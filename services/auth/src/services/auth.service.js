const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepository = require('../repositories/auth.repository');
const { redisClient } = require('../config/redis');
const { jwt: jwtConfig } = require('../config/env');
const logger = require('../utils/logger');

const SALT_ROUNDS = 12;

const register = async ({ name, email, password }) => {
  const existing = await authRepository.findByEmail(email);
  if (existing) {
    const error = new Error('El correo electrónico ya está registrado');
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await authRepository.createUser({ name, email, password: passwordHash });

  // Publicar evento UserRegistered en Redis Pub/Sub (para Pablo)
  try {
    const eventPayload = JSON.stringify({
      event: 'UserRegistered',
      user_id: user.id,
      email: user.email,
      name: user.name,
      timestamp: new Date().toISOString(),
    });
    await redisClient.publish('auth.events', eventPayload);
    logger.info(`Evento UserRegistered publicado para user_id: ${user.id}`);
  } catch (pubError) {
    logger.error('Error publicando evento UserRegistered:', pubError);
    // No bloqueamos el registro si falla la publicación del evento
  }

  const token = jwt.sign({ id: user.id, email: user.email }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });

  return { user, token };
};

const login = async (email, password) => {
  const user = await authRepository.findByEmail(email);
  if (!user) {
    const error = new Error('Correo electrónico o contraseña incorrectos');
    error.status = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Correo electrónico o contraseña incorrectos');
    error.status = 401;
    throw error;
  }

  const token = jwt.sign({ id: user.id, email: user.email }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });

  const { password: _, ...safeUser } = user;
  return { user: safeUser, token };
};

const getProfile = async (userId) => {
  const user = await authRepository.findById(userId);
  if (!user) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }
  return user;
};

const resetPassword = async (email, newPassword) => {
  const user = await authRepository.findByEmail(email);
  if (!user) {
    const error = new Error('No se encontró una cuenta con ese correo electrónico');
    error.status = 404;
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await authRepository.updatePassword(email, passwordHash);
  return true;
};

const deleteAccount = async (userId) => {
  const user = await authRepository.findById(userId);
  if (!user) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }

  await authRepository.deleteUser(userId);

  // Publicar evento UserDeleted en Redis Pub/Sub
  try {
    const eventPayload = JSON.stringify({
      event: 'UserDeleted',
      user_id: userId,
      email: user.email,
      timestamp: new Date().toISOString(),
    });
    await redisClient.publish('auth.events', eventPayload);
    logger.info(`Evento UserDeleted publicado para user_id: ${userId}`);
  } catch (pubError) {
    logger.error('Error publicando evento UserDeleted:', pubError);
  }

  return true;
};

module.exports = {
  register,
  login,
  getProfile,
  resetPassword,
  deleteAccount,
};
