const inventoryRepository = require('../repositories/inventory.repository');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');

const getCatalog = async (filters = {}) => {
  return await inventoryRepository.findAll(filters);
};

const getProductById = async (id) => {
  const item = await inventoryRepository.findById(id);
  if (!item) {
    const error = new Error('Producto no encontrado');
    error.status = 404;
    throw error;
  }
  return item;
};

const createProduct = async (data, sellerId) => {
  if (!data.title || !data.price || data.stock === undefined) {
    const error = new Error('Faltan campos obligatorios: title, price, stock');
    error.status = 400;
    throw error;
  }

  const newItem = await inventoryRepository.create({
    ...data,
    sellerId,
  });

  // Publicar evento ProductCreated en Redis Pub/Sub (para Pablo)
  try {
    const eventPayload = JSON.stringify({
      event: 'ProductCreated',
      product_id: newItem.id,
      seller_id: sellerId,
      title: newItem.title,
      timestamp: new Date().toISOString(),
    });
    await redisClient.publish('inventory.events', eventPayload);
    logger.info(`Evento ProductCreated publicado para product_id: ${newItem.id}`);
  } catch (pubError) {
    logger.error('Error publicando evento ProductCreated:', pubError);
  }

  return newItem;
};

const updateProduct = async (id, sellerId, updateData) => {
  const existingItem = await inventoryRepository.findById(id);
  if (!existingItem) {
    const error = new Error('Producto no encontrado');
    error.status = 404;
    throw error;
  }

  if (existingItem.seller_id !== sellerId) {
    const error = new Error('Acceso denegado: No tienes permisos para modificar este producto');
    error.status = 403;
    throw error;
  }

  const updatedItem = await inventoryRepository.update(id, sellerId, updateData);

  // Detectar si el stock llegó a 0 y publicar evento StockDepleted
  if (updatedItem && updatedItem.stock === 0) {
    try {
      const eventPayload = JSON.stringify({
        event: 'StockDepleted',
        product_id: updatedItem.id,
        title: updatedItem.title,
        seller_id: sellerId,
        timestamp: new Date().toISOString(),
      });
      await redisClient.publish('inventory.events', eventPayload);
      logger.info(`Evento StockDepleted publicado para product_id: ${updatedItem.id}`);
    } catch (pubError) {
      logger.error('Error publicando evento StockDepleted:', pubError);
    }
  }

  return updatedItem;
};

const deleteProduct = async (id, sellerId) => {
  const existingItem = await inventoryRepository.findById(id);
  if (!existingItem) {
    const error = new Error('Producto no encontrado');
    error.status = 404;
    throw error;
  }

  if (existingItem.seller_id !== sellerId) {
    const error = new Error('Acceso denegado: No tienes permisos para eliminar este producto');
    error.status = 403;
    throw error;
  }

  const success = await inventoryRepository.remove(id, sellerId);
  return success;
};

module.exports = {
  getCatalog,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};