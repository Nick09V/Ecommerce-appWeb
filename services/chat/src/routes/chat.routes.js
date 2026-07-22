const express = require('express');
const chatController = require('../controllers/chat.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Health check
router.get('/health', chatController.health);

// Chat endpoints
router.get('/inbox', requireAuth, chatController.getInbox);
router.get('/conversation/:inventoryId', requireAuth, chatController.getConversation);
router.post('/messages', requireAuth, chatController.sendMessage);

module.exports = router;