// backend-pintureria/routes/order.routes.js
import { Router } from 'express';
import {
  getOrderHistory,
  getAllOrders,
  cancelOrder,
  processPayment,
  createPixPayment,
  confirmTransferPayment,
  getOrderById,
  updateOrderStatus, // Importar el nuevo controlador
} from '../controllers/order.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';
import { orderQueryParamsRules, validate } from '../middlewares/validators.js';

const router = Router();

// --- Rutas de Administrador (Más específicas primero) ---
router.get('/admin', [authenticateToken, isAdmin, orderQueryParamsRules(), validate], getAllOrders);
router.post('/:orderId/cancel', [authenticateToken, isAdmin], cancelOrder);
router.post('/:orderId/confirm-payment', [authenticateToken, isAdmin], confirmTransferPayment);

// --- NUEVO: Ruta para que el admin actualice el estado de una orden ---
router.post('/admin/:orderId/status', [authenticateToken, isAdmin], updateOrderStatus);


// --- Rutas de Usuario (Más genéricas después) ---
router.get('/', authenticateToken, getOrderHistory);
router.get('/:orderId', authenticateToken, getOrderById);
router.post('/process-payment', authenticateToken, processPayment);
router.post('/pix-payment', authenticateToken, createPixPayment);

export default router;
