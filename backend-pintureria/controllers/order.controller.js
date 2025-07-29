// backend-pintureria/controllers/order.controller.js
import db from '../db.js';
import mercadopago from 'mercadopago';
import { sendOrderConfirmationEmail, sendBankTransferInstructionsEmail } from '../emailService.js';
import logger from '../logger.js';

const { MercadoPagoConfig, Payment, PaymentRefund } = mercadopago;
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
const MIN_TRANSACTION_AMOUNT = 100;

// Helper function to get order details for email, using parameterized query
const getOrderDetailsForEmail = async (orderId, dbClient) => {
  const orderQuery = `
    SELECT o.id, o.total_amount, u.email,
    COALESCE((SELECT json_agg(items) FROM (
      SELECT oi.quantity, oi.price, p.name, p.image_url as "imageUrl"
      FROM order_items oi JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = o.id
    ) AS items), '[]'::json) AS items
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = $1
  `;
  const orderResult = await dbClient.query(orderQuery, [orderId]);
  return orderResult.rows[0];
};

export const confirmTransferPayment = async (req, res, next) => {
  const { orderId } = req.params;
  const dbClient = await db.connect();
  try {
    await dbClient.query('BEGIN');

    // Using parameterized query
    const result = await dbClient.query(
      "UPDATE orders SET status = 'approved' WHERE id = $1 AND status = 'pending_transfer' RETURNING *",
      [orderId]
    );

    if (result.rowCount === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ message: 'Orden no encontrada o ya no estaba pendiente de pago.' });
    }

    const order = result.rows[0];

    // Using parameterized query
    const userData = await dbClient.query('SELECT email FROM users WHERE id = $1', [order.user_id]);
    // Using parameterized query
    const itemsData = await dbClient.query('SELECT p.name, oi.quantity, oi.price FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1', [orderId]);
    
    const orderForEmail = {
      ...order,
      items: itemsData.rows,
    };

    await sendOrderConfirmationEmail(userData.rows[0].email, orderForEmail);
    
    await dbClient.query('COMMIT');

    logger.info(`Pago por transferencia confirmado para la orden #${orderId}`);
    res.status(200).json({ message: 'Pago confirmado y email enviado con éxito.', order });
  } catch (error) {
    await dbClient.query('ROLLBACK');
    next(error);
  } finally {
    dbClient.release();
  }
};

export const createBankTransferOrder = async (req, res, next) => {
  const { cart, total, shippingCost, postalCode } = req.body;
  const { userId, email } = req.user;

  if (!cart || cart.length === 0) {
    return res.status(400).json({ message: 'El carrito está vacío.' });
  }

  const dbClient = await db.connect();

  try {
    await dbClient.query('BEGIN');

    for (const item of cart) {
      // Using parameterized query
      const stockResult = await dbClient.query('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [item.id]);
      if (stockResult.rows.length === 0) throw new Error(`Producto "${item.name}" no encontrado.`);
      const availableStock = stockResult.rows[0].stock;
      if (item.quantity > availableStock) throw new Error(`Stock insuficiente para "${item.name}". Solo quedan ${availableStock} unidades.`);
    }

    // Using parameterized query
    const orderResult = await dbClient.query(
      'INSERT INTO orders (user_id, total_amount, status, shipping_cost, postal_code) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at',
      [userId, total, 'pending_transfer', shippingCost, postalCode]
    );
    const order = orderResult.rows[0];
    const orderId = order.id;

    for (const item of cart) {
      // Using parameterized query
      await dbClient.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.id, item.quantity, item.price]
      );
      // Using parameterized query
      await dbClient.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.id]
      );
    }

    const orderDataForEmail = { id: orderId, created_at: order.created_at, total_amount: total, items: cart };
    await sendBankTransferInstructionsEmail(email, orderDataForEmail);

    await dbClient.query('COMMIT');
    logger.info(`Orden #${orderId} creada exitosamente por transferencia bancaria para el usuario ID: ${userId}`);
    res.status(201).json({ status: 'pending_transfer', orderId: orderId });

  } catch (error) {
    await dbClient.query('ROLLBACK');
    next(error);
  } finally {
    dbClient.release();
  }
};

export const processPayment = async (req, res, next) => {
    const { token, issuer_id, payment_method_id, transaction_amount, installments, payer, cart, shippingCost, postalCode } = req.body;
    const { userId } = req.user;
    const dbClient = await db.connect();
    let orderId;

    try {
        await dbClient.query('BEGIN');

        // 1. Verificar el stock DENTRO de la transacción
        for (const item of cart) {
            // Using parameterized query
            const stockResult = await dbClient.query('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [item.id]);
            if (stockResult.rows.length === 0 || item.quantity > stockResult.rows[0].stock) {
                throw new Error(`Stock insuficiente para "${item.name}".`);
            }
        }

        // 2. Crear la orden con estado 'pending'
        // Using parameterized query
        const orderResult = await dbClient.query(
            'INSERT INTO orders (user_id, total_amount, status, shipping_cost, postal_code) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [userId, transaction_amount, 'pending', shippingCost, postalCode]
        );
        orderId = orderResult.rows[0].id;

        // 3. Insertar los items de la orden
        for (const item of cart) {
            // Using parameterized query
            await dbClient.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [orderId, item.id, item.quantity, item.price]
            );
        }

        // 4. Realizar el intento de pago
        const payment = new Payment(client);
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
                    number: payer.identification.number
                },
                first_name: payer.firstName,
                last_name: payer.lastName
            },
            external_reference: orderId.toString(),
            notification_url: `${process.env.BACKEND_URL}/api/payment/notification`,
        };

        const paymentResult = await payment.create({ body: payment_data });

        // 5. Si el pago es aprobado, actualizar stock y estado de la orden
        if (paymentResult.status === 'approved') {
            for (const item of cart) {
                // Using parameterized query
                await dbClient.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.id]);
            }
            // Using parameterized query
            await dbClient.query("UPDATE orders SET status = 'approved', mercadopago_transaction_id = $1 WHERE id = $2", [paymentResult.id, orderId]);
            
            // RESALTADO: Obtener detalles completos de la orden para el email
            const orderDetailsForEmail = await getOrderDetailsForEmail(orderId, dbClient);
            if (orderDetailsForEmail) {
                try {
                    await sendOrderConfirmationEmail(orderDetailsForEmail.email, orderDetailsForEmail);
                    logger.info(`Email de confirmación enviado exitosamente para la orden #${orderId}`);
                } catch (emailError) {
                    logger.error(`Error al enviar email de confirmación para la orden #${orderId}:`, emailError);
                    // No revertimos la transacción por un fallo en el envío del email,
                    // pero lo registramos.
                }
            } else {
                logger.warn(`No se encontraron detalles para la orden #${orderId} para enviar el email de confirmación.`);
            }

            await dbClient.query('COMMIT');
            logger.info(`Pago aprobado por Mercado Pago para la orden #${orderId}`);
            res.status(201).json({ status: 'approved', orderId: orderId, paymentId: paymentResult.id });
        } else {
            // Si el pago es rechazado, revertir todo
            await dbClient.query('ROLLBACK');
            logger.warn(`Pago rechazado por Mercado Pago. Orden #${orderId} revertida. Motivo: ${paymentResult.status_detail}`);
            res.status(400).json({ status: paymentResult.status, message: paymentResult.status_detail || 'El pago no pudo ser procesado.' });
        }

    } catch (error) {
        await dbClient.query('ROLLBACK');
        logger.error(`Error procesando el pago para la orden #${orderId}:`, error);
        next(error);
    } finally {
        dbClient.release();
    }
};

export const getOrderById = async (req, res, next) => {
    const { orderId } = req.params;
    const { userId, role } = req.user;
    try {
        let query;
        const params = [orderId];
        // Using parameterized query for both admin and regular user cases
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
        next(error);
    }
};

export const getOrderHistory = async (req, res, next) => {
    const userId = req.user.userId;
    try {
        // Using parameterized query
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
        next(error);
    }
};

export const getAllOrders = async (req, res, next) => {
    const { status, search, page = 1, limit = 15 } = req.query;
    
    const queryParams = [];
    let paramIndex = 1;
    const whereClauses = [];

    if (status) {
        whereClauses.push(`o.status = $${paramIndex++}`);
        queryParams.push(status);
    }

    if (search) {
        // Using parameterized query for LIKE clauses
        whereClauses.push(`(u.email ILIKE $${paramIndex} OR o.id::text ILIKE $${paramIndex})`);
        queryParams.push(`%${search}%`);
        paramIndex++;
    }

    const whereString = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';

    try {
        // Using parameterized query for count
        const countQuery = `SELECT COUNT(*) FROM orders o JOIN users u ON o.user_id = u.id ${whereString}`;
        const totalResult = await db.query(countQuery, queryParams);
        const totalOrders = parseInt(totalResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalOrders / limit);

        const offset = (page - 1) * limit;
        // Using parameterized query for LIMIT and OFFSET
        const ordersQuery = `
            SELECT o.id, o.total_amount, o.status, o.created_at, u.email as user_email 
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ${whereString}
            ORDER BY o.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        
        const ordersResult = await db.query(ordersQuery, [...queryParams, limit, offset]);

        res.json({
            orders: ordersResult.rows,
            currentPage: parseInt(page, 10),
            totalPages,
            totalOrders,
        });
    } catch (error) {
        next(error);
    }
};

export const cancelOrder = async (req, res, next) => {
    const { orderId } = req.params;
    const dbClient = await db.connect();
    try {
        await dbClient.query('BEGIN');
        
        logger.info(`Intentando cancelar orden #${orderId}.`);

        const orderResult = await dbClient.query('SELECT * FROM orders WHERE id = $1', [orderId]);
        if (orderResult.rows.length === 0) {
            await dbClient.query('ROLLBACK');
            logger.warn(`Orden #${orderId} no encontrada para cancelación.`);
            return res.status(404).json({ message: 'Orden no encontrada.' });
        }
        const order = orderResult.rows[0];

        if (order.status === 'cancelled') {
            await dbClient.query('ROLLBACK');
            logger.warn(`Orden #${orderId} ya estaba cancelada.`);
            return res.status(400).json({ message: 'La orden ya ha sido cancelada.' });
        }

        // --- Logging adicional para el reembolso de Mercado Pago ---
        if (order.mercadopago_transaction_id) {
            logger.info(`Intentando reembolso para la orden #${orderId} con transaction_id: ${order.mercadopago_transaction_id}`);
            try {
                const refundClient = new PaymentRefund(client);
                // --- AÑADIDO: Log del objeto que se envía a Mercado Pago ---
                logger.info(`Enviando a Mercado Pago para reembolso (payment_id): ${order.mercadopago_transaction_id}`);
                const refundResponse = await refundClient.create({
                    payment_id: order.mercadopago_transaction_id
                });
                logger.info(`Respuesta de reembolso de Mercado Pago para orden #${orderId}:`, refundResponse);
                if (refundResponse.status !== 'approved') {
                    // Si el reembolso no es aprobado por MP, podrías querer manejarlo de forma diferente
                    // Por ahora, lo tratamos como un error que impide la cancelación total.
                    throw new Error(`Reembolso de Mercado Pago no aprobado: ${refundResponse.status_detail || 'Error desconocido'}`);
                }
            } catch (mpError) {
                logger.error(`Error al procesar el reembolso de Mercado Pago para la orden #${orderId}:`, mpError.message);
                // --- AÑADIDO: Log del objeto de error completo de MP ---
                logger.error(`Detalles del error de MP:`, mpError); 
                throw new Error(`Fallo en el reembolso de Mercado Pago: ${mpError.message}`); // Re-lanzar para que el catch principal lo maneje
            }
        } else {
            logger.info(`Orden #${orderId} no tiene transaction_id de Mercado Pago. No se requiere reembolso de MP.`);
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
        logger.info(`Orden #${orderId} cancelada y reembolso (si aplica) procesado exitosamente.`);
        res.status(200).json({ message: 'Orden cancelada y reembolso procesado con éxito.', order: updatedOrderResult.rows[0] });
    } catch (error) {
        await dbClient.query('ROLLBACK');
        logger.error(`Error general al cancelar la orden #${orderId}:`, error.message);
        logger.error(`Stack del error:`, error.stack);
        next(error); // Pasa el error al middleware de manejo de errores
    } finally {
        dbClient.release();
    }
};
