// models/User.js
const db = require("./../config/db");
const bcrypt = require("bcryptjs");

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

  static async getAll() {
    const [rows] = await db.execute(`
      SELECT u.id, u.name, u.email, u.empresa_id
      FROM users u
      ORDER BY u.name
    `);
    return rows;
  }

  static async getRolesByUserId(userId) {
    const [rows] = await db.execute(
      `
      SELECT r.name
      FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `,
      [userId]
    );
    return rows || [];
  }

  static async assignRoleToUser(userId, roleId) {
    await db.execute(
      "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
      [userId, roleId]
    );
  }

  static async removeRolesFromUser(userId) {
    await db.execute("DELETE FROM user_roles WHERE user_id = ?", [userId]);
  }

  static async deleteById(id) {
    await db.execute(
      "DELETE FROM model_has_roles WHERE model_id = ? AND model_type = ?",
      [id, "AppModelsUser"]
    );
    const [result] = await db.execute("DELETE FROM users WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  static async updateById(id, userData) {
    const { name, email, empresa_id } = userData;
    const [result] = await db.execute(
      "UPDATE users SET name = ?, email = ?, empresa_id = ? WHERE id = ?",
      [name, email, empresa_id, id]
    );
    return result.affectedRows > 0;
  }

  static async emailExists(email, excludeId = null) {
    let query = "SELECT COUNT(*) as count FROM users WHERE email = ?";
    let params = [email];

    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }

    const [rows] = await db.execute(query, params);
    return rows[0].count > 0;
  }
}

module.exports = User;
