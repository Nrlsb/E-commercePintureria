// backend-pintureria/middlewares/errorHandler.js
import logger from '../logger.js';
import config from '../config/index.js'; // Importamos la configuración
import AppError from '../utils/AppError.js'; // Importamos la clase AppError

/**
 * Middleware centralizado para el manejo de errores.
 * Este middleware se ejecuta cuando se pasa un error a `next()`.
 * @param {Error} err - El objeto de error.
 * @param {import('express').Request} req - El objeto de solicitud de Express.
 * @param {import('express').Response} res - El objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - La función para pasar al siguiente middleware.
 */
const errorHandler = (err, req, res, next) => {
  // Se registra el error completo en el logger para depuración.
  logger.error('ERROR STACK: ', err.stack);
  // Agregamos un log más detallado del objeto de error
  logger.error('DETALLES DEL ERROR:', {
    message: err.message,
    name: err.name,
    code: err.code, // Si el error tiene un código (ej. de PostgreSQL)
    status: err.status, // Si el error tiene un status HTTP
    stack: err.stack,
    errors: err.errors, // Para errores de validación de express-validator
    originalUrl: req.originalUrl,
    method: req.method,
    ip: req.ip,
    // NUEVO: Propiedades específicas de AppError
    isOperational: err.isOperational,
    customData: err.data // Datos adicionales de AppError
  });

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';
  let errorData = err.data || null; // Para AppError

  // Manejo de errores específicos
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    // Ejemplo para errores de Mongoose si se usara, o similar para IDs inválidos
    statusCode = 400;
    message = `Recurso no encontrado. ID inválido: ${err.value}`;
    errorData = null;
    err.isOperational = true; // Marcar como operacional
  }

  if (err.code === '23505') { // Código de error de PostgreSQL para violación de unicidad (duplicate key)
    statusCode = 409;
    message = 'Ya existe un recurso con este valor único.';
    // Intentar extraer el campo duplicado del mensaje de error de PostgreSQL
    const match = err.detail && err.detail.match(/Key \((.+?)\)=\((.+?)\) already exists/);
    if (match) {
      message = `El valor '${match[2]}' para el campo '${match[1]}' ya existe.`;
    }
    errorData = { type: 'duplicate_entry', field: match ? match[1] : null };
    err.isOperational = true;
  }

  // Errores de validación de express-validator
  if (err.errors && Array.isArray(err.errors)) {
    statusCode = 400;
    message = 'Errores de validación en la solicitud.';
    errorData = err.errors.map(e => ({ field: e.param, message: e.msg }));
    err.isOperational = true;
  }

  // Si el error no es operacional y estamos en producción, no revelamos detalles.
  if (!err.isOperational && config.nodeEnv === 'production') {
    statusCode = 500;
    message = 'Algo salió muy mal.';
    errorData = null;
  }

  res.status(statusCode).json({
    status: err.status || 'error', // Usar el status de AppError ('fail' o 'error')
    message: message,
    data: errorData, // Incluir datos adicionales si existen
    stack: config.nodeEnv === 'development' ? err.stack : null, // Solo stack en desarrollo
  });
};

export default errorHandler;
