const { Pool } = require('pg');
const { postgres } = require('./env');
const logger = require('../utils/logger');

const pool = new Pool(postgres);

pool.on('error', (error) => {
  logger.error('PostgreSQL pool error:', error);
});

const connectPostgres = async () => {
  const client = await pool.connect();
  client.release();
  return pool;
};

module.exports = {
  pool,
  connectPostgres,
};
