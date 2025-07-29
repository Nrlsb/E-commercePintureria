    // backend-pintureria/controllers/auth.controller.js
    import * as authService from '../services/auth.service.js';
    import logger from '../logger.js'; // Asegúrate de importar el logger

    export const registerUser = async (req, res, next) => {
      try {
        const user = await authService.register(req.body);
        res.status(201).json({ message: 'Usuario registrado con éxito', user });
      } catch (err) {
        // Si el servicio lanza un error con statusCode, lo usamos.
        if (err.statusCode) {
          return res.status(err.statusCode).json({ message: err.message });
        }
        next(err);
      }
    };

    export const loginUser = async (req, res, next) => {
      const { email, password } = req.body;
      try {
        const data = await authService.login(email, password);
        res.json(data);
      } catch (err) {
        // CAMBIO: Log más detallado aquí antes de pasar al manejador de errores
        logger.error(`Error en loginUser para email ${email}: ${err.message}`);
        logger.error(err.stack); // También loguea el stack aquí
        if (err.statusCode) {
          return res.status(err.statusCode).json({ message: err.message });
        }
        next(err);
      }
    };

    export const forgotPassword = async (req, res, next) => {
      const { email } = req.body;
      try {
        const message = await authService.forgotPassword(email);
        res.status(200).json({ message });
      } catch (error) {
        next(error);
      }
    };

    export const resetPassword = async (req, res, next) => {
      const { token } = req.params;
      const { password } = req.body;
      try {
        const message = await authService.resetPassword(token, password);
        res.status(200).json({ message });
      } catch (error) {
        if (error.statusCode) {
          return res.status(error.statusCode).json({ message: error.message });
        }
        next(error);
      }
    };

    // --- NUEVO: Controlador para refrescar el token ---
    export const refreshToken = async (req, res, next) => {
      try {
        // req.user es añadido por el middleware authenticateToken
        const userId = req.user.userId; 
        const newToken = await authService.refreshToken(userId);
        res.json({ token: newToken });
      } catch (err) {
        if (err.statusCode) {
          return res.status(err.statusCode).json({ message: err.message });
        }
        next(err);
      }
    };
    