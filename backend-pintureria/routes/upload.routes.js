// backend-pintureria/routes/upload.routes.js
import { Router } from 'express';
import { 
  uploadMultipleImages, 
  processAndAssociateImages,
  uploadSingleImage,
  handleSingleImageUpload,
  analyzeImageWithAI,
  bulkCreateProductsWithAI // <-- NUEVO: Importamos el controlador
} from '../controllers/upload.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Endpoint para la carga masiva (asociar a productos existentes)
router.post('/', [authenticateToken, isAdmin, uploadMultipleImages], processAndAssociateImages);

// Endpoint para subir una sola imagen desde el formulario
router.post('/single', [authenticateToken, isAdmin, uploadSingleImage], handleSingleImageUpload);

// Endpoint para analizar una imagen con IA
router.post('/analyze-image', [authenticateToken, isAdmin], analyzeImageWithAI);

// --- NUEVO: Endpoint para creación masiva de productos con IA ---
router.post('/bulk-create-ai', [authenticateToken, isAdmin, uploadMultipleImages], bulkCreateProductsWithAI);

export default router;
