// backend-pintureria/routes/upload.routes.js
import { Router } from 'express';
import { uploadImages, associateImages } from '../controllers/upload.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Endpoint protegido para que solo administradores puedan subir y asociar imágenes
router.post('/', [authenticateToken, isAdmin, uploadImages], associateImages);

export default router;
