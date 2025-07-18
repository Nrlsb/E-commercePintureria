// backend-pintureria/routes/upload.routes.js
import { Router } from 'express';
// Se importa la nueva función del controlador
import { uploadImages, processAndAssociateImages } from '../controllers/upload.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// La ruta ahora usa el nuevo controlador para procesar las imágenes
router.post('/', [authenticateToken, isAdmin, uploadImages], processAndAssociateImages);

export default router;
