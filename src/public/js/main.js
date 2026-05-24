const socket = io();
const statusEl = document.getElementById('status');

socket.on('connect', () => {
  statusEl.textContent = `Socket conectado: ${socket.id}`;
});

socket.on('welcome', (payload) => {
  console.log(payload.message);
});
