// backend-pintureria/routes/reports.routes.js

import { Router } from 'express';
import { generateReport } from '../controllers/reports.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';
// Aquí podrías agregar reglas de validación si lo deseas

const router = Router();

// Todas las rutas de reportes requieren ser administrador
router.use(authenticateToken, isAdmin);

// Una única ruta para generar todos los reportes
router.post('/generate', generateReport);

export default router;
