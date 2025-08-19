// backend-pintureria/routes/upload.routes.js
import { Router } from 'express';
import { 
  uploadMultipleImages, 
  processAndAssociateImages,
  uploadSingleImage,
  handleSingleImageUpload,
  analyzeImageWithAI,
  bulkCreateProductsWithAI,
  bulkAssociateImagesWithAI,
  generateAIDescription,
  bulkGenerateAIDescriptions, // Importar el nuevo controlador
  generateSEOMetaTags // <-- NUEVO
} from '../controllers/upload.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de subida y procesamiento de imágenes son para uso administrativo.
router.post('/', [authenticateToken, isAdmin, uploadMultipleImages], processAndAssociateImages);
router.post('/single', [authenticateToken, isAdmin, uploadSingleImage], handleSingleImageUpload);
router.post('/analyze-image', [authenticateToken, isAdmin], analyzeImageWithAI);
router.post('/bulk-create-ai', [authenticateToken, isAdmin, uploadMultipleImages], bulkCreateProductsWithAI);
router.post('/bulk-associate-ai', [authenticateToken, isAdmin, uploadMultipleImages], bulkAssociateImagesWithAI);
router.post('/generate-description', [authenticateToken, isAdmin], generateAIDescription);

// --- NUEVA RUTA PARA GENERACIÓN MASIVA DE DESCRIPCIONES ---
router.post('/bulk-generate-descriptions', [authenticateToken, isAdmin], bulkGenerateAIDescriptions);

// --- NUEVA RUTA PARA GENERACIÓN DE META TAGS SEO ---
router.post('/generate-seo-tags', [authenticateToken, isAdmin], generateSEOMetaTags);

export default router;
