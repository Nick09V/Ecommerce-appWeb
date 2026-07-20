const { pool } = require('../config/database');

const findAll = async (filters = {}) => {
  let query = `
    SELECT id, seller_id, title, price, stock, description, created_at 
    FROM inventory_schema.products 
    WHERE 1=1
  `;
  const values = [];
  let paramCount = 1;

  if (filters.search) {
    query += ` AND (
      title ILIKE $${paramCount} OR 
      description ILIKE $${paramCount}
    )`;
    values.push(`%${filters.search}%`);
    paramCount++;
  }

  if (filters.sellerId) {
    query += ` AND seller_id = $${paramCount}`;
    values.push(filters.sellerId);
    paramCount++;
  }

  if (filters.excludeSellerId) {
    query += ` AND seller_id != $${paramCount}`;
    values.push(filters.excludeSellerId);
    paramCount++;
  }

  if (filters.sortBy === 'price_asc') {
    query += ' ORDER BY price ASC';
  } else if (filters.sortBy === 'price_desc') {
    query += ' ORDER BY price DESC';
  } else {
    query += ' ORDER BY created_at DESC';
  }

  const { rows } = await pool.query(query, values);
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    'SELECT id, seller_id, title, price, stock, description, created_at FROM inventory_schema.products WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

const create = async ({ title, price, stock, description, sellerId }) => {
  const { rows } = await pool.query(
    `INSERT INTO inventory_schema.products (seller_id, title, price, stock, description)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, seller_id, title, price, stock, description, created_at`,
    [sellerId, title, price, stock, description || null]
  );
  return rows[0];
};

const update = async (id, sellerId, updateData) => {
  const { rows } = await pool.query(
    `UPDATE inventory_schema.products 
     SET title = COALESCE($1, title),
         price = COALESCE($2, price),
         stock = COALESCE($3, stock),
         description = COALESCE($4, description)
     WHERE id = $5 AND seller_id = $6
     RETURNING id, seller_id, title, price, stock, description, created_at`,
    [updateData.title, updateData.price, updateData.stock, updateData.description, id, sellerId]
  );
  return rows[0] || null;
};

const remove = async (id, sellerId) => {
  const { rowCount } = await pool.query(
    'DELETE FROM inventory_schema.products WHERE id = $1 AND seller_id = $2',
    [id, sellerId]
  );
  return rowCount > 0;
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};