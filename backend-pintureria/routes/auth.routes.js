import { Router } from 'express';
import { 
  registerUser, 
  loginUser,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// --- NUEVAS RUTAS ---
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
