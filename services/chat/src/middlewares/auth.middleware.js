const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de acceso requerido' });
  }

  const token = authHeader.slice(7).trim();

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    const userId = Number(decoded.id ?? decoded.user_id ?? decoded.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: 'El token no contiene un usuario válido' });
    }
    req.user = { ...decoded, id: userId };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = { requireAuth };
