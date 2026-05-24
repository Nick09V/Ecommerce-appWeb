const { createClient } = require('redis');
const { redis } = require('./env');

const redisClient = createClient({ url: redis.url });

redisClient.on('error', (error) => {
  console.error('Redis client error:', error);
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
