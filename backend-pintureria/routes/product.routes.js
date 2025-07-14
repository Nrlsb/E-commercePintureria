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
  deleteReview,
} from '../controllers/product.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas públicas de productos
router.get('/', getProducts);
router.get('/brands', getProductBrands);
router.get('/:productId', getProductById);

// Rutas de administración de productos (protegidas)
router.post('/', [authenticateToken, isAdmin], createProduct);
router.put('/:id', [authenticateToken, isAdmin], updateProduct);
router.delete('/:id', [authenticateToken, isAdmin], deleteProduct);

// Rutas de reseñas
router.get('/:productId/reviews', getProductReviews);
router.post('/:productId/reviews', authenticateToken, createProductReview);
router.delete('/reviews/:reviewId', authenticateToken, deleteReview);

export default router;
