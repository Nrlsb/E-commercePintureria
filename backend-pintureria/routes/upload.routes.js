// backend-pintureria/routes/upload.routes.js
import { Router } from 'express';
import { 
  uploadMultipleImages, 
  processAndAssociateImages,
  uploadSingleImage,
  handleSingleImageUpload,
  analyzeImageWithAI,
  bulkCreateProductsWithAI,
  bulkAssociateImagesWithAI
} from '../controllers/upload.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de subida y procesamiento de imágenes son para uso administrativo.
// Requieren autenticación y que el usuario tenga rol de administrador.

// Carga masiva de imágenes (asociación por nombre de archivo)
router.post('/', [authenticateToken, isAdmin, uploadMultipleImages], processAndAssociateImages);
// Carga de una sola imagen (para formulario de producto)
router.post('/single', [authenticateToken, isAdmin, uploadSingleImage], handleSingleImageUpload);
// Análisis de imagen con IA (para sugerir datos de producto)
router.post('/analyze-image', [authenticateToken, isAdmin], analyzeImageWithAI);
// Creación masiva de productos con IA (genera productos a partir de imágenes)
router.post('/bulk-create-ai', [authenticateToken, isAdmin, uploadMultipleImages], bulkCreateProductsWithAI);
// Asociación masiva de imágenes a productos existentes con IA
router.post('/bulk-associate-ai', [authenticateToken, isAdmin, uploadMultipleImages], bulkAssociateImagesWithAI);

export default router;
