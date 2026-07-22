const express = require('express');
const axios = require('axios');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const INVENTORY_URL = process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3002';
const CHAT_URL = process.env.CHAT_SERVICE_URL || 'http://chat-service:3003';

// Helper para construir headers limpios y uniformes
const buildHeaders = (req) => {
  const headers = {};
  if (req.headers.authorization) {
    headers['authorization'] = req.headers.authorization;
  }
  if (req.user) {
    headers['x-user-id'] = req.user.id || req.user.user_id;
  }
  return headers;
};

// --- AUTHENTICATION ---
router.post('/auth/signup', async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_URL}/auth/signup`, req.body);
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Error en Auth' });
  }
});

router.post('/auth/signin', async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_URL}/auth/signin`, req.body);
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Error en Auth' });
  }
});

router.delete('/auth/account', authenticateToken, async (req, res) => {
  try {
    const response = await axios.delete(`${AUTH_URL}/auth/account`, {
      headers: buildHeaders(req)
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Error al eliminar cuenta' });
  }
});

// --- INVENTORY / CATALOGO ---
router.get('/inventory', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${INVENTORY_URL}/inventory`, {
      params: req.query,
      headers: buildHeaders(req) // <-- CORREGIDO: ahora usa el helper estandarizado
    });

    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Error en Inventario' });
  }
});

router.get('/inventory/:id', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${INVENTORY_URL}/inventory/${req.params.id}`, {
      headers: buildHeaders(req)
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Error en Inventario' });
  }
});

router.post('/inventory', authenticateToken, async (req, res) => {
  try {
    const response = await axios.post(`${INVENTORY_URL}/inventory`, req.body, {
      headers: buildHeaders(req)
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Error en Inventario' });
  }
});

router.put('/inventory/:id', authenticateToken, async (req, res) => {
  try {
    const response = await axios.put(`${INVENTORY_URL}/inventory/${req.params.id}`, req.body, {
      headers: buildHeaders(req)
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Error en Inventario' });
  }
});

router.delete('/inventory/:id', authenticateToken, async (req, res) => {
  try {
    const response = await axios.delete(`${INVENTORY_URL}/inventory/${req.params.id}`, {
      headers: buildHeaders(req)
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Error en Inventario' });
  }
});

// --- CHAT ---
router.get('/chat/inbox', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${CHAT_URL}/chat/inbox`, {
      headers: buildHeaders(req)
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error('Error cargando bandeja de chat:', err.response?.data || err.message);
    res.status(err.response?.status || 502).json(
      err.response?.data || { message: 'El servicio de chat no pudo cargar las conversaciones' }
    );
  }
});

router.get('/chat/conversation/:inventoryId', authenticateToken, async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { user } = req.query;

    const response = await axios.get(`${CHAT_URL}/chat/conversation/${inventoryId}`, {
      params: { user },
      headers: buildHeaders(req)
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Error al obtener conversación' });
  }
});

router.post('/chat/messages', authenticateToken, async (req, res) => {
  try {
    const response = await axios.post(`${CHAT_URL}/chat/messages`, req.body, {
      headers: buildHeaders(req)
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Error en Chat' });
  }
});

module.exports = router;