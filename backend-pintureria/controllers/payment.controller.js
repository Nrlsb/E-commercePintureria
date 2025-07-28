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

  // Intenta obtener topic y eventId de la query string
  let topic = req.query.topic || req.query.type;
  let eventId = req.query.id;

  // --- LOG DE DEPURACIÓN 2: Vemos qué datos iniciales tenemos de la query string ---
  logger.info(`Webhook recibido (query string) - Topic: ${topic}, Event ID: ${eventId}`);

  let payloadToStore = req.query; // Por defecto, guarda la query string

  // Si el cuerpo de la solicitud es un Buffer y no se encontró topic/eventId en la query
  // o si el topic/eventId de la query es 'undefined' (string)
  if (Buffer.isBuffer(req.body) && req.body.length > 0) {
    try {
      const bodyAsString = req.body.toString();
      const parsedBody = JSON.parse(bodyAsString);
      payloadToStore = parsedBody; // Guarda el cuerpo parseado como payload

      // Si no se encontraron en la query, intenta obtenerlos del cuerpo
      if (!topic || topic === 'undefined') { // 'undefined' puede ser un string si viene así en la query
        topic = parsedBody.topic || parsedBody.type;
      }
      if (!eventId || eventId === 'undefined') {
        eventId = parsedBody.id || parsedBody.data?.id; // Mercado Pago a veces usa data.id
      }
      logger.info(`Webhook recibido (body parseado) - Topic: ${topic}, Event ID: ${eventId}`);
    } catch (e) {
      logger.error('El cuerpo del webhook no es un JSON válido o está vacío:', bodyAsString || 'vacío');
      // Si falla el parseo, sigue usando la query string como payload
      payloadToStore = req.query;
    }
  }
  
  // Si después de todas las comprobaciones, aún no tenemos topic o eventId, loggea y responde 200.
  if (!topic || !eventId) {
    logger.warn('Webhook recibido sin topic o eventId válido después de todas las comprobaciones. Respondiendo 200 OK.');
    return res.sendStatus(200);
  }

  // --- LOG DE DEPURACIÓN 3: Vemos el payload final que intentaremos guardar ---
  logger.info(`Payload a guardar en la BD: ${JSON.stringify(payloadToStore)}`);

  try {
    await db.query(
      `INSERT INTO webhook_events (source, event_type, event_id, payload)
       VALUES ($1, $2, $3, $4)`,
      ['mercadopago', topic, eventId, payloadToStore]
    );

    // --- LOG DE DEPURACIÓN 4: Confirmamos que la inserción fue exitosa ---
    logger.info(`ÉXITO: Webhook event ${eventId} guardado en la base de datos.`);
    
    res.sendStatus(200);

    // Procesa la notificación de forma asíncrona
    processPaymentNotification(topic, eventId).catch(err => {
      logger.error(`Error during async webhook processing for event ${eventId}:`, err);
    });

  } catch (error) {
    // --- LOG DE DEPURACIÓN 5: Si algo falla, este será el error exacto ---
    logger.error('FALLO al intentar guardar el webhook event en la BD:', error);
    next(error);
  }
};
