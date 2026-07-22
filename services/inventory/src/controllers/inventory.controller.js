const inventoryService = require('../services/inventory.service');

const getCatalog = async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search || '',
      sortBy: req.query.sortBy || 'date_desc',
      excludeSellerId: req.query.excludeMine === 'true' ? req.user?.id : undefined,
      sellerId: req.query.mine === 'true' ? req.user?.id : undefined,
    };

    const items = await inventoryService.getCatalog(filters);
    res.status(200).json({ items });
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await inventoryService.getProductById(id);
    res.status(200).json({ product: item });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { title, price, stock, description } = req.body;
    const sellerId = req.user.id;

    const newItem = await inventoryService.createProduct(
      { title, price, stock, description },
      sellerId
    );

    res.status(201).json({ product: newItem });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;
    const { title, price, stock, description } = req.body;

    const updatedItem = await inventoryService.updateProduct(
      id,
      sellerId,
      { title, price, stock, description }
    );

    res.status(200).json({ product: updatedItem });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    await inventoryService.deleteProduct(id, sellerId);
    res.status(200).json({ message: 'Producto eliminado exitosamente' });
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
    service: 'inventory-service',
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  getCatalog,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  health,
};