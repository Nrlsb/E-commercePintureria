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

  // Si no es una notificación válida, respondemos OK para que MP no reintente.
  if (!topic || !eventId) {
    return res.sendStatus(200);
  }

  try {
    // 1. Guardar el evento en la base de datos de forma rápida.
    // Usamos el cuerpo de la petición (req.body) si existe, si no, la query.
    const payloadToStore = Object.keys(req.body).length > 0 ? req.body : query;
    
    await db.query(
      `INSERT INTO webhook_events (source, event_type, event_id, payload)
       VALUES ($1, $2, $3, $4)`,
      ['mercadopago', topic, eventId, payloadToStore]
    );

    logger.info(`Webhook event received and stored: ${topic} - ${eventId}`);
    
    // 2. Responder inmediatamente a Mercado Pago para confirmar la recepción.
    res.sendStatus(200);

    // 3. Procesar el evento de forma asíncrona (sin esperar a que termine).
    // Esto se conoce como "fire and forget".
    processPaymentNotification(topic, eventId).catch(err => {
      // Si el procesamiento asíncrono falla, solo lo registramos.
      // Ya hemos guardado el evento, por lo que podemos re-procesarlo más tarde si es necesario.
      logger.error(`Error during async webhook processing for event ${eventId}:`, err);
    });

  } catch (error) {
    // Este error solo ocurriría si falla el INSERT inicial en la base de datos.
    logger.error('Failed to store webhook event:', error);
    // En este caso sí es importante devolver un error para que Mercado Pago reintente la notificación.
    next(error);
  }
};
