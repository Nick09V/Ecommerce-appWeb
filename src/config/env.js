const dotenv = require('dotenv');

dotenv.config();

const requiredEnvs = ['POSTGRES_PASSWORD', 'REDIS_URL'];

requiredEnvs.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  postgres: {
    host: process.env.POSTGRES_HOST || 'postgres',
    port: Number(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB || 'ecommerce',
  },
  redis: {
    url: process.env.REDIS_URL,
  },
};
