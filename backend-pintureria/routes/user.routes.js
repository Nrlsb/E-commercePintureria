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
import { updateProfileRules, addressRules, validate } from '../middlewares/validators.js'; // Importar reglas y validador

const router = Router();

// Todas las rutas de este archivo requieren autenticación
router.use(authenticateToken);

// Rutas para el perfil
router.get('/profile', getProfile);
// Aplicar validación para la actualización del perfil
router.put('/profile', updateProfileRules(), validate, updateProfile);

// Rutas para las direcciones
router.get('/addresses', getAddresses);
// Aplicar validación para añadir una dirección
router.post('/addresses', addressRules(), validate, addAddress);
// Aplicar validación para actualizar una dirección
router.put('/addresses/:addressId', addressRules(), validate, updateAddress);
router.delete('/addresses/:addressId', deleteAddress);

export default router;
