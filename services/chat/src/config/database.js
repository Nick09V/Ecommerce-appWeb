const { Pool } = require('pg');
const { databaseUrl } = require('./env');
const logger = require('../utils/logger');

const pool = new Pool({ connectionString: databaseUrl });

pool.on('connect', (client) => {
  client.query('SET search_path TO chat_schema, public');
});

pool.on('error', (error) => {
  logger.error('PostgreSQL pool error:', error);
});

const runMigrations = async (client) => {
  // Estas migraciones también se ejecutan cuando PostgreSQL ya tiene un volumen
  // creado, porque postgres/init.sql solo se ejecuta la primera vez.
  await client.query(`
    CREATE TABLE IF NOT EXISTS chat_schema.messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      inventory_id INTEGER,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query(`
    ALTER TABLE chat_schema.messages
      ADD COLUMN IF NOT EXISTS inventory_id INTEGER,
      ADD COLUMN IF NOT EXISTS message TEXT,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `);

  // Compatibilidad con una versión antigua que usaba "content".
  const { rows } = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'chat_schema'
      AND table_name = 'messages'
      AND column_name IN ('content', 'message')
  `);
  const columns = new Set(rows.map((row) => row.column_name));
  if (columns.has('content') && columns.has('message')) {
    await client.query(`
      UPDATE chat_schema.messages
      SET message = content
      WHERE message IS NULL AND content IS NOT NULL
    `);
  }

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_participants
      ON chat_schema.messages (sender_id, receiver_id, created_at DESC)
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_inventory
      ON chat_schema.messages (inventory_id, created_at DESC)
  `);
};

const connectPostgres = async () => {
  const client = await pool.connect();
  try {
    await runMigrations(client);
    logger.info('PostgreSQL connected and chat migrations applied');
    return pool;
  } catch (error) {
    logger.error('PostgreSQL migration failed', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  connectPostgres,
};
