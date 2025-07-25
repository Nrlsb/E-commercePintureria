// backend-pintureria/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport'; // 1. Importar passport
import './config/passport-setup.js'; // 2. Importar la configuración para que se ejecute
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

const whitelist = [
  'http://localhost:5173',
  'https://e-commerce-pintureria.vercel.app',
  config.frontendUrl,
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
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// --- NUEVO: Inicializar Passport ---
app.use(passport.initialize());
// --- FIN DE LA MODIFICACIÓN ---

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

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Servidor corriendo en el puerto ${PORT}`);
});
