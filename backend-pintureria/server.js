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
const PORT = process.env.PORT || 5001;

const JWT_SECRET = process.env.JWT_SECRET;
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });


app.use(cors()); 
app.use(express.json()); 

// --- MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN ---
// Este middleware verificará el token y si el usuario es administrador.
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

  if (token == null) {
    return res.sendStatus(401); // No hay token, no autorizado
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Token inválido o expirado
    }
    req.user = user; // Guardamos el usuario decodificado del token en la request
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};


// --- Rutas Públicas de Productos ---
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


// --- RUTAS DE ADMINISTRACIÓN DE PRODUCTOS (PROTEGIDAS) ---

// Crear un nuevo producto
app.post('/api/products', [authenticateToken, isAdmin], async (req, res) => {
  const { name, brand, category, price, old_price, image_url, description } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO products (name, brand, category, price, old_price, image_url, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, brand, category, price, old_price, image_url, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear el producto' });
  }
});

// Actualizar un producto existente
app.put('/api/products/:id', [authenticateToken, isAdmin], async (req, res) => {
  const { id } = req.params;
  const { name, brand, category, price, old_price, image_url, description } = req.body;
  try {
    const result = await db.query(
      'UPDATE products SET name = $1, brand = $2, category = $3, price = $4, old_price = $5, image_url = $6, description = $7 WHERE id = $8 RETURNING *',
      [name, brand, category, price, old_price, image_url, description, id]
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

// Eliminar un producto
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

// CAMBIO: El endpoint de login ahora también devuelve el rol.
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    }
    try {
        // Ahora también seleccionamos la columna 'role'
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        // Incluimos el rol en el payload del token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        // Devolvemos el rol junto con el resto de la información del usuario
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});


// --- Ruta de Mercado Pago ---
app.post('/api/create-payment-preference', async (req, res) => {
  try {
    const { cart } = req.body;
    
    if (!cart || cart.length === 0) {
      return res.status(400).json({ message: 'El carrito está vacío.' });
    }

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
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
