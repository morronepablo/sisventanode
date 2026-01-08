// controllers/userController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { registrarLog } = require("../utils/logger"); // 👈 Importamos el logger

// const getAllUsers = async (req, res) => {
//   try {
//     const users = await User.getAll();
//     const usersWithRoles = [];

//     for (const user of users) {
//       const roles = await User.getRolesByUserId(user.id);
//       usersWithRoles.push({
//         ...user,
//         roles: roles,
//       });
//     }

//     res.json(usersWithRoles);
//   } catch (error) {
//     console.error("Error al obtener usuarios:", error);
//     res
//       .status(500)
//       .json({ message: "Error al obtener usuarios", error: error.message });
//   }
// };

const getAllUsers = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id; // Obtenemos la empresa del token

    // Consulta avanzada para obtener usuarios y verificar actividad
    const query = `
      SELECT 
        u.*,
        (
          SELECT COUNT(*) FROM ventas WHERE usuario_id = u.id
        ) +
        (
          SELECT COUNT(*) FROM compras WHERE usuario_id = u.id
        ) +
        (
          SELECT COUNT(*) FROM arqueos WHERE usuario_id = u.id
        ) +
        (
          SELECT COUNT(*) FROM gastos WHERE usuario_id = u.id
        ) +
        (
          SELECT COUNT(*) FROM ajustes WHERE usuario_id = u.id
        ) as total_actividad
      FROM users u
      WHERE u.empresa_id = ?
      ORDER BY u.id ASC
    `;

    const [users] = await db.execute(query, [empresa_id]);
    const usersWithRoles = [];

    for (const user of users) {
      const roles = await User.getRolesByUserId(user.id);
      usersWithRoles.push({
        ...user,
        roles: roles,
        // Un usuario puede eliminarse si total_actividad es 0 y no es el Admin ID 1
        puede_eliminarse: user.total_actividad === 0 && user.id !== 1,
      });
    }

    res.json(usersWithRoles);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const roles = await User.getRolesByUserId(user.id);
    res.json({ ...user, roles });
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res
      .status(500)
      .json({ message: "Error al obtener usuario", error: error.message });
  }
};

const createUser = async (req, res) => {
  console.log("--- INICIO CREATE USUARIO ---");
  try {
    const { name, email, password, empresa_id, roles } = req.body;

    const emailExists = await User.emailExists(email);
    if (emailExists) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Crear usuario
    const userId = await User.create({
      name,
      email,
      password: hashedPassword,
      empresa_id: empresa_id || 1,
    });
    console.log(`[USUARIOS] Usuario creado con ID: ${userId}`);

    // 2. Asignar roles
    if (roles && roles.length > 0) {
      for (const roleId of roles) {
        await User.assignRoleToUser(userId, roleId);
      }
      console.log(`[USUARIOS] Roles asignados al ID: ${userId}`);
    }

    // 3. REGISTRO DE LOG
    await registrarLog(
      req,
      "CREAR",
      "USUARIOS",
      `Se registró un nuevo usuario: ${email} (Nombre: ${name})`
    );

    res.status(201).json({
      message: "Usuario creado exitosamente",
      userId: userId,
    });
  } catch (error) {
    console.error("[USUARIOS ERROR] Fallo al crear usuario:", error);
    res
      .status(500)
      .json({ message: "Error al crear usuario", error: error.message });
  }
  console.log("--- FIN CREATE USUARIO ---");
};

const updateUser = async (req, res) => {
  console.log("--- INICIO UPDATE USUARIO ---");
  try {
    const { id } = req.params;
    const { name, email, empresa_id, roles } = req.body;

    const emailExists = await User.emailExists(email, id);
    if (emailExists) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    // 1. Actualizar datos base
    const updated = await User.updateById(id, { name, email, empresa_id });
    if (!updated) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    console.log(`[USUARIOS] Datos base actualizados para ID: ${id}`);

    // 2. Actualizar roles (Quitar y Poner)
    if (roles) {
      await User.removeRolesFromUser(id);
      for (const roleId of roles) {
        await User.assignRoleToUser(id, roleId);
      }
      console.log(`[USUARIOS] Roles sincronizados para ID: ${id}`);
    }

    // 3. REGISTRO DE LOG
    await registrarLog(
      req,
      "EDITAR",
      "USUARIOS",
      `Se actualizaron los datos y roles del usuario: ${email} (ID: ${id})`
    );

    res.json({ message: "Usuario actualizado exitosamente" });
  } catch (error) {
    console.error("[USUARIOS ERROR] Fallo al actualizar usuario:", error);
    res
      .status(500)
      .json({ message: "Error al actualizar usuario", error: error.message });
  }
  console.log("--- FIN UPDATE USUARIO ---");
};

// const deleteUser = async (req, res) => {
//   console.log("--- INICIO DELETE USUARIO ---");
//   try {
//     const { id } = req.params;

//     if (id == 1) {
//       return res
//         .status(400)
//         .json({ message: "No se puede eliminar al usuario Admin" });
//     }

//     // Obtenemos los datos antes de borrar para el LOG
//     const userToDelete = await User.findById(id);

//     const deleted = await User.deleteById(id);
//     if (!deleted) {
//       return res.status(404).json({ message: "Usuario no encontrado" });
//     }
//     console.log(`[USUARIOS] Usuario ID ${id} eliminado con éxito.`);

//     // 3. REGISTRO DE LOG
//     await registrarLog(
//       req,
//       "ELIMINAR",
//       "USUARIOS",
//       `Se eliminó al usuario: ${userToDelete ? userToDelete.email : "ID " + id}`
//     );

//     res.json({ message: "Usuario eliminado exitosamente" });
//   } catch (error) {
//     console.error("[USUARIOS ERROR] Fallo al eliminar usuario:", error);
//     res
//       .status(500)
//       .json({ message: "Error al eliminar usuario", error: error.message });
//   }
//   console.log("--- FIN DELETE USUARIO ---");
// };

const deleteUser = async (req, res) => {
  console.log("--- INICIO DELETE USUARIO ---");
  try {
    const { id } = req.params;
    const currentUserId = req.user.id; // ID del usuario logueado (desde el token)

    // 1. Impedir borrar al Admin principal
    if (id == 1) {
      return res
        .status(400)
        .json({
          message: "No se puede eliminar al usuario Administrador maestro.",
        });
    }

    // 2. Impedir que un usuario se borre a sí mismo
    if (id == currentUserId) {
      return res
        .status(400)
        .json({
          message:
            "No puedes eliminar tu propia cuenta mientras estás logueado.",
        });
    }

    // 3. Verificar actividad antes de borrar (Validación de seguridad en el servidor)
    const [check] = await db.execute(
      `
       SELECT 
        (SELECT COUNT(*) FROM ventas WHERE usuario_id = ?) +
        (SELECT COUNT(*) FROM compras WHERE usuario_id = ?) +
        (SELECT COUNT(*) FROM arqueos WHERE usuario_id = ?) as actividad
    `,
      [id, id, id]
    );

    if (check[0].actividad > 0) {
      return res
        .status(400)
        .json({
          message:
            "No se puede eliminar el usuario porque tiene historial de movimientos registrado.",
        });
    }

    const userToDelete = await User.findById(id);
    const deleted = await User.deleteById(id);

    if (!deleted) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    await registrarLog(
      req,
      "ELIMINAR",
      "USUARIOS",
      `Se eliminó al usuario: ${userToDelete ? userToDelete.email : "ID " + id}`
    );

    res.json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    console.error("[USUARIOS ERROR] Fallo al eliminar usuario:", error);
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
  console.log("--- FIN DELETE USUARIO ---");
};

const countUsers = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT COUNT(*) AS total FROM users");
    const total = rows[0].total;
    res.json({ total });
  } catch (error) {
    console.error("Error al contar usuarios:", error);
    res.status(500).json({ total: 0 });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  countUsers,
};
