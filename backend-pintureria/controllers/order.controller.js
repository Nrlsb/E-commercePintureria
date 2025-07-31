// backend-pintureria/controllers/order.controller.js
import db from '../db.js';
import mercadopago from 'mercadopago';
import { sendOrderConfirmationEmail, sendBankTransferInstructionsEmail } from '../emailService.js';
import logger from '../logger.js';
import AppError from '../utils/AppError.js';

const { MercadoPagoConfig, Payment, PaymentRefund } = mercadopago;
const mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
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

    const result = await dbClient.query(
      "UPDATE orders SET status = 'approved' WHERE id = $1 AND status = 'pending_transfer' RETURNING *",
      [orderId]
    );

    if (result.rowCount === 0) {
      await dbClient.query('ROLLBACK');
      throw new AppError('Orden no encontrada o ya no estaba pendiente de pago.', 404);
    }

    const order = result.rows[0];

    const userData = await dbClient.query('SELECT email FROM users WHERE id = $1', [order.user_id]);
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

export const createPixPayment = async (req, res, next) => {
  const { cart, total, shippingCost, postalCode } = req.body;
  const { userId, email, firstName, lastName, phone } = req.user;

  const dbClient = await db.connect();
  let orderId;
  let paymentData; 

  try {
    const userResult = await dbClient.query('SELECT dni FROM users WHERE id = $1', [userId]);
    const dni = userResult.rows[0]?.dni;

    const addressResult = await dbClient.query(
        'SELECT address_line1, city, state, postal_code FROM user_addresses WHERE user_id = $1 AND is_default = true LIMIT 1',
        [userId]
    );
    const address = addressResult.rows[0];
    
    if (!dni) {
      return next(new AppError('Debe registrar su DNI en "Mi Perfil" para poder realizar pagos.', 400));
    }
    if (!address) {
        return next(new AppError('Debe registrar una dirección de envío predeterminada en "Mi Perfil".', 400));
    }
    
    if (!cart || cart.length === 0) {
      return next(new AppError('El carrito está vacío.', 400));
    }

    await dbClient.query('BEGIN');

    for (const item of cart) {
      const stockResult = await dbClient.query('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [item.id]);
      if (stockResult.rows.length === 0 || item.quantity > stockResult.rows[0].stock) {
        throw new AppError(`Stock insuficiente para "${item.name}".`, 400);
      }
    }

    const orderResult = await dbClient.query(
      'INSERT INTO orders (user_id, total_amount, status, shipping_cost, postal_code) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at',
      [userId, total, 'pending', shippingCost, postalCode]
    );
    const order = orderResult.rows[0];
    orderId = order.id;

    for (const item of cart) {
      await dbClient.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.id, item.quantity, item.price]
      );
    }

    const payment = new Payment(mpClient);
    const expirationDate = new Date(Date.now() + 30 * 60 * 1000).toISOString(); 

    paymentData = {
      transaction_amount: Number(total),
      description: `Compra en Pinturerías Mercurio - Orden #${orderId}`,
      payment_method_id: 'pix',
      payer: {
        email: email,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: 'DNI',
          number: dni
        },
        address: {
            zip_code: address.postal_code,
            street_name: address.address_line1,
            city: address.city,
        }
      },
      additional_info: {
        items: cart.map(item => ({
            id: item.id.toString(),
            title: item.name,
            description: item.description,
            category_id: item.category,
            quantity: item.quantity,
            unit_price: item.price
        })),
        payer: {
            first_name: firstName,
            last_name: lastName,
            phone: {
                area_code: "549",
                number: phone
            },
            address: {
                zip_code: address.postal_code,
                street_name: address.address_line1,
            }
        },
        shipments: {
            receiver_address: {
                zip_code: address.postal_code,
                state_name: address.state,
                city_name: address.city,
                street_name: address.address_line1,
            }
        }
      },
      external_reference: orderId.toString(),
      notification_url: `${process.env.BACKEND_URL}/api/payment/notification`,
      date_of_expiration: expirationDate,
    };
    
    logger.debug('Enviando el siguiente payload a Mercado Pago para pago PIX/Transfer:', JSON.stringify(paymentData, null, 2));

    const mpPayment = await payment.create({ body: paymentData });
    
    await dbClient.query(
      'UPDATE orders SET mercadopago_transaction_id = $1 WHERE id = $2',
      [mpPayment.id, orderId]
    );

    const orderDataForEmail = { 
      id: orderId, 
      created_at: order.created_at, 
      total_amount: total, 
      items: cart,
      paymentData: mpPayment.point_of_interaction.transaction_data
    };
    await sendBankTransferInstructionsEmail(email, orderDataForEmail);

    await dbClient.query('COMMIT');
    logger.info(`Orden de pago PIX/Transfer #${orderId} (MP ID: ${mpPayment.id}) creada para usuario ID: ${userId}`);
    
    res.status(201).json({
      status: 'pending_payment',
      orderId: orderId,
      paymentData: mpPayment.point_of_interaction.transaction_data,
    });

  } catch (error) {
    if (dbClient) await dbClient.query('ROLLBACK');
    const errorMessage = `Error completo creando pago PIX/Transfer para la orden #${orderId}:`;
    logger.error(errorMessage, error);
    const detailedError = new AppError(
      error.message || 'Error al procesar el pago.',
      error.statusCode || 500,
      {
        originalError: error.cause,
        payloadSent: paymentData
      }
    );
    next(detailedError);
  } finally {
    if (dbClient) dbClient.release();
  }
};


export const processPayment = async (req, res, next) => {
    logger.debug('Iniciando processPayment. Body recibido:', JSON.stringify(req.body, null, 2));

    const { token, issuer_id, payment_method_id, transaction_amount, installments, payer, cart, shippingCost, postalCode } = req.body;
    const { userId } = req.user;
    const dbClient = await db.connect();
    let orderId;

    try {
        if (!token) {
          throw new AppError('Card Token not Found', 400);
        }

        await dbClient.query('BEGIN');

        for (const item of cart) {
            const stockResult = await dbClient.query('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [item.id]);
            if (stockResult.rows.length === 0) {
                throw new AppError(`Producto "${item.name}" no encontrado.`, 404);
            }
            if (item.quantity > stockResult.rows[0].stock) {
                throw new AppError(`Stock insuficiente para "${item.name}".`, 400);
            }
        }

        const orderResult = await dbClient.query(
            'INSERT INTO orders (user_id, total_amount, status, shipping_cost, postal_code) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [userId, transaction_amount, 'pending', shippingCost, postalCode]
        );
        orderId = orderResult.rows[0].id;

        for (const item of cart) {
            await dbClient.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [orderId, item.id, item.quantity, item.price]
            );
        }

        const payment = new Payment(mpClient);
        const payment_data = {
            transaction_amount: Number(transaction_amount),
            token,
            description: `Compra en Pinturerías Mercurio - Orden #${orderId}`,
            installments,
            payment_method_id,
            issuer_id,
            payer,
            external_reference: orderId.toString(),
            notification_url: `${process.env.BACKEND_URL}/api/payment/notification`,
        };

        const paymentResult = await payment.create({ body: payment_data });

        if (paymentResult.status === 'approved') {
            for (const item of cart) {
                await dbClient.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.id]);
            }
            await dbClient.query("UPDATE orders SET status = 'approved', mercadopago_transaction_id = $1 WHERE id = $2", [paymentResult.id, orderId]);
            
            const orderDetailsForEmail = await getOrderDetailsForEmail(orderId, dbClient);
            if (orderDetailsForEmail) {
                try {
                    await sendOrderConfirmationEmail(orderDetailsForEmail.email, orderDetailsForEmail);
                    logger.info(`Email de confirmación enviado exitosamente para la orden #${orderId}`);
                } catch (emailError) {
                    logger.error(`Error al enviar email de confirmación para la orden #${orderId}:`, emailError);
                }
            } else {
                logger.warn(`No se encontraron detalles para la orden #${orderId} para enviar el email de confirmación.`);
            }

            await dbClient.query('COMMIT');
            logger.info(`Pago aprobado por Mercado Pago para la orden #${orderId}`);
            res.status(201).json({ status: 'approved', orderId: orderId, paymentId: paymentResult.id });
        } else {
            await dbClient.query('ROLLBACK');
            logger.warn(`Pago rechazado por Mercado Pago. Orden #${orderId} revertida. Motivo: ${paymentResult.status_detail}`);
            throw new AppError(paymentResult.status_detail || 'El pago no pudo ser procesado.', 400);
        }

    } catch (error) {
        if (dbClient) await dbClient.query('ROLLBACK');
        logger.error(`Error completo procesando el pago para la orden #${orderId}:`, error);
        next(error);
    } finally {
        if (dbClient) dbClient.release();
    }
};

export const getOrderById = async (req, res, next) => {
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
            FROM orders o
            JOIN users u ON o.user_id = u.id
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
            throw new AppError('Orden no encontrada o no pertenece al usuario.', 404);
        }
        res.json(orderResult.rows[0]);
    } catch (error) {
        next(error);
    }
};

export const getOrderHistory = async (req, res, next) => {
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
        next(error);
    }
}

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
        whereClauses.push(`(u.email ILIKE $${paramIndex} OR o.id::text ILIKE $${paramIndex})`);
        queryParams.push(`%${search}%`);
        paramIndex++;
    }

    const whereString = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';

    try {
        const countQuery = `SELECT COUNT(*) FROM orders o JOIN users u ON o.user_id = u.id ${whereString}`;
        const totalResult = await db.query(countQuery, queryParams);
        const totalOrders = parseInt(totalResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalOrders / limit);

        const offset = (page - 1) * limit;
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
            throw new AppError('Orden no encontrada.', 404);
        }
        const order = orderResult.rows[0];

        if (order.status === 'cancelled') {
            await dbClient.query('ROLLBACK');
            throw new AppError('La orden ya ha sido cancelada.', 400);
        }

        if (order.mercadopago_transaction_id) {
            logger.info(`Intentando reembolso para la orden #${orderId} con transaction_id: ${order.mercadopago_transaction_id}`);
            try {
                const refundClient = new PaymentRefund(mpClient);
                logger.info(`Enviando a Mercado Pago para reembolso (payment_id): ${order.mercadopago_transaction_id}`);
                const refundResponse = await refundClient.create({
                    payment_id: order.mercadopago_transaction_id
                });
                logger.info(`Respuesta de reembolso de Mercado Pago para orden #${orderId}:`, refundResponse);
                if (refundResponse.status !== 'approved') {
                    throw new AppError(`Reembolso de Mercado Pago no aprobado: ${refundResponse.status_detail || 'Error desconocido'}`, 400);
                }
            } catch (mpError) {
                logger.error(`Error al procesar el reembolso de Mercado Pago para la orden #${orderId}:`, mpError.message);
                logger.error(`Detalles del error de MP:`, mpError); 
                throw new AppError(`Fallo en el reembolso de Mercado Pago: ${mpError.message}`, 500); 
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
        res.status(200).json({ message: 'Ordenada cancelada y reembolso procesado con éxito.', order: updatedOrderResult.rows[0] });
    } catch (error) {
        if (dbClient) await dbClient.query('ROLLBACK');
        logger.error(`Error general al cancelar la orden #${orderId}:`, error.message);
        logger.error(`Stack del error:`, error.stack);
        next(error);
    } finally {
        if (dbClient) dbClient.release();
    }
};
