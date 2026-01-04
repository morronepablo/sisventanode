// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Role = require("../models/Role");
require("dotenv").config();

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Obtener roles del usuario
    const roles = await Role.findByUserId(user.id);
    let allPermisos = new Set();

    // Obtener permisos de cada rol
    for (const role of roles) {
      const permisos = await Role.getPermissionsByRole(role.id);
      permisos.forEach((p) => allPermisos.add(p));
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        empresa_id: user.empresa_id,
        permisos: Array.from(allPermisos),
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        empresa_id: user.empresa_id,
        permisos: Array.from(allPermisos),
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res
      .status(500)
      .json({ message: "Error en el servidor", error: error.message });
  }
};

const register = async (req, res) => {
  const { name, email, password, empresa_id } = req.body;

  try {
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = await User.create({
      name,
      email,
      password: hashedPassword,
      empresa_id: empresa_id || 1, // Por defecto 1 si no se envía
    });

    res.status(201).json({ message: "Usuario creado exitosamente", userId });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al registrar usuario", error: error.message });
  }
};

module.exports = { login, register };
