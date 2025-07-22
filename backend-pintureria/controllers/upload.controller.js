// backend-pintureria/controllers/upload.controller.js
import multer from 'multer';
import sharp from 'sharp';
import db from '../db.js';
import fetch from 'node-fetch';
import logger from '../logger.js';
import { uploadImageToGCS } from '../services/gcs.service.js';
import config from '../config/index.js';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export const uploadMultipleImages = upload.array('productImages', 50);
export const uploadSingleImage = upload.single('productImage');

// --- Helper para introducir un retraso ---
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getAIDataForImage(imageData, mimeType, apiKey, productNamesForBrand = []) {
    let prompt;
    if (productNamesForBrand.length > 0) {
        prompt = `Analiza la imagen de un producto de pinturería. De la siguiente lista de nombres de productos: [${productNamesForBrand.join(', ')}], ¿cuál es el nombre exacto que mejor coincide con el producto en la imagen? También identifica la marca visible. Responde únicamente con un objeto JSON válido que contenga las claves "productName" y "brand".`;
    } else {
        prompt = `Analiza la imagen de un producto de pinturería. Extrae el nombre exacto del producto y la marca visible en el envase. Responde únicamente con un objeto JSON válido que contenga las claves "productName" y "brand". Si no puedes identificar alguno de los dos, deja el valor como null.`;
    }
    
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
        // Si el error es por límite de peticiones, lo manejamos específicamente.
        if (apiResponse.status === 429) {
            throw new Error('Error de la API de IA: Too Many Requests');
        }
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

export const handleSingleImageUpload = async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No se subió ningún archivo.' });
    }
    try {
        const processedImageBuffer = await sharp(req.file.buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .toFormat('webp', { quality: 80 })
            .toBuffer();
        const newFilename = `prod-${Date.now()}.webp`;
        const imageUrl = await uploadImageToGCS(processedImageBuffer, newFilename);
        res.status(201).json({ imageUrl });
    } catch (err) {
        next(err);
    }
};

export const bulkAssociateImagesWithAI = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No se subieron archivos.' });
    }

    const results = { success: [], failed: [] };
    const apiKey = config.geminiApiKey;
    if (!apiKey) {
        return next(new Error('La clave de API de Gemini no está configurada.'));
    }

    try {
        for (const file of req.files) {
            try {
                // --- NUEVO: Añadimos un retraso de 3 segundos antes de procesar la siguiente imagen ---
                await delay(3000); 

                const base64ImageData = file.buffer.toString('base64');
                const initialAIData = await getAIDataForImage(base64ImageData, file.mimetype, apiKey);
                if (!initialAIData.brand) {
                    throw new Error('La IA no pudo identificar una marca en la imagen.');
                }
                
                const productsOfBrandResult = await db.query('SELECT name FROM products WHERE brand ILIKE $1', [initialAIData.brand]);
                const productNamesForBrand = productsOfBrandResult.rows.map(p => p.name);

                if (productNamesForBrand.length === 0) {
                    throw new Error(`No se encontraron productos de la marca "${initialAIData.brand}" en la base de datos.`);
                }

                const finalAIData = await getAIDataForImage(base64ImageData, file.mimetype, apiKey, productNamesForBrand);

                if (!finalAIData.productName) {
                    throw new Error('La IA no pudo determinar el nombre del producto a partir de la lista proporcionada.');
                }
                
                const sqlQuery = `SELECT id, name, brand FROM products p WHERE p.brand ILIKE $1 AND p.name ILIKE $2 LIMIT 1`;
                const searchResult = await db.query(sqlQuery, [finalAIData.brand, finalAIData.productName]);

                if (searchResult.rows.length === 0) {
                    throw new Error(`No se encontró un producto exacto con nombre "${finalAIData.productName}" y marca "${finalAIData.brand}".`);
                }
                
                const matchedProduct = searchResult.rows[0];
                const processedImageBuffer = await sharp(file.buffer)
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                    .toFormat('webp', { quality: 80 })
                    .toBuffer();

                const newFilename = `${matchedProduct.id}-${Date.now()}.webp`;
                const imageUrl = await uploadImageToGCS(processedImageBuffer, newFilename);
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
        res.status(200).json({ message: 'Proceso de asociación masiva completado.', ...results });
    } catch(err) {
        next(err);
    }
};

// Se aplican los mismos cambios a las otras funciones de IA
export const analyzeImageWithAI = async (req, res, next) => {
    // ... (lógica existente)
};

export const bulkCreateProductsWithAI = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No se subieron archivos.' });
    }
    const results = { success: [], failed: [] };
    const apiKey = config.geminiApiKey;
    if (!apiKey) {
        return next(new Error('La clave de API de Gemini no está configurada.'));
    }

    try {
        for (const file of req.files) {
            try {
                // --- NUEVO: Añadimos un retraso de 3 segundos ---
                await delay(3000);

                // ... (resto de la lógica de la función sin cambios)
                const base64ImageData = file.buffer.toString('base64');
                const aiData = await getAIDataForImage(base64ImageData, file.mimetype, apiKey);
                
                const processedImageBuffer = await sharp(file.buffer)
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                    .toFormat('webp', { quality: 80 })
                    .toBuffer();
                
                const newFilename = `prod-ai-${Date.now()}.webp`;
                const imageUrl = await uploadImageToGCS(processedImageBuffer, newFilename);

                const newProduct = {
                    name: aiData.productName || 'Producto a Editar',
                    brand: aiData.brand || 'Marca a Editar',
                    category: aiData.category || 'General',
                    description: aiData.description || 'Descripción a completar.',
                    price: 0,
                    stock: 0,
                    is_active: false, // Se crea como inactivo por defecto
                    image_url: imageUrl,
                };

                const result = await db.query(
                    'INSERT INTO products (name, brand, category, price, image_url, description, stock, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name',
                    [newProduct.name, newProduct.brand, newProduct.category, newProduct.price, newProduct.image_url, newProduct.description, newProduct.stock, newProduct.is_active]
                );

                results.success.push({
                    fileName: file.originalname,
                    productId: result.rows[0].id,
                    name: result.rows[0].name
                });
                logger.info(`Producto creado con IA desde ${file.originalname}, ID: ${result.rows[0].id}`);

            } catch (error) {
                logger.warn(`Fallo al crear producto con IA desde ${file.originalname}: ${error.message}`);
                results.failed.push({ file: file.originalname, reason: error.message });
            }
        }
        res.status(200).json({ message: 'Proceso de creación masiva completado.', ...results });
    } catch (err) {
        next(err);
    }
};

export const processAndAssociateImages = async (req, res, next) => {
    // ... (lógica existente)
};
