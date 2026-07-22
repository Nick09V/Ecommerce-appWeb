const authService = require('../services/auth.service');
const logger = require('../utils/logger');

const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    await authService.resetPassword(email, newPassword);
    res.status(200).json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    await authService.deleteAccount(req.user.id);
    res.status(200).json({ message: 'Cuenta eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
};

const health = async (req, res) => {
  const { pool } = require('../config/database');
  const { redisClient } = require('../config/redis');
  
  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';

  try {
    const client = await pool.connect();
    client.release();
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'disconnected';
  }

  redisStatus = redisClient.isOpen ? 'connected' : 'disconnected';

  res.status(200).json({
    status: 'ok',
    service: 'auth-service',
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  signup,
  signin,
  getProfile,
  resetPassword,
  deleteAccount,
  health,
};
