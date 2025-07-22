// backend-pintureria/server.js
import express from 'express';
import cors from 'cors';
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
import errorHandler from './middlewares/errorHandler.js';
// --- NUEVO: Importamos el controlador de pagos directamente ---
import { handlePaymentNotification } from './controllers/payment.controller.js';


const app = express();
const PORT = config.port;

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

// --- MODIFICACIÓN CLAVE ---
// Se define la ruta del webhook ANTES de los middlewares que parsean el body.
// Esta ruta usará express.raw() para recibir el cuerpo de la solicitud sin procesar,
// que es como Mercado Pago lo necesita para validar la firma.
app.post('/api/payment/notification', express.raw({ type: 'application/json' }), handlePaymentNotification);
// --- FIN DE LA MODIFICACIÓN ---


// Middlewares que parsean el body para el RESTO de la aplicación
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
app.use('/api/payment', paymentRoutes); // El resto de las rutas de pago siguen funcionando
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/uploads', uploadRoutes);

startCancelPendingOrdersJob();

app.use(expressWinston.errorLogger({
  winstonInstance: logger
}));

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Servidor corriendo en el puerto ${PORT}`);
});
