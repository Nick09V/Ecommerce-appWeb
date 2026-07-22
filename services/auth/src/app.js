const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const errorHandler = require("./middlewares/errorHandler.middleware");
const { getMetrics, trackRequest } = require("./utils/metrics");
const { port, corsOrigin } = require("./config/env");
const { connectPostgres, pool } = require("./config/database");
const { connectRedis } = require("./config/redis");
const logger = require("./utils/logger");

const app = express();

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(morgan("dev"));
app.use(express.json());

// Metrics tracking
app.use(trackRequest);

// Metrics endpoint for Prometheus
app.get("/metrics", getMetrics);

// Routes
app.use("/auth", authRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "Auth Service" });
});

// Error handler
app.use(errorHandler);

const bootstrap = async () => {
  try {
    await connectPostgres();
    await pool.query(`
      ALTER TABLE auth_schema.users ALTER COLUMN password DROP NOT NULL;
      ALTER TABLE auth_schema.users ADD COLUMN IF NOT EXISTS role VARCHAR(30) NOT NULL DEFAULT 'user';
      ALTER TABLE auth_schema.users ADD COLUMN IF NOT EXISTS provider VARCHAR(30) NOT NULL DEFAULT 'local';
      ALTER TABLE auth_schema.users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);
      ALTER TABLE auth_schema.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      UPDATE auth_schema.users SET role = 'admin' WHERE email = 'admin@tienda.com';
    `);
    await connectRedis();

    app.listen(port, () => {
      logger.info(`Auth Service running on port ${port}`);
    });
  } catch (error) {
    logger.error("Auth Service bootstrap failed", error);
    process.exit(1);
  }
};

bootstrap();

module.exports = app;
