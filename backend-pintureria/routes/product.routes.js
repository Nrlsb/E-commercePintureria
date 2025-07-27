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
  getProductSuggestions,
} from '../controllers/product.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';
// Importamos las reglas de validación y el manejador
import { productRules, reviewRules, productQueryParamsRules, validate } from '../middlewares/validators.js'; // Importar productQueryParamsRules

const router = Router();

// --- Rutas de Productos ---
// Aplicar validación para los parámetros de consulta de productos
router.get('/', productQueryParamsRules(), validate, getProducts);

// 2. Añadir la nueva ruta para sugerencias de búsqueda.
// Es importante que esté ANTES de la ruta /:productId para que no haya conflictos.
// Aplicar validación para la consulta de sugerencias
router.get('/suggestions', productQueryParamsRules(), validate, getProductSuggestions);

router.get('/brands', getProductBrands);
router.get('/:productId', getProductById);

// Aplicamos las reglas de validación para crear y actualizar productos
router.post('/', [authenticateToken, isAdmin, productRules(), validate], createProduct);
router.put('/:id', [authenticateToken, isAdmin, productRules(), validate], updateProduct);
router.delete('/:id', [authenticateToken, isAdmin], deleteProduct);

// --- Rutas de Reseñas anidadas bajo un producto ---
router.get('/:productId/reviews', getProductReviews);
// Aplicamos las reglas de validación para crear una reseña
router.post('/:productId/reviews', authenticateToken, reviewRules(), validate, createProductReview);

export default router;
