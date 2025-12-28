// models/Proveedor.js
const db = require("../config/db");

const Proveedor = {
  getAll: async () => {
    try {
      // Obtenemos los proveedores básicos
      const [rows] = await db.execute("SELECT * FROM proveedors");
      return rows;
    } catch (error) {
      console.error("Error en Proveedor.getAll:", error);
      throw error;
    }
  },

  getFacturasAdeudadas: async (proveedorId) => {
    try {
      // Basado en tu imagen de DB, la tabla 'compras' tiene 'proveedor_id' y 'usuario_id'
      const query = `
        SELECT c.*, u.name as usuario_nombre
        FROM compras c
        LEFT JOIN users u ON c.usuario_id = u.id
        WHERE c.proveedor_id = ?
      `;
      const [compras] = await db.execute(query, [proveedorId]);

      const facturas = [];
      for (const compra of compras) {
        // Buscamos cuánto se ha pagado de esta compra específica
        const [pagos] = await db.execute(
          "SELECT SUM(monto) as total_pagado FROM pago_compras WHERE compra_id = ?",
          [compra.id]
        );

        const totalPagado = parseFloat(pagos[0].total_pagado) || 0;
        const precioTotal = parseFloat(compra.precio_total) || 0;
        const saldo = precioTotal - totalPagado;

        if (saldo > 0) {
          facturas.push({
            ...compra,
            total_pagado: totalPagado,
            saldo_pendiente: saldo,
          });
        }
      }
      return facturas;
    } catch (error) {
      console.error(
        `Error en getFacturasAdeudadas para ID ${proveedorId}:`,
        error
      );
      return []; // Devolvemos vacío para que no rompa el loop principal
    }
  },

  getPagosRealizados: async (proveedorId) => {
    try {
      const query = `
        SELECT p.*, c.comprobante, u.name as usuario_nombre
        FROM pago_compras p
        LEFT JOIN compras c ON p.compra_id = c.id
        LEFT JOIN users u ON p.usuario_id = u.id
        WHERE p.proveedor_id = ?
        ORDER BY p.fecha_pago DESC
      `;
      const [rows] = await db.execute(query, [proveedorId]);
      return rows;
    } catch (error) {
      console.error(
        `Error en getPagosRealizados para ID ${proveedorId}:`,
        error
      );
      return [];
    }
  },

  // Añadir si no lo tienes
  findById: async (id) => {
    const [rows] = await db.execute("SELECT * FROM proveedors WHERE id = ?", [
      id,
    ]);
    return rows[0];
  },

  create: async (datos) => {
    const {
      empresa,
      marca,
      direccion,
      telefono,
      email,
      contacto,
      celular,
      empresa_id,
    } = datos;
    const query = `
      INSERT INTO proveedors 
      (empresa, marca, direccion, telefono, email, contacto, celular, empresa_id, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await db.execute(query, [
      empresa,
      marca,
      direccion,
      telefono,
      email,
      contacto,
      celular,
      empresa_id || 1,
    ]);
    return result.insertId;
  },

  updateById: async (id, datos) => {
    const { empresa, marca, direccion, telefono, email, contacto, celular } =
      datos;
    const query = `
      UPDATE proveedors 
      SET empresa = ?, marca = ?, direccion = ?, telefono = ?, email = ?, contacto = ?, celular = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [
      empresa,
      marca,
      direccion,
      telefono,
      email,
      contacto,
      celular,
      id,
    ]);
    return result.affectedRows > 0;
  },
};

module.exports = Proveedor;
