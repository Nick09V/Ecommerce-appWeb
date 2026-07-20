const express = require('express');
const inventoryController = require('../controllers/inventory.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createProductRules,
  updateProductRules,
} = require('../validators/inventory.validator');

const router = express.Router();

// Health check
router.get('/health', inventoryController.health);

// Catalog routes (public with optional auth)
router.get('/', requireAuth, inventoryController.getCatalog);
router.get('/:id', requireAuth, inventoryController.getProduct);

// Protected routes (require auth)
router.post('/', requireAuth, createProductRules, validate, inventoryController.createProduct);
router.put('/:id', requireAuth, updateProductRules, validate, inventoryController.updateProduct);
router.delete('/:id', requireAuth, inventoryController.deleteProduct);

module.exports = router;