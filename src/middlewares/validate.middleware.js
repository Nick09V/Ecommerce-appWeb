const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.validationErrors = errors.array().map((err) => err.msg);
    return next();
  }
  next();
};

module.exports = validate;
