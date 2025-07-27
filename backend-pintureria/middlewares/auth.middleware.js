// backend-pintureria/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';
import logger from '../logger.js';
import config from '../config/index.js'; // Importar la configuración

// Se obtienen las claves secretas desde la configuración
const JWT_SECRET = config.jwtSecret;
const JWT_SECRET_PREVIOUS = config.jwtSecretPrevious;

/**
 * Middleware para verificar el token JWT en las cabeceras de autorización.
 * Si el token es válido, añade el objeto 'user' decodificado a la petición (req.user).
 * Implementa una lógica básica de rotación de claves.
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    logger.warn(`Intento de acceso sin token a la ruta: ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ message: 'Token no proporcionado.' });
  }

  // Función interna para intentar verificar el token con una clave específica
  const verifyWithKey = (secret, callback) => {
    jwt.verify(token, secret, (err, user) => {
      callback(err, user);
    });
  };

  // 1. Intentar verificar con la clave actual (JWT_SECRET)
  verifyWithKey(JWT_SECRET, (err, user) => {
    if (err) {
      // Si falla con la clave actual, y hay una clave anterior configurada,
      // intentar verificar con la clave anterior.
      if (JWT_SECRET_PREVIOUS && (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError')) {
        logger.warn(`Token inválido o expirado con clave actual. Intentando con clave anterior para ruta: ${req.method} ${req.originalUrl}. Error: ${err.message}`);
        verifyWithKey(JWT_SECRET_PREVIOUS, (prevErr, prevUser) => {
          if (prevErr) {
            // Si también falla con la clave anterior, el token es inválido.
            logger.warn(`Fallo de autenticación: Token inválido o expirado para la ruta ${req.method} ${req.originalUrl}. Error: ${prevErr.message}`);
            return res.status(403).json({ message: 'Token inválido o expirado.' });
          }
          // Si la verificación con la clave anterior es exitosa,
          // el token es válido pero antiguo. Se añade una bandera para el cliente
          // para que sepa que necesita refrescar su token.
          req.user = { ...prevUser, needsTokenRefresh: true }; 
          logger.info(`Token validado con clave anterior para usuario ID: ${prevUser.userId}. Se sugiere refrescar token.`);
          next();
        });
      } else {
        // Si falla con la clave actual y no hay clave anterior o es otro tipo de error,
        // el token es inválido.
        logger.warn(`Fallo de autenticación: Token inválido o expirado para la ruta ${req.method} ${req.originalUrl}. Error: ${err.message}`);
        return res.status(403).json({ message: 'Token inválido o expirado.' });
      }
    } else {
      // Si la verificación con la clave actual es exitosa, el token es válido.
      req.user = user;
      next();
    }
  });
};

/**
 * Middleware para verificar si el usuario autenticado tiene el rol de 'admin'.
 * Debe usarse siempre DESPUÉS de authenticateToken.
 */
export const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    logger.warn(`Acceso denegado: Usuario ${req.user?.email || 'desconocido'} (ID: ${req.user?.userId || 'N/A'}) intentó acceder a ruta de administrador: ${req.method} ${req.originalUrl}`);
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};
