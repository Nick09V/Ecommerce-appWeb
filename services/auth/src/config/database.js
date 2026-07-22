const { Pool } = require('pg');
const { databaseUrl } = require('./env');
const logger = require('../utils/logger');

const pool = new Pool({ connectionString: databaseUrl });

pool.on('connect', (client) => {
  client.query('SET search_path TO auth_schema, public');
});

pool.on('error', (error) => {
  logger.error('PostgreSQL pool error:', error);
});

const connectPostgres = async () => {
  try {
    const client = await pool.connect();
    client.release();
    logger.info('PostgreSQL connected (auth_schema)');
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