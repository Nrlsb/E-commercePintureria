// backend-pintureria/server.js
import express from 'express';
import cors from 'cors';
import db from './db.js'; 
import bcrypt from 'bcryptjs'; // 1. Importar bcrypt
import jwt from 'jsonwebtoken'; // 2. Importar jsonwebtoken

const app = express();
const PORT = 5001;
// 3. ¡IMPORTANTE! Necesitas una clave secreta para firmar los tokens.
const JWT_SECRET = 'tu_clave_secreta_super_dificil_de_adivinar';

app.use(cors()); 
app.use(express.json()); 

// --- Rutas de Productos (sin cambios) ---
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

// --- NUEVAS Rutas de Autenticación ---

// Ruta para REGISTRAR un nuevo usuario
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
  }

  try {
    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Guardar el nuevo usuario en la base de datos
    const result = await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, passwordHash]
    );

    res.status(201).json({ message: 'Usuario registrado con éxito', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    // Manejar error de email duplicado
    if (err.code === '23505') {
        return res.status(409).json({ message: 'El email ya está registrado.' });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Ruta para INICIAR SESIÓN
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    }

    try {
        // Buscar al usuario por email
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // Comparar la contraseña ingresada con la encriptada en la BD
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // Crear el token JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '1h' } // El token expira en 1 hora
        );

        res.json({ token, user: { id: user.id, email: user.email } });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});


// --- Iniciar el Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
