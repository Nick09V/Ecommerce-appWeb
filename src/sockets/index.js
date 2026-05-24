const registerSockets = (io) => {
  io.on('connection', (socket) => {
    socket.emit('welcome', { message: 'Conexión Socket.IO establecida' });

    socket.on('chat:message', (payload) => {
      if (typeof payload !== 'object' || payload === null) {
        socket.emit('chat:error', { message: 'Formato de mensaje inválido' });
        return;
      }

      const message = typeof payload.message === 'string' ? payload.message.trim() : '';
      const author = typeof payload.author === 'string' ? payload.author.trim() : 'Anónimo';

      if (!message || message.length > 500 || author.length > 100) {
        socket.emit('chat:error', { message: 'Mensaje inválido o demasiado largo' });
        return;
      }

      io.emit('chat:message', {
        message,
        author,
        sentAt: new Date().toISOString(),
      });
    });
  });
};

module.exports = registerSockets;
