import { Router } from 'express';
import { 
  registerUser, 
  loginUser,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';
// Importamos las reglas de validación y el manejador
import { registerRules, loginRules, validate } from '../middlewares/validators.js';

const router = Router();

// Aplicamos las reglas de validación antes del controlador
router.post('/register', registerRules(), validate, registerUser);
router.post('/login', loginRules(), validate, loginUser);

// --- RUTAS EXISTENTES ---
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
