const { createClient } = require('redis');
const { redisUrl } = require('./env');
const logger = require('../utils/logger');

const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (error) => {
  logger.error('Redis client error:', error);
});

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    logger.info('Redis connected (auth-service)');
  }
  return redisClient;
};

module.exports = {
  redisClient,
  connectRedis,
};