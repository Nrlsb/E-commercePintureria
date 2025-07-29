// backend-pintureria/controllers/payment.controller.js
import db from '../db.js';
import mercadopago from 'mercadopago';
import { sendOrderConfirmationEmail } from '../emailService.js';
import logger from '../logger.js';
import { processPaymentNotification } from '../services/webhook.service.js';

const { MercadoPagoConfig, Payment } = mercadopago;
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

export const handlePaymentNotification = async (req, res, next) => {
  logger.info('--- INICIANDO handlePaymentNotification ---');

  let topic = req.query.topic || req.query.type;
  let eventId; // Inicializamos eventId sin valor por defecto de la query

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

      // RESALTADO: Aquí está el cambio crucial
      // Para webhooks de 'payment', el ID del pago real está en parsedBody.data.id
      // El parsedBody.id es el ID de la notificación, no el ID del pago que se debe consultar
      if (topic === 'payment' && parsedBody.data && parsedBody.data.id) {
          eventId = parsedBody.data.id; // ¡Este es el ID de pago real!
          logger.info(`Webhook recibido (body parseado) - Topic: ${topic}, ID de PAGO: ${eventId}`);
      } else {
          // Para otros topics o si no se encuentra data.id, usamos el id principal del payload
          eventId = parsedBody.id; 
          logger.info(`Webhook recibido (body parseado) - Topic: ${topic}, ID de NOTIFICACIÓN/OTRO: ${eventId}`);
      }

    } catch (e) {
      logger.error('El cuerpo del webhook no es un JSON válido o está vacío:', bodyAsString || 'vacío');
      // Si falla el parseo, sigue usando la query string como payload
      payloadToStore = req.query;
      // Si el parseo falla, intentamos obtener el eventId de la query string como fallback
      eventId = req.query.id;
    }
  } else {
      // Si el cuerpo no es un Buffer o está vacío, intentamos obtener el eventId de la query string
      eventId = req.query.id;
  }
  
  // Si después de todas las comprobaciones, aún no tenemos topic o eventId, loggea y responde 200.
  if (!topic || !eventId) {
    logger.warn('Webhook recibido sin topic o eventId válido después de todas las comprobaciones. Respondiendo 200 OK.');
    return res.sendStatus(200);
  }

  logger.info(`Payload a guardar en la BD: ${JSON.stringify(payloadToStore)}`);

  try {
    await db.query(
      `INSERT INTO webhook_events (source, event_type, event_id, payload)
       VALUES ($1, $2, $3, $4)`,
      ['mercadopago', topic, eventId, payloadToStore]
    );

    logger.info(`ÉXITO: Webhook event ${eventId} guardado en la base de datos.`);
    
    res.sendStatus(200);

    // Procesa la notificación de forma asíncrona
    // Le pasamos el eventId que ahora debería ser el ID de pago real
    processPaymentNotification(topic, eventId).catch(err => {
      logger.error(`Error during async webhook processing for event ${eventId}:`, err);
    });

  } catch (error) {
    logger.error('FALLO al intentar guardar el webhook event en la BD:', error);
    next(error);
  }
};
