// models/Unidad.js
const db = require("../config/db");

class Unidad {
  static async getAll() {
    const [rows] = await db.execute("SELECT * FROM unidads ORDER BY nombre");
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute("SELECT * FROM unidads WHERE id = ?", [id]);
    return rows[0] || null;
  }

  static async create({ nombre, descripcion, empresa_id = 1 }) {
    const [result] = await db.execute(
      "INSERT INTO unidads (nombre, descripcion, empresa_id) VALUES (?, ?, ?)",
      [nombre, descripcion, empresa_id]
    );
    return result.insertId;
  }

  static async updateById(id, { nombre, descripcion }) {
    const [result] = await db.execute(
      "UPDATE unidads SET nombre = ?, descripcion = ? WHERE id = ?",
      [nombre, descripcion, id]
    );
    return result.affectedRows > 0;
  }

  static async deleteById(id) {
    const [result] = await db.execute("DELETE FROM unidads WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  static async nombreExists(nombre, excludeId = null) {
    let query = "SELECT COUNT(*) AS count FROM unidads WHERE nombre = ?";
    let params = [nombre];
    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }
    const [rows] = await db.execute(query, params);
    return rows[0].count > 0;
  }
}

module.exports = Unidad;
