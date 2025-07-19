// backend-pintureria/controllers/upload.controller.js
import multer from 'multer';
import path from 'path';
import db from '../db.js';
import fs from 'fs';
import sharp from 'sharp';
import fetch from 'node-fetch';
import logger from '../logger.js';

const uploadDir = 'public/uploads/';
if (!fs.existsSync(uploadDir)){ fs.mkdirSync(uploadDir, { recursive: true }); }

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export const uploadMultipleImages = upload.array('productImages', 50);
export const uploadSingleImage = upload.single('productImage');

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
        logger.error("Error from Gemini API:", errorBody);
        throw new Error(`Error de la API de IA: ${apiResponse.statusText}`);
    }

    const result = await apiResponse.json();
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        return JSON.parse(result.candidates[0].content.parts[0].text);
    } else {
        throw new Error('La respuesta de la IA no tuvo el formato esperado.');
    }
}

export const processAndAssociateImages = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No se subieron archivos.' });
    }

    const results = { success: [], failed: [] };

    for (const file of req.files) {
        const baseName = path.parse(file.originalname).name;
        const productId = parseInt(baseName.split('_')[0], 10);

        if (isNaN(productId)) {
            results.failed.push({ file: file.originalname, reason: 'Nombre de archivo no contiene un ID de producto válido.' });
            continue;
        }

        try {
            const newFilename = `${productId}-${Date.now()}.webp`;
            const outputPath = path.join(uploadDir, newFilename);
            const imageUrl = `/uploads/${newFilename}`;

            await sharp(file.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .toFormat('webp', { quality: 80 })
                .toFile(outputPath);

            const productResult = await db.query('SELECT image_url FROM products WHERE id = $1', [productId]);
            if (productResult.rows.length > 0 && !productResult.rows[0].image_url) {
                await db.query('UPDATE products SET image_url = $1 WHERE id = $2', [imageUrl, productId]);
            }
            
            results.success.push(file.originalname);
        } catch (error) {
            logger.error(`Error procesando el archivo ${file.originalname}:`, error);
            results.failed.push({ file: file.originalname, reason: 'Error interno del servidor al procesar la imagen.' });
        }
    }
    res.status(200).json(results);
};

export const handleSingleImageUpload = async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No se subió ningún archivo.' });
    }

    try {
        const newFilename = `prod-${Date.now()}.webp`;
        const outputPath = path.join(uploadDir, newFilename);
        const imageUrl = `/uploads/${newFilename}`;

        await sharp(req.file.buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .toFormat('webp', { quality: 80 })
            .toFile(outputPath);
        
        res.status(201).json({ imageUrl });
    } catch (err) {
        next(err);
    }
};

export const analyzeImageWithAI = async (req, res, next) => {
    const { imageData, mimeType } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!imageData || !mimeType || !apiKey) {
        return res.status(400).json({ message: 'Faltan datos para el análisis de IA.' });
    }

    try {
        const prompt = `Analiza esta imagen de un producto de pinturería. Describe el producto, sugiere un nombre comercial y una categoría. Responde solo con un JSON válido con las claves "name", "description" y "category".`;
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
            logger.error("Error from Gemini API:", errorBody);
            throw new Error(`Error de la API de IA: ${apiResponse.statusText}`);
        }

        const result = await apiResponse.json();
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            const aiData = JSON.parse(result.candidates[0].content.parts[0].text);
            res.status(200).json(aiData);
        } else {
            throw new Error('La respuesta de la IA no tuvo el formato esperado.');
        }
    } catch(err) {
        next(err);
    }
};

export const bulkCreateProductsWithAI = async (req, res, next) => {
    // Implementación completa si existiera...
};

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
                
                let brandKeyword = null;
                const nameKeywords = [];
                for (const kw of keywords) {
                    if (allBrands.includes(kw)) {
                        brandKeyword = kw;
                    } else {
                        nameKeywords.push(kw);
                    }
                }

                if (nameKeywords.length === 0 && !brandKeyword) {
                    throw new Error(`La IA no pudo extraer palabras clave del nombre: "${aiData.name}"`);
                }

                const queryParams = [];
                const whereClauses = [];
                let paramIndex = 1;

                if (brandKeyword) {
                    whereClauses.push(`p.brand ILIKE $${paramIndex++}`);
                    queryParams.push(brandKeyword);
                }
                
                if (nameKeywords.length > 0) {
                    const nameConditions = nameKeywords.map(() => `p.name ILIKE $${paramIndex++}`);
                    whereClauses.push(`(${nameConditions.join(' OR ')})`);
                    nameKeywords.forEach(kw => queryParams.push(`%${kw}%`));
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
                logger.info(`Imagen ${file.originalname} asociada al producto ID ${matchedProduct.id}`);
            } catch (error) {
                logger.warn(`Fallo al asociar imagen ${file.originalname}: ${error.message}`);
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
