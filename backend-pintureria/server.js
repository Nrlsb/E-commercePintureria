// backend-pintureria/server.js
import dotenv from 'dotenv';
dotenv.config(); 

import express from 'express';
import cors from 'cors';
import db from './db.js'; 
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const app = express();
// Render asigna el puerto dinámicamente, por eso usamos process.env.PORT
const PORT = process.env.PORT || 5001;

const JWT_SECRET = process.env.JWT_SECRET;
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });


app.use(cors()); 
app.use(express.json()); 

// --- Rutas de Productos ---
app.get('/api/products', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products ORDER BY id ASC');
    const products = result.rows.map(p => ({ ...p, imageUrl: p.image_url, oldPrice: p.old_price }));
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.get('/api/products/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const result = await db.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (result.rows.length > 0) {
      const product = result.rows[0];
      res.json({ ...product, imageUrl: product.image_url, oldPrice: product.old_price });
    } else {
      res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// --- Rutas de Autenticación ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const result = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, passwordHash]
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
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.json({ token, user: { id: user.id, email: user.email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// --- RUTA PARA MERCADO PAGO (VERSIÓN FINAL) ---
app.post('/api/create-payment-preference', async (req, res) => {
  try {
    const { cart } = req.body;
    
    if (!cart || cart.length === 0) {
      return res.status(400).json({ message: 'El carrito está vacío.' });
    }

    // Para producción, es crucial usar la URL del frontend desplegado.
    // Asegúrate de tener VITE_FRONTEND_URL en las variables de entorno de Render.
    const frontendUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:5173';

    const items = cart.map(product => ({
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
        success: `${frontendUrl}/success`,
        failure: `${frontendUrl}/cart`,
        pending: `${frontendUrl}/cart`,
      },
      auto_return: 'approved',
    };

    const preference = new Preference(client);
    const result = await preference.create({ body });

    res.json({ id: result.id });

  } catch (error) {
    console.error('Error al crear la preferencia de pago:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor al crear la preferencia.',
      error: error.message
    });
  }
});


app.listen(PORT, () => {
  // En producción, Render usa el puerto 10000, pero localmente seguirá siendo 5001.
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
