// backend-pintureria/db.js
import dotenv from 'dotenv';
dotenv.config(); // <-- AÑADIMOS ESTO AQUÍ para asegurar que las variables se carguen

import pg from 'pg';

const { Pool } = pg;

// Ahora, cuando se crea el Pool, las variables de process.env ya estarán disponibles.
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

export default {
  query: (text, params) => pool.query(text, params),
};
