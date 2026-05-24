const { pool } = require('../config/database');

const findByEmail = async (email) => {
  const { rows } = await pool.query(
    'SELECT id, first_name, last_name, email, password_hash, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
};

const createUser = async ({ firstName, lastName, email, passwordHash }) => {
  const { rows } = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, first_name, last_name, email, created_at`,
    [firstName, lastName, email, passwordHash]
  );
  return rows[0];
};

const updatePassword = async (email, passwordHash) => {
  const { rowCount } = await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
    [passwordHash, email]
  );
  return rowCount > 0;
};

module.exports = {
  findByEmail,
  createUser,
  updatePassword,
};
