// backend-pintureria/services/cronService.js
import cron from 'node-cron';
import db from '../db.js';
import { sendPaymentReminderEmail, sendOrderCancelledEmail } from '../emailService.js';

const getOrderDetailsForEmail = async (orderId, dbClient) => {
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
  cron.schedule('0 * * * *', async () => {
    console.log('Ejecutando tarea: Cancelar y recordar órdenes pendientes...');
    const dbClient = await db.connect();
    try {
      await dbClient.query('BEGIN');

      // 1. Cancelar órdenes de más de 48hs
      const expiredOrdersResult = await dbClient.query(
        "SELECT id FROM orders WHERE status = 'pending_transfer' AND created_at < NOW() - INTERVAL '48 hours'"
      );
      for (const order of expiredOrdersResult.rows) {
        const orderDetails = await getOrderDetailsForEmail(order.id, dbClient);
        const itemsResult = await dbClient.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [order.id]);
        for (const item of itemsResult.rows) {
          await dbClient.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
        }
        await dbClient.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [order.id]);
        await sendOrderCancelledEmail(orderDetails.email, orderDetails);
        console.log(`Orden #${order.id} cancelada y email enviado.`);
      }

      // 2. Enviar recordatorio para órdenes entre 24 y 25 horas de antigüedad
      const reminderOrdersResult = await dbClient.query(
        "SELECT id FROM orders WHERE status = 'pending_transfer' AND created_at BETWEEN NOW() - INTERVAL '25 hours' AND NOW() - INTERVAL '24 hours'"
      );
      for (const order of reminderOrdersResult.rows) {
        const orderDetails = await getOrderDetailsForEmail(order.id, dbClient);
        await sendPaymentReminderEmail(orderDetails.email, orderDetails);
        console.log(`Recordatorio de pago enviado para la orden #${order.id}.`);
      }

      await dbClient.query('COMMIT');
    } catch (error) {
      await dbClient.query('ROLLBACK');
      console.error('Error en la tarea de cancelación/recordatorio de órdenes:', error);
    } finally {
      dbClient.release();
    }
  });
};
