// backend-pintureria/server.js
import dotenv from 'dotenv';
dotenv.config(); 

import express from 'express';
import cors from 'cors';
import db from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendOrderConfirmationEmail } from './emailService.js';
import mercadopago from 'mercadopago';
const { MercadoPagoConfig, Preference, Payment, PaymentRefund } = mercadopago;

const app = express();
const PORT = process.env.PORT || 5001;

const JWT_SECRET = process.env.JWT_SECRET;
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
const payment = new Payment(client);

const whitelist = [
  'http://localhost:5173',
  'https://e-commerce-pintureria.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  if (req.originalUrl.includes('/api/payment-notification')) {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};

// --- RUTAS DE PRODUCTOS ---
app.get('/api/products', async (req, res) => {
  try {
    const { category, sortBy, brands, minPrice, maxPrice } = req.query;

    let baseQuery = `
      SELECT 
        p.*, 
        COALESCE(AVG(r.rating), 0) as average_rating, 
        COUNT(r.id) as review_count
      FROM products p
      LEFT JOIN reviews r ON p.id = r.product_id
    `;
    
    const whereClauses = [];
    const queryParams = [];
    let paramIndex = 1;

    if (category) {
      whereClauses.push(`p.category = $${paramIndex++}`);
      queryParams.push(category);
    }

    if (brands) {
      const brandList = brands.split(',');
      whereClauses.push(`p.brand = ANY($${paramIndex++})`);
      queryParams.push(brandList);
    }

    if (minPrice) {
      whereClauses.push(`p.price >= $${paramIndex++}`);
      queryParams.push(minPrice);
    }

    if (maxPrice) {
      whereClauses.push(`p.price <= $${paramIndex++}`);
      queryParams.push(maxPrice);
    }

    if (whereClauses.length > 0) {
      baseQuery += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    baseQuery += ` GROUP BY p.id`;

    let orderByClause = ' ORDER BY p.id ASC';
    switch (sortBy) {
      case 'price_asc':
        orderByClause = ' ORDER BY p.price ASC';
        break;
      case 'price_desc':
        orderByClause = ' ORDER BY p.price DESC';
        break;
      case 'rating_desc':
        orderByClause = ' ORDER BY average_rating DESC';
        break;
    }
    baseQuery += orderByClause;

    const result = await db.query(baseQuery, queryParams);
    
    const products = result.rows.map(p => ({ 
      ...p, 
      imageUrl: p.image_url, 
      oldPrice: p.old_price,
      averageRating: parseFloat(p.average_rating),
      reviewCount: parseInt(p.review_count, 10),
      stock: parseInt(p.stock, 10)
    }));
    
    res.json(products);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.get('/api/products/brands', async (req, res) => {
  try {
    const result = await db.query('SELECT DISTINCT brand FROM products ORDER BY brand ASC');
    const brands = result.rows.map(row => row.brand);
    res.json(brands);
  } catch (err) {
    console.error('Error al obtener las marcas:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.get('/api/products/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const query = `
      SELECT 
        p.*, 
        COALESCE(AVG(r.rating), 0) as average_rating, 
        COUNT(r.id) as review_count
      FROM products p
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.id = $1
      GROUP BY p.id;
    `;
    const result = await db.query(query, [productId]);
    if (result.rows.length > 0) {
      const product = result.rows[0];
      res.json({ 
        ...product, 
        imageUrl: product.image_url, 
        oldPrice: product.old_price,
        averageRating: parseFloat(product.average_rating),
        reviewCount: parseInt(product.review_count, 10),
        stock: parseInt(product.stock, 10)
      });
    } else {
      res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// --- RUTAS PARA RESEÑAS ---
app.get('/api/products/:productId/reviews', async (req, res) => {
  const { productId } = req.params;
  try {
    const query = `
      SELECT r.*, u.first_name, u.last_name 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC;
    `;
    const result = await db.query(query, [productId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener las reseñas' });
  }
});

app.post('/api/products/:productId/reviews', authenticateToken, async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.userId;

  try {
    const query = `
      INSERT INTO reviews (rating, comment, product_id, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await db.query(query, [rating, comment, productId, userId]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { 
      return res.status(409).json({ message: 'Ya has enviado una reseña para este producto.' });
    }
    res.status(500).json({ message: 'Error al crear la reseña' });
  }
});

app.delete('/api/reviews/:reviewId', authenticateToken, async (req, res) => {
  const { reviewId } = req.params;
  const { userId, role } = req.user;

  try {
    const reviewResult = await db.query('SELECT user_id FROM reviews WHERE id = $1', [reviewId]);
    
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ message: 'Reseña no encontrada.' });
    }

    const review = reviewResult.rows[0];

    if (review.user_id !== userId && role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar esta reseña.' });
    }

    await db.query('DELETE FROM reviews WHERE id = $1', [reviewId]);
    
    res.status(200).json({ message: 'Reseña eliminada con éxito.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar la reseña.' });
  }
});

// --- RUTAS DE ADMINISTRACIÓN DE PRODUCTOS ---
app.post('/api/products', [authenticateToken, isAdmin], async (req, res) => {
  const { name, brand, category, price, old_price, image_url, description, stock } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO products (name, brand, category, price, old_price, image_url, description, stock) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [name, brand, category, price, old_price, image_url, description, stock]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear el producto' });
  }
});

app.put('/api/products/:id', [authenticateToken, isAdmin], async (req, res) => {
  const { id } = req.params;
  const { name, brand, category, price, old_price, image_url, description, stock } = req.body;
  try {
    const result = await db.query(
      'UPDATE products SET name = $1, brand = $2, category = $3, price = $4, old_price = $5, image_url = $6, description = $7, stock = $8 WHERE id = $9 RETURNING *',
      [name, brand, category, price, old_price, image_url, description, stock, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar el producto' });
  }
});

app.delete('/api/products/:id', [authenticateToken, isAdmin], async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.status(200).json({ message: 'Producto eliminado con éxito' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar el producto' });
  }
});

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'Nombre, apellido, email y contraseña son requeridos.' });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const result = await db.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
      [email, passwordHash, firstName, lastName, phone]
    );
    res.status(201).json({ message: 'Usuario registrado con éxito', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
        return res.status(409).json({ message: 'El email ya está registrado.' });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    }
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// --- RUTAS DE ÓRDENES ---
app.get('/api/orders', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const ordersResult = await db.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    const orders = ordersResult.rows;

    for (const order of orders) {
      const itemsResult = await db.query(`
        SELECT oi.quantity, oi.price, p.name, p.image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
      `, [order.id]);
      order.items = itemsResult.rows.map(item => ({...item, imageUrl: item.image_url}));
    }

    res.json(orders);
  } catch (error) {
    console.error('Error al obtener el historial de órdenes:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

app.get('/api/admin/orders', [authenticateToken, isAdmin], async (req, res) => {
    try {
        const result = await db.query(`
            SELECT o.*, u.email as user_email 
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener todas las órdenes:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

app.post('/api/orders/:orderId/cancel', [authenticateToken, isAdmin], async (req, res) => {
    const { orderId } = req.params;
    try {
        const orderResult = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Orden no encontrada.' });
        }
        const order = orderResult.rows[0];

        if (order.status === 'cancelled') {
            return res.status(400).json({ message: 'La orden ya ha sido cancelada.' });
        }

        if (order.mercadopago_transaction_id) {
            const refundClient = new PaymentRefund(client);
            await refundClient.create({
                payment_id: order.mercadopago_transaction_id
            });
        }

        const updatedOrderResult = await db.query(
            "UPDATE orders SET status = 'cancelled' WHERE id = $1 RETURNING *",
            [orderId]
        );

        res.status(200).json({ message: 'Orden cancelada y reembolso procesado con éxito.', order: updatedOrderResult.rows[0] });

    } catch (error) {
        console.error('Error al cancelar orden:', error);
        const errorMessage = error.cause?.message || error.message || 'Error interno del servidor al procesar la cancelación.';
        res.status(500).json({ message: errorMessage });
    }
});

// --- RUTA: Creación de Preferencia de Pago ---
app.post('/api/create-payment-preference', authenticateToken, async (req, res) => {
  const { cart } = req.body;
  const userId = req.user.userId;

  if (!cart || cart.length === 0) {
    return res.status(400).json({ message: 'El carrito está vacío.' });
  }

  try {
    for (const item of cart) {
      const stockResult = await db.query('SELECT stock FROM products WHERE id = $1', [item.id]);
      if (stockResult.rows.length === 0) {
        return res.status(404).json({ message: `Producto "${item.name}" no encontrado.` });
      }
      const availableStock = stockResult.rows[0].stock;
      if (item.quantity > availableStock) {
        return res.status(400).json({ message: `Stock insuficiente para "${item.name}". Solo quedan ${availableStock} unidades.` });
      }
    }

    const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    const orderResult = await db.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING id',
      [userId, totalAmount, 'pending']
    );
    const orderId = orderResult.rows[0].id;

    for (const item of cart) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.id, item.quantity, item.price]
      );
    }
    
    const frontendUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';
    const notification_url = `${process.env.BACKEND_URL}/api/payment-notification`;

    const items = cart.map(product => ({
      id: product.id,
      title: product.name,
      description: product.brand,
      picture_url: product.imageUrl,
      quantity: Number(product.quantity),
      unit_price: Number(product.price),
      currency_id: 'ARS',
    }));

    const body = {
      items: items,
      back_urls: {
        success: `${frontendUrl}/success?order_id=${orderId}`,
        failure: `${frontendUrl}/cart`,
        pending: `${frontendUrl}/cart`,
      },
      auto_return: 'approved',
      external_reference: orderId.toString(),
      notification_url: notification_url,
    };

    const preference = new Preference(client);
    const result = await preference.create({ body });
    
    await db.query('UPDATE orders SET mercadopago_payment_id = $1 WHERE id = $2', [result.id, orderId]);

    res.json({ id: result.id });

  } catch (error) {
    console.error('Error al crear la preferencia de pago:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor al crear la preferencia.',
      error: error.message
    });
  }
});

// --- WEBHOOK ---
app.post('/api/payment-notification', async (req, res) => {
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
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
