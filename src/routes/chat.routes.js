const express = require('express');
const router = express.Router();
const { renderChatPage, getInbox } = require('../controllers/chat.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

// 1. Ruta raíz del chat: Muestra la Bandeja de Entrada
router.get('/', requireAuth, getInbox);

// 2. Ruta con ID: Muestra el chat P2P de un producto específico
router.get('/:id', requireAuth, renderChatPage);

module.exports = router;