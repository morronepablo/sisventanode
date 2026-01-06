// controllers/roleController.js
const db = require("../config/db");
const { registrarLog } = require("../utils/logger"); // 👈 Importamos el logger

const getAllRoles = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT id, name FROM roles ORDER BY name");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener roles:", error);
    res
      .status(500)
      .json({ message: "Error al obtener roles", error: error.message });
  }
};

const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute("SELECT id, name FROM roles WHERE id = ?", [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Rol no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener rol:", error);
    res
      .status(500)
      .json({ message: "Error al obtener rol", error: error.message });
  }
};

const getRoleWithDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const [roleRows] = await db.execute(
      "SELECT id, name FROM roles WHERE id = ?",
      [id]
    );
    if (roleRows.length === 0) {
      return res.status(404).json({ message: "Rol no encontrado" });
    }
    const role = roleRows[0];

    const [permissionsRows] = await db.execute(
      `SELECT p.name FROM permissions p
       INNER JOIN role_has_permissions rhp ON p.id = rhp.permission_id
       WHERE rhp.role_id = ?`,
      [id]
    );

    const [usersRows] = await db.execute(
      `SELECT COUNT(*) as user_count FROM model_has_roles WHERE role_id = ?`,
      [id]
    );

    res.json({
      ...role,
      permissions: permissionsRows,
      user_count: usersRows[0].user_count,
    });
  } catch (error) {
    console.error("Error al obtener detalles del rol:", error);
    res.status(500).json({ message: "Error al obtener detalles del rol" });
  }
};

const getRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const [roleRows] = await db.execute("SELECT id FROM roles WHERE id = ?", [
      id,
    ]);
    if (roleRows.length === 0) {
      return res.status(404).json({ message: "Rol no encontrado" });
    }

    const [allPermissions] = await db.execute(
      "SELECT id, name FROM permissions ORDER BY name"
    );
    const [assignedPermissions] = await db.execute(
      "SELECT permission_id FROM role_has_permissions WHERE role_id = ?",
      [id]
    );
    const assignedIds = assignedPermissions.map((p) => p.permission_id);

    const permissionsWithStatus = allPermissions.map((perm) => ({
      ...perm,
      assigned: assignedIds.includes(perm.id),
    }));

    res.json({ roleId: id, permissions: permissionsWithStatus });
  } catch (error) {
    console.error("Error al obtener permisos del rol:", error);
    res.status(500).json({ message: "Error al obtener permisos" });
  }
};

const assignPermissionsToRole = async (req, res) => {
  console.log("--- INICIO ASIGNAR PERMISOS A ROL ---");
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;

    const [roleRows] = await db.execute("SELECT name FROM roles WHERE id = ?", [
      id,
    ]);
    if (roleRows.length === 0) {
      return res.status(404).json({ message: "Rol no encontrado" });
    }
    const roleName = roleRows[0].name;

    // Eliminar actuales
    await db.execute("DELETE FROM role_has_permissions WHERE role_id = ?", [
      id,
    ]);

    // Insertar nuevos
    if (permissionIds && permissionIds.length > 0) {
      const placeholders = permissionIds.map(() => "(?, ?)").join(", ");
      const values = permissionIds.flatMap((permId) => [id, permId]);
      await db.execute(
        `INSERT INTO role_has_permissions (role_id, permission_id) VALUES ${placeholders}`,
        values
      );
    }

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "EDITAR",
      "SEGURIDAD_ROLES",
      `Se actualizaron los permisos para el rol: ${roleName} (Cant: ${permissionIds.length})`
    );

    console.log(`[ROLES] Permisos actualizados para el rol ${roleName}`);
    res.json({ message: "Permisos asignados exitosamente" });
  } catch (error) {
    console.error("[ROLES ERROR] Fallo al asignar permisos:", error);
    res.status(500).json({ message: "Error al asignar permisos" });
  }
  console.log("--- FIN ASIGNAR PERMISOS A ROL ---");
};

const createRole = async (req, res) => {
  console.log("--- INICIO CREATE ROL ---");
  try {
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Nombre de rol inválido" });
    }

    const [existing] = await db.execute("SELECT id FROM roles WHERE name = ?", [
      name,
    ]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "El rol ya existe" });
    }

    const [result] = await db.execute("INSERT INTO roles (name) VALUES (?)", [
      name,
    ]);

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "CREAR",
      "SEGURIDAD_ROLES",
      `Se creó el rol: ${name}`
    );

    console.log(`[ROLES] Rol ${name} creado con ID: ${result.insertId}`);
    res
      .status(201)
      .json({ message: "Rol creado exitosamente", id: result.insertId });
  } catch (error) {
    console.error("[ROLES ERROR] Fallo al crear rol:", error);
    res.status(500).json({ message: "Error al crear rol" });
  }
  console.log("--- FIN CREATE ROL ---");
};

const updateRole = async (req, res) => {
  console.log("--- INICIO UPDATE ROL ---");
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (id == 1 && name !== "Administrador") {
      return res.status(400).json({
        message: "No se puede cambiar el nombre del rol Administrador",
      });
    }

    const [result] = await db.execute(
      "UPDATE roles SET name = ? WHERE id = ?",
      [name, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Rol no encontrado" });
    }

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "EDITAR",
      "SEGURIDAD_ROLES",
      `Se cambió el nombre del rol ID ${id} a: ${name}`
    );

    console.log(`[ROLES] Rol ID ${id} actualizado a ${name}`);
    res.json({ message: "Rol actualizado exitosamente" });
  } catch (error) {
    console.error("[ROLES ERROR] Fallo al actualizar rol:", error);
    res.status(500).json({ message: "Error al actualizar rol" });
  }
  console.log("--- FIN UPDATE ROL ---");
};

const deleteRole = async (req, res) => {
  console.log("--- INICIO DELETE ROL ---");
  try {
    const { id } = req.params;

    const [assigned] = await db.execute(
      "SELECT COUNT(*) as count FROM model_has_roles WHERE role_id = ?",
      [id]
    );
    if (assigned[0].count > 0) {
      return res
        .status(400)
        .json({ message: "El rol tiene usuarios asignados" });
    }

    const [roleRows] = await db.execute("SELECT name FROM roles WHERE id = ?", [
      id,
    ]);
    const roleName = roleRows.length > 0 ? roleRows[0].name : "ID " + id;

    const [result] = await db.execute("DELETE FROM roles WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Rol no encontrado" });
    }

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "ELIMINAR",
      "SEGURIDAD_ROLES",
      `Se eliminó el rol: ${roleName}`
    );

    console.log(`[ROLES] Rol ${roleName} eliminado.`);
    res.json({ message: "Rol eliminado exitosamente" });
  } catch (error) {
    console.error("[ROLES ERROR] Fallo al eliminar rol:", error);
    res.status(500).json({ message: "Error al eliminar rol" });
  }
  console.log("--- FIN DELETE ROL ---");
};

const countRoles = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT COUNT(*) AS total FROM roles");
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error al contar roles:", error);
    res.status(500).json({ total: 0 });
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  getRoleWithDetails,
  getRolePermissions,
  assignPermissionsToRole,
  createRole,
  updateRole,
  deleteRole,
  countRoles,
};
