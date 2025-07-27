// backend-pintureria/routes/review.routes.js
import { Router } from 'express';
import { deleteReview } from '../controllers/product.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Esta ruta manejará las peticiones a DELETE /api/reviews/:reviewId.
// Requiere autenticación. La lógica de autorización (si es el propio usuario o un admin)
// se maneja dentro del controlador `deleteReview`.
router.delete('/:reviewId', authenticateToken, deleteReview);

export default router;
