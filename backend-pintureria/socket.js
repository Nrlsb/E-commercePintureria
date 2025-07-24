// backend-pintureria/socket.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from './config/index.js';
import logger from './logger.js';

let io;

/**
 * Inicializa el servidor de Socket.IO y lo adjunta al servidor HTTP.
 * Configura la autenticación y el manejo de conexiones.
 * @param {import('http').Server} httpServer - El servidor HTTP creado desde Express.
 */
export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.frontendUrl,
      methods: ["GET", "POST"]
    }
  });

  // Middleware de autenticación para Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token not provided.'));
    }

    jwt.verify(token, config.jwtSecret, (err, user) => {
      if (err) {
        return next(new Error('Authentication error: Invalid token.'));
      }
      // Solo permitimos la conexión si el usuario es administrador
      if (user.role !== 'admin') {
        return next(new Error('Authorization error: Admin role required.'));
      }
      socket.user = user;
      next();
    });
  });

  io.on('connection', (socket) => {
    logger.info(`Admin conectado a WebSocket: ${socket.user.email} (ID: ${socket.id})`);

    // Unir al administrador a una sala 'admins' para facilitar la difusión de mensajes
    socket.join('admins');

    socket.on('disconnect', () => {
      logger.info(`Admin desconectado de WebSocket: ${socket.user.email} (ID: ${socket.id})`);
    });
  });

  return io;
};

/**
 * Obtiene la instancia del servidor de Socket.IO.
 * @returns {Server} La instancia de Socket.IO.
 */
export const getIoInstance = () => {
  if (!io) {
    throw new Error('Socket.IO no ha sido inicializado.');
  }
  return io;
};
