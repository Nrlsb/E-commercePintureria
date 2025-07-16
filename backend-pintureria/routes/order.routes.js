// backend-pintureria/routes/order.routes.js
import { Router } from 'express';
import {
  getOrderHistory,
  getAllOrders,
  cancelOrder,
  createPaymentPreference,
  processPayment, // <-- 1. Importar la nueva función
} from '../controllers/order.controller.js';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// --- Rutas de Usuario ---
router.get('/', authenticateToken, getOrderHistory);

// Ruta para Checkout Pro (se puede mantener como alternativa o eliminar)
router.post('/create-payment-preference', authenticateToken, createPaymentPreference);

// --- 2. NUEVA RUTA PARA CHECKOUT API ---
router.post('/process-payment', authenticateToken, processPayment);


// --- Rutas de Administrador ---
router.get('/admin', [authenticateToken, isAdmin], getAllOrders);
router.post('/:orderId/cancel', [authenticateToken, isAdmin], cancelOrder);

export default router;
