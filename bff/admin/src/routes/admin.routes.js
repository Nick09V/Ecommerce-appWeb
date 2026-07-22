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

// CRUD completo de inventario desde el Admin
router.get('/inventory', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${INVENTORY_URL}/inventory`, { params: req.query, headers: buildHeaders(req) });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Error al listar inventario' });
  }
});

router.post('/inventory', authenticateToken, async (req, res) => {
  try {
    const response = await axios.post(`${INVENTORY_URL}/inventory`, req.body, { headers: buildHeaders(req) });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || { error: 'Error al crear producto' });
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


// --- OBSERVABILIDAD: salud, métricas y logs centralizados ---
const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://prometheus:9090';
const LOKI_URL = process.env.LOKI_URL || 'http://loki:3100';
const monitoredServices = [
  { key: 'auth-service', url: `${AUTH_URL}/health` },
  { key: 'inventory-service', url: `${INVENTORY_URL}/health` },
  { key: 'chat-service', url: `${process.env.CHAT_SERVICE_URL || 'http://chat-service:3003'}/health` },
  { key: 'bff-web', url: 'http://bff-web:3000/health' },
  { key: 'bff-admin', url: 'http://bff-admin:3000/health' },
];

// Monitoreo público: no requiere JWT ni rol admin.
router.get('/observability/report', async (req, res) => {
  const health = await Promise.all(monitoredServices.map(async (service) => {
    const started = Date.now();
    try {
      const response = await axios.get(service.url, { timeout: 3000 });
      return { service: service.key, status: 'UP', latencyMs: Date.now() - started, details: response.data };
    } catch (error) {
      return { service: service.key, status: 'DOWN', latencyMs: Date.now() - started, error: error.message };
    }
  }));
  const query = async (promql) => {
    try {
      const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query`, { params: { query: promql }, timeout: 4000 });
      return response.data?.data?.result || [];
    } catch { return []; }
  };
  const [up, requestRate, memory] = await Promise.all([
    query('up'),
    query('sum by (job) (rate(http_requests_total[5m]))'),
    query('sum by (job) (process_resident_memory_bytes)'),
  ]);
  res.json({ generatedAt: new Date().toISOString(), health, metrics: { up, requestRate, memory }, links: { prometheus: process.env.PROMETHEUS_PUBLIC_URL || 'http://localhost:9090', grafana: process.env.GRAFANA_PUBLIC_URL || 'http://localhost:3004' } });
});

router.get('/observability/logs', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 300);
  const service = String(req.query.service || '').replace(/[^a-zA-Z0-9_-]/g, '');
  const query = service ? `{container=~".*${service}.*"}` : '{container=~".+"}';
  try {
    const response = await axios.get(`${LOKI_URL}/loki/api/v1/query_range`, {
      params: { query, limit, direction: 'backward', start: String((Date.now() - 3600000) * 1000000), end: String(Date.now() * 1000000) },
      timeout: 5000,
    });
    const logs = (response.data?.data?.result || []).flatMap(stream =>
      (stream.values || []).map(([timestamp, line]) => ({ timestamp, line, labels: stream.stream }))
    ).sort((a,b) => Number(BigInt(b.timestamp) - BigInt(a.timestamp))).slice(0, limit);
    res.json({ logs });
  } catch (error) {
    res.status(502).json({ error: 'Loki no está disponible', details: error.message, logs: [] });
  }
});

module.exports = router;