// models/User.js
const db = require("../config/db");

class User {
  static async findByEmail(email) {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.execute(
      "SELECT id, name, email, empresa_id FROM users WHERE id = ?",
      [id]
    );
    return rows[0];
  }

  static async create(userData) {
    const { name, email, password, empresa_id } = userData;
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password, empresa_id) VALUES (?, ?, ?, ?)",
      [name, email, password, empresa_id]
    );
    return result.insertId;
  }
}

module.exports = User;
