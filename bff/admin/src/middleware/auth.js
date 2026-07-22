const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Acceso denegado: Token no proporcionado' });
  }

  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/auth/me`, {
      headers: { Authorization: authHeader }
    });

    req.user = response.data.user;
    next();
  } catch (error) {
    const status = error.response?.status || 401;
    return res.status(status).json({ error: 'Sesión inválida o token expirado' });
  }
};

module.exports = authenticateToken;