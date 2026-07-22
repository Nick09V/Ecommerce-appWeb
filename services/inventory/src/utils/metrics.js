const client = require('prom-client');

// Collect default metrics (CPU, memory, etc.)
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de las peticiones HTTP en segundos',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de peticiones HTTP',
  labelNames: ['method', 'route', 'status'],
});

const getMetrics = async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  const metrics = await client.register.metrics();
  res.end(metrics);
};

const trackRequest = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    httpRequestDuration.observe({ method: req.method, route, status: res.statusCode }, duration);
    httpRequestsTotal.inc({ method: req.method, route, status: res.statusCode });
  });
  next();
};

module.exports = {
  getMetrics,
  trackRequest,
};