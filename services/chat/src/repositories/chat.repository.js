const { pool } = require('../config/database');

const getInbox = async (userId) => {
  const query = `
    SELECT * FROM (
      SELECT DISTINCT ON (
        LEAST(m.sender_id, m.receiver_id), 
        GREATEST(m.sender_id, m.receiver_id)
      )
        m.id,
        m.sender_id,
        m.receiver_id,
        m.inventory_id,
        m.message,
        m.created_at
      FROM chat_schema.messages m
      WHERE m.sender_id = $1 OR m.receiver_id = $1
      ORDER BY 
        LEAST(m.sender_id, m.receiver_id), 
        GREATEST(m.sender_id, m.receiver_id),
        m.created_at DESC
    ) AS subquery
    ORDER BY created_at DESC;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
};

const getConversation = async (inventoryId, userId, partnerId) => {
  let query;
  const values = [];

  if (inventoryId) {
    query = `
      SELECT id, sender_id, receiver_id, inventory_id, message, created_at 
      FROM chat_schema.messages 
      WHERE inventory_id = $1
        AND ((sender_id = $2 AND receiver_id = $3) 
           OR (sender_id = $3 AND receiver_id = $2))
      ORDER BY created_at ASC
    `;
    values.push(inventoryId, userId, partnerId);
  } else {
    query = `
      SELECT id, sender_id, receiver_id, inventory_id, message, created_at 
      FROM chat_schema.messages 
      WHERE (sender_id = $1 AND receiver_id = $2) 
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `;
    values.push(userId, partnerId);
  }

  const { rows } = await pool.query(query, values);
  return rows;
};

const createMessage = async ({ senderId, receiverId, inventoryId, message }) => {
  if (inventoryId) {
    const { rows } = await pool.query(
      `INSERT INTO chat_schema.messages (sender_id, receiver_id, inventory_id, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, sender_id, receiver_id, inventory_id, message, created_at`,
      [senderId, receiverId, inventoryId, message]
    );
    return rows[0];
  }

  const { rows } = await pool.query(
    `INSERT INTO chat_schema.messages (sender_id, receiver_id, message)
     VALUES ($1, $2, $3)
     RETURNING id, sender_id, receiver_id, inventory_id, message, created_at`,
    [senderId, receiverId, message]
  );
  return rows[0];
};

module.exports = {
  getInbox,
  getConversation,
  createMessage,
};