// backend-pintureria/services/webhook.service.js
import db from '../db.js';
import mercadopago from 'mercadopago';
import { sendOrderConfirmationEmail } from '../emailService.js';
import logger from '../logger.js';

const { MercadoPagoConfig, Payment } = mercadopago;
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
const payment = new Payment(client);

/**
 * Procesa una notificación de pago de Mercado Pago de forma asíncrona.
 * Esta función es llamada después de que la notificación ha sido guardada y confirmada.
 * @param {string} topic - El tipo de evento (ej. 'payment').
 * @param {string} eventId - El ID del evento (ej. el ID del pago).
 */
export const processPaymentNotification = async (topic, eventId) => {
  if (topic !== 'payment') {
    logger.info(`Skipping webhook processing for topic: ${topic}`);
    return;
  }

  const dbClient = await db.connect();
  try {
    // Obtenemos la información del pago desde la API de Mercado Pago
    const paymentInfo = await payment.get({ id: eventId });
    const orderId = paymentInfo.external_reference;

    if (!orderId) {
      throw new Error(`Payment ${eventId} does not have an external_reference (orderId).`);
    }

    // Solo procesamos pagos que han sido aprobados
    if (paymentInfo.status === 'approved') {
      await dbClient.query('BEGIN');

      // Verificamos si la orden ya fue aprobada para evitar doble procesamiento (idempotencia)
      const orderStatusResult = await dbClient.query("SELECT status FROM orders WHERE id = $1 FOR UPDATE", [orderId]);
      if (orderStatusResult.rows.length === 0) {
        throw new Error(`Order #${orderId} not found for payment ${eventId}.`);
      }
      if (orderStatusResult.rows[0].status === 'approved') {
        logger.warn(`Order #${orderId} is already approved. Skipping processing for payment ${eventId}.`);
        await dbClient.query('COMMIT'); // Finalizamos la transacción vacía
        await db.query("UPDATE webhook_events SET status = 'processed' WHERE event_id = $1", [eventId]);
        return;
      }

      // Descontamos el stock de los productos
      const orderItemsResult = await dbClient.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [orderId]);
      for (const item of orderItemsResult.rows) {
        await dbClient.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
       
      // Actualizamos el estado de la orden a 'approved'
      await dbClient.query(
          "UPDATE orders SET status = 'approved', mercadopago_transaction_id = $1 WHERE id = $2", 
          [eventId, orderId]
      );

      // Enviamos el email de confirmación
      const orderDataResult = await dbClient.query(`
        SELECT o.*, u.email
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = $1
      `, [orderId]);
      
      if (orderDataResult.rows.length > 0) {
        const order = orderDataResult.rows[0];
        const itemsForEmailResult = await dbClient.query(`
          SELECT p.name, oi.quantity, oi.price 
          FROM order_items oi 
          JOIN products p ON p.id = oi.product_id 
          WHERE oi.order_id = $1
        `, [orderId]);
        order.items = itemsForEmailResult.rows;

        await sendOrderConfirmationEmail(order.email, order);
      }
      
      // Marcamos el evento del webhook como procesado
      await dbClient.query("UPDATE webhook_events SET status = 'processed' WHERE event_id = $1", [eventId]);
      await dbClient.query('COMMIT');
      logger.info(`Webhook processed successfully: Order #${orderId} approved and stock updated.`);
    } else {
      // Si el estado no es 'approved', simplemente lo registramos y marcamos como procesado
      logger.info(`Payment ${eventId} for order #${orderId} has status '${paymentInfo.status}'. No action taken.`);
      await db.query("UPDATE webhook_events SET status = 'processed' WHERE event_id = $1", [eventId]);
    }
  } catch (error) {
    await dbClient.query('ROLLBACK');
    logger.error(`Error processing webhook for payment ${eventId}:`, error);
    // Si hay un error, lo guardamos en la tabla para poder revisarlo
    await db.query("UPDATE webhook_events SET status = 'failed', error_message = $1 WHERE event_id = $2", [error.message, eventId]);
    throw error; // Re-lanzamos el error para que el llamador sepa que falló
  } finally {
    dbClient.release();
  }
};
