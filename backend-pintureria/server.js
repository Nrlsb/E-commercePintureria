// backend-pintureria/server.js
import dotenv from 'dotenv';
dotenv.config(); 

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'; // 1. Importar cookie-parser
import { startCancelPendingOrdersJob } from './services/cronService.js';
import expressWinston from 'express-winston';
import logger from './logger.js';

// Importadores de Rutas
import productRoutes from './routes/product.routes.js';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import shippingRoutes from './routes/shipping.routes.js';
import reviewRoutes from './routes/review.routes.js';
import couponRoutes from './routes/coupons.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import errorHandler from './middlewares/errorHandler.js';

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
    if (!origin || whitelist.some(allowedOrigin => 
        typeof allowedOrigin === 'string' 
          ? allowedOrigin === origin 
          : allowedOrigin.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200,
  credentials: true // 2. Permitir el envío de cookies
};

app.use(cors(corsOptions));

// --- Middlewares Globales ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser()); // 3. Usar cookie-parser

// ... (el resto del archivo permanece igual)

// --- Middleware de Logging de Peticiones (antes de las rutas) ---
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: true,
  colorize: true,
  ignoreRoute: function (req, res) { return false; }
}));

// --- Servir archivos estáticos ---
app.use(express.static('public'));

// --- Montaje de Rutas ---
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/uploads', uploadRoutes);

// --- Inicio de Tareas Programadas ---
startCancelPendingOrdersJob();

// --- Middleware de Logging de Errores (después de las rutas y antes del manejador de errores) ---
app.use(expressWinston.errorLogger({
  winstonInstance: logger
}));

// --- Middleware de Manejo de Errores ---
app.use(errorHandler);

// --- Inicio del Servidor ---
app.listen(PORT, () => {
  logger.info(`Servidor corriendo en el puerto ${PORT}`);
});
