// backend-pintureria/db.js
import pg from 'pg';
import config from './config/index.js'; // Importamos la configuración centralizada

const { Pool } = pg;

// Usamos la configuración para determinar el entorno
const isProduction = config.nodeEnv === 'production';

// Configuración de la conexión basada en el objeto de configuración
const connectionConfig = {
  connectionString: config.database.connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
};

// Creamos el Pool de conexiones
// Si no estamos en producción, usamos las variables de base de datos individuales del config.
const pool = new Pool(isProduction ? connectionConfig : {
  user: config.database.user,
  host: config.database.host,
  database: config.database.databaseName,
  password: config.database.password,
  port: config.database.port,
});

export default pool;
