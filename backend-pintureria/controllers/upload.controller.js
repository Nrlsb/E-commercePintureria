// backend-pintureria/controllers/upload.controller.js
import multer from 'multer';
import path from 'path';
import db from '../db.js';
import fs from 'fs';
import sharp from 'sharp';
import fetch from 'node-fetch';

// ... (código existente de configuración y otras funciones)
const uploadDir = 'public/uploads/';
if (!fs.existsSync(uploadDir)){ fs.mkdirSync(uploadDir, { recursive: true }); }
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
export const uploadMultipleImages = upload.array('productImages', 50);
export const uploadSingleImage = upload.single('productImage');
export const processAndAssociateImages = async (req, res, next) => { /* ... */ };
export const handleSingleImageUpload = async (req, res, next) => { /* ... */ };
export const analyzeImageWithAI = async (req, res, next) => { /* ... */ };
export const bulkCreateProductsWithAI = async (req, res, next) => { /* ... */ };


// --- Controlador para Asociación Masiva con IA (Búsqueda por Marca y Nombre) ---
export const bulkAssociateImagesWithAI = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No se subieron archivos.' });
    }

    const results = { success: [], failed: [] };
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return next(new Error('La clave de API de Gemini no está configurada.'));
    }

    try {
        // Obtenemos todas las marcas una sola vez para optimizar
        const brandsResult = await db.query('SELECT DISTINCT brand FROM products');
        const allBrands = brandsResult.rows.map(row => row.brand.toLowerCase());

        for (const file of req.files) {
            try {
                const base64ImageData = file.buffer.toString('base64');
                const aiData = await getAIDataForImage(base64ImageData, file.mimetype, apiKey);

                if (!aiData.name) {
                    throw new Error('La IA no pudo identificar un nombre para el producto.');
                }
                
                const keywords = aiData.name.toLowerCase().split(' ').filter(kw => kw.length > 2);
                
                // Separamos la marca de las otras palabras clave
                let brandKeyword = null;
                const nameKeywords = [];
                for (const kw of keywords) {
                    if (allBrands.includes(kw)) {
                        brandKeyword = kw;
                    } else {
                        nameKeywords.push(kw);
                    }
                }

                if (nameKeywords.length === 0) {
                    throw new Error(`La IA no pudo extraer palabras clave del nombre: "${aiData.name}"`);
                }

                // Construimos una consulta mucho más estricta
                const queryParams = [];
                const whereClauses = [];
                let paramIndex = 1;

                if (brandKeyword) {
                    whereClauses.push(`p.brand ILIKE $${paramIndex++}`);
                    queryParams.push(brandKeyword);
                }

                for (const kw of nameKeywords) {
                    whereClauses.push(`p.name ILIKE $${paramIndex++}`);
                    queryParams.push(`%${kw}%`);
                }

                const sqlQuery = `
                  SELECT id, name, brand 
                  FROM products p
                  WHERE ${whereClauses.join(' AND ')}
                  LIMIT 1
                `;

                const searchResult = await db.query(sqlQuery, queryParams);

                if (searchResult.rows.length === 0) {
                    throw new Error(`No se encontró un producto que coincida con la marca "${brandKeyword || 'N/A'}" y las palabras clave: "${nameKeywords.join(', ')}".`);
                }
                
                const matchedProduct = searchResult.rows[0];

                const newFilename = `${matchedProduct.id}-${Date.now()}.webp`;
                const outputPath = path.join(uploadDir, newFilename);
                const imageUrl = `/uploads/${newFilename}`;

                await sharp(file.buffer)
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                    .toFormat('webp', { quality: 80 })
                    .toFile(outputPath);
                
                await db.query('UPDATE products SET image_url = $1 WHERE id = $2', [imageUrl, matchedProduct.id]);

                results.success.push({
                    fileName: file.originalname,
                    matchedProductId: matchedProduct.id,
                    matchedProductName: matchedProduct.name
                });

            } catch (error) {
                results.failed.push({ file: file.originalname, reason: error.message });
            }
        }

        res.status(200).json({
            message: 'Proceso de asociación masiva completado.',
            ...results
        });

    } catch(err) {
        next(err);
    }
};


// --- Función auxiliar para llamar a la IA (sin cambios) ---
async function getAIDataForImage(imageData, mimeType, apiKey) {
    const prompt = `Analiza la imagen de un producto de pinturería. Sugiere un nombre de producto conciso y preciso, incluyendo la marca si es visible. Responde solo con un JSON válido con la clave "name".`;
    
    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType, data: imageData } }] }],
        generationConfig: { responseMimeType: "application/json" }
    };
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        console.error("Error from Gemini API:", errorBody);
        throw new Error(`Error de la API de IA: ${apiResponse.statusText}`);
    }

    const result = await apiResponse.json();
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        return JSON.parse(result.candidates[0].content.parts[0].text);
    } else {
        throw new Error('La respuesta de la IA no tuvo el formato esperado.');
    }
}
