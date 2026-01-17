// // controllers/authController.js
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");
// const Role = require("../models/Role");
// const db = require("../config/db");
// const { registrarLog } = require("../utils/logger");

// require("dotenv").config();

// const login = async (req, res) => {
//   const { email, password, caja_id } = req.body;
//   const CLIENT_CAJA = Number(caja_id || 1); // La caja que manda la PC

//   try {
//     const user = await User.findByEmail(email);
//     if (!user)
//       return res.status(401).json({ message: "Credenciales inválidas" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch)
//       return res.status(401).json({ message: "Credenciales inválidas" });

//     const userId = Number(user.id);
//     const empresaId = Number(user.empresa_id);

//     // --- 🛡️ LÓGICA DE BLOQUEO MULTICAJA ---

//     // 1. Buscamos si existe un arqueo abierto EN LA CAJA que la PC declara
//     const [arqueoOpen] = await db.execute(
//       `SELECT a.usuario_id, u.name as usuario_nombre
//        FROM arqueos a
//        INNER JOIN users u ON a.usuario_id = u.id
//        WHERE a.empresa_id = ?
//        AND a.caja_id = ?
//        AND (a.fecha_cierre IS NULL OR a.fecha_cierre = '' OR a.estado = 'Abierto')
//        LIMIT 1`,
//       [empresaId, CLIENT_CAJA],
//     );

//     if (arqueoOpen.length > 0) {
//       const idUsuarioQueAbrio = Number(arqueoOpen[0].usuario_id);

//       // REGLA DE ORO:
//       // Solo dejamos entrar si:
//       // a) El usuario que se loguea es el MISMO que abrió la caja.
//       // b) El usuario que se loguea es el ADMINISTRADOR MAESTRO (ID 1).

//       if (userId !== idUsuarioQueAbrio && userId !== 1) {
//         return res.status(403).json({
//           success: false,
//           message: `ACCESO DENEGADO A CAJA ${CLIENT_CAJA}. El usuario ${arqueoOpen[0].usuario_nombre} tiene esta caja abierta. Debe cerrarla para que otro cajero pueda usarla.`,
//         });
//       }
//     }

//     // 2. Si pasó el filtro, seguimos con la sesión...
//     const [configRows] = await db.execute(
//       "SELECT unidad, cantidad FROM config_sessions LIMIT 1",
//     );
//     const sessionConfig = configRows[0] || { unidad: "horas", cantidad: 24 };
//     let timeSuffix =
//       sessionConfig.unidad === "minutos"
//         ? "m"
//         : sessionConfig.unidad === "dias"
//           ? "d"
//           : "h";
//     const expireTime = `${sessionConfig.cantidad}${timeSuffix}`;

//     const roles = await Role.findByUserId(user.id);
//     let allPermisos = new Set();
//     for (const role of roles) {
//       const permisos = await Role.getPermissionsByRole(role.id);
//       permisos.forEach((p) => allPermisos.add(p));
//     }

//     // 3. Generar TOKEN con CAJA_ID (para que las ventas se registren en la caja correcta)
//     const token = jwt.sign(
//       {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         empresa_id: user.empresa_id,
//         caja_id: CLIENT_CAJA,
//         permisos: Array.from(allPermisos),
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: expireTime },
//     );

//     await registrarLog(
//       req,
//       "LOGIN",
//       "AUTENTICACION",
//       `Inició sesión en Caja ${CLIENT_CAJA}`,
//       user.id,
//       user.empresa_id,
//     );

//     res.json({
//       token,
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         empresa_id: user.empresa_id,
//         caja_id: CLIENT_CAJA,
//         permisos: Array.from(allPermisos),
//       },
//     });
//   } catch (error) {
//     console.error("Error en login:", error);
//     res.status(500).json({ message: "Error en el servidor" });
//   }
// };

// const register = async (req, res) => {
//   const { name, email, password, empresa_id } = req.body;
//   try {
//     const existingUser = await User.findByEmail(email);
//     if (existingUser)
//       return res.status(400).json({ message: "El correo ya está registrado" });
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const userId = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       empresa_id: empresa_id || 1,
//     });
//     res.status(201).json({ message: "Usuario creado exitosamente", userId });
//   } catch (error) {
//     res.status(500).json({ message: "Error al registrar usuario" });
//   }
// };

// const logoutLog = async (req, res) => {
//   try {
//     const { motivo } = req.body;
//     await registrarLog(
//       req,
//       "LOGOUT",
//       "AUTENTICACION",
//       `Sesión cerrada: ${motivo}`,
//     );
//     res.json({ success: true });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// const logExpiration = async (req, res) => {
//   try {
//     const { userId, empresaId } = req.body;
//     await registrarLog(
//       req,
//       "LOGOUT",
//       "AUTENTICACION",
//       "Sesión expirada",
//       userId,
//       empresaId,
//     );
//     res.json({ success: true });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// module.exports = { login, register, logoutLog, logExpiration };

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Role = require("../models/Role");
const db = require("../config/db");
const { registrarLog } = require("../utils/logger");
const { execSync } = require("child_process"); // 👈 Requerido para leer el hardware

require("dotenv").config();

/**
 * 🚀 FUNCIÓN NIVEL OLIMPO: Obtiene el Serial Físico del Disco Rígido (Windows)
 * Es la huella dactilar inmutable del hardware.
 */
function getHardwareSerial() {
  try {
    // Ejecuta comando de Windows para obtener el serial del disco físico
    const output = execSync("wmic diskdrive get serialnumber").toString();
    // Limpiamos el texto para quedarnos solo con el número
    const lines = output
      .split("\n")
      .filter(
        (line) => line.trim() && !line.toLowerCase().includes("serialnumber"),
      );
    if (lines.length > 0) {
      return lines[0].trim().toUpperCase();
    }
    return "SERIAL_NO_DETECTADO";
  } catch (e) {
    console.error("Error leyendo hardware:", e);
    return "ERROR_ACCESO_SISTEMA";
  }
}

const login = async (req, res) => {
  const { email, password, caja_id } = req.body;
  const CLIENT_CAJA = Number(caja_id || 1);

  try {
    // --- 🛡️ PASO 0: VALIDACIÓN DE LICENCIA POR HARDWARE (DISCO C:) ---
    const currentDiskSerial = getHardwareSerial();
    const [licencia] = await db.execute(
      "SELECT serial_autorizado FROM sistema_licencia WHERE id = 1",
    );

    // Si el serial de la PC no coincide con el guardado en la DB...
    if (
      licencia.length === 0 ||
      licencia[0].serial_autorizado !== currentDiskSerial
    ) {
      console.error(`🚨 INTENTO DE ACCESO NO AUTORIZADO 🚨`);
      console.error(`Serial de esta PC: ${currentDiskSerial}`);
      console.error(
        `Serial en DB: ${licencia[0]?.serial_autorizado || "NO CONFIGURADO"}`,
      );

      return res.status(451).json({
        success: false,
        message: `SISTEMA NO AUTORIZADO: Esta terminal (${currentDiskSerial}) no cuenta con una licencia activa. Por favor, contacte al desarrollador para habilitar el equipo.`,
      });
    }

    // --- CONTINÚA EL LOGIN NORMAL ---
    const user = await User.findByEmail(email);
    if (!user)
      return res.status(401).json({ message: "Credenciales inválidas" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Credenciales inválidas" });

    const userId = Number(user.id);
    const empresaId = Number(user.empresa_id);

    // --- 🛡️ LÓGICA DE BLOQUEO MULTICAJA ---
    const [arqueoOpen] = await db.execute(
      `SELECT a.usuario_id, u.name as usuario_nombre 
       FROM arqueos a 
       INNER JOIN users u ON a.usuario_id = u.id 
       WHERE a.empresa_id = ? 
       AND a.caja_id = ? 
       AND (a.fecha_cierre IS NULL OR a.fecha_cierre = '' OR a.estado = 'Abierto') 
       LIMIT 1`,
      [empresaId, CLIENT_CAJA],
    );

    if (arqueoOpen.length > 0) {
      const idUsuarioQueAbrio = Number(arqueoOpen[0].usuario_id);
      if (userId !== idUsuarioQueAbrio && userId !== 1) {
        return res.status(403).json({
          success: false,
          message: `ACCESO DENEGADO A CAJA ${CLIENT_CAJA}. El usuario ${arqueoOpen[0].usuario_nombre} tiene esta caja abierta. Debe cerrarla para que otro cajero pueda usarla.`,
        });
      }
    }

    // 2. Configuración de sesión
    const [configRows] = await db.execute(
      "SELECT unidad, cantidad FROM config_sessions LIMIT 1",
    );
    const sessionConfig = configRows[0] || { unidad: "horas", cantidad: 24 };
    let timeSuffix =
      sessionConfig.unidad === "minutos"
        ? "m"
        : sessionConfig.unidad === "dias"
          ? "d"
          : "h";
    const expireTime = `${sessionConfig.cantidad}${timeSuffix}`;

    const roles = await Role.findByUserId(user.id);
    let allPermisos = new Set();
    for (const role of roles) {
      const permisos = await Role.getPermissionsByRole(role.id);
      permisos.forEach((p) => allPermisos.add(p));
    }

    // 3. Generar TOKEN
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        empresa_id: user.empresa_id,
        caja_id: CLIENT_CAJA,
        permisos: Array.from(allPermisos),
      },
      process.env.JWT_SECRET,
      { expiresIn: expireTime },
    );

    await registrarLog(
      req,
      "LOGIN",
      "AUTENTICACION",
      `Inició sesión en Caja ${CLIENT_CAJA}. Hardware: ${currentDiskSerial}`,
      user.id,
      user.empresa_id,
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        empresa_id: user.empresa_id,
        caja_id: CLIENT_CAJA,
        permisos: Array.from(allPermisos),
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const register = async (req, res) => {
  const { name, email, password, empresa_id } = req.body;
  try {
    const existingUser = await User.findByEmail(email);
    if (existingUser)
      return res.status(400).json({ message: "El correo ya está registrado" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await User.create({
      name,
      email,
      password: hashedPassword,
      empresa_id: empresa_id || 1,
    });
    res.status(201).json({ message: "Usuario creado exitosamente", userId });
  } catch (error) {
    res.status(500).json({ message: "Error al registrar usuario" });
  }
};

const logoutLog = async (req, res) => {
  try {
    const { motivo } = req.body;
    await registrarLog(
      req,
      "LOGOUT",
      "AUTENTICACION",
      `Sesión cerrada: ${motivo}`,
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const logExpiration = async (req, res) => {
  try {
    const { userId, empresaId } = req.body;
    await registrarLog(
      req,
      "LOGOUT",
      "AUTENTICACION",
      "Sesión expirada",
      userId,
      empresaId,
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { login, register, logoutLog, logExpiration };
