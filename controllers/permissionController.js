// controllers/permissionController.js
const db = require("../config/db");

const getAllPermissions = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, name FROM permissions ORDER BY name"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener permisos:", error);
    res
      .status(500)
      .json({ message: "Error al obtener permisos", error: error.message });
  }
};

const getPermissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(
      "SELECT id, name FROM permissions WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Permiso no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener permiso:", error);
    res
      .status(500)
      .json({ message: "Error al obtener permiso", error: error.message });
  }
};

const getPermissionWithDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener permiso
    const [permissionRows] = await db.execute(
      "SELECT id, name FROM permissions WHERE id = ?",
      [id]
    );
    if (permissionRows.length === 0) {
      return res.status(404).json({ message: "Permiso no encontrado" });
    }
    const permission = permissionRows[0];

    // Obtener roles asignados al permiso
    const [rolesRows] = await db.execute(
      `
      SELECT r.name 
      FROM roles r
      INNER JOIN role_has_permissions rhp ON r.id = rhp.role_id
      WHERE rhp.permission_id = ?
    `,
      [id]
    );

    res.json({
      ...permission,
      roles: rolesRows,
    });
  } catch (error) {
    console.error("Error al obtener detalles del permiso:", error);
    res.status(500).json({
      message: "Error al obtener detalles del permiso",
      error: error.message,
    });
  }
};

const createPermission = async (req, res) => {
  try {
    const { name } = req.body;

    // Validar nombre
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        message: "El nombre del permiso debe tener al menos 2 caracteres",
      });
    }

    // Verificar si el permiso ya existe
    const [existing] = await db.execute(
      "SELECT id FROM permissions WHERE name = ?",
      [name]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "El permiso ya existe" });
    }

    const [result] = await db.execute(
      "INSERT INTO permissions (name) VALUES (?)",
      [name]
    );
    res
      .status(201)
      .json({ message: "Permiso creado exitosamente", id: result.insertId });
  } catch (error) {
    console.error("Error al crear permiso:", error);
    res
      .status(500)
      .json({ message: "Error al crear permiso", error: error.message });
  }
};

const updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        message: "El nombre del permiso debe tener al menos 2 caracteres",
      });
    }

    const [result] = await db.execute(
      "UPDATE permissions SET name = ? WHERE id = ?",
      [name, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Permiso no encontrado" });
    }

    res.json({ message: "Permiso actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar permiso:", error);
    res
      .status(500)
      .json({ message: "Error al actualizar permiso", error: error.message });
  }
};

const deletePermission = async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminar permisos asignados a roles
    const [assigned] = await db.execute(
      "SELECT COUNT(*) as count FROM role_has_permissions WHERE permission_id = ?",
      [id]
    );

    if (assigned[0].count > 0) {
      return res.status(400).json({
        message: "No se puede eliminar un permiso que tiene roles asignados",
      });
    }

    const [result] = await db.execute("DELETE FROM permissions WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Permiso no encontrado" });
    }

    res.json({ message: "Permiso eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar permiso:", error);
    res
      .status(500)
      .json({ message: "Error al eliminar permiso", error: error.message });
  }
};

const countPermissions = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS total FROM permissions"
    );
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error al contar permisos:", error);
    res.status(500).json({ total: 0 });
  }
};

module.exports = {
  getAllPermissions,
  getPermissionById,
  getPermissionWithDetails,
  createPermission,
  updatePermission,
  deletePermission,
  countPermissions,
};
