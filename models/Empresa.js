// src/models/Empresa.js
const db = require("./../config/db");

class Empresa {
  static async findById(id) {
    const [rows] = await db.execute("SELECT * FROM empresas WHERE id = ?", [
      id,
    ]);
    return rows[0];
  }

  static async updateById(id, data) {
    const fields = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(data);
    const [result] = await db.execute(
      `UPDATE empresas SET ${fields} WHERE id = ?`,
      [...values, id]
    );
    return result.affectedRows > 0;
  }

  static async getAll() {
    const [rows] = await db.execute(
      "SELECT * FROM empresas ORDER BY nombre_empresa"
    );
    return rows;
  }
}

module.exports = Empresa;
