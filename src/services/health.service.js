const { redisClient } = require('../config/redis');
const healthRepository = require('../repositories/health.repository');

const getHealthStatus = async () => {
  const databaseTime = await healthRepository.getDatabaseTime();
  const redisStatus = redisClient.isOpen ? 'connected' : 'disconnected';

  return {
    status: 'ok',
    databaseTime,
    redisStatus,
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  getHealthStatus,
};
