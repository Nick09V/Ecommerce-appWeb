const formatArgs = (level, args) => [new Date().toISOString(), `[${level}]`, ...args];

const logger = {
  info: (...args) => console.log(...formatArgs('INFO', args)),
  error: (...args) => console.error(...formatArgs('ERROR', args)),
};

module.exports = logger;
