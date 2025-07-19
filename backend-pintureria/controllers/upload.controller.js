// backend-pintureria/controllers/upload.controller.js
import multer from 'multer';
import path from 'path';
import db from '../db.js';
import fs from 'fs';
import sharp from 'sharp';
import fetch from 'node-fetch';

const uploadDir = 'public/uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export const uploadMultipleImages = upload.array('productImages', 50);
export const uploadSingleImage = upload.single('productImage');

// --- LÓGICA EXISTENTE ---
export const processAndAssociateImages = async (req, res, next) => { /* ... */ };
export const handleSingleImageUpload = async (req, res, next) => { /* ... */ };
export const analyzeImageWithAI = async (req, res, next) => { /* ... */ };


// --- NUEVO: Controlador para Creación Masiva de Productos con IA ---
export const bulkCreateProductsWithAI = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No se subieron archivos.' });
    }

    const results = {
        success: [],
        failed: []
    };
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return next(new Error('La clave de API de Gemini no está configurada en el servidor.'));
    }

    for (const file of req.files) {
        try {
            // 1. Analizar la imagen con IA para obtener datos del producto
            const base64ImageData = file.buffer.toString('base64');
            const aiData = await getAIDataForImage(base64ImageData, file.mimetype, apiKey);

            // 2. Crear un producto "borrador" en la base de datos
            const productResult = await db.query(
                'INSERT INTO products (name, description, category, brand, price, stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                [aiData.name || 'Producto sin nombre', aiData.description || 'Sin descripción.', aiData.category || 'Accesorios', 'Marca a definir', 0, 0]
            );
            const newProductId = productResult.rows[0].id;

            // 3. Procesar y guardar la imagen
            const newFilename = `${newProductId}-${Date.now()}.webp`;
            const outputPath = path.join(uploadDir, newFilename);
            const imageUrl = `/uploads/${newFilename}`;

            await sharp(file.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .toFormat('webp', { quality: 80 })
                .toFile(outputPath);
            
            // 4. Actualizar el producto con la URL de la imagen
            await db.query('UPDATE products SET image_url = $1 WHERE id = $2', [imageUrl, newProductId]);

            results.success.push({
                fileName: file.originalname,
                productId: newProductId,
                name: aiData.name
            });

        } catch (error) {
            results.failed.push({ file: file.originalname, reason: error.message });
        }
    }

    res.status(201).json({
        message: 'Proceso de creación masiva completado.',
        ...results
    });
};

// --- NUEVO: Función auxiliar para llamar a la IA ---
async function getAIDataForImage(imageData, mimeType, apiKey) {
    const prompt = `Analiza la imagen de un producto de pinturería. Sugiere nombre, descripción y categoría (Interior, Exterior, Impermeabilizantes, Esmaltes, Madera, Aerosoles, Automotor, Accesorios). Responde solo con un JSON válido con claves "name", "description", "category".`;
    
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
