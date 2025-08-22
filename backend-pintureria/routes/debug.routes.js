// backend-pintureria/routes/debug.routes.js
import { Router } from 'express';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';
import { analyzeErrorWithAI } from '../controllers/debug.controller.js';

const router = Router();

// Esta ruta es solo para administradores y requiere autenticación
router.post('/analyze-error', [authenticateToken, isAdmin], analyzeErrorWithAI);

export default router;
