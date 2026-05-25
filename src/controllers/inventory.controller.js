// src/controllers/inventory.controller.js
const inventoryService = require('../services/inventory.service');
const logger = require('../utils/logger');

// RF06: Mostrar el catálogo con opción de búsqueda

const getCatalog = async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search || '',
      sortBy: req.query.sortBy || 'date_desc',
      excludeUserId: req.session.userId 
    };

    const items = await inventoryService.getCatalog(filters);

    res.render('inventory/catalog', {
      title: 'Catálogo de Repuestos',
      items,
      search: filters.search,
      sortBy: filters.sortBy, // <--- Esta es la variable que faltaba
      currentUserId: req.session.userId 
    });
  } catch (error) {
    next(error);
  }
};
// Mostrar el detalle de una sola placa
const getPublicationDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await inventoryService.getPublicationById(id);

    res.render('inventory/detail', {
      title: item.title,
      item,
      currentUserId: req.session.userId
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).render('errors/404', { message: error.message });
    }
    next(error);
  }
};

// Renderizar formulario para crear publicación
const getCreatePublication = (req, res) => {
  res.render('inventory/create', {
    title: 'Publicar Repuesto',
    errors: [],
    old: {}
  });
};

// Procesar la creación
// Procesar la creación
const postCreatePublication = async (req, res, next) => {
  try {
    if (req.validationErrors) {
      return res.render('inventory/create', {
        title: 'Publicar Repuesto',
        errors: req.validationErrors,
        old: req.body || {}
      });
    }

    const userId = req.session.userId;
    // 1. Ya NO extraemos imageUrl de req.body, solo los textos
    const { partNumber, chassisModel, title, description, price } = req.body;
    
    // 2. Extraemos el nombre del archivo que Multer guardó
    let imageUrl = null;
    if (req.file) {
      // Guardamos la ruta relativa que entenderá el navegador
      imageUrl = `/uploads/${req.file.filename}`;
    }

    await inventoryService.createPublication({
      partNumber, chassisModel, title, description, price, imageUrl
    }, userId);

    req.session.successMessage = '¡El repuesto se publicó exitosamente con su imagen!';
    req.session.save(() => {
        res.redirect('/inventory/my-publications');
    });

  } catch (error) {
    next(error);
  }
};

// RF07: Renderizar formulario de edición (Verificando propiedad)
const getEditPublication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    
    const item = await inventoryService.getPublicationById(id);

    // Validación extra de UI: Si un listillo pone la URL de edición de otro usuario
    if (item.user_id !== userId) {
       return res.status(403).render('errors/403', { 
           message: 'No tienes permisos para editar esta publicación' 
       });
    }

    res.render('inventory/edit', {
      title: 'Editar Publicación',
      item,
      errors: [],
      old: {}
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).render('errors/404', { message: error.message });
    }
    next(error);
  }
};

// RF07: Procesar la actualización
// Procesar la actualización
const postUpdatePublication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    
    if (req.validationErrors) {
      // (Asumiendo que tienes lógica para devolver al form con errores)
      // ...
    }

    const { title, chassisModel, price, description } = req.body;
    
    // Armamos el objeto con los datos a actualizar
    const updateData = { title, chassisModel, price, description };

    // Si el usuario subió una NUEVA foto, la actualizamos. 
    // Si no subió nada (req.file es undefined), no tocamos la imagen anterior.
    if (req.file) {
      updateData.image_url = `/uploads/${req.file.filename}`;
    }

    await inventoryService.updatePublication(id, userId, updateData);

    req.session.successMessage = 'Los datos del repuesto han sido actualizados.';
    req.session.save(() => {
        res.redirect(`/inventory/my-publications`); 
    });

  } catch (error) {
    next(error);
  }
};

// RF08: Procesar el borrado lógico
const postDeletePublication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    await inventoryService.deletePublication(id, userId);

    req.session.successMessage = 'La publicación fue eliminada del catálogo definitivamente.'; // <-- AÑADE ESTO
    req.session.save(() => {
        res.redirect('/inventory/my-publications');
    });

  } catch (error) {
    if (error.status === 403 || error.status === 404) {
      return res.status(error.status).render(`errors/${error.status}`, { message: error.message });
    }
    next(error);
  }
};

// src/controllers/inventory.controller.js

// Mostrar únicamente las publicaciones del técnico autenticado
const getMyPublications = async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search || '',
      sortBy: req.query.sortBy || 'date_desc',
      userId: req.session.userId // Filtramos para que devuelva SOLO lo propio
    };

    // Llamamos al mismo servicio de siempre
    const items = await inventoryService.getCatalog(filters);

    res.render('inventory/my-publications', {
      title: 'Mis Publicaciones',
      items,
      search: filters.search,
      sortBy: filters.sortBy
    });
  } catch (error) {
    next(error);
  }
};

// Recuerda agregarlo al module.exports final:
module.exports = {
  getCatalog,
  getPublicationDetail,
  getCreatePublication,
  postCreatePublication,
  getEditPublication,
  postUpdatePublication,
  postDeletePublication,
  getMyPublications 
};