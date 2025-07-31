// backend-pintureria/routes/order.routes.js
import { Router } from 'express';
import {
  getOrderHistory,
  getAllOrders,
  cancelOrder,
  processPayment,
  createPixPayment, // --- CAMBIO: Se importa el nuevo controlador ---
  confirmTransferPayment,
  getOrderById,
} from '../controllers/order.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';
import { orderQueryParamsRules, validate } from '../middlewares/validators.js';

const router = Router();

// --- Rutas de Administrador (Más específicas primero) ---
router.get('/admin', [authenticateToken, isAdmin, orderQueryParamsRules(), validate], getAllOrders);
router.post('/:orderId/cancel', [authenticateToken, isAdmin], cancelOrder);
router.post('/:orderId/confirm-payment', [authenticateToken, isAdmin], confirmTransferPayment);

// --- Rutas de Usuario (Más genéricas después) ---
router.get('/', authenticateToken, getOrderHistory);
router.get('/:orderId', authenticateToken, getOrderById);
router.post('/process-payment', authenticateToken, processPayment);
// --- CAMBIO: La ruta ahora se llama /pix-payment y usa el nuevo controlador ---
router.post('/pix-payment', authenticateToken, createPixPayment);

export default router;
