// backend-pintureria/services/gcs.service.js
import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';
import logger from '../logger.js';

// Obtener la ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar el cliente de Google Cloud Storage
const storage = new Storage({
  projectId: config.gcs.projectId,
  // Construir la ruta completa al archivo de credenciales
  keyFilename: path.join(__dirname, '..', config.gcs.keyFilename),
});

// Obtener el nombre del bucket desde la configuración
const bucketName = config.gcs.bucketName;
const bucket = storage.bucket(bucketName);

/**
 * Sube un buffer de imagen a Google Cloud Storage.
 * @param {Buffer} buffer - El buffer del archivo a subir.
 * @param {string} destination - El nombre del archivo de destino en el bucket.
 * @returns {Promise<string>} La URL pública del archivo subido.
 */
export const uploadImageToGCS = (buffer, destination) => {
  return new Promise((resolve, reject) => {
    // Crear una referencia al archivo en el bucket
    const file = bucket.file(destination);

    // Crear un stream de escritura para subir el archivo
    const stream = file.createWriteStream({
      metadata: {
        contentType: 'image/webp', // Asumimos que siempre subiremos en formato webp
      },
      resumable: false,
    });

    stream.on('error', (err) => {
      logger.error('Error al subir a GCS:', err);
      reject(new Error('No se pudo subir la imagen a Google Cloud Storage.'));
    });

    stream.on('finish', () => {
      // Hacer el archivo público
      file.makePublic().then(() => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
        logger.info(`Imagen subida exitosamente a GCS: ${publicUrl}`);
        resolve(publicUrl);
      }).catch(err => {
        logger.error('Error al hacer pública la imagen en GCS:', err);
        reject(new Error('No se pudo hacer pública la imagen.'));
      });
    });

    // Enviar el buffer al stream
    stream.end(buffer);
  });
};
