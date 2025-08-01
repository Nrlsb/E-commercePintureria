// backend-pintureria/controllers/upload.controller.js
import multer from 'multer';
import sharp from 'sharp';
import db from '../db.js';
import fetch from 'node-fetch';
import logger from '../logger.js';
import { uploadImageToGCS } from '../services/gcs.service.js';
import config from '../config/index.js';
import AppError from '../utils/AppError.js'; // Importar AppError

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export const uploadMultipleImages = upload.array('productImages', 50);
export const uploadSingleImage = upload.single('productImage');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Función centralizada para procesar y subir imágenes en varios tamaños ---
const processAndUploadImage = async (fileBuffer) => {
    const baseFilename = `prod-${Date.now()}`;
    const sizes = {
        small: 400,
        medium: 800,
        large: 1200,
    };

    const uploadPromises = Object.entries(sizes).map(async ([sizeName, width]) => {
        const processedImageBuffer = await sharp(fileBuffer)
            .resize(width, width, { fit: 'inside', withoutEnlargement: true })
            .toFormat('webp', { quality: 80 })
            .toBuffer();
        const newFilename = `${baseFilename}-${sizeName}.webp`;
        const url = await uploadImageToGCS(processedImageBuffer, newFilename);
        return { [sizeName]: url };
    });

    const uploadedUrlsArray = await Promise.all(uploadPromises);
    // Combina el array de objetos en un solo objeto: { small: 'url', medium: 'url', large: 'url' }
    return uploadedUrlsArray.reduce((acc, curr) => ({ ...acc, ...curr }), {});
};


async function getAIDataForImage(imageData, mimeType, apiKey, productNamesForBrand = []) {
    let prompt;
    if (productNamesForBrand.length > 0) {
        // This prompt is static, no user input concatenation.
        prompt = `Analiza la imagen de un producto de pinturería. De la siguiente lista de nombres de productos: [${productNamesForBrand.join(', ')}], ¿cuál es el nombre exacto que mejor coincide con el producto en la imagen? También identifica la marca visible. Responde únicamente con un objeto JSON válido que contenga las claves "productName" y "brand".`;
    } else {
        // This prompt is static, no user input concatenation.
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
        if (apiResponse.status === 429) {
            throw new AppError('Error de la API de IA: Demasiadas solicitudes. Inténtalo de nuevo más tarde.', 429);
        }
        if (apiResponse.status === 503) {
            throw new AppError('Error de la API de IA: Servicio no disponible. Inténtalo de nuevo más tarde.', 503);
        }
        const errorBody = await apiResponse.text();
        logger.error("Error from Gemini API:", errorBody);
        throw new AppError(`Error de la API de IA: ${apiResponse.statusText}`, apiResponse.status);
    }

    const result = await apiResponse.json();
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        return JSON.parse(result.candidates[0].content.parts[0].text);
    } else {
        throw new AppError('La respuesta de la IA no tuvo el formato esperado.', 500);
    }
}

// --- NUEVA FUNCIÓN PARA GENERAR DESCRIPCIONES DETALLADAS ---
export const generateAIDescription = async (req, res, next) => {
    const { productName, brand, tone } = req.body;
    const apiKey = config.geminiApiKey;

    if (!productName || !brand || !tone) {
        return next(new AppError('Faltan el nombre, la marca o el tono del producto.', 400));
    }
    if (!apiKey) {
        return next(new AppError('La clave de API de Gemini no está configurada.', 500));
    }

    try {
        const prompt = `Actúa como un experto en marketing para una pinturería. Genera una descripción de producto atractiva y en tono "${tone}" para el siguiente producto: "${productName}" de la marca "${brand}". La descripción debe ser de aproximadamente 3 a 4 párrafos, destacando sus beneficios, usos ideales y características clave.`;

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
            logger.error("Error from Gemini API for description:", errorBody);
            throw new AppError('No se pudo generar la descripción desde la IA.', apiResponse.status);
        }

        const result = await apiResponse.json();
        const description = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!description) {
            throw new AppError('La respuesta de la IA para la descripción no tuvo el formato esperado.', 500);
        }

        res.status(200).json({ description });

    } catch (err) {
        next(err);
    }
};


export const handleSingleImageUpload = async (req, res, next) => {
    if (!req.file) {
        throw new AppError('No se subió ningún archivo.', 400);
    }
    try {
        const imageUrls = await processAndUploadImage(req.file.buffer);
        res.status(201).json({ imageUrls }); // Devuelve el objeto con todas las URLs
    } catch (err) {
        next(err); // Pasa cualquier error al errorHandler
    }
};

export const bulkAssociateImagesWithAI = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        throw new AppError('No se subieron archivos.', 400);
    }

    const results = { success: [], failed: [] };
    const apiKey = config.geminiApiKey;
    if (!apiKey) {
        throw new AppError('La clave de API de Gemini no está configurada.', 500);
    }

    try {
        for (const file of req.files) {
            try {
                await delay(3000); 

                const base64ImageData = file.buffer.toString('base64');
                const initialAIData = await getAIDataForImage(base64ImageData, file.mimetype, apiKey);
                if (!initialAIData.brand) {
                    throw new AppError('La IA no pudo identificar una marca en la imagen.', 400);
                }
                
                // Using parameterized query to prevent SQL Injection
                const productsOfBrandResult = await db.query('SELECT id, name, brand FROM products WHERE brand ILIKE $1', [initialAIData.brand]);
                const dbProducts = productsOfBrandResult.rows;

                if (dbProducts.length === 0) {
                    throw new AppError(`No se encontraron productos de la marca "${initialAIData.brand}" en la base de datos.`, 404);
                }
                
                const productNamesForBrand = dbProducts.map(p => p.name);
                const finalAIData = await getAIDataForImage(base64ImageData, file.mimetype, apiKey, productNamesForBrand);

                if (!finalAIData.productName) {
                    throw new AppError('La IA no pudo determinar el nombre del producto a partir de la lista proporcionada.', 400);
                }

                const stopWords = new Set(['para', 'de', 'y', 'a', 'con', 'en', 'x', 'lts', 'lt', 'blanco', 'mate', 'blanca', 'acrilico', 'acrílico']);
                const getKeywords = (text) => new Set(text.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase().split(' ').filter(word => word.length > 2 && !stopWords.has(word)));

                const aiKeywords = getKeywords(finalAIData.productName);
                
                if (aiKeywords.size === 0) {
                    throw new AppError(`No se pudieron extraer palabras clave significativas de "${finalAIData.productName}".`, 400);
                }

                let bestMatch = null;
                let highestScore = 0;

                for (const dbProduct of dbProducts) {
                    const dbKeywords = getKeywords(dbProduct.name);
                    let currentScore = 0;
                    for (const keyword of aiKeywords) {
                        if (dbKeywords.has(keyword)) {
                            currentScore++;
                        }
                    }

                    if (currentScore > highestScore) {
                        highestScore = currentScore;
                        bestMatch = dbProduct;
                    }
                }

                if (!bestMatch || highestScore === 0) {
                    throw new AppError(`No se encontró un producto que coincida con las palabras clave de "${finalAIData.productName}" y marca "${finalAIData.brand}".`, 404);
                }
                
                const matchedProduct = bestMatch;
                
                const imageUrls = await processAndUploadImage(file.buffer);
                
                await db.query('UPDATE products SET image_url = $1 WHERE id = $2', [JSON.stringify(imageUrls), matchedProduct.id]);


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
        next(err); // Pasa cualquier error al errorHandler
    }
};

export const analyzeImageWithAI = async (req, res, next) => {
    if (!req.body.imageData || !req.body.mimeType) {
        throw new AppError('Faltan datos de imagen o tipo MIME.', 400);
    }
    const { imageData, mimeType } = req.body;
    const apiKey = config.geminiApiKey;
    if (!apiKey) {
        throw new AppError('La clave de API de Gemini no está configurada.', 500);
    }

    try {
        const aiData = await getAIDataForImage(imageData, mimeType, apiKey);
        res.status(200).json(aiData);
    } catch (err) {
        next(err); // Pasa cualquier error al errorHandler
    }
};

export const bulkCreateProductsWithAI = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        throw new AppError('No se subieron archivos.', 400);
    }
    const results = { success: [], failed: [] };
    const apiKey = config.geminiApiKey;
    if (!apiKey) {
        throw new AppError('La clave de API de Gemini no está configurada.', 500);
    }

    try {
        for (const file of req.files) {
            try {
                await delay(3000);
                const base64ImageData = file.buffer.toString('base64');
                const aiData = await getAIDataForImage(base64ImageData, file.mimetype, apiKey);
                
                const imageUrls = await processAndUploadImage(file.buffer);

                const newProduct = {
                    name: aiData.productName || 'Producto a Editar',
                    brand: aiData.brand || 'Marca a Editar',
                    category: aiData.category || 'General',
                    description: aiData.description || 'Descripción a completar.',
                    price: 0,
                    stock: 0,
                    is_active: false,
                    image_url: JSON.stringify(imageUrls), // Guardamos el objeto como string
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
        next(err); // Pasa cualquier error al errorHandler
    }
};

export const processAndAssociateImages = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        throw new AppError('No se subieron archivos.', 400);
    }

    const results = { success: [], failed: [] };
    for (const file of req.files) {
        const productIdMatch = file.originalname.match(/^(\d+)/);
        if (!productIdMatch) {
            results.failed.push({ file: file.originalname, reason: 'El nombre del archivo no contiene un ID de producto válido.' });
            continue;
        }
        const productId = productIdMatch[1];

        try {
            const imageUrls = await processAndUploadImage(file.buffer);
            await db.query('UPDATE products SET image_url = $1 WHERE id = $2', [JSON.stringify(imageUrls), productId]);
            
            results.success.push(file.originalname);
            logger.info(`Imagen ${file.originalname} asociada al producto ID ${productId}`);
        } catch (error) {
            logger.warn(`Fallo al asociar imagen ${file.originalname}: ${error.message}`);
            results.failed.push({ file: file.originalname, reason: error.message });
        }
    }
    res.status(200).json({ message: 'Carga masiva completada.', ...results });
};
