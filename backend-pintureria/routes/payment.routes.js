// backend-pintureria/routes/payment.routes.js
import { Router } from 'express';
import express from 'express'; // Asegúrate de importar express
import { handlePaymentNotification } from '../controllers/payment.controller.js';

const router = Router();

// Webhook de Mercado Pago: Esta ruta no requiere autenticación JWT
// ya que es llamada por un servicio externo (Mercado Pago) y no por un usuario.
// El cuerpo de la solicitud se parsea como "raw" para la verificación de la firma.
router.post('/notification', express.raw({ type: 'application/json' }), handlePaymentNotification);

export default router;
