const inventoryRepository = require('../repositories/inventory.repository');

// RF06: Obtener todo el catálogo o filtrar por búsqueda
const getCatalog = async (filters = {}) => {
  const items = await inventoryRepository.findAll(filters);
  return items;
};

// Obtener el detalle de una publicación en específico
const getPublicationById = async (id) => {
  const item = await inventoryRepository.findById(id);
  
  if (!item) {
    const error = new Error('La publicación no existe o fue eliminada');
    error.status = 404;
    throw error;
  }
  
  return item;
};

// Crear una nueva publicación en el catálogo
const createPublication = async (data, userId) => {
  // Validación básica de negocio (El middleware debería validar esto, pero es buen respaldo)
  if (!data.partNumber || !data.chassisModel || !data.title || !data.price) {
    const error = new Error('Faltan campos obligatorios para registrar el repuesto');
    error.status = 400; // Bad Request
    throw error;
  }

  const newItem = await inventoryRepository.create({
    ...data,
    userId
  });

  return newItem;
};

// RF07: Modificar publicación (Validando propiedad)
const updatePublication = async (id, userId, updateData) => {
  // 1. Verificar si la placa existe
  const existingItem = await inventoryRepository.findById(id);
  
  if (!existingItem) {
    const error = new Error('La publicación no existe o fue eliminada');
    error.status = 404;
    throw error;
  }

  // 2. REGLA DE NEGOCIO P2P: Validar que el usuario que intenta editar sea el dueño
  if (existingItem.user_id !== userId) {
    const error = new Error('Acceso denegado: No tienes permisos para modificar esta publicación');
    error.status = 403; // Forbidden
    throw error;
  }

  // 3. Si todo está correcto, pedirle al repositorio que actualice
  const updatedItem = await inventoryRepository.update(id, userId, updateData);
  return updatedItem;
};

// RF08: Retirar publicación (Validando propiedad)
const deletePublication = async (id, userId) => {
  // 1. Verificar si la placa existe
  const existingItem = await inventoryRepository.findById(id);
  
  if (!existingItem) {
    const error = new Error('La publicación no existe o ya fue eliminada');
    error.status = 404;
    throw error;
  }

  // 2. REGLA DE NEGOCIO P2P: Validar que el usuario que intenta eliminar sea el dueño
  if (existingItem.user_id !== userId) {
    const error = new Error('Acceso denegado: No tienes permisos para retirar esta publicación');
    error.status = 403;
    throw error;
  }

  // 3. Ejecutar el borrado lógico (Soft Delete)
  const success = await inventoryRepository.remove(id, userId);
  return success;
};

module.exports = {
  getCatalog,
  getPublicationById,
  createPublication,
  updatePublication,
  deletePublication
};