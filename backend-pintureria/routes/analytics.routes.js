// backend-pintureria/routes/analytics.routes.js
import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/analytics.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Ruta para obtener todas las analíticas del dashboard.
// Protegida para que solo los administradores puedan acceder.
router.get('/', [authenticateToken, isAdmin], getDashboardAnalytics);

export default router;
