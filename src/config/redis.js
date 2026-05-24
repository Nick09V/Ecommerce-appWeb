const { createClient } = require('redis');
const { redis } = require('./env');
const logger = require('../utils/logger');

const redisClient = createClient({ url: redis.url });

redisClient.on('error', (error) => {
  logger.error('Redis client error:', error);
});

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
};

module.exports = {
  redisClient,
  connectRedis,
};
