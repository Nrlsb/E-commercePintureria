// backend-pintureria/routes/auth.routes.js
import { Router } from 'express';
import { 
  registerUser, 
  loginUser,
  forgotPassword,
  resetPassword,
  refreshToken // 1. Importar el nuevo controlador
} from '../controllers/auth.controller.js';
import { registerRules, loginRules, validate } from '../middlewares/validators.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { authenticateToken } from '../middlewares/auth.middleware.js'; // Importar middleware de autenticación

const router = Router();

router.post('/register', authLimiter, registerRules(), validate, registerUser);
router.post('/login', authLimiter, loginRules(), validate, loginUser);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);

// 2. Añadir la nueva ruta para refrescar el token.
//    Requiere un token válido para poder generar uno nuevo.
router.post('/refresh-token', authenticateToken, refreshToken);

export default router;
