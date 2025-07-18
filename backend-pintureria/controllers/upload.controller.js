// backend-pintureria/controllers/upload.controller.js
import multer from 'multer';
import path from 'path';
import db from '../db.js';
import fs from 'fs';
import sharp from 'sharp';

// Asegurarse de que el directorio de subida exista
const uploadDir = 'public/uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Usamos 'memoryStorage' para que Multer mantenga los archivos en un buffer en memoria.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware para procesar múltiples imágenes (para la carga masiva existente)
export const uploadMultipleImages = upload.array('productImages', 50);

// --- NUEVO: Middleware para procesar una sola imagen ---
export const uploadSingleImage = upload.single('productImage');

// Controlador para la carga masiva (sin cambios en su lógica interna por ahora)
export const processAndAssociateImages = async (req, res, next) => {
  // ... (código existente de la carga masiva)
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No se subieron archivos.' });
  }

  const results = {
    success: [],
    failed: []
  };

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
      results.failed.push({ file: file.originalname, reason: error.message });
    }
  }

  res.status(200).json({
    message: 'Proceso de carga y optimización completado.',
    ...results
  });
};


// --- NUEVO: Controlador para subir y optimizar una sola imagen ---
export const handleSingleImageUpload = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se subió ningún archivo.' });
  }

  try {
    // Generamos un nombre de archivo único para evitar colisiones
    const originalName = path.parse(req.file.originalname).name;
    const newFilename = `${originalName}-${Date.now()}.webp`;
    const outputPath = path.join(uploadDir, newFilename);
    const imageUrl = `/uploads/${newFilename}`;

    // Procesamos la imagen con sharp
    await sharp(req.file.buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .toFormat('webp', { quality: 80 })
      .toFile(outputPath);

    // Devolvemos la URL pública de la imagen recién creada
    res.status(201).json({ imageUrl });

  } catch (error) {
    next(error); // Pasamos el error al manejador central
  }
};
