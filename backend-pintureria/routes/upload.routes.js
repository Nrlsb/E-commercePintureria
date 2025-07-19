// backend-pintureria/routes/upload.routes.js
import { Router } from 'express';
import { 
  uploadMultipleImages, 
  processAndAssociateImages,
  uploadSingleImage,
  handleSingleImageUpload,
  analyzeImageWithAI,
  bulkCreateProductsWithAI,
  bulkAssociateImagesWithAI // <-- NUEVO: Importamos el controlador
} from '../controllers/upload.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', [authenticateToken, isAdmin, uploadMultipleImages], processAndAssociateImages);
router.post('/single', [authenticateToken, isAdmin, uploadSingleImage], handleSingleImageUpload);
router.post('/analyze-image', [authenticateToken, isAdmin], analyzeImageWithAI);
router.post('/bulk-create-ai', [authenticateToken, isAdmin, uploadMultipleImages], bulkCreateProductsWithAI);

// --- NUEVO: Endpoint para asociación masiva de imágenes con IA ---
router.post('/bulk-associate-ai', [authenticateToken, isAdmin, uploadMultipleImages], bulkAssociateImagesWithAI);

export default router;
