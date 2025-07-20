import { Router } from 'express';
import { 
  registerUser, 
  loginUser,
  logoutUser, // Importar logoutUser
  getMe,      // Importar getMe
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';
import { registerRules, loginRules, validate } from '../middlewares/validators.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { authenticateToken } from '../middlewares/auth.middleware.js'; // Importar authenticateToken

const router = Router();

router.post('/register', authLimiter, registerRules(), validate, registerUser);
router.post('/login', authLimiter, loginRules(), validate, loginUser);
router.post('/logout', logoutUser); // Nueva ruta de logout

// Nueva ruta para verificar la sesión del usuario a través de la cookie
router.get('/me', authenticateToken, getMe);

router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
