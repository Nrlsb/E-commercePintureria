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
import { orderQueryParamsRules, validate } from '../middlewares/validators.js'; // Importar reglas de validación

const router = Router();

// --- Rutas de Administrador (Más específicas primero) ---
// Aplicar validación para los parámetros de consulta de órdenes
router.get('/admin', [authenticateToken, isAdmin, orderQueryParamsRules(), validate], getAllOrders);
router.post('/:orderId/cancel', [authenticateToken, isAdmin], cancelOrder); // orderId es un param, se valida en el controller si es necesario
router.post('/:orderId/confirm-payment', [authenticateToken, isAdmin], confirmTransferPayment); // orderId es un param

// --- Rutas de Usuario (Más genéricas después) ---
router.get('/', authenticateToken, getOrderHistory);
router.get('/:orderId', authenticateToken, getOrderById);
router.post('/process-payment', authenticateToken, processPayment);
router.post('/bank-transfer', authenticateToken, createBankTransferOrder);

export default router;
