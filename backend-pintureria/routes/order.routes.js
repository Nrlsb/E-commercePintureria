// backend-pintureria/routes/order.routes.js
import { Router } from 'express';
import {
  getOrderHistory,
  getAllOrders,
  cancelOrder,
  processPayment,
  createBankTransferOrder,
  confirmTransferPayment,
  getOrderById, // <-- NUEVO
} from '../controllers/order.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// --- Rutas de Usuario ---
router.get('/', authenticateToken, getOrderHistory);
router.get('/:orderId', authenticateToken, getOrderById); // <-- NUEVA RUTA
router.post('/process-payment', authenticateToken, processPayment);
router.post('/bank-transfer', authenticateToken, createBankTransferOrder);

// --- Rutas de Administrador ---
router.get('/admin', [authenticateToken, isAdmin], getAllOrders);
router.post('/:orderId/cancel', [authenticateToken, isAdmin], cancelOrder);
router.post('/:orderId/confirm-payment', [authenticateToken, isAdmin], confirmTransferPayment);

export default router;
