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
// Obtener todas las órdenes: Requiere autenticación y rol de administrador.
router.get('/admin', [authenticateToken, isAdmin, orderQueryParamsRules(), validate], getAllOrders);
// Cancelar una orden: Requiere autenticación y rol de administrador.
router.post('/:orderId/cancel', [authenticateToken, isAdmin], cancelOrder);
// Confirmar pago por transferencia: Requiere autenticación y rol de administrador.
router.post('/:orderId/confirm-payment', [authenticateToken, isAdmin], confirmTransferPayment);

// --- Rutas de Usuario (Más genéricas después) ---
// Obtener historial de órdenes del usuario autenticado.
router.get('/', authenticateToken, getOrderHistory);
// Obtener detalles de una orden específica (el usuario solo puede ver sus propias órdenes).
router.get('/:orderId', authenticateToken, getOrderById);
// Procesar pago con tarjeta (Mercado Pago): Requiere autenticación.
router.post('/process-payment', authenticateToken, processPayment);
// Crear orden por transferencia bancaria: Requiere autenticación.
router.post('/bank-transfer', authenticateToken, createBankTransferOrder);

export default router;
