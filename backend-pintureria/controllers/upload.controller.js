// backend-pintureria/controllers/upload.controller.js
import multer from 'multer';
import path from 'path';
import db from '../db.js';
import fs from 'fs';
import sharp from 'sharp'; // 1. Importamos la librería sharp

// Asegurarse de que el directorio de subida exista
const uploadDir = 'public/uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Usamos 'memoryStorage' para que Multer mantenga los archivos en un buffer en memoria.
// Esto nos permite procesarlos con sharp antes de guardarlos en el disco.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware para procesar hasta 50 imágenes a la vez
export const uploadImages = upload.array('productImages', 50);

// 3. Nueva función controladora que procesa, guarda y asocia las imágenes.
export const processAndAssociateImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No se subieron archivos.' });
  }

  const results = {
    success: [],
    failed: []
  };

  for (const file of req.files) {
    // Extraemos el ID del producto del nombre del archivo original (ej: "123.jpg")
    const productId = path.basename(file.originalname, path.extname(file.originalname)).split('_')[0];
    
    // Generamos un nuevo nombre de archivo con la extensión .webp
    const newFilename = `${productId}_${Date.now()}.webp`;
    const outputPath = path.join(uploadDir, newFilename);
    const imageUrl = `/uploads/${newFilename}`; // URL relativa para la base de datos

    try {
      // 4. Usamos sharp para procesar la imagen desde el buffer
      await sharp(file.buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true }) // Redimensiona si es más grande de 800x800
        .toFormat('webp', { quality: 80 }) // Convierte a formato WebP con 80% de calidad
        .toFile(outputPath); // Guarda la imagen procesada en el disco

      // 5. Actualizamos la URL de la imagen para el producto correspondiente en la BD
      const result = await db.query(
        'UPDATE products SET image_url = $1 WHERE id = $2 RETURNING id',
        [imageUrl, productId]
      );

      if (result.rowCount > 0) {
        results.success.push(`${file.originalname} -> ${newFilename}`);
      } else {
        // Si el producto no se encuentra, eliminamos la imagen que acabamos de crear.
        fs.unlinkSync(outputPath); 
        results.failed.push({ file: file.originalname, reason: 'Producto no encontrado' });
      }
    } catch (error) {
      // Si hay un error en el procesamiento, lo capturamos.
      results.failed.push({ file: file.originalname, reason: error.message });
    }
  }

  res.status(200).json({
    message: 'Proceso de carga y optimización completado.',
    ...results
  });
};
