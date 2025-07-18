// backend-pintureria/controllers/order.controller.js
import db from '../db.js';
import mercadopago from 'mercadopago';
import { sendOrderConfirmationEmail } from '../emailService.js';

// --- CONFIGURACIÓN DE MERCADOPAGO ---
const { MercadoPagoConfig, Preference, PaymentRefund } = mercadopago;
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

const MIN_TRANSACTION_AMOUNT = 100;

// --- FUNCIÓN PARA CREAR PREFERENCIA DE PAGO ---
export const createPaymentPreference = async (req, res) => {
  const { cart, total, shippingCost, postalCode } = req.body;
  const { userId, email, firstName, lastName } = req.user;

  if (!cart || cart.length === 0) {
    return res.status(400).json({ message: 'El carrito está vacío.' });
  }
  if (total < MIN_TRANSACTION_AMOUNT) {
    return res.status(400).json({ message: `El monto mínimo de compra es $${MIN_TRANSACTION_AMOUNT}.` });
  }

  const dbClient = await db.connect();
  try {
    await dbClient.query('BEGIN');

    // 1. Verificar el stock de los productos
    for (const item of cart) {
      const stockResult = await dbClient.query('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [item.id]);
      if (stockResult.rows.length === 0) throw new Error(`Producto "${item.name}" no encontrado.`);
      const availableStock = stockResult.rows[0].stock;
      if (item.quantity > availableStock) throw new Error(`Stock insuficiente para "${item.name}".`);
    }

    // 2. Crear la orden en nuestra base de datos con estado 'pending'
    const orderResult = await dbClient.query(
      'INSERT INTO orders (user_id, total_amount, status, shipping_cost, postal_code) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [userId, total, 'pending', shippingCost, postalCode]
    );
    const orderId = orderResult.rows[0].id;

    // 3. Insertar los items de la orden
    for (const item of cart) {
      await dbClient.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.id, item.quantity, item.price]
      );
    }

    // 4. Crear la preferencia de pago en Mercado Pago
    const preference = new Preference(client);
    const preferenceResponse = await preference.create({
      body: {
        purpose: 'wallet_purchase',
        items: cart.map(p => ({
          id: p.id.toString(),
          title: p.name,
          quantity: Number(p.quantity),
          unit_price: Number(p.price),
          picture_url: p.imageUrl,
          category_id: p.category,
        })),
        payer: {
          name: firstName,
          surname: lastName,
          email: email,
        },
        payment_methods: {
          credit_card: {},
          debit_card: {},
          excluded_payment_types: [
            { id: 'ticket' }
          ],
          installments: 12
        },
        back_urls: {
          success: `${process.env.VITE_FRONTEND_URL}/success`,
          failure: `${process.env.VITE_FRONTEND_URL}/cart`,
          pending: `${process.env.VITE_FRONTEND_URL}/my-orders`,
        },
        auto_return: 'approved',
        external_reference: orderId.toString(),
        notification_url: `${process.env.BACKEND_URL}/api/payment/notification`,
        statement_descriptor: "PINTURERIASMERCURIO",
      },
    });

    await dbClient.query('COMMIT');
    res.status(201).json({ preferenceId: preferenceResponse.id });

  } catch (error) {
    await dbClient.query('ROLLBACK');
    // --- LOG DETALLADO AÑADIDO ---
    // Este console.log mostrará el objeto de error completo de Mercado Pago en la consola del backend.
    console.error('Detalle completo del error de Mercado Pago:', JSON.stringify(error, null, 2));
    
    console.error('Error al crear la preferencia de pago:', error);
    const errorMessage = error.cause?.message || error.message || 'Error interno del servidor.';
    res.status(500).json({ message: errorMessage });
  } finally {
    dbClient.release();
  }
};

// --- Las demás funciones se mantienen igual ---
export const getOrderHistory = async (req, res) => {
  const userId = req.user.userId;
  try {
    const query = `
      SELECT o.*,
      COALESCE((SELECT json_agg(items) FROM (
        SELECT oi.quantity, oi.price, p.name, p.image_url as "imageUrl"
        FROM order_items oi JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = o.id
      ) AS items), '[]'::json) AS items
      FROM orders o
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC;
    `;
    const ordersResult = await db.query(query, [userId]);
    res.json(ordersResult.rows);
  } catch (error) {
    console.error('Error al obtener el historial de órdenes:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const getAllOrders = async (req, res) => {
    const { status, search } = req.query;
    let query = `
        SELECT o.id, o.total_amount, o.status, o.created_at, u.email as user_email 
        FROM orders o
        JOIN users u ON o.user_id = u.id
    `;
    const queryParams = [];
    let paramIndex = 1;
    const whereClauses = [];

    if (status) {
        whereClauses.push(`o.status = $${paramIndex++}`);
        queryParams.push(status);
    }

    if (search) {
        whereClauses.push(`(u.email ILIKE $${paramIndex} OR o.id::text ILIKE $${paramIndex})`);
        queryParams.push(`%${search}%`);
        paramIndex++;
    }

    if (whereClauses.length > 0) {
        query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ' ORDER BY o.created_at DESC';

    try {
        const result = await db.query(query, queryParams);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener todas las órdenes:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export const getOrderById = async (req, res) => {
  const { orderId } = req.params;
  const { userId, role } = req.user;
  try {
    let query;
    const params = [orderId];
    
    if (role === 'admin') {
      query = `
        SELECT o.*, u.first_name, u.last_name, u.email, u.phone,
        COALESCE((SELECT json_agg(items) FROM (
          SELECT oi.quantity, oi.price, p.name, p.image_url as "imageUrl"
          FROM order_items oi JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = o.id
        ) AS items), '[]'::json) AS items
        FROM orders o JOIN users u ON o.user_id = u.id
        WHERE o.id = $1;
      `;
    } else {
      query = `
        SELECT o.*,
        COALESCE((SELECT json_agg(items) FROM (
          SELECT oi.quantity, oi.price, p.name, p.image_url as "imageUrl"
          FROM order_items oi JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = o.id
        ) AS items), '[]'::json) AS items
        FROM orders o
        WHERE o.id = $1 AND o.user_id = $2;
      `;
      params.push(userId);
    }

    const orderResult = await db.query(query, params);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Orden no encontrada o no pertenece al usuario.' });
    }
    res.json(orderResult.rows[0]);
  } catch (error) {
    console.error(`Error al obtener la orden #${orderId}:`, error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const cancelOrder = async (req, res) => {
    const { orderId } = req.params;
    const dbClient = await db.connect();
    try {
        await dbClient.query('BEGIN');
        const orderResult = await dbClient.query('SELECT * FROM orders WHERE id = $1', [orderId]);
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Orden no encontrada.' });
        }
        const order = orderResult.rows[0];

        if (order.status === 'cancelled') {
            return res.status(400).json({ message: 'La orden ya ha sido cancelada.' });
        }

        if (order.mercadopago_transaction_id) {
            const refundClient = new PaymentRefund(client);
            await refundClient.create({
                payment_id: order.mercadopago_transaction_id
            });
        }

        const updatedOrderResult = await dbClient.query(
            "UPDATE orders SET status = 'cancelled' WHERE id = $1 RETURNING *",
            [orderId]
        );
        
        const orderItemsResult = await dbClient.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [orderId]);
        for (const item of orderItemsResult.rows) {
            await dbClient.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
        }

        await dbClient.query('COMMIT');
        res.status(200).json({ message: 'Orden cancelada y reembolso procesado con éxito.', order: updatedOrderResult.rows[0] });

    } catch (error) {
        await dbClient.query('ROLLBACK');
        console.error('Error al cancelar orden:', error);
        const errorMessage = error.cause?.message || error.message || 'Error interno del servidor al procesar la cancelación.';
        res.status(500).json({ message: errorMessage });
    } finally {
        dbClient.release();
    }
};
