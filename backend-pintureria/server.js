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
      // AÑADIDO: Si estás en desarrollo o testing, permite también la URL del backend itself.
      // Esto es crucial para que el backend pueda ser accedido por sí mismo (ej. webhooks internos)
      // o por herramientas de desarrollo cuando se despliega en un entorno no productivo.
      allowedOrigins.push(config.backendUrl); 
      // AÑADIDO: Si tu Render URL es dinámica o tiene un patrón, puedes añadir un regex similar al de Vercel.
      // Ejemplo: allowedOrigins.push(/^https:\/\/tu-app-.*\.onrender\.com$/);
      // O simplemente asegúrate de que config.backendUrl esté correctamente configurado con la URL de Render.
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
  optionsSuccessStatus: 200 // Para solicitudes OPTIONS preflight
};

app.use(cors(corsOptions));

// Usar el middleware de compresión
app.use(compression()); 

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

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Servidor corriendo en el puerto ${PORT}`);
});
