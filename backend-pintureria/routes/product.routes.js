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
  deleteReview, // Importar el controlador de eliminación de reseñas
  getComplementaryProducts // <-- NUEVO
} from '../controllers/product.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';
// Importamos las reglas de validación y el manejador
import { productRules, reviewRules, productQueryParamsRules, validate } from '../middlewares/validators.js';

const router = Router();

// --- Rutas Públicas (no requieren autenticación) ---
// Obtener lista de productos con filtros y paginación.
router.get('/', productQueryParamsRules(), validate, getProducts);
// Obtener sugerencias de búsqueda.
router.get('/suggestions', productQueryParamsRules(), validate, getProductSuggestions);
// Obtener marcas de productos.
router.get('/brands', getProductBrands);
// Obtener detalles de un producto por ID.
router.get('/:productId', getProductById);
// Obtener reseñas de un producto.
router.get('/:productId/reviews', getProductReviews);

// --- NUEVA RUTA DE RECOMENDACIONES (requiere autenticación) ---
router.post('/recommendations', authenticateToken, getComplementaryProducts);

// --- Rutas Protegidas para Usuarios Autenticados ---
// Crear una reseña de producto: Requiere autenticación.
router.post('/:productId/reviews', authenticateToken, reviewRules(), validate, createProductReview);
// Eliminar una reseña: Requiere autenticación (y la lógica del controlador verifica si es el dueño o un admin).
router.delete('/reviews/:reviewId', authenticateToken, deleteReview);


// --- Rutas Protegidas para Administradores ---
// Crear producto: Requiere autenticación y rol de administrador.
router.post('/', [authenticateToken, isAdmin, productRules(), validate], createProduct);
// Actualizar producto: Requiere autenticación y rol de administrador.
router.put('/:id', [authenticateToken, isAdmin, productRules(), validate], updateProduct);
// Eliminar/desactivar producto: Requiere autenticación y rol de administrador.
router.delete('/:id', [authenticateToken, isAdmin], deleteProduct);

export default router;
