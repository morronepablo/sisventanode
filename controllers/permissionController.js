// controllers/permissionController.js
const db = require("../config/db");
const { registrarLog } = require("../utils/logger"); // 👈 Importamos el logger

const getAllPermissions = async (req, res) => {
  try {
    // Agregamos una subconsulta para saber cuántos roles usan cada permiso
    const query = `
      SELECT 
        p.id, 
        p.name, 
        (SELECT COUNT(*) FROM role_has_permissions WHERE permission_id = p.id) as roles_count
      FROM permissions p 
      ORDER BY p.name
    `;
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener permisos:", error);
    res.status(500).json({ message: "Error al obtener permisos" });
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
    res.status(500).json({ message: "Error al obtener permiso" });
  }
};

const getPermissionWithDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const [permissionRows] = await db.execute(
      "SELECT id, name FROM permissions WHERE id = ?",
      [id]
    );
    if (permissionRows.length === 0) {
      return res.status(404).json({ message: "Permiso no encontrado" });
    }
    const permission = permissionRows[0];

    const [rolesRows] = await db.execute(
      `SELECT r.name FROM roles r
       INNER JOIN role_has_permissions rhp ON r.id = rhp.role_id
       WHERE rhp.permission_id = ?`,
      [id]
    );

    res.json({ ...permission, roles: rolesRows });
  } catch (error) {
    console.error("Error al obtener detalles del permiso:", error);
    res.status(500).json({ message: "Error al obtener detalles" });
  }
};

const createPermission = async (req, res) => {
  console.log("--- INICIO CREATE PERMISO ---");
  try {
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Nombre de permiso inválido" });
    }

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

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "CREAR",
      "SEGURIDAD_PERMISOS",
      `Se creó un nuevo permiso: ${name}`
    );

    console.log(`[PERMISOS] Permiso ${name} creado con ID: ${result.insertId}`);
    res
      .status(201)
      .json({ message: "Permiso creado exitosamente", id: result.insertId });
  } catch (error) {
    console.error("[PERMISOS ERROR] Fallo al crear permiso:", error);
    res.status(500).json({ message: "Error al crear permiso" });
  }
  console.log("--- FIN CREATE PERMISO ---");
};

const updatePermission = async (req, res) => {
  console.log("--- INICIO UPDATE PERMISO ---");
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Nombre de permiso inválido" });
    }

    const [result] = await db.execute(
      "UPDATE permissions SET name = ? WHERE id = ?",
      [name, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Permiso no encontrado" });
    }

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "EDITAR",
      "SEGURIDAD_PERMISOS",
      `Se actualizó el permiso ID ${id}. Nuevo nombre: ${name}`
    );

    console.log(`[PERMISOS] Permiso ID ${id} actualizado a ${name}`);
    res.json({ message: "Permiso actualizado exitosamente" });
  } catch (error) {
    console.error("[PERMISOS ERROR] Fallo al actualizar permiso:", error);
    res.status(500).json({ message: "Error al actualizar permiso" });
  }
  console.log("--- FIN UPDATE PERMISO ---");
};

const deletePermission = async (req, res) => {
  console.log("--- INICIO DELETE PERMISO ---");
  try {
    const { id } = req.params;

    const [assigned] = await db.execute(
      "SELECT COUNT(*) as count FROM role_has_permissions WHERE permission_id = ?",
      [id]
    );

    if (assigned[0].count > 0) {
      return res
        .status(400)
        .json({ message: "El permiso tiene roles asignados" });
    }

    const [permRows] = await db.execute(
      "SELECT name FROM permissions WHERE id = ?",
      [id]
    );
    const permName = permRows.length > 0 ? permRows[0].name : "ID " + id;

    const [result] = await db.execute("DELETE FROM permissions WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Permiso no encontrado" });
    }

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "ELIMINAR",
      "SEGURIDAD_PERMISOS",
      `Se eliminó el permiso: ${permName}`
    );

    console.log(`[PERMISOS] Permiso ${permName} eliminado.`);
    res.json({ message: "Permiso eliminado exitosamente" });
  } catch (error) {
    console.error("[PERMISOS ERROR] Fallo al eliminar permiso:", error);
    res.status(500).json({ message: "Error al eliminar permiso" });
  }
  console.log("--- FIN DELETE PERMISO ---");
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
