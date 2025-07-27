// backend-pintureria/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import compression from 'compression';
import cookieParser from 'cookie-parser'; // Importar cookie-parser
import csurf from 'csurf'; // Importar csurf
import './config/passport-setup.js';
import { startCancelPendingOrdersJob } from './services/cronService.js';
import expressWinston from 'express-winston';
import logger from './logger.js';
import config from './config/index.js';

// Importadores de Rutas
import productRoutes from './routes/product.routes.js';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import shippingRoutes from './routes/shipping.routes.js';
import reviewRoutes from './routes/review.routes.js';
import couponRoutes from './routes/coupons.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import utilsRoutes from './routes/utils.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import userRoutes from './routes/user.routes.js';
import errorHandler from './middlewares/errorHandler.js';
import { handlePaymentNotification } from './controllers/payment.controller.js';


const app = express();
const PORT = config.port;

app.use(helmet());
app.set('trust proxy', 1);

// --- MODIFICACIÓN: Configuración de CORS más estricta en producción ---
const corsOptions = {
  origin: (origin, callback) => {
    const isProduction = config.nodeEnv === 'production';
    let allowedOrigins = [];

    if (isProduction) {
      // En producción, solo permite el origen explícito del frontend.
      // Es crucial que config.frontendUrl apunte a tu dominio de producción (ej. 'https://e-commerce-pintureria.vercel.app').
      allowedOrigins.push(config.frontendUrl);
    } else {
      // En desarrollo o testing, permite localhost y las URLs de previsualización de Vercel.
      allowedOrigins.push('http://localhost:5173');
      allowedOrigins.push(config.frontendUrl); // También permite la URL de producción en desarrollo
      allowedOrigins.push(/^https:\/\/e-commerce-pintureria-.*\.vercel\.app$/); // Para previsualizaciones de Vercel
    }

    // Verifica si el origen de la solicitud está en la lista de permitidos.
    // Si no hay un origen (ej. solicitudes del mismo origen o herramientas como Postman), se permite.
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else { // Es una expresión regular
        return allowedOrigin.test(origin);
      }
    });

    if (!origin || isAllowed) {
      callback(null, true);
    } else {
      // Si el origen no está permitido, se rechaza la solicitud CORS.
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true, // Importante para que las cookies (incluida la de CSRF) se envíen
  optionsSuccessStatus: 200 // Para solicitudes OPTIONS preflight
};

app.use(cors(corsOptions));

// Usar el middleware de compresión
app.use(compression()); 

// Middleware para parsear cookies. Debe ir antes de csurf.
app.use(cookieParser());

// Middleware CSRF. La cookie csrf-token se generará y se enviará al cliente.
// El cliente debe incluir este token en el header 'X-CSRF-Token' para solicitudes POST, PUT, DELETE.
const csrfProtection = csurf({ cookie: true });
app.use(csrfProtection);

app.use(passport.initialize());

app.post('/api/payment/notification', express.raw({ type: 'application/json' }), handlePaymentNotification);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: true,
  colorize: true,
  ignoreRoute: function (req, res) { return false; }
}));

app.use(express.static('public'));

// Ruta para obtener el token CSRF. El frontend llamará a esto para obtener el token.
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Definición del resto de las rutas de la API
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/utils', utilsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/user', userRoutes);

startCancelPendingOrdersJob();

app.use(expressWinston.errorLogger({
  winstonInstance: logger
}));

// --- NUEVO: Manejo de errores no capturados (unhandledRejection, uncaughtException) ---
// Captura promesas rechazadas no manejadas.
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at Promise:', promise, 'reason:', reason);
  // Termina el proceso para evitar un estado inconsistente, permitiendo que un reiniciador de procesos lo levante.
  process.exit(1); 
});

// Captura excepciones no capturadas.
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Termina el proceso para evitar un estado inconsistente.
  process.exit(1);
});

// Middleware de manejo de errores de CSRF
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.warn('CSRF token validation failed for request:', req.method, req.url);
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  next(err);
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Servidor corriendo en el puerto ${PORT}`);
});
