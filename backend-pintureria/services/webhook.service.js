// backend-pintureria/services/webhook.service.js
import db from '../db.js';
import mercadopago from 'mercadopago';
import { sendOrderConfirmationEmail, sendNewOrderNotificationToAdmin } from '../emailService.js';
import logger from '../logger.js';

const { MercadoPagoConfig, Payment } = mercadopago;
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
const payment = new Payment(client);

// Helper para obtener detalles completos de la orden para los correos
const getFullOrderDetails = async (orderId, dbClient) => {
  const query = `
    SELECT o.id, o.total_amount, o.tracking_number, o.created_at,
           u.email, u.first_name, u.last_name, u.dni as user_dni,
           (SELECT CONCAT(address_line1, ', ', city, ', ', state, ' ', postal_code) 
            FROM user_addresses 
            WHERE user_id = u.id AND is_default = true LIMIT 1) as shipping_address,
    COALESCE((SELECT json_agg(items) FROM (
      SELECT oi.quantity, oi.price, p.name, p.image_url as "imageUrl", p.id as product_id
      FROM order_items oi JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = o.id
    ) AS items), '[]'::json) AS items
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = $1
  `;
  const result = await dbClient.query(query, [orderId]);
  return result.rows[0];
};


export const processPaymentNotification = async (topic, eventId) => {
  if (topic !== 'payment') {
    logger.info(`Omitiendo procesamiento de webhook para el topic: ${topic}`);
    return;
  }

  const dbClient = await db.connect();
  try {
    const eventCheck = await dbClient.query("SELECT status FROM webhook_events WHERE event_id = $1", [eventId]);
    if (eventCheck.rows.length > 0 && eventCheck.rows[0].status !== 'received') {
        logger.warn(`El evento de webhook ${eventId} ya fue procesado o falló anteriormente (estado: ${eventCheck.rows[0].status}). Omitiendo.`);
        return;
    }

    logger.info(`Intentando obtener detalles del pago de Mercado Pago para eventId: ${eventId}`);
    const paymentInfo = await payment.get({ id: eventId });
    logger.info(`Respuesta COMPLETA de Mercado Pago para el pago ${eventId}:`, JSON.stringify(paymentInfo, null, 2));

    if (!paymentInfo) {
        throw new Error(`La información del pago es nula o indefinida para el ID ${eventId}`);
    }

    const orderId = paymentInfo.external_reference;
    if (!orderId) {
      throw new Error(`El pago ${eventId} no tiene una external_reference (orderId).`);
    }

    if (paymentInfo.status === 'approved') {
      await dbClient.query('BEGIN');

      const orderStatusResult = await dbClient.query("SELECT status FROM orders WHERE id = $1 FOR UPDATE", [orderId]);
      if (orderStatusResult.rows.length === 0) {
        throw new Error(`Orden #${orderId} no encontrada para el pago ${eventId}.`);
      }
      if (orderStatusResult.rows[0].status === 'approved') {
        logger.warn(`La orden #${orderId} ya está aprobada. Omitiendo procesamiento para el pago ${eventId}.`);
        await dbClient.query('COMMIT');
        await db.query("UPDATE webhook_events SET status = 'processed' WHERE event_id = $1", [eventId]);
        return;
      }

      const orderItemsResult = await dbClient.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [orderId]);
      for (const item of orderItemsResult.rows) {
        await dbClient.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
       
      await dbClient.query(
          "UPDATE orders SET status = 'approved', mercadopago_transaction_id = $1 WHERE id = $2", 
          [eventId, orderId]
      );

      const fullOrderDetails = await getFullOrderDetails(orderId, dbClient);
      
      if (fullOrderDetails) {
        // Enviar correos en paralelo
        await Promise.all([
            sendOrderConfirmationEmail(fullOrderDetails.email, fullOrderDetails),
            sendNewOrderNotificationToAdmin(fullOrderDetails)
        ]);
      }
      
      await dbClient.query('COMMIT');
      await db.query("UPDATE webhook_events SET status = 'processed', error_message = NULL WHERE event_id = $1", [eventId]);
      logger.info(`Webhook procesado exitosamente: Orden #${orderId} aprobada y stock actualizado.`);
    } else {
      logger.info(`Pago ${eventId} para la orden #${orderId} tiene estado '${paymentInfo.status}'. No se toma acción.`);
      await db.query("UPDATE webhook_events SET status = 'processed', error_message = NULL WHERE event_id = $1", [eventId]);
    }
  } catch (error) {
    if (dbClient) await dbClient.query('ROLLBACK');
    logger.error(`Error procesando webhook para el pago ${eventId}:`, error);
    await db.query("UPDATE webhook_events SET status = 'failed', error_message = $1 WHERE event_id = $2", [error.message, eventId]);
    throw error;
  } finally {
    if (dbClient) dbClient.release();
  }
};
