const { body } = require('express-validator');

const createProductRules = [
  body('title')
    .notEmpty().withMessage('El título es obligatorio')
    .isLength({ max: 255 }).withMessage('El título no puede exceder 255 caracteres')
    .trim(),
  body('price')
    .notEmpty().withMessage('El precio es obligatorio')
    .isNumeric().withMessage('El precio debe ser un número válido')
    .isFloat({ min: 0.1 }).withMessage('El precio debe ser mayor a 0'),
  body('stock')
    .notEmpty().withMessage('El stock es obligatorio')
    .isInt({ min: 0 }).withMessage('El stock debe ser un número entero mayor o igual a 0'),
  body('description')
    .optional()
    .trim(),
];

const updateProductRules = [
  body('title')
    .optional()
    .notEmpty().withMessage('El título no puede quedar vacío')
    .isLength({ max: 255 }).withMessage('El título no puede exceder 255 caracteres')
    .trim(),
  body('price')
    .optional()
    .isNumeric().withMessage('El precio debe ser un número válido')
    .isFloat({ min: 0.1 }).withMessage('El precio debe ser mayor a 0'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('El stock debe ser un número entero mayor o igual a 0'),
  body('description')
    .optional()
    .trim(),
];

module.exports = {
  createProductRules,
  updateProductRules,
};