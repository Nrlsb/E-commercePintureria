import { Router } from 'express';
import { handlePaymentNotification } from '../controllers/payment.controller.js';

const router = Router();

// El webhook de mercadopago no debe tener middlewares que procesen el body como JSON
router.post('/notification', handlePaymentNotification);

export default router;
