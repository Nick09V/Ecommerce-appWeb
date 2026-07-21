const express = require('express');
const axios = require('axios');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const INVENTORY_URL = process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3002';

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

// Login del Administrador
router.post('/auth/signin', async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_URL}/auth/signin`, req.body);
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Error de autenticación Admin' });
  }
});

// Vista agregada para Dashboard: Obtiene inventario y filtra estado general
router.get('/dashboard/summary', authenticateToken, async (req, res) => {
  try {
    // CORREGIDO: Se pasan los headers autenticados
    const productsRes = await axios.get(`${INVENTORY_URL}/inventory`, {
      headers: buildHeaders(req)
    });

    // CORREGIDO: Soporta tanto si devuelve un array directo como si viene con wrapper { items: [...] }
    const rawData = productsRes.data;
    const products = Array.isArray(rawData) 
      ? rawData 
      : (Array.isArray(rawData?.items) ? rawData.items : []);

    // Lógica propia del BFF: procesar datos para la interfaz de Admin
    const totalProducts = products.length;
    const outOfStock = products.filter(p => Number(p.stock) === 0);

    res.status(200).json({
      summary: {
        totalProducts,
        outOfStockCount: outOfStock.length
      },
      outOfStockProducts: outOfStock
    });
  } catch (err) {
    res.status(err.response?.status || 500).json(
      err.response?.data || { error: 'Error al compilar métricas para el Admin' }
    );
  }
});

// Gestión directa de inventario desde el Admin
router.put('/inventory/:id', authenticateToken, async (req, res) => {
  try {
    const response = await axios.put(`${INVENTORY_URL}/inventory/${req.params.id}`, req.body, {
      headers: buildHeaders(req)
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Error al actualizar inventario' });
  }
});

router.delete('/inventory/:id', authenticateToken, async (req, res) => {
  try {
    const response = await axios.delete(`${INVENTORY_URL}/inventory/${req.params.id}`, {
      headers: buildHeaders(req)
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Error al eliminar producto' });
  }
});

// --- AUTH ADMIN: Dar de baja cuenta ---
router.delete('/auth/account', authenticateToken, async (req, res) => {
  try {
    const response = await axios.delete(`${AUTH_URL}/auth/account`, {
      headers: buildHeaders(req)
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Error en Auth' });
  }
});

module.exports = router;