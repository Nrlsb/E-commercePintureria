// backend-pintureria/db.js
import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';

const { Pool } = pg;

// 1. Configuración de la conexión
const connectionConfig = {
  // Si estamos en producción (Render), usamos la URL de la base de datos.
  // Render establece la variable NODE_ENV a 'production' automáticamente.
  connectionString: process.env.DATABASE_URL,
  // Esta configuración SSL es necesaria para las conexiones en producción en Render.
  ssl: {
    rejectUnauthorized: false,
  },
};

// 2. Creamos el Pool de conexiones
// Si no estamos en producción, el connectionString será 'undefined' y 'pg'
// usará automáticamente las variables PG* (o DB_*) de nuestro .env local.
const pool = new Pool(process.env.NODE_ENV === 'production' ? connectionConfig : {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

export default {
  query: (text, params) => pool.query(text, params),
};
