const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const inventoryRoutes = require('./routes/inventory.routes');
const errorHandler = require('./middlewares/errorHandler.middleware');
const { getMetrics, trackRequest } = require('./utils/metrics');
const { port, corsOrigin } = require('./config/env');
const { connectPostgres } = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');

const app = express();

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(morgan('dev'));
app.use(express.json());

// Metrics tracking
app.use(trackRequest);

// Metrics endpoint for Prometheus
app.get('/metrics', getMetrics);

// Routes
app.use('/inventory', inventoryRoutes);

// Error handler
app.use(errorHandler);

const bootstrap = async () => {
  try {
    await connectPostgres();
    await connectRedis();

    app.listen(port, () => {
      logger.info(`Inventory Service running on port ${port}`);
    });
  } catch (error) {
    logger.error('Inventory Service bootstrap failed', error);
    process.exit(1);
  }
};

bootstrap();

module.exports = app;