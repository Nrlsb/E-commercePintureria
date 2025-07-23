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

router.post('/register', authLimiter, registerRules(), validate, registerUser);
router.post('/login', authLimiter, loginRules(), validate, loginUser);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/refresh-token', authenticateToken, refreshToken);

// --- NUEVAS RUTAS PARA GOOGLE OAUTH ---
// 1. Ruta de inicio: Redirige al usuario a Google para que inicie sesión.
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. Ruta de Callback: Google redirige aquí después de que el usuario autoriza.
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${config.frontendUrl}/login?error=auth_failed` }),
  (req, res) => {
    // En este punto, req.user contiene el objeto { token } devuelto por findOrCreateGoogleUser
    const { token } = req.user;
    // Redirigimos al frontend a una página especial que procesará el token
    res.redirect(`${config.frontendUrl}/auth/callback?token=${token}`);
  }
);
// --- FIN DE LAS NUEVAS RUTAS ---

export default router;
