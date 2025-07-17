// backend-pintureria/routes/order.routes.js
import { Router } from 'express';
import {
  getOrderHistory,
  getAllOrders,
  cancelOrder,
  getOrderById,
  createPaymentPreference, // <-- NUEVA RUTA
} from '../controllers/order.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// --- Rutas de Administrador ---
router.get('/admin', [authenticateToken, isAdmin], getAllOrders);
router.post('/:orderId/cancel', [authenticateToken, isAdmin], cancelOrder);

// --- Rutas de Usuario ---
router.get('/', authenticateToken, getOrderHistory);
router.get('/:orderId', authenticateToken, getOrderById);

// --- NUEVA RUTA UNIFICADA PARA CREAR PAGOS ---
// Esta ruta crea una preferencia en Mercado Pago que puede incluir
// tarjetas, saldo en cuenta, y ahora también PIX (transferencia).
router.post('/create-payment-preference', authenticateToken, createPaymentPreference);

// Se eliminan las rutas /process-payment y /bank-transfer

export default router;
