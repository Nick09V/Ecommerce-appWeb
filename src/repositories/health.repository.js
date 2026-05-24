const { pool } = require('../config/database');

const getDatabaseTime = async () => {
  const { rows } = await pool.query('SELECT NOW() AS now');
  return rows[0]?.now;
};

module.exports = {
  getDatabaseTime,
};
