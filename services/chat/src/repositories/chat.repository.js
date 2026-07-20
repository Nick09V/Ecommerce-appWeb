const { pool } = require('../config/database');

const getInbox = async (userId) => {
  const query = `
    SELECT DISTINCT ON (m.sender_id, m.receiver_id)
      m.id,
      m.sender_id,
      m.receiver_id,
      m.message,
      m.created_at
    FROM chat_schema.messages m
    WHERE m.sender_id = $1 OR m.receiver_id = $1
    ORDER BY 
      CASE 
        WHEN m.sender_id = $1 THEN m.receiver_id 
        ELSE m.sender_id 
      END,
      m.created_at DESC
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
};

const getConversation = async (inventoryId, userId, partnerId) => {
  const query = `
    SELECT id, sender_id, receiver_id, message, created_at 
    FROM chat_schema.messages 
    WHERE (sender_id = $1 AND receiver_id = $2) 
       OR (sender_id = $2 AND receiver_id = $1)
    ORDER BY created_at ASC
  `;
  const { rows } = await pool.query(query, [userId, partnerId]);
  return rows;
};

const createMessage = async ({ senderId, receiverId, message }) => {
  const { rows } = await pool.query(
    `INSERT INTO chat_schema.messages (sender_id, receiver_id, message)
     VALUES ($1, $2, $3)
     RETURNING id, sender_id, receiver_id, message, created_at`,
    [senderId, receiverId, message]
  );
  return rows[0];
};

module.exports = {
  getInbox,
  getConversation,
  createMessage,
};