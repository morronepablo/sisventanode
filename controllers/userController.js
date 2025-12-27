// controllers/userController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    const usersWithRoles = [];

    for (const user of users) {
      const roles = await User.getRolesByUserId(user.id);
      console.log(`Usuario ${user.id} tiene roles:`, roles); // ← AÑADE ESTO
      usersWithRoles.push({
        ...user,
        roles: roles,
      });
    }

    res.json(usersWithRoles);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res
      .status(500)
      .json({ message: "Error al obtener usuarios", error: error.message });
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
  try {
    const { name, email, password, empresa_id, roles } = req.body;

    // Validar que el email no exista
    const emailExists = await User.emailExists(email);
    if (emailExists) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    // Validar contraseña
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const userId = await User.create({
      name,
      email,
      password: hashedPassword,
      empresa_id: empresa_id || 1,
    });

    // Asignar roles si se proporcionan
    if (roles && roles.length > 0) {
      for (const roleId of roles) {
        await User.assignRoleToUser(userId, roleId);
      }
    }

    res.status(201).json({
      message: "Usuario creado exitosamente",
      userId: userId,
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({
      message: "Error al crear usuario",
      error: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, empresa_id, roles } = req.body;

    // Validar que el email no exista (excluyendo el usuario actual)
    const emailExists = await User.emailExists(email, id);
    if (emailExists) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    // Actualizar usuario
    const updated = await User.updateById(id, { name, email, empresa_id });
    if (!updated) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Actualizar roles
    if (roles) {
      // Eliminar roles actuales
      await User.removeRolesFromUser(id);
      // Asignar nuevos roles
      for (const roleId of roles) {
        await User.assignRoleToUser(id, roleId);
      }
    }

    res.json({ message: "Usuario actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res
      .status(500)
      .json({ message: "Error al actualizar usuario", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminar al usuario Admin (id=1)
    if (id == 1) {
      return res
        .status(400)
        .json({ message: "No se puede eliminar al usuario Admin" });
    }

    const deleted = await User.deleteById(id);
    if (!deleted) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res
      .status(500)
      .json({ message: "Error al eliminar usuario", error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
