const chatRepository = require('../repositories/chat.repository');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');

const getInbox = async (userId) => {
  return await chatRepository.getInbox(userId);
};

const getConversation = async (inventoryId, userId, partnerId) => {
  return await chatRepository.getConversation(inventoryId, userId, partnerId);
};

const sendMessage = async ({ senderId, receiverId, inventoryId, message }) => {
  if (!message || !message.trim()) {
    const error = new Error('El mensaje no puede estar vacío');
    error.status = 400;
    throw error;
  }

  if (message.length > 500) {
    const error = new Error('El mensaje excede los 500 caracteres');
    error.status = 400;
    throw error;
  }

  const savedMessage = await chatRepository.createMessage({
    senderId,
    receiverId,
    inventoryId: inventoryId || null,
    message: message.trim(),
  });

  // Publicar evento NewMessage en Redis Pub/Sub (para Pablo - WebSockets en tiempo real)
  try {
    const eventPayload = JSON.stringify({
      event: 'NewMessage',
      chat_id: savedMessage.id,
      sender_id: senderId,
      receiver_id: receiverId,
      inventory_id: savedMessage.inventory_id,
      message: savedMessage.message,
      text: savedMessage.message,
      created_at: savedMessage.created_at,
      timestamp: savedMessage.created_at,
    });
    await redisClient.publish('chat.events', eventPayload);
    logger.info(`Evento NewMessage publicado para chat_id: ${savedMessage.id}`);
  } catch (pubError) {
    logger.error('Error publicando evento NewMessage:', pubError);
  }

  return savedMessage;
};

module.exports = {
  getInbox,
  getConversation,
  sendMessage,
};