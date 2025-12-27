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

  static async create({ nombre, descripcion }) {
    const [result] = await db.execute(
      "INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)",
      [nombre, descripcion]
    );
    return result.insertId;
  }

  static async updateById(id, { nombre, descripcion }) {
    const [result] = await db.execute(
      "UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?",
      [nombre, descripcion, id]
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
