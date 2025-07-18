// backend-pintureria/routes/upload.routes.js
import { Router } from 'express';
import { 
  uploadMultipleImages, 
  processAndAssociateImages,
  uploadSingleImage,
  handleSingleImageUpload,
  analyzeImageWithAI // <-- NUEVO: Importamos el controlador de IA
} from '../controllers/upload.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Endpoint para la carga masiva
router.post('/', [authenticateToken, isAdmin, uploadMultipleImages], processAndAssociateImages);

// Endpoint para subir una sola imagen desde el formulario
router.post('/single', [authenticateToken, isAdmin, uploadSingleImage], handleSingleImageUpload);

// --- NUEVO: Endpoint para analizar la imagen con IA ---
router.post('/analyze-image', [authenticateToken, isAdmin], analyzeImageWithAI);

export default router;
