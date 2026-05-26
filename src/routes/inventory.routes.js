const express = require('express');
const inventoryController = require('../controllers/inventory.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const upload = require('../middlewares/upload.middleware');

// Importamos las reglas de validación (que crearemos a continuación)
const {
  createPublicationRules,
  updatePublicationRules,
} = require('../validators/inventory.validator');

const router = express.Router();

// ==========================================
// Catálogo y Detalles (Lectura)
// ==========================================
// Usamos requireAuth para que solo técnicos registrados puedan ver el catálogo
router.get('/', requireAuth, inventoryController.getCatalog);
router.get('/detail/:id', requireAuth, inventoryController.getPublicationDetail);

// ==========================================
// Crear Publicación
// ==========================================
router.get('/create', requireAuth, inventoryController.getCreatePublication);
// Aquí inyectamos las reglas y el validador antes del controlador

// Asegúrate de tener importado upload en este archivo:
// const upload = require('../middlewares/upload.middleware');

router.post(
    '/create', 
    requireAuth, 
    upload.single('image'),    // <-- 1. Multer traduce el formulario "multipart"
    createPublicationRules,    // <-- 2. AHORA SÍ el validador puede leer los textos
    validate,                  // <-- 3. Se revisan los errores
    inventoryController.postCreatePublication
);

// ==========================================
// Editar Publicación
// ==========================================
router.get('/:id/edit', requireAuth, inventoryController.getEditPublication);
// Para editar, aplicamos reglas similares pero enfocadas en los campos permitidos
router.post('/:id/edit', requireAuth, updatePublicationRules, validate, inventoryController.postUpdatePublication);

// ==========================================
// Eliminar Publicación
// ==========================================
// Al eliminar solo pasamos el ID por URL, no hay "body" que validar con express-validator, 
// así que solo requiere estar autenticado.
router.post('/:id/delete', requireAuth, inventoryController.postDeletePublication);

// src/routes/inventory.routes.js

// Colócala justo debajo de la ruta del catálogo general '/'
router.get('/', requireAuth, inventoryController.getCatalog);
router.get('/my-publications', requireAuth, inventoryController.getMyPublications);

module.exports = router;