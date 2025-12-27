// models/Role.js
const db = require("./../config/db");

class Role {
  static async findByUserId(userId) {
    const [rows] = await db.execute(
      `SELECT r.* FROM roles r
       INNER JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = ?`,
      [userId]
    );
    return rows;
  }

  static async getPermissionsByRole(roleId) {
    const [rows] = await db.execute(
      `SELECT p.name FROM permissions p
       INNER JOIN role_has_permissions rhp ON p.id = rhp.permission_id
       WHERE rhp.role_id = ?`,
      [roleId]
    );
    return rows.map((p) => p.name);
  }
}

module.exports = Role;
