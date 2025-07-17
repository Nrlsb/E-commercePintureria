// backend-pintureria/services/cronService.js
import cron from 'node-cron';
import db from '../db.js';

/**
 * Inicia una tarea programada que se ejecuta cada hora para cancelar órdenes
 * con estado 'pending_transfer' que tengan más de 48 horas de antigüedad.
 * Al cancelarlas, devuelve el stock de los productos al inventario.
 */
export const startCancelPendingOrdersJob = () => {
  // Se ejecuta en el minuto 0 de cada hora: '0 * * * *'
  cron.schedule('0 * * * *', async () => {
    console.log('Ejecutando tarea: Cancelar órdenes pendientes vencidas...');
    const dbClient = await db.connect();
    try {
      await dbClient.query('BEGIN');

      // 1. Encontrar órdenes con estado 'pending_transfer' de más de 48 horas
      const expiredOrdersResult = await dbClient.query(
        "SELECT id FROM orders WHERE status = 'pending_transfer' AND created_at < NOW() - INTERVAL '48 hours'"
      );
      const expiredOrders = expiredOrdersResult.rows;

      if (expiredOrders.length === 0) {
        console.log('No hay órdenes vencidas para cancelar.');
        await dbClient.query('COMMIT');
        dbClient.release();
        return;
      }

      console.log(`Se encontraron ${expiredOrders.length} órdenes vencidas para cancelar.`);

      for (const order of expiredOrders) {
        // 2. Devolver el stock de los productos de la orden cancelada
        const itemsResult = await dbClient.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [order.id]);
        for (const item of itemsResult.rows) {
          await dbClient.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
        }

        // 3. Actualizar el estado de la orden a 'cancelled'
        await dbClient.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [order.id]);
        console.log(`Orden #${order.id} cancelada y stock devuelto.`);
      }

      await dbClient.query('COMMIT');
    } catch (error) {
      await dbClient.query('ROLLBACK');
      console.error('Error en la tarea de cancelación de órdenes:', error);
    } finally {
      dbClient.release();
    }
  });
};
