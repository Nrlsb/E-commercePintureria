// backend-pintureria/routes/shipping.routes.js
import { Router } from 'express';
import { calculateShipping, trackShipment } from '../controllers/shipping.controller.js';
import { shippingCalculationRules, validate } from '../middlewares/validators.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Ruta para calcular el costo de envío.
// Esta ruta se considera pública ya que un usuario no autenticado podría querer estimar el envío.
router.post('/calculate', shippingCalculationRules(), validate, calculateShipping);

// --- NUEVA RUTA ---
// Ruta para obtener el estado de un envío.
// Requiere autenticación para que solo los usuarios logueados puedan ver seguimientos.
router.get('/track/:trackingNumber', authenticateToken, trackShipment);

export default router;
