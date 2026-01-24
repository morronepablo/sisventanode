// models/Producto.js
const db = require("../config/db");

class Producto {
  static async getAll() {
    const [rows] = await db.execute(`
      SELECT p.*, c.nombre as categoria_nombre, u.nombre as unidad_nombre
      FROM productos p
      JOIN categorias c ON p.categoria_id = c.id
      JOIN unidads u ON p.unidad_id = u.id
      ORDER BY p.nombre
    `);
    return rows;
  }

  static async getBajoStock() {
    const [rows] = await db.execute(`
      SELECT p.*, c.nombre as categoria_nombre, u.nombre as unidad_nombre
      FROM productos p
      JOIN categorias c ON p.categoria_id = c.id
      JOIN unidads u ON p.unidad_id = u.id
      WHERE p.stock <= p.stock_minimo
      ORDER BY p.stock ASC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `
      SELECT p.*, c.nombre as categoria_nombre, u.nombre as unidad_nombre
      FROM productos p
      JOIN categorias c ON p.categoria_id = c.id
      JOIN unidads u ON p.unidad_id = u.id
      WHERE p.id = ?
    `,
      [id],
    );
    return rows[0] || null;
  }

  static async create(data) {
    const {
      categoria_id,
      unidad_id,
      unidad_compra_id, // 👈 NUEVO
      factor_conversion, // 👈 NUEVO
      codigo,
      nombre,
      nombre_corto,
      stock,
      stock_minimo,
      stock_maximo,
      precio_compra,
      aplicar_porcentaje,
      valor_porcentaje,
      precio_venta,
      descripcion,
      fecha_ingreso,
      imagen,
      empresa_id, // 👈 Lo tomamos del objeto data
    } = data;

    const [result] = await db.execute(
      `INSERT INTO productos (
      categoria_id, unidad_id, unidad_compra_id, factor_conversion, 
      codigo, nombre, nombre_corto, stock, stock_minimo, stock_maximo, 
      precio_compra, aplicar_porcentaje, valor_porcentaje, precio_venta, 
      descripcion, fecha_ingreso, imagen, empresa_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        categoria_id,
        unidad_id,
        unidad_compra_id || null, // 👈 Manejo de nulos si no se elige caja
        factor_conversion || 1.0, // 👈 Default 1
        codigo,
        nombre,
        nombre_corto,
        stock,
        stock_minimo,
        stock_maximo,
        precio_compra,
        aplicar_porcentaje,
        valor_porcentaje,
        precio_venta,
        descripcion,
        fecha_ingreso,
        imagen,
        empresa_id || 1,
      ],
    );

    return result.insertId;
  }

  static async updateById(id, data) {
    const {
      categoria_id,
      unidad_id,
      unidad_compra_id, // 👈 NUEVO
      factor_conversion, // 👈 NUEVO
      codigo,
      nombre,
      nombre_corto,
      stock,
      stock_minimo,
      stock_maximo,
      precio_compra,
      aplicar_porcentaje,
      valor_porcentaje,
      precio_venta,
      descripcion,
      fecha_ingreso,
      imagen,
    } = data;

    const [result] = await db.execute(
      `UPDATE productos SET
      categoria_id = ?, unidad_id = ?, unidad_compra_id = ?, factor_conversion = ?, 
      codigo = ?, nombre = ?, nombre_corto = ?, stock = ?, stock_minimo = ?, 
      stock_maximo = ?, precio_compra = ?, aplicar_porcentaje = ?, 
      valor_porcentaje = ?, precio_venta = ?, descripcion = ?, 
      fecha_ingreso = ?, imagen = ?
    WHERE id = ?`,
      [
        categoria_id,
        unidad_id,
        unidad_compra_id || null,
        factor_conversion || 1.0,
        codigo,
        nombre,
        nombre_corto,
        stock,
        stock_minimo,
        stock_maximo,
        precio_compra,
        aplicar_porcentaje,
        valor_porcentaje,
        precio_venta,
        descripcion,
        fecha_ingreso,
        imagen,
        id,
      ],
    );

    return result.affectedRows > 0;
  }

  static async deleteById(id) {
    const [result] = await db.execute("DELETE FROM productos WHERE id = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  }

  static async codigoExists(codigo, excludeId = null) {
    let query = "SELECT COUNT(*) AS count FROM productos WHERE codigo = ?";
    let params = [codigo];
    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }
    const [rows] = await db.execute(query, params);
    return rows[0].count > 0;
  }
}

module.exports = Producto;
