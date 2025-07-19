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
  getProductDetailsPageData, // <-- 1. Importar el nuevo controlador
} from '../controllers/product.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// --- Rutas de Productos ---
router.get('/', getProducts);
router.get('/brands', getProductBrands);
router.get('/:productId/details', getProductDetailsPageData); // <-- 2. Añadir la nueva ruta
router.get('/:productId', getProductById);
router.post('/', [authenticateToken, isAdmin], createProduct);
router.put('/:id', [authenticateToken, isAdmin], updateProduct);
router.delete('/:id', [authenticateToken, isAdmin], deleteProduct);

// --- Rutas de Reseñas anidadas bajo un producto ---
router.get('/:productId/reviews', getProductReviews);
router.post('/:productId/reviews', authenticateToken, createProductReview);

export default router;
