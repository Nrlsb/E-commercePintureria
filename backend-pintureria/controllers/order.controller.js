// backend-pintureria/controllers/order.controller.js
import db from '../db.js';
import mercadopago from 'mercadopago';
import { sendOrderConfirmationEmail, sendBankTransferInstructionsEmail, sendPaymentReminderEmail, sendOrderCancelledEmail } from '../emailService.js';

const { MercadoPagoConfig, Preference, Payment, PaymentRefund } = mercadopago;
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
const MIN_TRANSACTION_AMOUNT = 100;

// ... (otras funciones como confirmTransferPayment, createBankTransferOrder, etc. se mantienen igual)

export const confirmTransferPayment = async (req, res) => {
  const { orderId } = req.params;
  try {
    const result = await db.query(
      "UPDATE orders SET status = 'approved' WHERE id = $1 AND status = 'pending_transfer' RETURNING *",
      [orderId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Orden no encontrada o ya no estaba pendiente de pago.' });
    }

    const order = result.rows[0];

    const userData = await db.query('SELECT email FROM users WHERE id = $1', [order.user_id]);
    const itemsData = await db.query('SELECT p.name, oi.quantity, oi.price FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1', [orderId]);
    
    const orderForEmail = {
      ...order,
      items: itemsData.rows,
    };

    await sendOrderConfirmationEmail(userData.rows[0].email, orderForEmail);

    res.status(200).json({ message: 'Pago confirmado y email enviado con éxito.', order });
  } catch (error) {
    console.error('Error al confirmar el pago de la orden:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const createBankTransferOrder = async (req, res) => {
  const { cart, total, shippingCost, postalCode } = req.body;
  const { userId, email } = req.user;

  if (!cart || cart.length === 0) {
    return res.status(400).json({ message: 'El carrito está vacío.' });
  }

  const dbClient = await db.connect();

  try {
    await dbClient.query('BEGIN');

    for (const item of cart) {
      const stockResult = await dbClient.query('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [item.id]);
      if (stockResult.rows.length === 0) throw new Error(`Producto "${item.name}" no encontrado.`);
      const availableStock = stockResult.rows[0].stock;
      if (item.quantity > availableStock) throw new Error(`Stock insuficiente para "${item.name}". Solo quedan ${availableStock} unidades.`);
    }

    const orderResult = await dbClient.query(
      'INSERT INTO orders (user_id, total_amount, status, shipping_cost, postal_code) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at',
      [userId, total, 'pending_transfer', shippingCost, postalCode]
    );
    const order = orderResult.rows[0];
    const orderId = order.id;

    for (const item of cart) {
      await dbClient.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.id, item.quantity, item.price]
      );
      await dbClient.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.id]
      );
    }

    const orderDataForEmail = { id: orderId, created_at: order.created_at, total_amount: total, items: cart };
    await sendBankTransferInstructionsEmail(email, orderDataForEmail);

    await dbClient.query('COMMIT');
    res.status(201).json({ status: 'pending_transfer', orderId: orderId });

  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Error al crear orden por transferencia:', error);
    res.status(500).json({ message: error.message || 'Error interno del servidor.' });
  } finally {
    dbClient.release();
  }
};

export const processPayment = async (req, res) => {
  const { token, issuer_id, payment_method_id, transaction_amount, installments, payer, cart } = req.body;
  const { userId } = req.user;

  if (transaction_amount < MIN_TRANSACTION_AMOUNT) {
    return res.status(400).json({ message: `El monto de la transacción debe ser de al menos $${MIN_TRANSACTION_AMOUNT}.` });
  }
  if (!cart || cart.length === 0) {
    return res.status(400).json({ message: 'El carrito está vacío.' });
  }
  if (!payer || !payer.identification || !payer.identification.type || !payer.identification.number) {
    return res.status(400).json({ message: 'La información de identificación del pagador es requerida.' });
  }
  
  const dbClient = await db.connect();

  try {
    await dbClient.query('BEGIN');

    for (const item of cart) {
      const stockResult = await dbClient.query('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [item.id]);
      if (stockResult.rows.length === 0) throw new Error(`Producto "${item.name}" no encontrado.`);
      const availableStock = stockResult.rows[0].stock;
      if (item.quantity > availableStock) throw new Error(`Stock insuficiente para "${item.name}". Solo quedan ${availableStock} unidades.`);
    }

    const orderResult = await dbClient.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING id',
      [userId, transaction_amount, 'pending']
    );
    const orderId = orderResult.rows[0].id;

    for (const item of cart) {
      await dbClient.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.id, item.quantity, item.price]
      );
    }
    
    const payment_data = {
      transaction_amount: Number(transaction_amount), token, description: `Compra en Pinturerías Mercurio - Orden #${orderId}`,
      installments, payment_method_id, issuer_id,
      payer: { email: payer.email, identification: { type: payer.identification.type, number: payer.identification.number }, first_name: payer.firstName, last_name: payer.lastName },
      external_reference: orderId.toString(), notification_url: `${process.env.BACKEND_URL}/api/payment/notification`,
    };

    const payment = new Payment(client);
    const paymentResult = await payment.create({ body: payment_data });

    if (paymentResult.status === 'approved') {
      for (const item of cart) {
        await dbClient.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.id]);
      }
      await dbClient.query(
        "UPDATE orders SET status = 'approved', mercadopago_transaction_id = $1, mercadopago_payment_id = $2 WHERE id = $3", 
        [paymentResult.id, paymentResult.id, orderId]
      );

      const orderDataForEmail = { id: orderId, total_amount: transaction_amount, items: cart };
      await sendOrderConfirmationEmail(payer.email, orderDataForEmail);
      
      await dbClient.query('COMMIT');
      res.status(201).json({ status: 'approved', orderId: orderId, paymentId: paymentResult.id });
    } else {
      await dbClient.query('ROLLBACK');
      res.status(400).json({ status: paymentResult.status, message: paymentResult.status_detail || 'El pago no pudo ser procesado.' });
    }
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Error detallado al procesar el pago:', JSON.stringify(error, null, 2));
    const errorMessage = error.cause?.message || error.message || 'Error interno del servidor al procesar el pago.';
    res.status(500).json({ message: errorMessage });
  } finally {
    dbClient.release();
  }
};

export const getOrderById = async (req, res) => {
  const { orderId } = req.params;
  const { userId, role } = req.user;
  try {
    let query;
    const params = [orderId];
    
    // Si es admin, puede ver cualquier orden. Si no, solo las suyas.
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

// --- FUNCIÓN MODIFICADA ---
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
