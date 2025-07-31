// backend-pintureria/server.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const passport = require('passport');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./db');
const path = require('path');

const config = require('./config');
const logger = require('./logger');
const productRoutes = require('./routes/product.routes');
const authRoutes = require('./routes/auth.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const reviewRoutes = require('./routes/review.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const couponsRoutes = require('./routes/coupons.routes');
const userRoutes = require('./routes/user.routes');
const uploadRoutes = require('./routes/upload.routes');
const shippingRoutes = require('./routes/shipping.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const utilsRoutes = require('./routes/utils.routes');
const errorHandler = require('./middlewares/errorHandler');
const rateLimiter = require('./middlewares/rateLimiter');
require('./config/passport-setup');
// MODIFICACIÓN: Importamos el controlador directamente para la ruta de notificación
const { handlePaymentNotification } = require('./controllers/payment.controller');

const app = express();

// Middlewares de seguridad básicos
app.use(helmet());
app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));

// --- CAMBIO IMPORTANTE ---
// La ruta para notificaciones de Mercado Pago se define ANTES de que se aplique
// la protección CSRF. Esto es crucial para que tu servidor pueda recibir
// las confirmaciones de pago.
// Usamos express.raw() porque Mercado Pago envía los webhooks en formato raw JSON.
app.post('/api/payment/notification', express.raw({ type: 'application/json' }), handlePaymentNotification);
// --- FIN DEL CAMBIO ---


// Middlewares para procesar el resto de las solicitudes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de Sesión
app.use(session({
  store: new pgSession({
    pool,
    tableName: 'session'
  }),
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 día
    sameSite: config.nodeEnv === 'production' ? 'lax' : 'none'
  }
}));

// Configuración de CSRF
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'lax' : 'none',
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
});

// --- CAMBIO IMPORTANTE ---
// Ahora, la protección CSRF se aplica a todas las rutas que vienen DESPUÉS de este punto.
app.use(csrfProtection);
// --- FIN DEL CAMBIO ---

// Inicialización de Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware para añadir el token CSRF a las cookies para que el frontend pueda usarlo
app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken());
  next();
});

// Rutas de la API (ahora todas protegidas por CSRF, excepto la de notificación)
app.use('/api', rateLimiter);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/utils', utilsRoutes);

// Manejador de errores global
app.use(errorHandler);

const PORT = config.port || 3001;
if (config.nodeEnv !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Servidor corriendo en el puerto ${PORT}`);
  });
}

module.exports = app;
