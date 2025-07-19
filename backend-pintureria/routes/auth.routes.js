import { Router } from 'express';
import { 
  registerUser, 
  loginUser,
  forgotPassword,
  resetPassword,
  refreshToken, // <-- 1. Importar nuevas funciones
  logoutUser
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/refresh', refreshToken); // <-- 2. Añadir ruta para refrescar
router.post('/logout', logoutUser);   // <-- 3. Añadir ruta para cerrar sesión
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
