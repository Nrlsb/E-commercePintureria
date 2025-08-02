// backend-pintureria/controllers/chatbot.controller.js
import db from '../db.js';
import fetch from 'node-fetch';
import logger from '../logger.js';
import config from '../config/index.js';
import AppError from '../utils/AppError.js';

// Función para obtener un resumen de los productos y proporcionar contexto a la IA
const getProductsStoreContext = async () => {
    try {
        const result = await db.query(
            'SELECT name, brand, category, price, stock, description FROM products WHERE is_active = true'
        );
        // Formateamos los datos para que sean fáciles de entender para la IA
        return result.rows.map(p => 
            `- ${p.name} (Marca: ${p.brand}, Categoría: ${p.category}, Precio: $${p.price}, Stock: ${p.stock})`
        ).join('\n');
    } catch (error) {
        logger.error('Error fetching product context for chatbot:', error);
        return ''; // Retorna un string vacío si hay un error
    }
};

export const handleChatMessage = async (req, res, next) => {
    const { message, history } = req.body;
    const apiKey = config.geminiApiKey;

    if (!message) {
        return next(new AppError('El mensaje es requerido.', 400));
    }
    if (!apiKey) {
        return next(new AppError('La clave de API de Gemini no está configurada.', 500));
    }

    try {
        const productContext = await getProductsStoreContext();
        
        // Creamos un prompt detallado para guiar a la IA
        const systemPrompt = `Eres "Mercurio Asistente", un chatbot de atención al cliente para "Pinturerías Mercurio". Tu tono es amable, servicial y profesional. 
        Tu objetivo es ayudar a los usuarios con preguntas sobre productos, disponibilidad, precios y recomendaciones.
        Utiliza la siguiente lista de productos como tu base de conocimiento. No inventes productos que no estén en esta lista.
        Si no sabes la respuesta, amablemente indica que no tienes esa información y sugiere contactar a soporte.
        
        Contexto de Productos Disponibles:
        ${productContext}
        `;

        // Construimos el historial para la API, incluyendo el prompt del sistema
        const apiHistory = [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "¡Hola! Soy Mercurio Asistente. ¿En qué puedo ayudarte hoy?" }] }
        ];

        // Añadimos el historial de la conversación actual
        if (history && history.length > 0) {
            history.forEach(msg => {
                apiHistory.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                });
            });
        }
        
        // Añadimos el nuevo mensaje del usuario
        apiHistory.push({ role: "user", parts: [{ text: message }] });

        const payload = {
            contents: apiHistory,
        };

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            logger.error("Error from Gemini API for chatbot:", errorBody);
            throw new AppError('No se pudo obtener una respuesta de la IA.', apiResponse.status);
        }

        const result = await apiResponse.json();
        const botResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!botResponse) {
            throw new AppError('La respuesta de la IA no tuvo el formato esperado.', 500);
        }

        res.status(200).json({ reply: botResponse });

    } catch (err) {
        next(err);
    }
};
