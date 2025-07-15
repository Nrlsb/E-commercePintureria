// backend-pintureria/routes/shipping.routes.js
import { Router } from 'express';
import { calculateShipping } from '../controllers/shipping.controller.js';

const router = Router();

// Ruta para calcular el costo de envío
router.post('/calculate', calculateShipping);

export default router;
