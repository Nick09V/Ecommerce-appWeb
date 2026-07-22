const { pool } = require('../config/database');

const findByEmail = async (email) => {
  const { rows } = await pool.query(
    'SELECT id, email, password, name, role, provider, provider_id, avatar_url, created_at FROM auth_schema.users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    'SELECT id, email, name, role, provider, avatar_url, created_at FROM auth_schema.users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

const createUser = async ({ name, email, password }) => {
  const { rows } = await pool.query(
    `INSERT INTO auth_schema.users (name, email, password)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, role, provider, avatar_url, created_at`,
    [name, email, password]
  );
  return rows[0];
};

const updatePassword = async (email, passwordHash) => {
  const { rowCount } = await pool.query(
    'UPDATE auth_schema.users SET password = $1 WHERE email = $2',
    [passwordHash, email]
  );
  return rowCount > 0;
};

const deleteUser = async (id) => {
  const { rowCount } = await pool.query(
    'DELETE FROM auth_schema.users WHERE id = $1',
    [id]
  );
  return rowCount > 0;
};

const upsertOAuthUser = async ({ name, email, provider, providerId, avatarUrl }) => {
  const { rows } = await pool.query(
    `INSERT INTO auth_schema.users (name, email, password, provider, provider_id, avatar_url)
     VALUES ($1, $2, NULL, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name,
       provider = EXCLUDED.provider,
       provider_id = EXCLUDED.provider_id,
       avatar_url = EXCLUDED.avatar_url
     RETURNING id, email, name, role, provider, avatar_url, created_at`,
    [name, email, provider, providerId, avatarUrl]
  );
  return rows[0];
};

module.exports = {
  findByEmail,
  findById,
  createUser,
  updatePassword,
  deleteUser,
  upsertOAuthUser,
};
