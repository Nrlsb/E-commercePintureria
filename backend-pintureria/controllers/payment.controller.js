// backend-pintureria/controllers/payment.controller.js
import db from '../db.js';
import mercadopago from 'mercadopago';
import { sendOrderConfirmationEmail } from '../emailService.js';
import logger from '../logger.js';
import { processPaymentNotification } from '../services/webhook.service.js';

const { MercadoPagoConfig, Payment } = mercadopago;
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

export const handlePaymentNotification = async (req, res, next) => {
  const { query } = req;
  const topic = query.topic || query.type;
  const eventId = query.id;

  if (!topic || !eventId) {
    return res.sendStatus(200);
  }

  try {
    // --- CORRECCIÓN: Procesar el cuerpo de la solicitud (req.body) ---
    // Por defecto, usamos la query.
    let payloadToStore = query;

    // Si req.body es un Buffer y tiene contenido, lo procesamos.
    if (Buffer.isBuffer(req.body) && req.body.length > 0) {
      try {
        // 1. Convertimos el Buffer a un string.
        const bodyAsString = req.body.toString();
        // 2. Parseamos el string para obtener el objeto JSON.
        payloadToStore = JSON.parse(bodyAsString);
      } catch (e) {
        logger.error('El cuerpo del webhook no es un JSON válido:', req.body.toString());
        // Si falla el parseo, nos quedamos con la query como fallback.
        payloadToStore = query;
      }
    }
    // --- FIN DE LA CORRECCIÓN ---

    await db.query(
      `INSERT INTO webhook_events (source, event_type, event_id, payload)
       VALUES ($1, $2, $3, $4)`,
      ['mercadopago', topic, eventId, payloadToStore]
    );

    logger.info(`Webhook event received and stored: ${topic} - ${eventId}`);
    
    res.sendStatus(200);

    processPaymentNotification(topic, eventId).catch(err => {
      logger.error(`Error during async webhook processing for event ${eventId}:`, err);
    });

  } catch (error) {
    logger.error('Failed to store webhook event:', error);
    next(error);
  }
};
