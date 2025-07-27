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
// Requiere autenticación para saber qué usuario lo está aplicando.
router.post('/validate', authenticateToken, validateCouponRules(), validate, validateCoupon);

// --- Rutas para Administradores ---
// Se agrupan las rutas de admin bajo un middleware común, asegurando que solo admins autenticados puedan acceder.
router.use('/admin', authenticateToken, isAdmin);

// Obtener todos los cupones (solo para administradores)
router.get('/admin', getAllCoupons);
// Crear un nuevo cupón (solo para administradores)
router.post('/admin', couponRules(), validate, createCoupon);
// Actualizar un cupón existente (solo para administradores)
router.put('/admin/:id', couponRules(), validate, updateCoupon);
// Eliminar un cupón (solo para administradores)
router.delete('/admin/:id', deleteCoupon);

export default router;
