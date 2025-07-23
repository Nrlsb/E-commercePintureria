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

const router = Router();

// --- Rutas para Clientes ---
// Ruta para que los usuarios validen un cupón.
router.post('/validate', authenticateToken, validateCoupon);

// --- Rutas para Administradores ---
// Se agrupan las rutas de admin bajo un middleware común.
router.use('/admin', authenticateToken, isAdmin);

router.get('/admin', getAllCoupons);
router.post('/admin', createCoupon);
router.put('/admin/:id', updateCoupon);
router.delete('/admin/:id', deleteCoupon);

export default router;
