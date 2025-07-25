const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./db');
const cors = require('cors');
const helmet = require('helmet'); // Importación de Helmet
const passport = require('passport');
const session = require('express-session');
const productRoutes = require('./routes/product.routes');
const authRoutes = require('./routes/auth.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const reviewRoutes = require('./routes/review.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const userRoutes = require('./routes/user.routes');
const shippingRoutes = require('./routes/shipping.routes');
const couponsRoutes = require('./routes/coupons.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const uploadRoutes = require('./routes/upload.routes');
const utilsRoutes = require('./routes/utils.routes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./logger');
const { initializeSocket } = require('./socket');
const cronService = require('./services/cronService');
const config = require('./config');
const rateLimiter = require('./middlewares/rateLimiter');

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
require('./config/passport-setup');

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

module.exports = { app, server, io };
