// models/Categoria.js
const db = require("../config/db");

class Categoria {
  static async getAll() {
    const [rows] = await db.execute("SELECT * FROM categorias ORDER BY nombre");
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute("SELECT * FROM categorias WHERE id = ?", [
      id,
    ]);
    return rows[0] || null;
  }

  // 1. AJUSTADO PARA INSERTAR EL MARGEN
  static async create({ nombre, descripcion, margen_objetivo }) {
    const [result] = await db.execute(
      "INSERT INTO categorias (nombre, descripcion, margen_objetivo) VALUES (?, ?, ?)",
      [nombre, descripcion, margen_objetivo || 0]
    );
    return result.insertId;
  }

  // 2. AJUSTADO PARA ACTUALIZAR EL MARGEN
  static async updateById(id, { nombre, descripcion, margen_objetivo }) {
    const [result] = await db.execute(
      "UPDATE categorias SET nombre = ?, descripcion = ?, margen_objetivo = ? WHERE id = ?",
      [nombre, descripcion, margen_objetivo || 0, id]
    );
    return result.affectedRows > 0;
  }

  static async deleteById(id) {
    const [result] = await db.execute("DELETE FROM categorias WHERE id = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  }

  static async nombreExists(nombre, excludeId = null) {
    let query = "SELECT COUNT(*) AS count FROM categorias WHERE nombre = ?";
    let params = [nombre];
    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }
    const [rows] = await db.execute(query, params);
    return rows[0].count > 0;
  }
}

module.exports = Categoria;
