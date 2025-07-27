// backend-pintureria/db.js
import pg from 'pg';
import config from './config/index.js'; // Importamos la configuración centralizada
import dotenv from 'dotenv'; // Import dotenv para acceder a process.env directamente para DATABASE_URL

dotenv.config(); // Cargar variables de entorno

const { Pool } = pg;

// Usamos la configuración para determinar el entorno
const isProduction = config.nodeEnv === 'production';

let connectionConfig;

if (isProduction) {
  // En producción, priorizamos DATABASE_URL si está disponible
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set in production.');
    // Fallback a propiedades de configuración individuales si DATABASE_URL no está configurada
    // Esto podría no ser ideal para producción, pero evita el crash
    connectionConfig = {
      user: config.db.user,
      host: config.db.host,
      database: config.db.database,
      password: config.db.password,
      port: config.db.port,
      ssl: config.db.ssl ? { rejectUnauthorized: false } : false, // Usar config.db.ssl
    };
  } else {
    connectionConfig = {
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    };
  }
} else {
  // En desarrollo, usamos las variables de base de datos individuales del config.
  connectionConfig = {
    user: config.db.user,
    host: config.db.host,
    database: config.db.database, // Corregido de config.database.databaseName
    password: config.db.password,
    port: config.db.port,
    ssl: config.db.ssl ? { rejectUnauthorized: false } : false, // Usar config.db.ssl
  };
}

// Creamos el Pool de conexiones
const pool = new Pool(connectionConfig);

export default pool;
