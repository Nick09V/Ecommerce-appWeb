const { pool } = require('../config/database');
const logger = require('../utils/logger'); 

const registerSockets = (io) => {
  
  // 1. Middleware de Autenticación con las sesiones que ya tienes
  io.use((socket, next) => {
    const session = socket.request.session;
    if (session && session.userId) {
      socket.user = {
        id: session.userId,
        name: session.userName,
        email: session.userEmail
      };
      next();
    } else {
      next(new Error("No autorizado"));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Usuario conectado al chat: ${socket.user.name} (ID: ${socket.user.id})`);

    // 2. Unimos al usuario a su "sala privada" basada en su ID
    const userRoom = `user_${socket.user.id}`;
    socket.join(userRoom);

    socket.emit('welcome', { message: `Conexión establecida. Hola ${socket.user.name}` });

    // 3. Escuchar nuevos mensajes P2P
    socket.on('chat:message', async (payload) => {
      if (!payload || typeof payload.message !== 'string' || !payload.inventoryId || !payload.receiverId) {
        socket.emit('chat:error', { message: 'Faltan datos requeridos o el formato es inválido' });
        return;
      }

      const message = payload.message.trim();
      const inventoryId = parseInt(payload.inventoryId, 10);
      const receiverId = parseInt(payload.receiverId, 10);
      const senderId = socket.user.id;

      if (!message || message.length > 500) {
        socket.emit('chat:error', { message: 'El mensaje está vacío o excede los 500 caracteres' });
        return;
      }

      try {
        // 4. Guardar el mensaje en PostgreSQL de forma segura (evitando SQL Injection)
        const insertQuery = `
          INSERT INTO messages (inventory_id, sender_id, receiver_id, content) 
          VALUES ($1, $2, $3, $4) 
          RETURNING id, inventory_id, sender_id, receiver_id, content, is_read, created_at;
        `;
        
        const result = await pool.query(insertQuery, [
          inventoryId, 
          senderId, 
          receiverId, 
          message
        ]);

        const savedMessage = result.rows[0];

        // 5. Enviar el mensaje en tiempo real al destinatario usando su sala privada
        io.to(`user_${receiverId}`).emit('chat:receive', savedMessage);

        // 6. Confirmarle al remitente que se guardó/envió
        socket.emit('chat:sent_success', savedMessage);

      } catch (error) {
        logger.error('Error guardando el mensaje de chat en la BD:', error);
        socket.emit('chat:error', { message: 'Error interno al procesar el mensaje' });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Usuario desconectado: ${socket.user.name}`);
    });
  });
};

module.exports = registerSockets;