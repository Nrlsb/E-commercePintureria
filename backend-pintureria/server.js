// backend-pintureria/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import compression from 'compression';
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
// CORRECCIÓN: Cambiar 'reviews.routes.js' a 'review.routes.js'
import reviewRoutes from './routes/review.routes.js'; 
import couponRoutes from './routes/coupons.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import utilsRoutes from './routes/utils.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import userRoutes from './routes/user.routes.js';
import errorHandler from './middlewares/errorHandler.js';
import { handlePaymentNotification } from './controllers/payment.controller.js';


// --- INICIO DE LOGS DE DEPURACIÓN DE VARIABLES DE ENTORNO ---
// ESTO ES SOLO PARA DEPURACIÓN. ELIMINAR EN PRODUCCIÓN.
console.log('--- DEBUGGING ENVIRONMENT VARIABLES ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL (first 15 chars):', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) + '...' : 'NOT SET');
console.log('REDIS_URL (first 15 chars):', process.env.REDIS_URL ? process.env.REDIS_URL.substring(0, 15) + '...' : 'NOT SET');
console.log('JWT_SECRET (length):', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'NOT SET');
console.log('MERCADOPAGO_ACCESS_TOKEN (first 15 chars):', process.env.MERCADOPAGO_ACCESS_TOKEN ? process.env.MERCADOPAGO_ACCESS_TOKEN.substring(0, 15) + '...' : 'NOT SET');
console.log('GEMINI_API_KEY (length):', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 'NOT SET');
console.log('GCS_PROJECT_ID:', process.env.GCS_PROJECT_ID || 'NOT SET');
console.log('GCS_BUCKET_NAME:', process.env.GCS_BUCKET_NAME || 'NOT SET');
console.log('GCS_KEYFILE_CONTENT (length):', process.env.GCS_KEYFILE_CONTENT ? process.env.GCS_KEYFILE_CONTENT.length : 'NOT SET');
console.log('VITE_FRONTEND_URL:', process.env.VITE_FRONTEND_URL || 'NOT SET');
console.log('BACKEND_URL:', process.env.BACKEND_URL || 'NOT SET');
console.log('--- END DEBUGGING ENVIRONMENT VARIABLES ---');
// --- FIN DE LOGS DE DEPURACIÓN ---


const app = express();
const PORT = config.port;

app.use(helmet());
app.set('trust proxy', 1);

// --- MODIFICACIÓN: Configuración de CORS para permitir tu dominio de producción ---
const corsOptions = {
  origin: (origin, callback) => {
    const isProduction = config.nodeEnv === 'production';
    let allowedOrigins = [];

    if (isProduction) {
      // En producción, solo permite el origen explícito del frontend.
      // AÑADIDO: Tu dominio de frontend de producción
      allowedOrigins.push('https://www.nrlsb.com'); // <--- AÑADE ESTA LÍNEA
      allowedOrigins.push(config.frontendUrl); // Asegúrate de que esta variable también esté configurada correctamente
    } else {
      // En desarrollo o testing, permite localhost y las URLs de previsualización de Vercel y Render.
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
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.post('/api/payment/notification', express.raw({ type: 'application/json' }), handlePaymentNotification);
app.use(compression()); 
app.use(passport.initialize());
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

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Servidor corriendo en el puerto ${PORT}`);
});
