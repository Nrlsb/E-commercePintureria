// backend-pintureria/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import compression from 'compression';
import cookieParser from 'cookie-parser'; // 1. Importar cookie-parser
import csurf from 'csurf'; // 2. Importar csurf
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

// --- Configuración de CORS ---
const corsOptions = {
  origin: (origin, callback) => {
    const isProduction = config.nodeEnv === 'production';
    let allowedOrigins = [];

    if (isProduction) {
      allowedOrigins.push('https://www.nrlsb.com'); 
      allowedOrigins.push('https://nrlsb.com');
      allowedOrigins.push(config.frontendUrl);
    } else {
      allowedOrigins.push('http://localhost:5173');
      allowedOrigins.push(config.frontendUrl);
      allowedOrigins.push(/^https:\/\/e-commercepintureria-.*\.vercel\.app$/);
      allowedOrigins.push(config.backendUrl);
      allowedOrigins.push(/^https:\/\/.*\.onrender\.com$/);
    }

    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else {
        return allowedOrigin.test(origin);
      }
    });

    if (!origin || isAllowed) {
      callback(null, true);
    } else {
      logger.warn(`CORS: Solicitud bloqueada desde el origen: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true, // Habilitar credenciales para que las cookies se envíen
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(compression()); 
app.use(passport.initialize());
app.post('/api/payment/notification', express.raw({ type: 'application/json' }), handlePaymentNotification);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 3. Usar cookie-parser ANTES de csurf
app.use(cookieParser());

// 4. Configurar csurf
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: config.nodeEnv === 'production', // Usar cookies seguras en producción
    sameSite: 'strict', // 'strict' es más seguro, pero puede requerir 'lax' si tienes redirecciones entre dominios
  },
});

// 5. Crear una ruta para que el frontend obtenga el token CSRF
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  // El middleware csurf añade el método req.csrfToken()
  res.json({ csrfToken: req.csrfToken() });
});

// 6. Aplicar la protección CSRF a todas las rutas que vienen después
app.use(csrfProtection);

app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: true,
  colorize: true,
  ignoreRoute: function (req, res) { return false; }
}));

app.use(express.static('public'));

// --- RUTAS DE LA API (AHORA PROTEGIDAS) ---
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

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at Promise:', promise, 'reason:', reason);
  process.exit(1); 
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// 7. Middleware para manejar errores específicos de CSRF
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.warn(`Token CSRF inválido para la petición: ${req.method} ${req.originalUrl}`);
    res.status(403).json({ message: 'Token CSRF inválido o ausente. Por favor, recarga la página.' });
  } else {
    next(err);
  }
});

// 8. Middleware de manejo de errores general
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Servidor corriendo en el puerto ${PORT}`);
});
