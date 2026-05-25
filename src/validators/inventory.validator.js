const { body } = require('express-validator');

const createPublicationRules = [
  body('partNumber')
    .notEmpty().withMessage('El número de parte es obligatorio')
    .trim(),
  body('chassisModel')
    .notEmpty().withMessage('El modelo del chasis es obligatorio')
    .trim(),
  body('title')
    .notEmpty().withMessage('El título de la publicación es obligatorio')
    .isLength({ max: 255 }).withMessage('El título no puede exceder los 255 caracteres'),
  body('price')
    .notEmpty().withMessage('El precio es obligatorio')
    .isNumeric().withMessage('El precio debe ser un número válido')
    .isFloat({ min: 0.1 }).withMessage('El precio debe ser mayor a 0'),
  body('description')
    .optional()
    .trim()
];

const updatePublicationRules = [
  // En la actualización, no permitimos cambiar el partNumber, así que no lo validamos aquí
  body('title')
    .optional()
    .notEmpty().withMessage('El título no puede quedar vacío si lo envías')
    .isLength({ max: 255 }).withMessage('El título no puede exceder los 255 caracteres'),
  body('price')
    .optional()
    .isNumeric().withMessage('El precio debe ser un número válido')
    .isFloat({ min: 0.1 }).withMessage('El precio debe ser mayor a 0'),
  body('chassisModel')
    .optional()
    .notEmpty().withMessage('El modelo del chasis no puede quedar vacío')
    .trim(),
  body('description')
    .optional()
    .trim()
];

module.exports = {
  createPublicationRules,
  updatePublicationRules
};