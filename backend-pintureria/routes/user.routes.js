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

// Todas las rutas de este archivo requieren autenticación del usuario.
router.use(authenticateToken);

// Rutas para el perfil del usuario.
router.get('/profile', getProfile);
// Actualizar perfil: Requiere autenticación y validación de los datos de entrada.
router.put('/profile', updateProfileRules(), validate, updateProfile);

// Rutas para las direcciones del usuario.
router.get('/addresses', getAddresses);
// Añadir una nueva dirección: Requiere autenticación y validación de los datos.
router.post('/addresses', addressRules(), validate, addAddress);
// Actualizar una dirección existente: Requiere autenticación y validación.
router.put('/addresses/:addressId', addressRules(), validate, updateAddress);
// Eliminar una dirección: Requiere autenticación.
router.delete('/addresses/:addressId', deleteAddress);

export default router;
