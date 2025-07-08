// backend-pintureria/db.js
import pg from 'pg';

// Importamos 'Pool' directamente desde la librería 'pg'
const { Pool } = pg;

// El Pool gestiona las conexiones a la base de datos de forma eficiente.
const pool = new Pool({
  user: 'postgres',          // Tu nombre de usuario de PostgreSQL (usualmente 'postgres')
  host: 'localhost',         // La dirección del servidor de la base de datos
  database: 'pintureria_db', // El nombre de la base de datos que creaste
  password: 'Dragon10', // ¡IMPORTANTE! Reemplaza esto con tu contraseña real
  port: 5432,                // El puerto por defecto de PostgreSQL
});

// Exportamos una función 'query' para poder usarla en el resto de la aplicación.
// Esta función toma una consulta SQL y sus parámetros, y la ejecuta usando el pool.
export default {
  query: (text, params) => pool.query(text, params),
};
