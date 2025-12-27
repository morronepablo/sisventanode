// controllers/roleController.js
const db = require("../config/db");

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

    // Obtener rol
    const [roleRows] = await db.execute(
      "SELECT id, name FROM roles WHERE id = ?",
      [id]
    );
    if (roleRows.length === 0) {
      return res.status(404).json({ message: "Rol no encontrado" });
    }
    const role = roleRows[0];

    // Obtener permisos del rol
    const [permissionsRows] = await db.execute(
      `
      SELECT p.name 
      FROM permissions p
      INNER JOIN role_has_permissions rhp ON p.id = rhp.permission_id
      WHERE rhp.role_id = ?
    `,
      [id]
    );

    // Obtener cantidad de usuarios asignados
    const [usersRows] = await db.execute(
      `
      SELECT COUNT(*) as user_count 
      FROM model_has_roles 
      WHERE role_id = ?
    `,
      [id]
    );

    res.json({
      ...role,
      permissions: permissionsRows,
      user_count: usersRows[0].user_count,
    });
  } catch (error) {
    console.error("Error al obtener detalles del rol:", error);
    res.status(500).json({
      message: "Error al obtener detalles del rol",
      error: error.message,
    });
  }
};

const getRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el rol exista
    const [roleRows] = await db.execute("SELECT id FROM roles WHERE id = ?", [
      id,
    ]);
    if (roleRows.length === 0) {
      return res.status(404).json({ message: "Rol no encontrado" });
    }

    // Obtener todos los permisos
    const [allPermissions] = await db.execute(
      "SELECT id, name FROM permissions ORDER BY name"
    );

    // Obtener permisos asignados al rol
    const [assignedPermissions] = await db.execute(
      "SELECT permission_id FROM role_has_permissions WHERE role_id = ?",
      [id]
    );

    const assignedIds = assignedPermissions.map((p) => p.permission_id);

    // Marcar permisos asignados
    const permissionsWithStatus = allPermissions.map((perm) => ({
      ...perm,
      assigned: assignedIds.includes(perm.id),
    }));

    res.json({
      roleId: id,
      permissions: permissionsWithStatus,
    });
  } catch (error) {
    console.error("Error al obtener permisos del rol:", error);
    res.status(500).json({
      message: "Error al obtener permisos del rol",
      error: error.message,
    });
  }
};

// const assignPermissionsToRole = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { permissionIds } = req.body;

//     // Verificar que el rol exista
//     const [roleRows] = await db.execute("SELECT id FROM roles WHERE id = ?", [
//       id,
//     ]);
//     if (roleRows.length === 0) {
//       return res.status(404).json({ message: "Rol no encontrado" });
//     }

//     // Eliminar todas las asignaciones actuales
//     await db.execute("DELETE FROM role_has_permissions WHERE role_id = ?", [
//       id,
//     ]);

//     // Insertar nuevas asignaciones
//     if (permissionIds && permissionIds.length > 0) {
//       const values = permissionIds.map((permId) => [id, permId]);
//       await db.execute(
//         "INSERT INTO role_has_permissions (role_id, permission_id) VALUES ?",
//         [values]
//       );
//     }

//     res.json({ message: "Permisos asignados exitosamente" });
//   } catch (error) {
//     console.error("Error al asignar permisos al rol:", error);
//     res
//       .status(500)
//       .json({
//         message: "Error al asignar permisos al rol",
//         error: error.message,
//       });
//   }
// };

const assignPermissionsToRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;

    // Verificar que el rol exista
    const [roleRows] = await db.execute("SELECT id FROM roles WHERE id = ?", [
      id,
    ]);
    if (roleRows.length === 0) {
      return res.status(404).json({ message: "Rol no encontrado" });
    }

    // Eliminar todas las asignaciones actuales
    await db.execute("DELETE FROM role_has_permissions WHERE role_id = ?", [
      id,
    ]);

    // Insertar nuevas asignaciones
    if (permissionIds && permissionIds.length > 0) {
      // Construir la consulta dinámicamente
      const placeholders = permissionIds.map(() => "(?, ?)").join(", ");
      const values = permissionIds.flatMap((permId) => [id, permId]);

      await db.execute(
        `INSERT INTO role_has_permissions (role_id, permission_id) VALUES ${placeholders}`,
        values
      );
    }

    res.json({ message: "Permisos asignados exitosamente" });
  } catch (error) {
    console.error("Error al asignar permisos al rol:", error);
    res
      .status(500)
      .json({
        message: "Error al asignar permisos al rol",
        error: error.message,
      });
  }
};

const createRole = async (req, res) => {
  try {
    const { name } = req.body;

    // Validar nombre
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        message: "El nombre del rol debe tener al menos 2 caracteres",
      });
    }

    // Verificar si el rol ya existe
    const [existing] = await db.execute("SELECT id FROM roles WHERE name = ?", [
      name,
    ]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "El rol ya existe" });
    }

    const [result] = await db.execute("INSERT INTO roles (name) VALUES (?)", [
      name,
    ]);
    res
      .status(201)
      .json({ message: "Rol creado exitosamente", id: result.insertId });
  } catch (error) {
    console.error("Error al crear rol:", error);
    res
      .status(500)
      .json({ message: "Error al crear rol", error: error.message });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // No permitir cambiar el nombre del rol Administrador
    if (id == 1 && name !== "Administrador") {
      return res.status(400).json({
        message: "No se puede cambiar el nombre del rol Administrador",
      });
    }

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        message: "El nombre del rol debe tener al menos 2 caracteres",
      });
    }

    const [result] = await db.execute(
      "UPDATE roles SET name = ? WHERE id = ?",
      [name, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Rol no encontrado" });
    }

    res.json({ message: "Rol actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar rol:", error);
    res
      .status(500)
      .json({ message: "Error al actualizar rol", error: error.message });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminar roles con usuarios asignados
    const [assigned] = await db.execute(
      "SELECT COUNT(*) as count FROM model_has_roles WHERE role_id = ?",
      [id]
    );

    if (assigned[0].count > 0) {
      return res.status(400).json({
        message: "No se puede eliminar un rol que tiene usuarios asignados",
      });
    }

    const [result] = await db.execute("DELETE FROM roles WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Rol no encontrado" });
    }

    res.json({ message: "Rol eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar rol:", error);
    res
      .status(500)
      .json({ message: "Error al eliminar rol", error: error.message });
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
};
