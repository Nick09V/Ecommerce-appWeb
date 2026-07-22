const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig, corsOrigin } = require('../config/env');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');

function initSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: corsOrigin, // Unificado con la configuración global de CORS
      methods: ['GET', 'POST']
    }
  });

  // 1. MIDDLEWARE DE AUTENTICACIÓN PARA WEBSOCKETS
  io.use((socket, next) => {
    // Extraer el token de la autenticación del handshake (frontend) o de los headers
    const token = socket.handshake.auth?.token || 
                  (socket.handshake.headers?.authorization?.split(' ')[1]);

    if (!token) {
      return next(new Error('Token de acceso requerido'));
    }

    try {
      // Validar el token usando tu secreto
      const decoded = jwt.verify(token, jwtConfig.secret);
      socket.user = decoded; // Inyectar la identidad validada en el socket
      next();
    } catch (error) {
      return next(new Error('Token inválido o expirado'));
    }
  });

  const CHANNEL = 'chat.events';
  const redisSubscriber = redisClient.duplicate();

  redisSubscriber.connect().then(() => {
    logger.info('Redis Subscriber conectado para WebSockets');
    
    redisSubscriber.subscribe(CHANNEL, (message) => {
      try {
        const payload = JSON.parse(message);

        if (payload.event === 'NewMessage') {
          const receiverRoom = `user_${payload.receiver_id}`;
          const senderRoom = `user_${payload.sender_id}`;
          io.to(receiverRoom).emit('new_message', payload);
          io.to(senderRoom).emit('new_message', payload);
          logger.info(`[Socket.io] Mensaje reemitido a ${receiverRoom} y ${senderRoom}`);
        }
      } catch (error) {
        logger.error('Error parseando el mensaje de Redis Pub/Sub:', error);
      }
    });
  }).catch(err => {
    logger.error('Error conectando el Redis Subscriber:', err);
  });

  // 2. MANEJO DE CONEXIONES SEGURAS
  io.on('connection', (socket) => {
    // El ID de usuario ahora viene del token validado, es 100% confiable
    const userId = socket.user.id; 
    logger.info(`Cliente conectado a WebSockets: ${socket.id}, Usuario ID: ${userId}`);

    // Unimos automáticamente al usuario a su sala personal al conectarse.
    // Ya no requerimos que el frontend emita 'join_inbox'.
    const room = `user_${userId}`;
    socket.join(room);
    logger.info(`Socket ${socket.id} (User: ${userId}) se unió automáticamente a ${room}`);

    socket.on('disconnect', () => {
      logger.info(`Cliente desconectado de WebSockets: ${socket.id}`);
    });
  });

  return io;
}

module.exports = initSockets;