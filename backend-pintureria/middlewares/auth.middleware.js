// backend-pintureria/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';
import logger from '../logger.js'; // Importar el logger

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware para verificar el token JWT en las cabeceras de autorización.
 * Si el token es válido, añade el objeto 'user' decodificado a la petición (req.user).
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    logger.warn(`Intento de acceso sin token a la ruta: ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ message: 'Token no proporcionado.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Registrar el error de verificación del token
      logger.warn(`Fallo de autenticación: Token inválido o expirado para la ruta ${req.method} ${req.originalUrl}. Error: ${err.message}`);
      return res.status(403).json({ message: 'Token inválido o expirado.' });
    }
    req.user = user;
    next();
  });
};

/**
 * Middleware para verificar si el usuario autenticado tiene el rol de 'admin'.
 * Debe usarse siempre DESPUÉS de authenticateToken.
 */
export const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    // Registrar el intento de acceso no autorizado por rol
    logger.warn(`Acceso denegado: Usuario ${req.user?.email || 'desconocido'} (ID: ${req.user?.userId || 'N/A'}) intentó acceder a ruta de administrador: ${req.method} ${req.originalUrl}`);
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};
