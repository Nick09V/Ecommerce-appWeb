const express = require('express');
const http = require('http'); // 1. Importar el módulo HTTP nativo
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const chatRoutes = require('./routes/chat.routes');
const errorHandler = require('./middlewares/errorHandler.middleware');
const { getMetrics, trackRequest } = require('./utils/metrics');
const { port, corsOrigin } = require('./config/env');
const { connectPostgres } = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');
const initSockets = require('./sockets'); // 2. Importar el archivo de WebSockets que acabas de crear

const app = express();
const server = http.createServer(app); // 3. Envolver Express con el servidor HTTP

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(morgan('dev'));
app.use(express.json());

// Metrics tracking
app.use(trackRequest);

// Metrics endpoint for Prometheus
app.get('/metrics', getMetrics);

// Routes
app.use('/chat', chatRoutes);

// Error handler
app.use(errorHandler);

const bootstrap = async () => {
  try {
    await connectPostgres();
    await connectRedis();

    // 4. Inicializar los WebSockets pasándole el servidor HTTP
    initSockets(server);

    // 5. Cambiar app.listen por server.listen
    server.listen(port, () => {
      logger.info(`Chat Service (REST + WebSockets) running on port ${port}`);
    });
  } catch (error) {
    logger.error('Chat Service bootstrap failed', error);
    process.exit(1);
  }
};

bootstrap();

// Exportar el server por si utilizas herramientas de testing (Supertest, Jest, etc.)
module.exports = server;