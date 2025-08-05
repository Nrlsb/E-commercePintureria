// backend-pintureria/controllers/webhook.controller.js
import db from '../db.js';
import logger from '../logger.js';
import { processPaymentNotification } from '../services/webhook.service.js';
import AppError from '../utils/AppError.js';

export const getWebhookEvents = async (req, res, next) => {
    try {
        const result = await db.query('SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 100');
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

export const reprocessWebhookEvent = async (req, res, next) => {
    const { eventId } = req.params;
    try {
        const eventResult = await db.query('SELECT * FROM webhook_events WHERE id = $1', [eventId]);
        if (eventResult.rows.length === 0) {
            throw new AppError('Evento de webhook no encontrado.', 404);
        }
        const event = eventResult.rows[0];

        logger.info(`Iniciando reprocesamiento manual del evento de webhook ID: ${event.id} (Event ID de MP: ${event.event_id})`);
        
        // Marcar como recibido de nuevo para que el servicio lo procese
        await db.query("UPDATE webhook_events SET status = 'received', error_message = NULL WHERE id = $1", [eventId]);

        // Llamar al servicio de procesamiento de forma asíncrona
        processPaymentNotification(event.event_type, event.event_id).catch(err => {
            logger.error(`Error durante el reprocesamiento asíncrono del webhook ${event.id}:`, err);
        });

        res.status(200).json({ message: 'El evento de webhook ha sido puesto en cola para ser reprocesado.' });
    } catch (error) {
        next(error);
    }
};
