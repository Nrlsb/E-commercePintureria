// backend-pintureria/routes/shipping.routes.js
import { Router } from 'express';
import { calculateShipping } from '../controllers/shipping.controller.js';
import { shippingCalculationRules, validate } from '../middlewares/validators.js'; // Importar reglas y validador

const router = Router();

// Ruta para calcular el costo de envío.
// Esta ruta se considera pública ya que un usuario no autenticado podría querer estimar el envío.
// Se aplica validación para asegurar que los datos de entrada son correctos.
router.post('/calculate', shippingCalculationRules(), validate, calculateShipping);

export default router;
