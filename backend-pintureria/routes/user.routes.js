// backend-pintureria/routes/user.routes.js
import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress
} from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
// Aquí podrías añadir reglas de validación si lo deseas

const router = Router();

// Todas las rutas de este archivo requieren autenticación
router.use(authenticateToken);

// Rutas para el perfil
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Rutas para las direcciones
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);

export default router;
