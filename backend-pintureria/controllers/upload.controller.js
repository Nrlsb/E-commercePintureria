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

// --- CORRECCIÓN: Se añade 'next' para el manejo de errores ---
export const processAndAssociateImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No se subieron archivos.' });
  }

  const results = {
    success: [],
    failed: []
  };

  try { // Se envuelve el bucle en un try...catch general
    for (const file of req.files) {
      const productId = path.basename(file.originalname, path.extname(file.originalname)).split('_')[0];
      const newFilename = `${productId}_${Date.now()}.webp`;
      const outputPath = path.join(uploadDir, newFilename);
      const imageUrl = `/uploads/${newFilename}`;

      try {
        await sharp(file.buffer)
          .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
          .toFormat('webp', { quality: 80 })
          .toFile(outputPath);

        const result = await db.query(
          'UPDATE products SET image_url = $1 WHERE id = $2 RETURNING id',
          [imageUrl, productId]
        );

        if (result.rowCount > 0) {
          results.success.push(`${file.originalname} -> ${newFilename}`);
        } else {
          fs.unlinkSync(outputPath); 
          results.failed.push({ file: file.originalname, reason: 'Producto no encontrado' });
        }
      } catch (error) {
        // Capturamos errores por archivo y continuamos
        results.failed.push({ file: file.originalname, reason: error.message });
      }
    }

    res.status(200).json({
      message: 'Proceso de carga y optimización completado.',
      ...results
    });
  } catch (err) {
    // Si hay un error mayor (ej. de base de datos), lo pasamos al manejador central.
    next(err);
  }
};

export const handleSingleImageUpload = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se subió ningún archivo.' });
  }

  try {
    const originalName = path.parse(req.file.originalname).name;
    const newFilename = `${originalName}-${Date.now()}.webp`;
    const outputPath = path.join(uploadDir, newFilename);
    const imageUrl = `/uploads/${newFilename}`;

    await sharp(req.file.buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .toFormat('webp', { quality: 80 })
      .toFile(outputPath);

    res.status(201).json({ imageUrl });
  } catch (error) {
    next(error);
  }
};

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
        
        const apiKey = "";
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
