const formatLogEntry = (level, args) => [new Date().toISOString(), `[${level}]`, ...args];

const logger = {
  info: (...args) => console.log(...formatLogEntry('INFO', args)),
  error: (...args) => console.error(...formatLogEntry('ERROR', args)),
};

module.exports = logger;
