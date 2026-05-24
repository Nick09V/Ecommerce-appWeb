const registerSockets = (io) => {
  io.on('connection', (socket) => {
    socket.emit('welcome', { message: 'Conexión Socket.IO establecida' });

    socket.on('chat:message', (payload) => {
      io.emit('chat:message', payload);
    });
  });
};

module.exports = registerSockets;
