import dotenv from 'dotenv';
dotenv.config(); 

import express from 'express';
import cors from 'cors';

// Importadores de Rutas
import productRoutes from './routes/product.routes.js';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';

const app = express();
const PORT = process.env.PORT || 5001;

// --- Configuración de CORS ---
const whitelist = [
  'http://localhost:5173',
  'https://e-commerce-pintureria.vercel.app',
  /^https:\/\/e-commerce-pintureria-.*\.vercel\.app$/
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (whitelist.some(allowedOrigin => 
        typeof allowedOrigin === 'string' 
          ? allowedOrigin === origin 
          : allowedOrigin.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// --- Middlewares Globales ---
// Middleware para parsear JSON en todas las rutas
app.use(express.json());

// --- Montaje de Rutas ---
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// --- CAMBIO CLAVE: Montaje especial para el webhook ---
// Se monta el router de pagos en su ruta base, pero el middleware raw se aplica
// directamente en el router de pagos para no afectar a otras rutas.
// Esto asegura que la ruta /api/payment/notification no sea parseada como JSON.
app.use('/api/payment', paymentRoutes);


// --- Inicio del Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
