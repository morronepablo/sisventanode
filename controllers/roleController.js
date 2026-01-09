// controllers/roleController.js
const db = require("../config/db");
const { registrarLog } = require("../utils/logger"); // 👈 Importamos el logger
const { calcularDiferencias } = require("../utils/differences"); // 👈 1. Importar utilidad

const getAllRoles = async (req, res) => {
  try {
    // Usamos una subconsulta para contar cuántos usuarios están usando este rol
    // Nota: Uso 'user_roles' que es la tabla que vimos en el módulo de usuarios
    const query = `
      SELECT 
        r.id, 
        r.name,
        (SELECT COUNT(*) FROM user_roles WHERE role_id = r.id) as user_count
      FROM roles r 
      ORDER BY r.name
    `;
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener roles:", error);
    res.status(500).json({ message: "Error al obtener roles" });
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
  console.log("--- INICIO ASIGNAR PERMISOS A ROL (AUDITADO) ---");
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;

    const [roleRows] = await db.execute("SELECT name FROM roles WHERE id = ?", [
      id,
    ]);
    if (roleRows.length === 0)
      return res.status(404).json({ message: "Rol no encontrado" });
    const roleName = roleRows[0].name;

    // 2. OBTENER PERMISOS ACTUALES PARA EL LOG ANTES DE BORRARLOS
    const [permsAnteriores] = await db.execute(
      `SELECT p.name FROM permissions p 
       INNER JOIN role_has_permissions rhp ON p.id = rhp.permission_id 
       WHERE rhp.role_id = ?`,
      [id]
    );
    const nombresPermisosAnteriores =
      permsAnteriores.map((p) => p.name).join(", ") || "Ninguno";

    // 3. PROCESO DE ACTUALIZACIÓN (Eliminar e Insertar)
    await db.execute("DELETE FROM role_has_permissions WHERE role_id = ?", [
      id,
    ]);

    if (permissionIds && permissionIds.length > 0) {
      const placeholders = permissionIds.map(() => "(?, ?)").join(", ");
      const values = permissionIds.flatMap((permId) => [id, permId]);
      await db.execute(
        `INSERT INTO role_has_permissions (role_id, permission_id) VALUES ${placeholders}`,
        values
      );
    }

    // 4. OBTENER NUEVOS PERMISOS PARA COMPARAR EN EL LOG
    const [permsNuevos] = await db.execute(
      `SELECT p.name FROM permissions p 
       INNER JOIN role_has_permissions rhp ON p.id = rhp.permission_id 
       WHERE rhp.role_id = ?`,
      [id]
    );
    const nombresPermisosNuevos =
      permsNuevos.map((p) => p.name).join(", ") || "Ninguno";

    // 5. REGISTRO DE LOG DETALLADO
    await registrarLog(
      req,
      "EDITAR",
      "SEGURIDAD_ROLES",
      `Se actualizaron permisos del rol: ${roleName}. ANTERIORES: [${nombresPermisosAnteriores}] ➡️ NUEVOS: [${nombresPermisosNuevos}]`
    );

    res.json({ message: "Permisos asignados exitosamente" });
  } catch (error) {
    console.error("[ROLES ERROR] Fallo al asignar permisos:", error);
    res.status(500).json({ message: "Error al asignar permisos" });
  }
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
  console.log("--- INICIO UPDATE ROL (AUDITADO) ---");
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (id == 1 && name !== "Administrador") {
      return res.status(400).json({
        message: "No se puede cambiar el nombre del rol Administrador",
      });
    }

    // 2. OBTENER NOMBRE ANTERIOR PARA COMPARAR
    const [roleAnterior] = await db.execute(
      "SELECT name FROM roles WHERE id = ?",
      [id]
    );
    if (roleAnterior.length === 0)
      return res.status(404).json({ message: "Rol no encontrado" });

    // 3. CALCULAR DIFERENCIA
    const detalleCambio = calcularDiferencias(roleAnterior[0], req.body, [
      "id",
    ]);

    const [result] = await db.execute(
      "UPDATE roles SET name = ? WHERE id = ?",
      [name, id]
    );

    // 4. REGISTRO DE LOG DETALLADO
    await registrarLog(
      req,
      "EDITAR",
      "SEGURIDAD_ROLES",
      `Se cambió el nombre del rol ID ${id}. Cambios: ${detalleCambio}`
    );

    res.json({ message: "Rol actualizado exitosamente" });
  } catch (error) {
    console.error("[ROLES ERROR] Fallo al actualizar rol:", error);
    res.status(500).json({ message: "Error al actualizar rol" });
  }
};

const deleteRole = async (req, res) => {
  console.log("--- INICIO DELETE ROL ---");
  try {
    const { id } = req.params;

    // 1. Protección absoluta del Rol Administrador (ID 1)
    if (id == 1) {
      return res.status(400).json({
        message: "No se puede eliminar el rol Administrador maestro.",
      });
    }

    // 2. Verificar si hay usuarios asignados antes de borrar
    const [assigned] = await db.execute(
      "SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?",
      [id]
    );

    if (assigned[0].count > 0) {
      return res.status(400).json({
        message: `No se puede eliminar: este rol tiene ${assigned[0].count} usuarios asignados.`,
      });
    }

    const [roleRows] = await db.execute("SELECT name FROM roles WHERE id = ?", [
      id,
    ]);
    const roleName = roleRows.length > 0 ? roleRows[0].name : "ID " + id;

    const [result] = await db.execute("DELETE FROM roles WHERE id = ?", [id]);

    await registrarLog(
      req,
      "ELIMINAR",
      "SEGURIDAD_ROLES",
      `Se eliminó el rol: ${roleName}`
    );

    res.json({ message: "Rol eliminado exitosamente" });
  } catch (error) {
    console.error("[ROLES ERROR] Fallo al eliminar rol:", error);
    res.status(500).json({ message: "Error al eliminar el rol" });
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
