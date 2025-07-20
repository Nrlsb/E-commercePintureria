// backend-pintureria/middlewares/rateLimiter.js
import rateLimit from 'express-rate-limit';

/**
 * Middleware para limitar la cantidad de peticiones a las rutas de autenticación.
 * Ayuda a prevenir ataques de fuerza bruta.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de tiempo: 15 minutos
  max: 10, // Límite de peticiones por IP durante la ventana de tiempo
  standardHeaders: true, // Devuelve la información del límite en las cabeceras `RateLimit-*`
  legacyHeaders: false, // Deshabilita las cabeceras `X-RateLimit-*`
  message: {
    message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo después de 15 minutos.'
  },
  // Función para personalizar la clave de seguimiento (por defecto usa la IP)
  // keyGenerator: (req, res) => req.ip,
});
