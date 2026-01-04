// src/models/Devolucion.js
const db = require("../config/db");

const Devolucion = {
  getAll: async (empresa_id) => {
    try {
      const query = `
        SELECT d.*, cl.nombre_cliente as cliente_nombre, u.name as usuario_nombre
        FROM devoluciones d
        LEFT JOIN clientes cl ON d.cliente_id = cl.id
        LEFT JOIN users u ON d.usuario_id = u.id
        WHERE d.empresa_id = ?
        ORDER BY d.fecha DESC, d.id DESC
      `;
      const [rows] = await db.execute(query, [empresa_id]);
      return rows;
    } catch (error) {
      console.error("Error en Devolucion.getAll:", error);
      throw error;
    }
  },

  getDetallesByDevolucionId: async (devolucionId) => {
    try {
      const query = `
        SELECT dd.*, 
               p.nombre as producto_nombre, p.codigo as producto_codigo, p.stock as producto_stock,
               c.nombre as combo_nombre, c.codigo as combo_codigo,
               un.nombre as unidad_nombre
        FROM detalle_devoluciones dd
        LEFT JOIN productos p ON dd.producto_id = p.id
        LEFT JOIN combos c ON dd.combo_id = c.id
        LEFT JOIN unidads un ON p.unidad_id = un.id
        WHERE dd.devolucion_id = ?
      `;
      const [rows] = await db.execute(query, [devolucionId]);
      return rows;
    } catch (error) {
      console.error("Error en getDetallesByDevolucionId:", error);
      return [];
    }
  },
};

module.exports = Devolucion;
