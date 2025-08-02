// backend-pintureria/routes/chatbot.routes.js
import { Router } from 'express';
import { handleChatMessage } from '../controllers/chatbot.controller.js';
// No se requiere autenticación para el chatbot, ya que es para todos los visitantes.

const router = Router();

// Ruta para manejar las conversaciones con el chatbot
router.post('/chat', handleChatMessage);

export default router;
