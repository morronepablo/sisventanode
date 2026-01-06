// utils/logger.js
const db = require("../config/db");

const registrarLog = async (
  req,
  accion,
  modulo,
  detalle,
  manualUserId = null,
  manualEmpresaId = null
) => {
  try {
    console.log(`[LOGGER] Intentando registrar log: ${accion} - ${modulo}`);

    const usuario_id = manualUserId || (req.user ? req.user.id : null);
    const empresa_id =
      manualEmpresaId || (req.user ? req.user.empresa_id : null);
    const ip = req.ip || req.connection.remoteAddress;

    console.log(
      `[LOGGER] Datos obtenidos -> Usuario: ${usuario_id}, Empresa: ${empresa_id}, IP: ${ip}`
    );

    if (!usuario_id || !empresa_id) {
      console.error(
        "[LOGGER ERROR] No se pudo determinar el usuario o la empresa. El log no se guardará."
      );
      return;
    }

    const query = `INSERT INTO logs (usuario_id, accion, modulo, detalle, ip, empresa_id) VALUES (?, ?, ?, ?, ?, ?)`;
    await db.execute(query, [
      usuario_id,
      accion,
      modulo,
      detalle,
      ip,
      empresa_id,
    ]);

    console.log(
      "[LOGGER SUCCESS] Log guardado correctamente en la base de datos."
    );
  } catch (error) {
    console.error(
      "[LOGGER CRITICAL ERROR] Falló la inserción en la tabla logs:",
      error
    );
  }
};

module.exports = { registrarLog };
