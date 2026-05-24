const session = require('express-session');
const { RedisStore } = require('connect-redis');
const { redisClient } = require('./redis');
const { session: sessionConfig, nodeEnv } = require('./env');

const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient }),
  secret: sessionConfig.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: nodeEnv === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

module.exports = sessionMiddleware;
