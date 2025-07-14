import { Router } from 'express';
import express from 'express';
import { handlePaymentNotification } from '../controllers/payment.controller.js';

const router = Router();

// El webhook de Mercado Pago necesita el body en formato raw para la validación de la firma.
// Aplicamos el middleware express.raw() solo a esta ruta específica.
router.post('/notification', express.raw({ type: 'application/json' }), handlePaymentNotification);

export default router;
