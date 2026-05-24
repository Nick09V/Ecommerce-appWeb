const { Pool } = require('pg');
const { postgres } = require('./env');

const pool = new Pool(postgres);

pool.on('error', (error) => {
  console.error('PostgreSQL pool error:', error);
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
