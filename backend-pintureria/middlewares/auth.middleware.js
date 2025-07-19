// backend-pintureria/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';

// --- CORRECCIÓN: Usar la variable específica para el token de acceso ---
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-default';

/**
 * Middleware para verificar el token JWT en las cabeceras de autorización.
 * Si el token es válido, añade el objeto 'user' decodificado a la petición (req.user).
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ message: 'Token no proporcionado.' });
  }

  // --- CORRECCIÓN: Verificar el token con el secreto correcto ---
  jwt.verify(token, JWT_ACCESS_SECRET, (err, user) => {
    if (err) {
      // Devolvemos 403 para que el frontend sepa que debe intentar refrescar el token
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
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};
