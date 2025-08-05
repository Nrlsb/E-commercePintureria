// backend-pintureria/routes/webhook.routes.js
import { Router } from 'express';
import { getWebhookEvents, reprocessWebhookEvent } from '../controllers/webhook.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas requieren ser administrador
router.use(authenticateToken, isAdmin);

// Obtener la lista de los últimos eventos de webhook
router.get('/', getWebhookEvents);

// Re-procesar un evento de webhook que haya fallado
router.post('/reprocess/:eventId', reprocessWebhookEvent);

export default router;
