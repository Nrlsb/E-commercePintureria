// backend-pintureria/services/cronService.js
import cron from 'node-cron';
import db from '../db.js';
import { sendPaymentReminderEmail, sendOrderCancelledEmail } from '../emailService.js';
import logger from '../logger.js';

const getOrderDetailsForEmail = async (orderId, dbClient) => {
  // Using parameterized query to prevent SQL Injection
  const orderQuery = `
    SELECT o.id, o.total_amount, u.email
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = $1
  `;
  const orderResult = await dbClient.query(orderQuery, [orderId]);
  return orderResult.rows[0];
};

export const startCancelPendingOrdersJob = () => {
  cron.schedule('0 * * * *', async () => { // Se ejecuta cada hora
    logger.info('Ejecutando tarea: Cancelar y recordar órdenes pendientes...');
    const dbClient = await db.connect();
    try {
      await dbClient.query('BEGIN');

      // 1. Cancelar órdenes de más de 48hs
      // Query is static, no user input
      const expiredOrdersResult = await dbClient.query(
        "SELECT id FROM orders WHERE status = 'pending_transfer' AND created_at < NOW() - INTERVAL '48 hours'"
      );
      for (const order of expiredOrdersResult.rows) {
        try { // Añadido: Bloque try-catch para cada orden individual
          const orderDetails = await getOrderDetailsForEmail(order.id, dbClient);
          // Using parameterized query to prevent SQL Injection
          const itemsResult = await dbClient.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [order.id]);
          for (const item of itemsResult.rows) {
            // Using parameterized query to prevent SQL Injection
            await dbClient.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
          }
          // Using parameterized query to prevent SQL Injection
          await dbClient.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [order.id]);
          await sendOrderCancelledEmail(orderDetails.email, orderDetails);
          logger.info(`Orden #${order.id} cancelada y email enviado.`);
        } catch (individualError) {
          logger.error(`Error al procesar la cancelación de la orden #${order.id} en el cron job:`, individualError);
          // No hacemos rollback aquí para no afectar otras órdenes en el mismo batch.
          // La transacción principal se hará commit o rollback al final.
        }
      }

      // 2. Enviar recordatorio para órdenes entre 24 y 25 horas de antigüedad
      // Query is static, no user input
      const reminderOrdersResult = await dbClient.query(
        "SELECT id FROM orders WHERE status = 'pending_transfer' AND created_at BETWEEN NOW() - INTERVAL '25 hours' AND NOW() - INTERVAL '24 hours'"
      );
      for (const order of reminderOrdersResult.rows) {
        try { // Añadido: Bloque try-catch para cada recordatorio individual
          const orderDetails = await getOrderDetailsForEmail(order.id, dbClient);
          await sendPaymentReminderEmail(orderDetails.email, orderDetails);
          logger.info(`Recordatorio de pago enviado para la orden #${order.id}.`);
        } catch (individualError) {
          logger.error(`Error al enviar recordatorio para la orden #${order.id} en el cron job:`, individualError);
        }
      }

      await dbClient.query('COMMIT');
      logger.info('Tarea de cancelación y recordatorio de órdenes finalizada con éxito.');
    } catch (error) {
      await dbClient.query('ROLLBACK');
      logger.error('Error general en la tarea de cancelación/recordatorio de órdenes:', error);
    } finally {
      dbClient.release();
    }
  });
};
