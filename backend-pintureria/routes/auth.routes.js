// backend-pintureria/routes/auth.routes.js
import { Router } from 'express';
import passport from 'passport';
import { 
  registerUser, 
  loginUser,
  forgotPassword,
  resetPassword,
  refreshToken
} from '../controllers/auth.controller.js';
import { registerRules, loginRules, validate } from '../middlewares/validators.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import config from '../config/index.js';

const router = Router();

// Rutas de registro y login: No requieren autenticación ya que son para obtenerla.
// Protegidas con rate limiting para prevenir ataques de fuerza bruta.
router.post('/register', authLimiter, registerRules(), validate, registerUser);
router.post('/login', authLimiter, loginRules(), validate, loginUser);

// Rutas de recuperación y reseteo de contraseña: No requieren autenticación.
// Protegidas con rate limiting.
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Ruta para refrescar el token: Requiere que el usuario esté autenticado con un token existente.
router.post('/refresh-token', authenticateToken, refreshToken);

// Rutas para Google OAuth
// 1. Ruta de inicio: Redirige al usuario a Google para que inicie sesión.
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. Ruta de Callback: Google redirige aquí después de que el usuario autoriza.
// session: false ya que estamos usando JWT y no sesiones basadas en cookies.
// failureRedirect: Redirige al frontend en caso de fallo de autenticación de Google.
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${config.frontendUrl}/login?error=auth_failed` }),
  (req, res) => {
    // En este punto, req.user contiene el objeto { token } devuelto por findOrCreateGoogleUser.
    // Redirigimos al frontend a una página especial que procesará el token.
    const { token } = req.user;
    res.redirect(`${config.frontendUrl}/auth/callback?token=${token}`);
  }
);

export default router;
