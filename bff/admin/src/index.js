const express = require('express');
const cors = require('cors');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint de Health
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'BFF Admin' });
});

app.use('/api', adminRoutes);

app.listen(PORT, () => {
  console.log(`🚀 BFF Admin escuchando en el puerto ${PORT}`);
});

const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});