// backend-pintureria/routes/shipping.routes.js
import { Router } from 'express';
import { calculateShipping } from '../controllers/shipping.controller.js';
import { shippingCalculationRules, validate } from '../middlewares/validators.js'; // Importar reglas y validador

const router = Router();

// Ruta para calcular el costo de envío
// Aplicar validación para el cálculo de envío
router.post('/calculate', shippingCalculationRules(), validate, calculateShipping);

export default router;
