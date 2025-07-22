// backend-pintureria/redisClient.js
import { createClient } from 'redis';
import config from './config/index.js';
import logger from './logger.js';

// Creamos el cliente de Redis
const redisClient = createClient({
  url: config.redis.url,
});

// Manejador de errores de conexión
redisClient.on('error', (err) => {
  logger.error('Error de Conexión con Redis:', err);
});

// Conectamos al servidor de Redis
// Es una función asíncrona, pero la ejecutamos aquí y el cliente manejará la cola de comandos
// hasta que la conexión se establezca.
(async () => {
  try {
    await redisClient.connect();
    logger.info('Conectado a Redis exitosamente.');
  } catch (err) {
    logger.error('No se pudo conectar a Redis:', err);
  }
})();


export default redisClient;
