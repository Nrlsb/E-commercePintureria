import db from '../db.js';
import mercadopago from 'mercadopago';
import { sendOrderConfirmationEmail } from '../emailService.js';

const { MercadoPagoConfig, Payment } = mercadopago;
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
const payment = new Payment(client);

export const handlePaymentNotification = async (req, res) => {
  const { query } = req;
  const topic = query.topic || query.type;
  
  console.log('Notificación recibida:', { topic, id: query.id });

  const dbClient = await db.connect();

  try {
    if (topic === 'payment') {
      const paymentId = query.id;
      if (!paymentId) return res.sendStatus(200);
      
      const paymentInfo = await payment.get({ id: paymentId });
      const orderId = paymentInfo.external_reference;
      
      if (paymentInfo.status === 'approved') {
        await dbClient.query('BEGIN');
        
        const orderItemsResult = await dbClient.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [orderId]);
        const orderItems = orderItemsResult.rows;

        for (const item of orderItems) {
          await dbClient.query(
            'UPDATE products SET stock = stock - $1 WHERE id = $2',
            [item.quantity, item.product_id]
          );
        }
        
        await dbClient.query(
            "UPDATE orders SET status = 'approved', mercadopago_transaction_id = $1 WHERE id = $2", 
            [paymentId, orderId]
        );

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
        
        await dbClient.query('COMMIT');
      }
    }
    res.sendStatus(200);
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('Error en el webhook de Mercado Pago:', error);
    res.sendStatus(500);
  } finally {
    dbClient.release();
  }
};
