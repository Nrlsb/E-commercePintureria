// backend-pintureria/routes/order.routes.js
import { Router } from 'express';
import {
  getOrderHistory,
  getAllOrders,
  cancelOrder,
  processPayment,
  createBankTransferOrder,
  confirmTransferPayment,
  getOrderById,
} from '../controllers/order.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// --- Rutas de Administrador (Más específicas primero) ---
router.get('/admin', [authenticateToken, isAdmin], getAllOrders);
router.post('/:orderId/cancel', [authenticateToken, isAdmin], cancelOrder);
router.post('/:orderId/confirm-payment', [authenticateToken, isAdmin], confirmTransferPayment);

// --- Rutas de Usuario (Más genéricas después) ---
router.get('/', authenticateToken, getOrderHistory);
router.get('/:orderId', authenticateToken, getOrderById); // <-- Esta ruta ahora está después de /admin
router.post('/process-payment', authenticateToken, processPayment);
router.post('/bank-transfer', authenticateToken, createBankTransferOrder);

export default router;
