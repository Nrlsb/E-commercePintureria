// backend-pintureria/routes/product.routes.js
import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getProductBrands,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductReviews,
  createProductReview,
  deleteReview, // Se mantiene la importación del controlador
} from '../controllers/product.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// --- Rutas de Productos ---
router.get('/', getProducts);
router.get('/brands', getProductBrands);
router.get('/:productId', getProductById);
router.post('/', [authenticateToken, isAdmin], createProduct);
router.put('/:id', [authenticateToken, isAdmin], updateProduct);
router.delete('/:id', [authenticateToken, isAdmin], deleteProduct);

// --- Rutas de Reseñas anidadas bajo un producto ---
router.get('/:productId/reviews', getProductReviews);
router.post('/:productId/reviews', authenticateToken, createProductReview);

// --- CORRECCIÓN: Ruta de eliminación de reseña ---
// Se mueve a una ruta raíz /api/reviews/:reviewId para que sea más simple y directa.
// Esta ruta ahora se manejará en un nuevo archivo de rutas (ver server.js).
// Por simplicidad en este cambio, la dejamos aquí pero con la ruta corregida.
// En una refactorización mayor, esto iría en `review.routes.js`.
router.delete('/reviews/:reviewId', authenticateToken, deleteReview);

export default router;
