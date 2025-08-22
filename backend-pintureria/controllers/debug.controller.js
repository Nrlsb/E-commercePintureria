// backend-pintureria/controllers/debug.controller.js
import fetch from 'node-fetch';
import logger from '../logger.js';
import config from '../config/index.js';
import AppError from '../utils/AppError.js';

export const analyzeErrorWithAI = async (req, res, next) => {
    const { errorMessage, errorStack, componentStack } = req.body;
    const apiKey = config.geminiApiKey;

    if (!errorMessage || !errorStack) {
        return next(new AppError('Faltan detalles del error para el análisis.', 400));
    }

    if (!apiKey) {
        return next(new AppError('La clave de API de Gemini no está configurada en el servidor.', 500));
    }

    try {
        const prompt = `
            Actúa como un ingeniero de software senior experto en depuración de aplicaciones full-stack con React y Node.js.
            Se ha producido un error en un sitio de e-commerce. Proporciona un análisis claro y conciso del problema.

            Aquí están los detalles del error:
            - Mensaje de Error: "${errorMessage}"
            - Stack Trace del Error: 
            \`\`\`
            ${errorStack}
            \`\`\`
            - Stack de Componentes de React: 
            \`\`\`
            ${componentStack}
            \`\`\`

            Tu análisis debe estar en formato HTML y estructurado de la siguiente manera:
            1.  **Diagnóstico del Problema:** En una o dos frases, explica qué significa el error en un lenguaje claro.
            2.  **Causa Más Probable:** Basado en el stack trace, identifica el archivo y la línea de código que probablemente causaron el error. Explica por qué esa línea podría ser el problema.
            3.  **Solución Sugerida:** Ofrece una o dos soluciones concretas. Incluye un pequeño fragmento de código (si es aplicable) mostrando cómo podría corregirse.
            4.  **Impacto en el Usuario:** Describe brevemente cómo este error afecta la experiencia del usuario en el sitio.

            Utiliza etiquetas <h4> para los títulos y <pre><code> para los fragmentos de código. Sé directo y técnico, pero claro.
        `;

        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        };

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            logger.error("Error from Gemini API for error analysis:", errorBody);
            throw new AppError('No se pudo obtener el análisis de la IA.', apiResponse.status);
        }

        const result = await apiResponse.json();
        const analysis = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!analysis) {
            throw new AppError('La respuesta de la IA no tuvo el formato esperado.', 500);
        }

        res.status(200).json({ analysis });

    } catch (err) {
        next(err);
    }
};
