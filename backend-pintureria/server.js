import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './db.js';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import session from 'express-session';
import productRoutes from './routes/product.routes.js';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reviewRoutes from './routes/review.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import userRoutes from './routes/user.routes.js';
import shippingRoutes from './routes/shipping.routes.js';
import couponsRoutes from './routes/coupons.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import utilsRoutes from './routes/utils.routes.js';
import errorHandler from './middlewares/errorHandler.js';
import logger from './logger.js';
import { initializeSocket } from './socket.js';
import cronService from './services/cronService.js';
import config from './config/index.js';
import rateLimiter from './middlewares/rateLimiter.js';
import './config/passport-setup.js'; // Se importa para que se ejecute el código de configuración

// Conectar a la base de datos
connectDB();

const app = express();

// Establecer cabeceras de seguridad HTTP con Helmet. Debe ir al principio.
app.use(helmet());

// Configuración de CORS
const corsOptions = {
  origin: config.clientUrl,
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de la sesión
app.use(session({
  secret: config.jwtSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Inicialización de Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware de Rate Limiting
app.use(rateLimiter);

// Rutas
app.get('/', (req, res) => {
  res.send('API de la pinturería funcionando!');
});
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/utils', utilsRoutes);

// Middleware para manejar errores
app.use(errorHandler);

const server = http.createServer(app);
const io = initializeSocket(server, corsOptions);

// Iniciar cron jobs
cronService.start();

const PORT = config.port || 5000;

server.listen(PORT, () => {
  logger.info(`Servidor corriendo en el puerto ${PORT}`);
});

// Exportamos para poder usarlo en los tests
export { app, server, io };
