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

// --- CAMBIO CLAVE: Configuración de CORS Simplificada y Robusta ---
// Lista de orígenes permitidos. Incluye la URL local, la de producción,
// y una expresión regular para todas las URLs de vista previa de Vercel.
const whitelist = [
  'http://localhost:5173',
  'https://e-commerce-pintureria.vercel.app',
  // Esta expresión regular permite cualquier subdominio de vista previa de Vercel para tu proyecto.
  // Por ejemplo: https://e-commerce-pintureria-git-main-mi-equipo.vercel.app
  /^https:\/\/e-commerce-pintureria-.*\.vercel\.app$/
];

const corsOptions = {
  origin: (origin, callback) => {
    // Permite solicitudes sin 'origin' (como Postman, apps móviles, etc.)
    if (!origin) {
      return callback(null, true);
    }
    // Comprueba si el origen de la solicitud coincide con nuestra lista blanca
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
  optionsSuccessStatus: 200 // Para compatibilidad con navegadores antiguos
};

app.use(cors(corsOptions));

// --- Middlewares Globales ---
// Middleware especial para el webhook de MercadoPago que necesita el body en formato raw
app.use('/api/payment/notification', express.raw({ type: 'application/json' }));
// Middleware para parsear JSON en todas las demás rutas
app.use(express.json());


// --- Montaje de Rutas ---
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);


// --- Inicio del Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
