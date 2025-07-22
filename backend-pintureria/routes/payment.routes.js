import { Router } from 'express';
import express from 'express'; // Asegúrate de importar express
import { handlePaymentNotification } from '../controllers/payment.controller.js';

const router = Router();

// --- CORRECCIÓN CRÍTICA ---
// El webhook de Mercado Pago necesita el cuerpo de la solicitud en formato "raw"
// para poder validar la firma y procesar la notificación correctamente.
// Aplicamos el middleware express.raw() solo a esta ruta específica.
router.post('/notification', express.raw({ type: 'application/json' }), handlePaymentNotification);

export default router;
