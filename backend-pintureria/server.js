// backend-pintureria/server.js

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
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
import chatbotRoutes from './routes/chatbot.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import reportsRoutes from './routes/reports.routes.js'; // <-- AÑADIDO
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
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(compression()); 
app.use(passport.initialize());

app.post('/api/payment/notification', express.raw({ type: 'application/json' }), handlePaymentNotification);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
  },
});

// La ruta del chatbot no necesita protección CSRF ya que es una API de solo lectura de datos
app.use('/api/chatbot', chatbotRoutes);

app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

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

// --- RUTAS DE LA API ---
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
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/reports', reportsRoutes); // <-- AÑADIDO

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

app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.warn(`Token CSRF inválido para la petición: ${req.method} ${req.originalUrl}`);
    res.status(403).json({ message: 'Token CSRF inválido o ausente. Por favor, recarga la página.' });
  } else {
    next(err);
  }
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Servidor corriendo en el puerto ${PORT}`);
});
