const { Pool } = require('pg');
const { databaseUrl } = require('./env');
const logger = require('../utils/logger');

const pool = new Pool({ connectionString: databaseUrl });

pool.on('connect', (client) => {
  client.query('SET search_path TO inventory_schema, public');
});

pool.on('error', (error) => {
  logger.error('PostgreSQL pool error:', error);
});

const connectPostgres = async () => {
  try {
    const client = await pool.connect();
    await client.query('ALTER TABLE inventory_schema.products ADD COLUMN IF NOT EXISTS image_url TEXT');
    client.release();
    logger.info('PostgreSQL connected (inventory_schema)');
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