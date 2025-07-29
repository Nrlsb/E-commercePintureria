    // backend-pintureria/middlewares/errorHandler.js
    import logger from '../logger.js';
    import config from '../config/index.js'; // Importamos la configuración

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

      // Si la respuesta ya tiene un código de estado, se respeta. Si no, se establece 500 (Error Interno del Servidor).
      const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
      
      res.status(statusCode);

      // Se envía una respuesta JSON estandarizada.
      // CAMBIO TEMPORAL: Siempre expone el stack del error para depuración
      res.json({
        message: err.message || 'Error interno del servidor', // Mensaje genérico si no hay mensaje de error
        stack: err.stack, // Siempre incluir stack para depuración
      });
    };

    export default errorHandler;
    