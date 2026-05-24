const bcrypt = require('bcryptjs');
const authRepository = require('../repositories/auth.repository');

const SALT_ROUNDS = 12;

const register = async ({ firstName, lastName, email, password }) => {
  const existing = await authRepository.findByEmail(email);
  if (existing) {
    const error = new Error('El correo electrónico ya está registrado');
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await authRepository.createUser({
    firstName,
    lastName,
    email,
    passwordHash,
  });

  return user;
};

const login = async (email, password) => {
  const user = await authRepository.findByEmail(email);
  if (!user) {
    const error = new Error('Correo electrónico o contraseña incorrectos');
    error.status = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Correo electrónico o contraseña incorrectos');
    error.status = 401;
    throw error;
  }

  const { password_hash, ...safeUser } = user;
  return safeUser;
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

module.exports = {
  register,
  login,
  resetPassword,
};
