// backend-pintureria/controllers/upload.controller.js
import multer from 'multer';
import path from 'path';
import db from '../db.js';
import fs from 'fs';
import sharp from 'sharp';
import fetch from 'node-fetch';

// ... (código existente de configuración de Multer y funciones de subida)
const uploadDir = 'public/uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
export const uploadMultipleImages = upload.array('productImages', 50);
export const uploadSingleImage = upload.single('productImage');
export const processAndAssociateImages = async (req, res, next) => { /* ... código existente ... */ };
export const handleSingleImageUpload = async (req, res, next) => { /* ... código existente ... */ };


// --- Controlador para analizar la imagen con IA (Corregido) ---
export const analyzeImageWithAI = async (req, res, next) => {
    const { imageData, mimeType } = req.body;

    if (!imageData || !mimeType) {
        return res.status(400).json({ message: 'Faltan datos de la imagen para el análisis.' });
    }

    try {
        const prompt = `
            Analiza la siguiente imagen de un producto de una pinturería.
            Basado en la imagen, sugiere un nombre de producto, una descripción detallada y técnica, y una categoría.
            Las categorías posibles son: Interior, Exterior, Impermeabilizantes, Esmaltes, Madera, Aerosoles, Automotor, Accesorios.
            Responde únicamente con un objeto JSON válido con las claves "name", "description" y "category".
        `;

        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: imageData
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: "application/json",
            }
        };
        
        // --- CORRECCIÓN: Usamos la variable de entorno para la API Key ---
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('La clave de API de Gemini no está configurada en el servidor.');
        }
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            console.error("Error from Gemini API:", errorBody);
            // Extraemos el mensaje de error de la API si es posible
            let errorMessage = `Error de la API de IA: ${apiResponse.statusText}`;
            try {
                const parsedError = JSON.parse(errorBody);
                if(parsedError.error && parsedError.error.message) {
                    errorMessage = parsedError.error.message;
                }
            } catch (e) { /* No hacer nada si no se puede parsear */ }
            
            const error = new Error(errorMessage);
            error.status = apiResponse.status;
            throw error;
        }

        const result = await apiResponse.json();
        
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            
            const jsonText = result.candidates[0].content.parts[0].text;
            const parsedJson = JSON.parse(jsonText);
            res.status(200).json(parsedJson);

        } else {
            throw new Error('La respuesta de la IA no tuvo el formato esperado.');
        }

    } catch (error) {
        next(error);
    }
};
