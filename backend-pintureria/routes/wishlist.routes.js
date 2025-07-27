// backend-pintureria/routes/wishlist.routes.js
import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlist.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de wishlist requieren que el usuario esté autenticado.
// Se aplica el middleware authenticateToken a todas las rutas de este router.
router.use(authenticateToken);

// Obtener la lista de deseos del usuario autenticado.
router.get('/', getWishlist);
// Añadir un producto a la lista de deseos del usuario autenticado.
router.post('/', addToWishlist);
// Eliminar un producto de la lista de deseos del usuario autenticado.
router.delete('/:productId', removeFromWishlist);

export default router;
