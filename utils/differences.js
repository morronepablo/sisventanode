// backend/utils/differences.js

/**
 * Compara dos objetos y devuelve un texto con los cambios encontrados.
 * @param {Object} oldData - Datos antes de editar (de la DB)
 * @param {Object} newData - Datos nuevos (del req.body)
 * @param {Array} fieldsToIgnore - Campos que no queremos auditar (ej: updated_at, password)
 */
const calcularDiferencias = (oldData, newData, fieldsToIgnore = []) => {
  let cambios = [];

  for (let key in newData) {
    // Si el campo está en la lista de ignorados, saltar
    if (fieldsToIgnore.includes(key)) continue;

    // Si el valor cambió y existe en el objeto viejo
    if (oldData.hasOwnProperty(key) && oldData[key] != newData[key]) {
      cambios.push(
        `${key.toUpperCase()}: "${oldData[key]}" ➡️ "${newData[key]}"`
      );
    }
  }

  return cambios.length > 0 ? cambios.join(" | ") : "Sin cambios detectados";
};

module.exports = { calcularDiferencias };
