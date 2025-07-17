// backend-pintureria/routes/coupons.routes.js
import { Router } from 'express';
import { validateCoupon } from '../controllers/coupons.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Ruta para que los usuarios validen un cupón.
// Se protege con authenticateToken para que solo usuarios logueados puedan usar cupones.
router.post('/validate', authenticateToken, validateCoupon);

export default router;
