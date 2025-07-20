import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware para verificar el token JWT en las cookies.
 * Si el token es válido, añade el objeto 'user' decodificado a la petición (req.user).
 */
export const authenticateToken = (req, res, next) => {
  // 1. Leer el token desde la cookie llamada 'token'
  const token = req.cookies.token;

  if (token == null) {
    return res.status(401).json({ message: 'Token no proporcionado.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Si el token es inválido, también limpiamos la cookie
      res.clearCookie('token');
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
