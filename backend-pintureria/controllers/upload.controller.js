// backend-pintureria/controllers/upload.controller.js
import multer from 'multer';
import path from 'path';
import db from '../db.js';
import fs from 'fs';

// Asegurarse de que el directorio de subida exista
const uploadDir = 'public/uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de Multer para guardar archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Usamos el nombre original del archivo para la asociación
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Middleware para procesar hasta 50 imágenes a la vez
export const uploadImages = upload.array('productImages', 50);

// Controlador para asociar las imágenes subidas a los productos
export const associateImages = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No se subieron archivos.' });
  }

  const results = {
    success: [],
    failed: []
  };

  for (const file of req.files) {
    // Extraemos el ID del producto del nombre del archivo (ej: "123.jpg" o "123_1.jpg")
    const productId = path.basename(file.originalname, path.extname(file.originalname)).split('_')[0];
    const imageUrl = `/uploads/${file.originalname}`; // URL relativa para acceder a la imagen

    try {
      // Actualizamos la URL de la imagen para el producto correspondiente
      const result = await db.query(
        'UPDATE products SET image_url = $1 WHERE id = $2 RETURNING id',
        [imageUrl, productId]
      );

      if (result.rowCount > 0) {
        results.success.push(file.originalname);
      } else {
        results.failed.push({ file: file.originalname, reason: 'Producto no encontrado' });
      }
    } catch (error) {
      results.failed.push({ file: file.originalname, reason: error.message });
    }
  }

  res.status(200).json({
    message: 'Proceso de carga masiva completado.',
    ...results
  });
};
