// // // // controllers/authController.js
// // // const bcrypt = require("bcryptjs");
// // // const jwt = require("jsonwebtoken");
// // // const User = require("../models/User");
// // // const Role = require("../models/Role");
// // // const db = require("../config/db");
// // // const { registrarLog } = require("../utils/logger");

// // // require("dotenv").config();

// // // const login = async (req, res) => {
// // //   const { email, password } = req.body;

// // //   try {
// // //     // 1. Verificar existencia del usuario
// // //     const user = await User.findByEmail(email);
// // //     if (!user) {
// // //       return res.status(401).json({ message: "Credenciales inválidas" });
// // //     }

// // //     // 2. Verificar contraseña
// // //     const isMatch = await bcrypt.compare(password, user.password);
// // //     if (!isMatch) {
// // //       return res.status(401).json({ message: "Credenciales inválidas" });
// // //     }

// // //     // 3. OBTENER CONFIGURACIÓN DE SESIÓN DINÁMICA
// // //     const [configRows] = await db.execute(
// // //       "SELECT unidad, cantidad FROM config_sessions LIMIT 1"
// // //     );

// // //     // Si la tabla no tiene datos, usamos 24 horas por defecto
// // //     const sessionConfig = configRows[0] || { unidad: "horas", cantidad: 24 };

// // //     // --- CORRECCIÓN AQUÍ: Usamos .unidad (español) tal cual está en la DB ---
// // //     let timeSuffix = "h"; // Por defecto horas
// // //     if (sessionConfig.unidad === "minutos") timeSuffix = "m";
// // //     if (sessionConfig.unidad === "dias") timeSuffix = "d";

// // //     const expireTime = `${sessionConfig.cantidad}${timeSuffix}`;

// // //     // Log de seguimiento en la terminal del servidor
// // //     console.log(
// // //       `Generando token para ${user.email} con duración: ${expireTime}`
// // //     );

// // //     // 4. Obtener roles y permisos del usuario
// // //     const roles = await Role.findByUserId(user.id);
// // //     let allPermisos = new Set();

// // //     for (const role of roles) {
// // //       const permisos = await Role.getPermissionsByRole(role.id);
// // //       permisos.forEach((p) => allPermisos.add(p));
// // //     }

// // //     // 5. Firmar el TOKEN con el tiempo dinámico
// // //     const token = jwt.sign(
// // //       {
// // //         id: user.id,
// // //         name: user.name,
// // //         email: user.email,
// // //         empresa_id: user.empresa_id,
// // //         permisos: Array.from(allPermisos),
// // //       },
// // //       process.env.JWT_SECRET,
// // //       { expiresIn: expireTime }
// // //     );

// // //     // 6. Registrar log de inicio de sesión
// // //     await registrarLog(
// // //       req,
// // //       "LOGIN",
// // //       "AUTENTICACION",
// // //       `El usuario ${user.email} inició sesión`,
// // //       user.id,
// // //       user.empresa_id
// // //     );

// // //     // 7. Respuesta al cliente
// // //     res.json({
// // //       token,
// // //       user: {
// // //         id: user.id,
// // //         name: user.name,
// // //         email: user.email,
// // //         empresa_id: user.empresa_id,
// // //         permisos: Array.from(allPermisos),
// // //       },
// // //     });
// // //   } catch (error) {
// // //     console.error("Error en login:", error);
// // //     res
// // //       .status(500)
// // //       .json({ message: "Error en el servidor", error: error.message });
// // //   }
// // // };

// // // const register = async (req, res) => {
// // //   const { name, email, password, empresa_id } = req.body;
// // //   try {
// // //     const existingUser = await User.findByEmail(email);
// // //     if (existingUser) {
// // //       return res.status(400).json({ message: "El correo ya está registrado" });
// // //     }
// // //     const hashedPassword = await bcrypt.hash(password, 10);
// // //     const userId = await User.create({
// // //       name,
// // //       email,
// // //       password: hashedPassword,
// // //       empresa_id: empresa_id || 1,
// // //     });
// // //     res.status(201).json({ message: "Usuario creado exitosamente", userId });
// // //   } catch (error) {
// // //     res
// // //       .status(500)
// // //       .json({ message: "Error al registrar usuario", error: error.message });
// // //   }
// // // };

// // // const logoutLog = async (req, res) => {
// // //   try {
// // //     const { motivo } = req.body;
// // //     await registrarLog(
// // //       req,
// // //       "LOGOUT",
// // //       "AUTENTICACION",
// // //       `Sesión cerrada. Motivo: ${motivo}`
// // //     );
// // //     res.json({ success: true });
// // //   } catch (error) {
// // //     console.error("Error al registrar log de logout:", error);
// // //     res.status(500).json({ error: error.message });
// // //   }
// // // };

// // // const logExpiration = async (req, res) => {
// // //   try {
// // //     const { userId, empresaId } = req.body;

// // //     // Usamos el logger con los IDs manuales que nos manda el frontend
// // //     await registrarLog(
// // //       req,
// // //       "LOGOUT",
// // //       "AUTENTICACION",
// // //       "Sesión cerrada automáticamente por vencimiento de token",
// // //       userId,
// // //       empresaId
// // //     );

// // //     res.json({ success: true });
// // //   } catch (error) {
// // //     console.error("Error al registrar log de expiración:", error);
// // //     res.status(500).json({ error: error.message });
// // //   }
// // // };

// // // module.exports = { login, register, logoutLog, logExpiration };

// // // controllers/authController.js
// // const bcrypt = require("bcryptjs");
// // const jwt = require("jsonwebtoken");
// // const User = require("../models/User");
// // const Role = require("../models/Role");
// // const db = require("../config/db");
// // const { registrarLog } = require("../utils/logger");

// // require("dotenv").config();

// // const login = async (req, res) => {
// //   const { email, password } = req.body;

// //   try {
// //     // 1. Verificar existencia del usuario
// //     const user = await User.findByEmail(email);
// //     if (!user) {
// //       return res.status(401).json({ message: "Credenciales inválidas" });
// //     }

// //     // 2. Verificar contraseña
// //     const isMatch = await bcrypt.compare(password, user.password);
// //     if (!isMatch) {
// //       return res.status(401).json({ message: "Credenciales inválidas" });
// //     }

// //     // --- 🛡️ INICIO DE BLOQUEO POR ARQUEO AJENO ---
// //     // Buscamos si hay algún arqueo abierto en la empresa de este usuario
// //     const [arqueoOpen] = await db.execute(
// //       `SELECT a.usuario_id, u.name as usuario_nombre
// //        FROM arqueos a
// //        INNER JOIN users u ON a.usuario_id = u.id
// //        WHERE a.empresa_id = ?
// //        AND (a.fecha_cierre IS NULL OR a.fecha_cierre = '' OR a.estado = 'Abierto')
// //        LIMIT 1`,
// //       [user.empresa_id]
// //     );

// //     // Lógica de bloqueo:
// //     // - Si hay un arqueo abierto
// //     // - Y no pertenece al usuario que intenta loguearse
// //     // - Y el usuario que intenta loguearse NO es el administrador (ID 1)
// //     if (
// //       arqueoOpen.length > 0 &&
// //       arqueoOpen[0].usuario_id !== user.id &&
// //       user.id !== 1
// //     ) {
// //       return res.status(403).json({
// //         success: false,
// //         type: "ARQUEO_BLOQUEADO",
// //         message: `Acceso denegado. Existe un arqueo abierto de: ${arqueoOpen[0].usuario_nombre}. Por seguridad, ese usuario debe cerrar su caja antes de que otro pueda iniciar sesión.`,
// //       });
// //     }
// //     // --- 🛡️ FIN DE BLOQUEO ---

// //     // 3. OBTENER CONFIGURACIÓN DE SESIÓN DINÁMICA
// //     const [configRows] = await db.execute(
// //       "SELECT unidad, cantidad FROM config_sessions LIMIT 1"
// //     );

// //     const sessionConfig = configRows[0] || { unidad: "horas", cantidad: 24 };

// //     let timeSuffix = "h";
// //     if (sessionConfig.unidad === "minutos") timeSuffix = "m";
// //     if (sessionConfig.unidad === "dias") timeSuffix = "d";

// //     const expireTime = `${sessionConfig.cantidad}${timeSuffix}`;

// //     console.log(
// //       `Generando token para ${user.email} con duración: ${expireTime}`
// //     );

// //     // 4. Obtener roles y permisos del usuario
// //     const roles = await Role.findByUserId(user.id);
// //     let allPermisos = new Set();

// //     for (const role of roles) {
// //       const permisos = await Role.getPermissionsByRole(role.id);
// //       permisos.forEach((p) => allPermisos.add(p));
// //     }

// //     // 5. Firmar el TOKEN con el tiempo dinámico
// //     const token = jwt.sign(
// //       {
// //         id: user.id,
// //         name: user.name,
// //         email: user.email,
// //         empresa_id: user.empresa_id,
// //         permisos: Array.from(allPermisos),
// //       },
// //       process.env.JWT_SECRET,
// //       { expiresIn: expireTime }
// //     );

// //     // 6. Registrar log de inicio de sesión
// //     await registrarLog(
// //       req,
// //       "LOGIN",
// //       "AUTENTICACION",
// //       `El usuario ${user.email} inició sesión`,
// //       user.id,
// //       user.empresa_id
// //     );

// //     // 7. Respuesta al cliente
// //     res.json({
// //       token,
// //       user: {
// //         id: user.id,
// //         name: user.name,
// //         email: user.email,
// //         empresa_id: user.empresa_id,
// //         permisos: Array.from(allPermisos),
// //       },
// //     });
// //   } catch (error) {
// //     console.error("Error en login:", error);
// //     res
// //       .status(500)
// //       .json({ message: "Error en el servidor", error: error.message });
// //   }
// // };

// // const register = async (req, res) => {
// //   const { name, email, password, empresa_id } = req.body;
// //   try {
// //     const existingUser = await User.findByEmail(email);
// //     if (existingUser) {
// //       return res.status(400).json({ message: "El correo ya está registrado" });
// //     }
// //     const hashedPassword = await bcrypt.hash(password, 10);
// //     const userId = await User.create({
// //       name,
// //       email,
// //       password: hashedPassword,
// //       empresa_id: empresa_id || 1,
// //     });
// //     res.status(201).json({ message: "Usuario creado exitosamente", userId });
// //   } catch (error) {
// //     res
// //       .status(500)
// //       .json({ message: "Error al registrar usuario", error: error.message });
// //   }
// // };

// // const logoutLog = async (req, res) => {
// //   try {
// //     const { motivo } = req.body;
// //     await registrarLog(
// //       req,
// //       "LOGOUT",
// //       "AUTENTICACION",
// //       `Sesión cerrada. Motivo: ${motivo}`
// //     );
// //     res.json({ success: true });
// //   } catch (error) {
// //     console.error("Error al registrar log de logout:", error);
// //     res.status(500).json({ error: error.message });
// //   }
// // };

// // const logExpiration = async (req, res) => {
// //   try {
// //     const { userId, empresaId } = req.body;

// //     await registrarLog(
// //       req,
// //       "LOGOUT",
// //       "AUTENTICACION",
// //       "Sesión cerrada automáticamente por vencimiento de token",
// //       userId,
// //       empresaId
// //     );

// //     res.json({ success: true });
// //   } catch (error) {
// //     console.error("Error al registrar log de expiración:", error);
// //     res.status(500).json({ error: error.message });
// //   }
// // };

// // module.exports = { login, register, logoutLog, logExpiration };

// // controllers/authController.js
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");
// const Role = require("../models/Role");
// const db = require("../config/db");
// const { registrarLog } = require("../utils/logger");

// require("dotenv").config();

// const login = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // 1. Verificar existencia del usuario
//     const user = await User.findByEmail(email);
//     if (!user) {
//       return res.status(401).json({ message: "Credenciales inválidas" });
//     }

//     // 2. Verificar contraseña
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Credenciales inválidas" });
//     }

//     // --- 🛡️ INICIO DE BLOQUEO POR ARQUEO AJENO (CORREGIDO) ---
//     const userId = Number(user.id);

//     // Solo verificamos bloqueo si NO eres el administrador (ID 1)
//     if (userId !== 1) {
//       const [arqueoOpen] = await db.execute(
//         `SELECT a.usuario_id, u.name as usuario_nombre
//          FROM arqueos a
//          INNER JOIN users u ON a.usuario_id = u.id
//          WHERE a.empresa_id = ?
//          AND (a.fecha_cierre IS NULL OR a.fecha_cierre = '' OR a.estado = 'Abierto')
//          LIMIT 1`,
//         [user.empresa_id]
//       );

//       // Si hay un arqueo abierto Y no pertenece a este usuario
//       if (
//         arqueoOpen.length > 0 &&
//         Number(arqueoOpen[0].usuario_id) !== userId
//       ) {
//         return res.status(403).json({
//           success: false,
//           type: "ARQUEO_BLOQUEADO",
//           message: `Acceso denegado. Existe un arqueo abierto de: ${arqueoOpen[0].usuario_nombre}. Por seguridad, ese usuario debe cerrar su caja antes de que otro pueda iniciar sesión.`,
//         });
//       }
//     }
//     // --- 🛡️ FIN DE BLOQUEO ---

//     // 3. OBTENER CONFIGURACIÓN DE SESIÓN DINÁMICA
//     const [configRows] = await db.execute(
//       "SELECT unidad, cantidad FROM config_sessions LIMIT 1"
//     );

//     const sessionConfig = configRows[0] || { unidad: "horas", cantidad: 24 };

//     let timeSuffix = "h";
//     if (sessionConfig.unidad === "minutos") timeSuffix = "m";
//     if (sessionConfig.unidad === "dias") timeSuffix = "d";

//     const expireTime = `${sessionConfig.cantidad}${timeSuffix}`;

//     // 4. Obtener roles y permisos del usuario
//     const roles = await Role.findByUserId(user.id);
//     let allPermisos = new Set();

//     for (const role of roles) {
//       const permisos = await Role.getPermissionsByRole(role.id);
//       permisos.forEach((p) => allPermisos.add(p));
//     }

//     // 5. Firmar el TOKEN
//     const token = jwt.sign(
//       {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         empresa_id: user.empresa_id,
//         permisos: Array.from(allPermisos),
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: expireTime }
//     );

//     // 6. Registrar log de inicio de sesión
//     await registrarLog(
//       req,
//       "LOGIN",
//       "AUTENTICACION",
//       `El usuario ${user.email} inició sesión`,
//       user.id,
//       user.empresa_id
//     );

//     // 7. Respuesta al cliente
//     res.json({
//       token,
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         empresa_id: user.empresa_id,
//         permisos: Array.from(allPermisos),
//       },
//     });
//   } catch (error) {
//     console.error("Error en login:", error);
//     res
//       .status(500)
//       .json({ message: "Error en el servidor", error: error.message });
//   }
// };

// const register = async (req, res) => {
//   const { name, email, password, empresa_id } = req.body;
//   try {
//     const existingUser = await User.findByEmail(email);
//     if (existingUser) {
//       return res.status(400).json({ message: "El correo ya está registrado" });
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const userId = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       empresa_id: empresa_id || 1,
//     });
//     res.status(201).json({ message: "Usuario creado exitosamente", userId });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error al registrar usuario", error: error.message });
//   }
// };

// const logoutLog = async (req, res) => {
//   try {
//     const { motivo } = req.body;
//     await registrarLog(
//       req,
//       "LOGOUT",
//       "AUTENTICACION",
//       `Sesión cerrada. Motivo: ${motivo}`
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
//       "Sesión cerrada automáticamente por vencimiento de token",
//       userId,
//       empresaId
//     );
//     res.json({ success: true });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// module.exports = { login, register, logoutLog, logExpiration };

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
    // 1. Buscar usuario
    const user = await User.findByEmail(email);
    if (!user)
      return res.status(401).json({ message: "Credenciales inválidas" });

    // 2. Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Credenciales inválidas" });

    const userId = Number(user.id);
    const empresaId = Number(user.empresa_id);

    // --- 🛡️ BLOQUEO POR ARQUEO ABIERTO ---
    // SI NO ES EL ADMINISTRADOR (ID 1), VERIFICAMOS SI HAY CAJAS DE OTROS ABIERTAS
    if (userId !== 1) {
      const [arqueos] = await db.execute(
        `SELECT a.usuario_id, u.name as usuario_nombre 
         FROM arqueos a 
         INNER JOIN users u ON a.usuario_id = u.id 
         WHERE a.empresa_id = ? 
         AND (a.fecha_cierre IS NULL OR a.fecha_cierre = '' OR a.estado = 'Abierto') 
         LIMIT 1`,
        [empresaId]
      );

      if (arqueos.length > 0) {
        const usuarioCajaId = Number(arqueos[0].usuario_id);

        // Si la caja abierta NO es de este usuario, lo bloqueamos
        if (usuarioCajaId !== userId) {
          return res.status(403).json({
            success: false,
            message: `Caja bloqueada. El usuario ${arqueos[0].usuario_nombre} tiene un arqueo abierto. Debe cerrarlo para que puedas ingresar.`,
          });
        }
      }
    }

    // 3. Obtener configuración de sesión
    const [configRows] = await db.execute(
      "SELECT unidad, cantidad FROM config_sessions LIMIT 1"
    );
    const sessionConfig = configRows[0] || { unidad: "horas", cantidad: 24 };
    let timeSuffix =
      sessionConfig.unidad === "minutos"
        ? "m"
        : sessionConfig.unidad === "dias"
        ? "d"
        : "h";
    const expireTime = `${sessionConfig.cantidad}${timeSuffix}`;

    // 4. Obtener permisos
    const roles = await Role.findByUserId(user.id);
    let allPermisos = new Set();
    for (const role of roles) {
      const permisos = await Role.getPermissionsByRole(role.id);
      permisos.forEach((p) => allPermisos.add(p));
    }

    // 5. Generar TOKEN
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

    // 6. Registrar Log y Responder
    await registrarLog(
      req,
      "LOGIN",
      "AUTENTICACION",
      `Inició sesión: ${user.email}`,
      user.id,
      user.empresa_id
    );

    return res.json({
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
    console.error("ERROR CRÍTICO LOGIN:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
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
      `Sesión cerrada: ${motivo}`
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
      empresaId
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { login, register, logoutLog, logExpiration };
