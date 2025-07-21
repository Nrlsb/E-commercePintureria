// backend-pintureria/services/gcs.service.js
import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/index.js';
import logger from '../logger.js';

// --- LÓGICA DE INICIALIZACIÓN MEJORADA ---

// Objeto base para las opciones de configuración de Storage
const storageOptions = {
  projectId: config.gcs.projectId,
};

// Prioridad 1: Usar el contenido del archivo JSON desde una variable de entorno.
// Este es el método recomendado para producción en plataformas como Render.
if (config.gcs.keyFileContent) {
  try {
    // Parseamos el contenido JSON de la variable de entorno
    storageOptions.credentials = JSON.parse(config.gcs.keyFileContent);
  } catch (e) {
    logger.error('No se pudo parsear GCS_KEYFILE_CONTENT. Asegúrate de que sea un JSON válido.', e);
    // Si las credenciales son inválidas en producción, detenemos la aplicación para evitar errores.
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
  }
} 
// Prioridad 2: Usar una ruta de archivo local.
// Este es el método para desarrollo local.
else if (config.gcs.keyFilename) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  storageOptions.keyFilename = path.join(__dirname, '..', config.gcs.keyFilename);
} else {
  // Advertencia si no se encuentran credenciales.
  logger.warn('Credenciales de GCS no encontradas. La aplicación puede fallar si se intentan operaciones de GCS.');
  if (config.nodeEnv === 'production') {
    throw new Error('Las credenciales de GCS (GCS_KEYFILE_CONTENT o GCS_KEYFILE) son requeridas en producción.');
  }
}

// Inicializamos Storage solo si tenemos la configuración necesaria.
const storage = config.gcs.projectId ? new Storage(storageOptions) : null;
const bucket = storage && config.gcs.bucketName ? storage.bucket(config.gcs.bucketName) : null;

/**
 * Sube un buffer de imagen a Google Cloud Storage.
 * @param {Buffer} buffer - El buffer del archivo a subir.
 * @param {string} destination - El nombre del archivo de destino en el bucket.
 * @returns {Promise<string>} La URL pública del archivo subido.
 */
export const uploadImageToGCS = (buffer, destination) => {
  return new Promise((resolve, reject) => {
    // Verificamos si el bucket fue configurado correctamente antes de usarlo.
    if (!bucket) {
      const errorMessage = 'El bucket de Google Cloud Storage no está configurado.';
      logger.error(errorMessage);
      return reject(new Error(errorMessage));
    }

    const file = bucket.file(destination);

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
      file.makePublic().then(() => {
        const publicUrl = `https://storage.googleapis.com/${config.gcs.bucketName}/${destination}`;
        logger.info(`Imagen subida exitosamente a GCS: ${publicUrl}`);
        resolve(publicUrl);
      }).catch(err => {
        logger.error('Error al hacer pública la imagen en GCS:', err);
        reject(new Error('No se pudo hacer pública la imagen.'));
      });
    });

    stream.end(buffer);
  });
};
