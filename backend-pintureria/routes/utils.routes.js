// backend-pintureria/routes/utils.routes.js
import { Router } from 'express';
import redisClient from '../redisClient.js';
import logger from '../logger.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Endpoint para limpiar toda la caché de Redis.
 * Protegido para que solo los administradores puedan acceder.
 * Requiere autenticación (authenticateToken) y verificación de rol de administrador (isAdmin).
 */
router.post('/clear-cache', [authenticateToken, isAdmin], async (req, res, next) => {
  try {
    if (redisClient.isReady) {
      await redisClient.flushAll();
      logger.info('Toda la caché de Redis ha sido limpiada por un administrador.');
      res.status(200).json({ message: 'La caché de Redis ha sido limpiada exitosamente.' });
    } else {
      res.status(503).json({ message: 'No se pudo conectar con el servidor de Redis.' });
    }
  } catch (error) {
    logger.error('Error al intentar limpiar la caché de Redis:', error);
    next(error);
  }
});

export default router;
