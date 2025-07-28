// backend-pintureria/db.js
import pg from 'pg';
import config from './config/index.js'; // Importamos la configuración centralizada
import logger from './logger.js'; // Importamos el logger para mensajes de depuración

const { Pool } = pg;

// Configuración base para la conexión
let connectionConfig;

// Priorizamos siempre DATABASE_URL si está disponible, ya que es la forma estándar en la nube (ej. Render)
if (config.database.connectionString) {
  connectionConfig = {
    connectionString: config.database.connectionString,
    ssl: {
      // Solo habilitar SSL con rejectUnauthorized: false en producción o entornos de desarrollo seguros
      // donde se confía en el certificado, o si la base de datos lo requiere.
      // Render generalmente maneja SSL automáticamente, pero es bueno ser explícito.
      rejectUnauthorized: config.nodeEnv === 'production', // Solo rechazar no autorizados en producción
    },
  };
  logger.info('Usando DATABASE_URL para la conexión a la base de datos.');
} else {
  // Si DATABASE_URL no está definida, caemos a las variables individuales.
  // Esto es más común para desarrollo local o entornos muy específicos.
  connectionConfig = {
    user: config.database.user,
    host: config.database.host,
    database: config.database.databaseName,
    password: config.database.password,
    port: config.database.port,
    ssl: false, // Deshabilitar SSL para desarrollo local si no se usa
  };
  logger.warn('DATABASE_URL no definida. Usando variables individuales para la conexión a la base de datos.');
}

// Creamos el Pool de conexiones
const pool = new Pool(connectionConfig);

// Añadir un listener para errores del pool
pool.on('error', (err, client) => {
  logger.error('Error inesperado en el pool de PostgreSQL:', err);
});

export default pool;
