// backend-pintureria/controllers/payment.controller.js
import db from '../db.js';
import mercadopago from 'mercadopago';
import { sendOrderConfirmationEmail } from '../emailService.js';
import logger from '../logger.js';
import { processPaymentNotification } from '../services/webhook.service.js';

const { MercadoPagoConfig, Payment } = mercadopago;
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

export const handlePaymentNotification = async (req, res, next) => {
  // --- LOG DE DEPURACIÓN 1: Verificamos si la función se está ejecutando ---
  logger.info('--- INICIANDO handlePaymentNotification ---');

  const { query } = req;
  const topic = query.topic || query.type;
  const eventId = query.id;

  // --- LOG DE DEPURACIÓN 2: Vemos qué datos iniciales tenemos ---
  logger.info(`Webhook recibido - Topic: ${topic}, Event ID: ${eventId}`);

  if (!topic || !eventId) {
    logger.warn('Webhook recibido sin topic o eventId. Respondiendo 200 OK.');
    return res.sendStatus(200);
  }

  try {
    let payloadToStore = query;

    // --- LOG DE DEPURACIÓN 3: Vemos el tipo y contenido del req.body ---
    logger.info(`Tipo de req.body: ${typeof req.body}`);
    if (Buffer.isBuffer(req.body)) {
        logger.info(`req.body es un Buffer. Contenido: ${req.body.toString()}`);
    } else {
        logger.info(`req.body no es un Buffer. Contenido: ${JSON.stringify(req.body)}`);
    }

    if (Buffer.isBuffer(req.body) && req.body.length > 0) {
      try {
        const bodyAsString = req.body.toString();
        payloadToStore = JSON.parse(bodyAsString);
      } catch (e) {
        logger.error('El cuerpo del webhook no es un JSON válido:', req.body.toString());
        payloadToStore = query;
      }
    }
    
    // --- LOG DE DEPURACIÓN 4: Vemos el payload final que intentaremos guardar ---
    logger.info(`Payload a guardar en la BD: ${JSON.stringify(payloadToStore)}`);

    await db.query(
      `INSERT INTO webhook_events (source, event_type, event_id, payload)
       VALUES ($1, $2, $3, $4)`,
      ['mercadopago', topic, eventId, payloadToStore]
    );

    // --- LOG DE DEPURACIÓN 5: Confirmamos que la inserción fue exitosa ---
    logger.info(`ÉXITO: Webhook event ${eventId} guardado en la base de datos.`);
    
    res.sendStatus(200);

    processPaymentNotification(topic, eventId).catch(err => {
      logger.error(`Error during async webhook processing for event ${eventId}:`, err);
    });

  } catch (error) {
    // --- LOG DE DEPURACIÓN 6: Si algo falla, este será el error exacto ---
    logger.error('FALLO al intentar guardar el webhook event en la BD:', error);
    next(error);
  }
};
