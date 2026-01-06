// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Role = require("../models/Role");
const db = require("../config/db");
const { registrarLog } = require("../utils/logger");

require("dotenv").config();

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Verificar existencia del usuario
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // 2. Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // 3. OBTENER CONFIGURACIÓN DE SESIÓN DINÁMICA
    const [configRows] = await db.execute(
      "SELECT unidad, cantidad FROM config_sessions LIMIT 1"
    );

    // Si la tabla no tiene datos, usamos 24 horas por defecto
    const sessionConfig = configRows[0] || { unidad: "horas", cantidad: 24 };

    // --- CORRECCIÓN AQUÍ: Usamos .unidad (español) tal cual está en la DB ---
    let timeSuffix = "h"; // Por defecto horas
    if (sessionConfig.unidad === "minutos") timeSuffix = "m";
    if (sessionConfig.unidad === "dias") timeSuffix = "d";

    const expireTime = `${sessionConfig.cantidad}${timeSuffix}`;

    // Log de seguimiento en la terminal del servidor
    console.log(
      `Generando token para ${user.email} con duración: ${expireTime}`
    );

    // 4. Obtener roles y permisos del usuario
    const roles = await Role.findByUserId(user.id);
    let allPermisos = new Set();

    for (const role of roles) {
      const permisos = await Role.getPermissionsByRole(role.id);
      permisos.forEach((p) => allPermisos.add(p));
    }

    // 5. Firmar el TOKEN con el tiempo dinámico
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        empresa_id: user.empresa_id,
        permisos: Array.from(allPermisos),
      },
      process.env.JWT_SECRET,
      { expiresIn: expireTime }
    );

    // 6. Registrar log de inicio de sesión
    await registrarLog(
      req,
      "LOGIN",
      "AUTENTICACION",
      `El usuario ${user.email} inició sesión`,
      user.id,
      user.empresa_id
    );

    // 7. Respuesta al cliente
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
      empresa_id: empresa_id || 1,
    });
    res.status(201).json({ message: "Usuario creado exitosamente", userId });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al registrar usuario", error: error.message });
  }
};

const logoutLog = async (req, res) => {
  try {
    const { motivo } = req.body;
    await registrarLog(
      req,
      "LOGOUT",
      "AUTENTICACION",
      `Sesión cerrada. Motivo: ${motivo}`
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error al registrar log de logout:", error);
    res.status(500).json({ error: error.message });
  }
};

const logExpiration = async (req, res) => {
  try {
    const { userId, empresaId } = req.body;

    // Usamos el logger con los IDs manuales que nos manda el frontend
    await registrarLog(
      req,
      "LOGOUT",
      "AUTENTICACION",
      "Sesión cerrada automáticamente por vencimiento de token",
      userId,
      empresaId
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error al registrar log de expiración:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { login, register, logoutLog, logExpiration };
