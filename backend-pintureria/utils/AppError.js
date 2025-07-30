// backend-pintureria/utils/AppError.js

/**
 * @class AppError
 * @extends Error
 * @description Clase de error personalizada para manejar errores de aplicación con códigos de estado HTTP.
 * Permite adjuntar un código de estado HTTP y datos adicionales al error.
 */
class AppError extends Error {
  /**
   * Crea una instancia de AppError.
   * @param {string} message - El mensaje de error.
   * @param {number} statusCode - El código de estado HTTP asociado con el error (ej. 400, 401, 404, 409).
   * @param {any} [data=null] - Datos adicionales que se pueden adjuntar al error (ej. detalles de validación).
   */
  constructor(message, statusCode, data = null) {
    super(message); // Llama al constructor de la clase base Error

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; // 'fail' para errores 4xx, 'error' para 5xx
    this.isOperational = true; // Indica que es un error esperado y manejable
    this.data = data; // Datos adicionales, como errores de validación

    // Captura el stack de la pila de llamadas, excluyendo la llamada a este constructor.
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
