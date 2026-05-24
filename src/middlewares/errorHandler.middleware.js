const errorHandler = (error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'test') {
    console.error(error);
  }

  res.status(status).json({ message });
};

module.exports = errorHandler;
