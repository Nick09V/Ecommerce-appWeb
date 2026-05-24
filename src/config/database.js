const { Pool } = require('pg');
const { postgres } = require('./env');
const logger = require('../utils/logger');

const pool = new Pool(postgres);

pool.on('error', (error) => {
  logger.error('PostgreSQL pool error:', error);
});

const connectPostgres = async () => {
  try {
    const client = await pool.connect();
    client.release();
    logger.info('PostgreSQL connected');
    return pool;
  } catch (error) {
    logger.error('PostgreSQL connection failed', error);
    throw error;
  }
};

module.exports = {
  pool,
  connectPostgres,
};
