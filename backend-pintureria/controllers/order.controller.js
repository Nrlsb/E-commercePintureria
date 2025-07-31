// backend-pintureria/controllers/order.controller.js

const mercadopago = require('mercadopago');
const pool = require('../db');
const logger = require('../logger');
const config = require('../config');
const AppError = require('../utils/AppError');
const { sendOrderConfirmationEmail } = require('../emailService');

// Configurar Mercado Pago
mercadopago.configure({
  access_token: config.mpAccessToken
});

exports.createOrder = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.user.id;
    const { cart, shippingAddress, shippingCost, couponId, discountAmount, finalTotal } = req.body;

    if (!cart || cart.length === 0) {
      return next(new AppError('El carrito está vacío', 400));
    }

    // Validar stock antes de crear la orden
    for (const item of cart) {
      const stockResult = await client.query('SELECT stock FROM products WHERE id = $1', [item.id]);
      if (stockResult.rows.length === 0 || stockResult.rows[0].stock < item.quantity) {
        throw new AppError(`Stock insuficiente para el producto: ${item.name}`, 400);
      }
    }

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total, status, shipping_address, shipping_cost, coupon_id, discount_amount)
       VALUES ($1, $2, 'pending', $3, $4, $5, $6) RETURNING id`,
      [userId, finalTotal, shippingAddress, shippingCost, couponId, discountAmount]
    );
    const orderId = orderResult.rows[0].id;

    const itemPromises = cart.map(item => {
      return client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.id, item.quantity, item.price]
      );
    });
    await Promise.all(itemPromises);

    const stockPromises = cart.map(item => {
      return client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.id]
      );
    });
    await Promise.all(stockPromises);

    await client.query('COMMIT');
    
    // Opcional: Enviar email de confirmación de orden creada (aún pendiente de pago)
    // await sendOrderConfirmationEmail(req.user.email, orderId);

    res.status(201).json({ success: true, orderId });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error al crear la orden:', error);
    if (error instanceof AppError) {
        return next(error);
    }
    next(new AppError('No se pudo crear la orden. Por favor, intente de nuevo.', 500));
  } finally {
    client.release();
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error al obtener órdenes:', error);
    next(new AppError('Error al obtener las órdenes del usuario.', 500));
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (orderResult.rows.length === 0) {
      return next(new AppError('Orden no encontrada.', 404));
    }

    const itemsResult = await pool.query(
      'SELECT oi.*, p.name, p.thumbnail_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1',
      [id]
    );

    const order = orderResult.rows[0];
    order.items = itemsResult.rows;

    res.json(order);
  } catch (error) {
    logger.error(`Error al obtener la orden ${req.params.id}:`, error);
    next(new AppError('Error al obtener los detalles de la orden.', 500));
  }
};

exports.createPixPayment = async (req, res, next) => {
  const { orderId, shippingAddress } = req.body;
  const userId = req.user.id;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [orderId, userId]);
    if (orderResult.rows.length === 0) {
      return next(new AppError('Orden no encontrada', 404));
    }
    const order = orderResult.rows[0];

    if (order.status !== 'pending') {
        return next(new AppError('Esta orden ya ha sido procesada o está en un estado inválido.', 400));
    }

    const itemsResult = await pool.query('SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE order_id = $1', [orderId]);
    const items = itemsResult.rows;

    const preferenceItems = items.map(item => ({
      id: item.product_id.toString(),
      title: item.name,
      quantity: item.quantity,
      unit_price: parseFloat(item.price)
    }));
    
    // --- CAMBIO IMPORTANTE ---
    // Corregimos el objeto 'payer' para que envíe datos válidos.
    // Asumimos que el frontend envía 'identificationType' y 'identificationNumber'
    // desde un formulario de checkout.
    // Para Argentina, el tipo de documento para un consumidor final es 'DNI'.
    const paymentData = {
      transaction_amount: parseFloat(order.total),
      description: `Pedido #${order.id} - Pinturería Mercurio`,
      // NOTA: 'pix' es para Brasil. Para Transferencia en Argentina, el método es 'transfer'.
      // Deberías ajustar esto según el país de tu cuenta de Mercado Pago.
      payment_method_id: 'pix', 
      payer: {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        identification: {
          // Asegúrate de que el frontend envíe el tipo correcto ('DNI', 'CUIT', etc.)
          type: shippingAddress.identificationType || 'DNI', 
          // Asegúrate de que el frontend envíe un número de documento válido.
          // Para pruebas, usa los que provee Mercado Pago en su documentación.
          number: shippingAddress.identificationNumber 
        },
        address: {
          zip_code: shippingAddress.postalCode,
          street_name: shippingAddress.street,
          street_number: shippingAddress.number, // Es importante pedir el número de calle
          neighborhood: shippingAddress.neighborhood,
          city: shippingAddress.city,
          federal_unit: shippingAddress.state // Usar el código de provincia (ej: 'AR-S' para Santa Fe)
        }
      },
      notification_url: `${config.serverUrl}/api/payment/notification`,
      external_reference: order.id.toString(),
    };
    // --- FIN DEL CAMBIO ---

    logger.debug(`Enviando el siguiente payload a Mercado Pago para pago PIX/Transfer: ${JSON.stringify(paymentData)}`);

    const payment = await mercadopago.payment.create(paymentData);

    logger.info(`Respuesta de Mercado Pago para orden ${order.id}:`, { status: payment.status, status_detail: payment.body.status_detail });

    await pool.query('UPDATE orders SET payment_id = $1, payment_method = $2 WHERE id = $3', [payment.body.id, 'pix', order.id]);

    res.status(201).json({
      paymentId: payment.body.id,
      qrCode: payment.body.point_of_interaction.transaction_data.qr_code,
      qrCodeBase64: payment.body.point_of_interaction.transaction_data.qr_code_base64
    });

  } catch (error) {
    logger.error(`Error completo creando pago PIX/Transfer para la orden ${orderId}:`, error);
    // Extraer el mensaje de error específico de Mercado Pago si está disponible
    const mpError = error.cause ? JSON.stringify(error.cause) : error.message;
    logger.error(`DETALLES DEL ERROR: ${mpError}`);
    next(new AppError(`Error al crear el pago: ${mpError}`, 500));
  }
};
