// backend-pintureria/logger.js
import winston from 'winston';
import path from 'path';

// Define el formato de log para la consola
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);

// Define el formato de log para los archivos
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Crea el logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: fileFormat,
  transports: [
    // Guarda los errores en un archivo separado `error.log`
    new winston.transports.File({ 
      filename: path.join('logs', 'error.log'), 
      level: 'error' 
    }),
    // Guarda todos los logs en un archivo `combined.log`
    new winston.transports.File({ 
      filename: path.join('logs', 'combined.log') 
    }),
  ],
});

// Si no estamos en producción, también muestra los logs en la consola
// con un formato más legible y colorido.
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

export default logger;
