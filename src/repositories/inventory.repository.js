// src/repositories/inventory.repository.js
const { pool } = require('../config/database');


// src/repositories/inventory.repository.js

// RF06: Obtener catálogo activo con filtros dinámicos (Soporta catálogo general y "Mis publicaciones")
const findAll = async (filters = {}) => {
  let query = `
    SELECT id, part_number, chassis_model, title, description, price, status, image_url, user_id, created_at 
    FROM inventory 
    WHERE status = 'active'
  `;
  const values = [];
  let paramCount = 1;

  // 1. Buscador por palabras clave (Funciona en ambas vistas)
  if (filters.search) {
    query += ` AND (
      part_number ILIKE $${paramCount} OR 
      chassis_model ILIKE $${paramCount} OR 
      title ILIKE $${paramCount} OR 
      description ILIKE $${paramCount}
    )`;
    values.push(`%${filters.search}%`);
    paramCount++;
  }

  // 2. FILTRO A: Excluir al usuario actual (Para el catálogo general P2P)
  if (filters.excludeUserId) {
    query += ` AND user_id != $${paramCount}`;
    values.push(filters.excludeUserId);
    paramCount++;
  }

  // 3. FILTRO B: Incluir SOLO al usuario actual (Para "Mis Publicaciones")
  if (filters.userId) {
    query += ` AND user_id = $${paramCount}`;
    values.push(filters.userId);
    paramCount++;
  }

  // 4. Ordenamiento
  if (filters.sortBy === 'price_asc') {
    query += ' ORDER BY price ASC';
  } else if (filters.sortBy === 'price_desc') {
    query += ' ORDER BY price DESC';
  } else {
    query += ' ORDER BY created_at DESC'; // Por defecto: más nuevos primero
  }

  const { rows } = await pool.query(query, values);
  return rows;
};
// Obtener una publicación específica por ID
const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT id, part_number, chassis_model, title, description, price, status, image_url, user_id, created_at 
     FROM inventory 
     WHERE id = $1 AND status != 'deleted'`,
    [id]
  );
  return rows[0] || null;
};

// Crear una publicación real en PostgreSQL
const create = async ({ partNumber, chassisModel, title, description, price, imageUrl, userId }) => {
  const { rows } = await pool.query(
    `INSERT INTO inventory (part_number, chassis_model, title, description, price, image_url, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, part_number, chassis_model, title, description, price, status, image_url, user_id, created_at`,
    [partNumber, chassisModel, title, description, price, imageUrl, userId]
  );
  return rows[0];
};

// RF07: Modificar publicación existente (BLINDADO: Solo el dueño puede actualizar)
const update = async (id, userId, updateData) => {
  const { rows } = await pool.query(
    `UPDATE inventory 
     SET title = COALESCE($1, title),
         price = COALESCE($2, price),
         description = COALESCE($3, description),
         chassis_model = COALESCE($4, chassis_model),
         updated_at = NOW()
     WHERE id = $5 AND user_id = $6 AND status != 'deleted'
     RETURNING *`,
    [updateData.title, updateData.price, updateData.description, updateData.chassis_model, id, userId]
  );
  return rows[0] || null; // Si no es el dueño (o no existe), retorna null
};

// RF08: Retiro de publicación (BLINDADO: Solo el dueño puede eliminar)
const remove = async (id, userId) => {
  const { rowCount } = await pool.query(
    `UPDATE inventory 
     SET status = 'deleted', updated_at = NOW() 
     WHERE id = $1 AND user_id = $2 AND status != 'deleted'`,
    [id, userId]
  );
  return rowCount > 0; // Retorna true si era el dueño y se eliminó, false caso contrario
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove
};