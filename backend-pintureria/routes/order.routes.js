import { Router } from 'express';
import {
  getOrderHistory,
  getAllOrders,
  cancelOrder,
  createPaymentPreference,
} from '../controllers/order.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas de usuario
router.get('/', authenticateToken, getOrderHistory);
router.post('/create-payment-preference', authenticateToken, createPaymentPreference);

// Rutas de administrador
router.get('/admin', [authenticateToken, isAdmin], getAllOrders);
router.post('/:orderId/cancel', [authenticateToken, isAdmin], cancelOrder);

export default router;
