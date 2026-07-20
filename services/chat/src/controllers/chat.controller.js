const chatService = require('../services/chat.service');

const getInbox = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const inbox = await chatService.getInbox(userId);
    res.status(200).json({ conversations: inbox });
  } catch (error) {
    next(error);
  }
};

const getConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { inventoryId } = req.params;
    const partnerId = parseInt(req.query.user, 10);

    if (!partnerId) {
      return res.status(400).json({ message: 'El parámetro "user" es obligatorio para identificar al interlocutor' });
    }

    const messages = await chatService.getConversation(inventoryId, userId, partnerId);
    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const { receiverId, message } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: 'El ID del destinatario (receiverId) es obligatorio' });
    }

    const savedMessage = await chatService.sendMessage({ senderId, receiverId, message });
    res.status(201).json({ message: savedMessage });
  } catch (error) {
    next(error);
  }
};

const health = async (req, res) => {
  const { pool } = require('../config/database');
  const { redisClient } = require('../config/redis');
  
  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';

  try {
    const client = await pool.connect();
    client.release();
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'disconnected';
  }

  redisStatus = redisClient.isOpen ? 'connected' : 'disconnected';

  res.status(200).json({
    status: 'ok',
    service: 'chat-service',
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  getInbox,
  getConversation,
  sendMessage,
  health,
};