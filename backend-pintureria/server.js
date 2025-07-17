// backend-pintureria/server.js
import dotenv from 'dotenv';
dotenv.config(); 

import express from 'express';
import cors from 'cors';

// Importadores de Rutas
import productRoutes from './routes/product.routes.js';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import shippingRoutes from './routes/shipping.routes.js';
import reviewRoutes from './routes/review.routes.js';
import couponRoutes from './routes/coupons.routes.js';

const app = express();
const PORT = process.env.PORT || 5001;

// --- Configuración de CORS ---
// Se ha modificado la whitelist para ser más flexible con los dominios de Vercel.
const whitelist = [
  'http://localhost:5173', // Para desarrollo local
  // Esta expresión regular aceptará el dominio principal y cualquier subdominio de preview/branch de Vercel.
  /^https:\/\/e-commerce-pintureria.*\.vercel\.app$/
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permite requests sin 'origin' (como Postman o apps móviles)
    if (!origin) {
      return callback(null, true);
    }
    // Comprueba si el origen está en nuestra whitelist
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
app.use(express.json());

// --- Montaje de Rutas ---
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);


// --- Inicio del Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
