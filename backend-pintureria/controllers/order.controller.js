// backend-pintureria/controllers/order.controller.js
import db from '../db.js';
import mercadopago from 'mercadopago';
import { sendOrderConfirmationEmail, sendBankTransferInstructionsEmail } from '../emailService.js';
import logger from '../logger.js';

const { MercadoPagoConfig, Payment, PaymentRefund } = mercadopago;
// Asegúrate de que MERCADOPAGO_ACCESS_TOKEN esté configurado correctamente en tus variables de entorno
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
const MIN_TRANSACTION_AMOUNT = 100; // Define esto si no está en config/index.js o similar

export const confirmTransferPayment = async (req, res, next) => {
  const { orderId } = req.params;
  // --- MEJORA: Se utiliza un cliente de la pool para manejar la transacción ---
  const dbClient = await db.connect();
  try {
    // Iniciamos la transacción
    await dbClient.query('BEGIN');

    const result = await dbClient.query(
      "UPDATE orders SET status = 'approved' WHERE id = $1 AND status = 'pending_transfer' RETURNING *",
      [orderId]
    );

    if (result.rowCount === 0) {
      // Si no se actualizó ninguna fila, hacemos rollback y notificamos
      await dbClient.query('ROLLBACK');
      return res.status(404).json({ message: 'Orden no encontrada o ya no estaba pendiente de pago.' });
    }

    const order = result.rows[0];

    const userData = await dbClient.query('SELECT email FROM users WHERE id = $1', [order.user_id]);
    const itemsData = await dbClient.query('SELECT p.name, oi.quantity, oi.price FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1', [orderId]);
    
    const orderForEmail = {
      ...order,
      items: itemsData.rows,
    };

    // Enviamos el email antes de confirmar la transacción. Si el envío falla, podemos hacer rollback.
    await sendOrderConfirmationEmail(userData.rows[0].email, orderForEmail);
    
    // Si todo fue exitoso, confirmamos la transacción
    await dbClient.query('COMMIT');

    logger.info(`Pago por transferencia confirmado para la orden #${orderId}`);
    res.status(200).json({ message: 'Pago confirmado y email enviado con éxito.', order });
  } catch (error) {
    // Si cualquier paso falla, revertimos todos los cambios en la base de datos
    await dbClient.query('ROLLBACK');
    next(error);
  } finally {
    // Liberamos el cliente para que vuelva a la pool
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
    let orderId; // Declarar orderId aquí para que sea accesible en todo el scope

    try {
        await dbClient.query('BEGIN');

        // 1. Verificar el stock DENTRO de la transacción
        for (const item of cart) {
            const stockResult = await dbClient.query('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [item.id]);
            if (stockResult.rows.length === 0 || item.quantity > stockResult.rows[0].stock) {
                throw new Error(`Stock insuficiente para "${item.name}".`);
            }
        }

        // 2. Crear la orden con estado 'pending'
        const orderResult = await dbClient.query(
            'INSERT INTO orders (user_id, total_amount, status, shipping_cost, postal_code) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [userId, transaction_amount, 'pending', shippingCost, postalCode]
        );
        orderId = orderResult.rows[0].id;

        // 3. Insertar los items de la orden
        for (const item of cart) {
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
                await dbClient.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.id]);
            }
            await dbClient.query("UPDATE orders SET status = 'approved', mercadopago_transaction_id = $1 WHERE id = $2", [paymentResult.id, orderId]);
            
            // Lógica para enviar email de confirmación
            // ...

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
        // Si ocurre cualquier error, revertir la transacción
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
    // 1. Añadir page y limit a los query params, con valores por defecto
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

    const whereString = whereClauses.length > 0 ? ` WHERE ${whereClaClauses.join(' AND ')}` : '';

    try {
        // 2. Crear una consulta para obtener el conteo total de órdenes que coinciden con los filtros
        const countQuery = `SELECT COUNT(*) FROM orders o JOIN users u ON o.user_id = u.id ${whereString}`;
        const totalResult = await db.query(countQuery, queryParams);
        const totalOrders = parseInt(totalResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalOrders / limit);

        // 3. Modificar la consulta principal para añadir LIMIT y OFFSET para la paginación
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

        // 4. Devolver un objeto con los datos de paginación
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
    let dbClient; // Declara dbClient aquí para que esté disponible en el bloque finally
    try {
        dbClient = await db.connect(); // Conecta con la base de datos
        await dbClient.query('BEGIN'); // Inicia una transacción

        logger.info(`Intentando cancelar la orden #${orderId}`);

        const orderResult = await dbClient.query('SELECT * FROM orders WHERE id = $1', [orderId]);
        if (orderResult.rows.length === 0) {
            logger.warn(`Intento de cancelar orden no encontrada: #${orderId}`);
            await dbClient.query('ROLLBACK'); // Asegúrate de hacer rollback si no se encuentra la orden
            return res.status(404).json({ message: 'Orden no encontrada.' });
        }
        const order = orderResult.rows[0];

        if (order.status === 'cancelled') {
            logger.warn(`Intento de cancelar orden #${orderId} que ya está cancelada.`);
            await dbClient.query('ROLLBACK'); // Asegúrate de hacer rollback si la orden ya está cancelada
            return res.status(400).json({ message: 'La orden ya ha sido cancelada.' });
        }

        // Lógica para reembolso de Mercado Pago
        if (order.mercadopago_transaction_id) {
            logger.info(`Orden #${orderId} tiene ID de transacción de Mercado Pago: ${order.mercadopago_transaction_id}. Intentando reembolso.`);
            try {
                const refundClient = new PaymentRefund(client);
                const refundResponse = await refundClient.create({
                    payment_id: order.mercadopago_transaction_id
                });
                logger.info(`Reembolso de Mercado Pago para la orden #${orderId} exitoso. Respuesta:`, refundResponse);
            } catch (mpError) {
                // Captura y loguea específicamente los errores de Mercado Pago
                logger.error(`Error al procesar el reembolso de Mercado Pago para la orden #${orderId} (ID de transacción: ${order.mercadopago_transaction_id}):`, mpError.message || mpError);
                // Si el reembolso falla, puedes decidir si abortar la cancelación de la orden o continuar.
                // Por ahora, el error se propagará y la transacción de DB se revertirá.
                throw new Error(`Fallo el reembolso de Mercado Pago: ${mpError.message || 'Error desconocido'}`);
            }
        } else {
            logger.info(`Orden #${orderId} no tiene ID de transacción de Mercado Pago. No se requiere reembolso.`);
        }

        // Actualizar el estado de la orden a 'cancelled'
        const updatedOrderResult = await dbClient.query(
            "UPDATE orders SET status = 'cancelled' WHERE id = $1 RETURNING *",
            [orderId]
        );
        logger.info(`Estado de la orden #${orderId} actualizado a 'cancelled'.`);

        // Devolver el stock de los productos
        const orderItemsResult = await dbClient.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [orderId]);
        if (orderItemsResult.rows.length > 0) {
            for (const item of orderItemsResult.rows) {
                await dbClient.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
                logger.info(`Stock del producto ID ${item.product_id} incrementado en ${item.quantity} unidades para la orden #${orderId}.`);
            }
        } else {
            logger.warn(`No se encontraron ítems para la orden #${orderId} al intentar devolver el stock.`);
        }

        await dbClient.query('COMMIT'); // Confirma la transacción
        logger.info(`Orden #${orderId} cancelada y reembolso/stock procesado exitosamente.`);
        res.status(200).json({ message: 'Orden cancelada y reembolso procesado con éxito.', order: updatedOrderResult.rows[0] });
    } catch (error) {
        if (dbClient) { // Asegura que dbClient existe antes de intentar el rollback
            await dbClient.query('ROLLBACK'); // Revierte todos los cambios en la base de datos si algo falla
            logger.error(`Transacción de base de datos revertida para la orden #${orderId}.`);
        }
        // Loguea el error completo para depuración
        logger.error(`Error inesperado al cancelar la orden #${orderId}:`, error);
        next(error); // Pasa el error al siguiente middleware de manejo de errores
    } finally {
        if (dbClient) { // Asegura que dbClient existe antes de liberarlo
            dbClient.release(); // Libera el cliente de la base de datos para que vuelva a la pool
            logger.debug(`Cliente de base de datos liberado para la orden #${orderId}.`);
        }
    }
};
