// backend-pintureria/routes/review.routes.js
import { Router } from 'express';
import { deleteReview } from '../controllers/product.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Esta ruta manejará las peticiones a DELETE /api/reviews/:reviewId
router.delete('/:reviewId', authenticateToken, deleteReview);

export default router;
