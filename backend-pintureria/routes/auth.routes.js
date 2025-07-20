import { Router } from 'express';
import { 
  registerUser, 
  loginUser,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';
import { registerRules, loginRules, validate } from '../middlewares/validators.js';
// Importamos el nuevo middleware de rate limiting
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Aplicamos el limitador de peticiones a las rutas sensibles antes de la validación
router.post('/register', authLimiter, registerRules(), validate, registerUser);
router.post('/login', authLimiter, loginRules(), validate, loginUser);
router.post('/forgot-password', authLimiter, forgotPassword);

// La ruta de reset-password es menos propensa a ataques de fuerza bruta
// ya que depende de un token único, por lo que no es estrictamente necesario limitarla.
router.post('/reset-password/:token', resetPassword);

export default router;
