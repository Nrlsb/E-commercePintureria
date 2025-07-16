// backend-pintureria/controllers/order.controller.js
import db from '../db.js';
import mercadopago from 'mercadopago';
import { sendOrderConfirmationEmail } from '../emailService.js';

// Configuración del cliente de Mercado Pago
const { MercadoPagoConfig, Preference, Payment, PaymentRefund } = mercadopago;
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

// --- NUEVA FUNCIÓN PARA PROCESAR PAGOS CON CHECKOUT API ---
/**
 * Procesa un pago directamente a través de la API de Mercado Pago.
 * Crea una orden en la base de datos y luego intenta ejecutar el pago.
 */
export const processPayment = async (req, res) => {
  const { token, issuer_id, payment_method_id, transaction_amount, installments, payer, cart } = req.body;
  const userId = req.user.userId;

  if (!cart || cart.length === 0) {
    return res.status(400).json({ message: 'El carrito está vacío.' });
  }
  
  const dbClient = await db.connect();

  try {
    // 1. Verificar el stock antes de crear la orden
    for (const item of cart) {
      const stockResult = await dbClient.query('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [item.id]);
      if (stockResult.rows.length === 0) {
        throw new Error(`Producto "${item.name}" no encontrado.`);
      }
      const availableStock = stockResult.rows[0].stock;
      if (item.quantity > availableStock) {
        throw new Error(`Stock insuficiente para "${item.name}". Solo quedan ${availableStock} unidades.`);
      }
    }

    // Iniciar transacción
    await dbClient.query('BEGIN');

    // 2. Crear la orden en la base de datos con estado 'pending'
    const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const orderResult = await dbClient.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING id',
      [userId, totalAmount, 'pending']
    );
    const orderId = orderResult.rows[0].id;

    // Insertar los items de la orden
    for (const item of cart) {
      await dbClient.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.id, item.quantity, item.price]
      );
    }
    
    // 3. Preparar y ejecutar el pago con Mercado Pago
    const payment_data = {
      transaction_amount: Number(transaction_amount),
      token,
      description: `Compra en Pinturerías Mercurio - Orden #${orderId}`,
      installments,
      payment_method_id,
      issuer_id,
      payer: {
        email: payer.email,
        identification: {
          type: payer.identification.type,
          number: payer.identification.number,
        },
      },
      external_reference: orderId.toString(),
      notification_url: `${process.env.BACKEND_URL}/api/payment/notification`,
    };

    const payment = new Payment(client);
    const paymentResult = await payment.create({ body: payment_data });

    // 4. Manejar la respuesta del pago
    if (paymentResult.status === 'approved') {
      // Si se aprueba, actualizar stock y estado de la orden
      for (const item of cart) {
        await dbClient.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
      await dbClient.query(
        "UPDATE orders SET status = 'approved', mercadopago_transaction_id = $1, mercadopago_payment_id = $2 WHERE id = $3", 
        [paymentResult.id, paymentResult.id, orderId]
      );

      // Enviar email de confirmación
      const orderDataForEmail = {
        id: orderId,
        total_amount: totalAmount,
        items: cart,
      };
      await sendOrderConfirmationEmail(payer.email, orderDataForEmail);
      
      await dbClient.query('COMMIT');
      res.status(201).json({ status: 'approved', orderId: orderId, paymentId: paymentResult.id });

    } else {
      // Si es rechazado o pendiente, no confirmamos la transacción en la BD
      await dbClient.query('ROLLBACK');
      res.status(400).json({ 
        status: paymentResult.status, 
        message: paymentResult.status_detail || 'El pago no pudo ser procesado.' 
      });
    }

  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Error al procesar el pago:', error);
    const errorMessage = error.cause?.message || error.message || 'Error interno del servidor al procesar el pago.';
    res.status(500).json({ message: errorMessage });
  } finally {
    dbClient.release();
  }
};


// --- La función de crear preferencia se mantiene por si se quiere volver a usar o para otros flujos ---
export const createPaymentPreference = async (req, res) => {
  const { cart } = req.body;
  const userId = req.user.userId;

  if (!cart || cart.length === 0) {
    return res.status(400).json({ message: 'El carrito está vacío.' });
  }

  const dbClient = await db.connect();

  try {
    await dbClient.query('BEGIN');
    for (const item of cart) {
      const stockResult = await dbClient.query('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [item.id]);
      if (stockResult.rows.length === 0) {
        return res.status(404).json({ message: `Producto "${item.name}" no encontrado.` });
      }
      const availableStock = stockResult.rows[0].stock;
      if (item.quantity > availableStock) {
        return res.status(400).json({ message: `Stock insuficiente para "${item.name}". Solo quedan ${availableStock} unidades.` });
      }
    }

    const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    const orderResult = await dbClient.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING id',
      [userId, totalAmount, 'pending']
    );
    const orderId = orderResult.rows[0].id;

    for (const item of cart) {
      await dbClient.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.id, item.quantity, item.price]
      );
    }
    
    await dbClient.query('COMMIT');
    
    const frontendUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';
    const notification_url = `${process.env.BACKEND_URL}/api/payment/notification`;

    const items = cart.map(product => ({
      id: product.id,
      title: product.name,
      description: product.brand,
      picture_url: product.imageUrl,
      quantity: Number(product.quantity),
      unit_price: Number(product.price),
      currency_id: 'ARS',
    }));

    const body = {
      items: items,
      back_urls: {
        success: `${frontendUrl}/success?order_id=${orderId}`,
        failure: `${frontendUrl}/cart`,
        pending: `${frontendUrl}/cart`,
      },
      auto_return: 'approved',
      external_reference: orderId.toString(),
      notification_url: notification_url,
    };

    const preference = new Preference(client);
    const result = await preference.create({ body });
    
    await db.query('UPDATE orders SET mercadopago_payment_id = $1 WHERE id = $2', [result.id, orderId]);

    res.json({ id: result.id });

  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Error al crear la preferencia de pago:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor al crear la preferencia.',
      error: error.message
    });
  } finally {
    dbClient.release();
  }
};


// --- OTRAS FUNCIONES DEL CONTROLADOR (SIN CAMBIOS) ---

export const getOrderHistory = async (req, res) => {
  const userId = req.user.userId;
  try {
    const query = `
      SELECT
        o.*,
        COALESCE(
          (
            SELECT json_agg(items)
            FROM (
              SELECT
                oi.quantity,
                oi.price,
                p.name,
                p.image_url as "imageUrl"
              FROM order_items oi
              JOIN products p ON oi.product_id = p.id
              WHERE oi.order_id = o.id
            ) AS items
          ),
          '[]'::json
        ) AS items
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
    try {
        const result = await db.query(`
            SELECT o.*, u.email as user_email 
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener todas las órdenes:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
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
        
        // Devolver stock
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
