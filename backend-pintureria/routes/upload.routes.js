// backend-pintureria/routes/upload.routes.js
import { Router } from 'express';
import { 
  uploadMultipleImages, 
  processAndAssociateImages,
  uploadSingleImage,          // <-- NUEVO: Importamos el middleware
  handleSingleImageUpload     // <-- NUEVO: Importamos el controlador
} from '../controllers/upload.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Endpoint para la carga masiva (se mantiene igual)
router.post('/', [authenticateToken, isAdmin, uploadMultipleImages], processAndAssociateImages);

// --- NUEVO: Endpoint para subir una sola imagen desde el formulario del producto ---
router.post('/single', [authenticateToken, isAdmin, uploadSingleImage], handleSingleImageUpload);

export default router;
