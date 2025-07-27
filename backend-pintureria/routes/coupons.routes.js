// backend-pintureria/routes/coupons.routes.js
import { Router } from 'express';
import { 
    validateCoupon,
    createCoupon,
    getAllCoupons,
    updateCoupon,
    deleteCoupon
} from '../controllers/coupons.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';
import { couponRules, validateCouponRules, validate } from '../middlewares/validators.js'; // Importar reglas y validador

const router = Router();

// --- Rutas para Clientes ---
// Ruta para que los usuarios validen un cupón.
// Aplicar validación para la validación de cupones
router.post('/validate', authenticateToken, validateCouponRules(), validate, validateCoupon);

// --- Rutas para Administradores ---
// Se agrupan las rutas de admin bajo un middleware común.
router.use('/admin', authenticateToken, isAdmin);

router.get('/admin', getAllCoupons);
// Aplicar validación para la creación de cupones
router.post('/admin', couponRules(), validate, createCoupon);
// Aplicar validación para la actualización de cupones
router.put('/admin/:id', couponRules(), validate, updateCoupon);
router.delete('/admin/:id', deleteCoupon);

export default router;
