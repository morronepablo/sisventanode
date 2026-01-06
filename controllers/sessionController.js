// controllers/sessionController.js
const db = require("../config/db");
const { registrarLog } = require("../utils/logger"); // 👈 Importamos el logger

const getSessionConfig = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM config_sessions LIMIT 1");
    if (rows.length === 0)
      return res.status(404).json({ message: "No encontrada" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSessionConfig = async (req, res) => {
  try {
    const { unidad, cantidad } = req.body;

    // 1. Ejecutar la actualización en la DB
    await db.execute(
      "UPDATE config_sessions SET unidad = ?, cantidad = ? WHERE id = 1",
      [unidad, cantidad]
    );

    // 2. REGISTRAR EL LOG DE AUDITORÍA
    // Usamos "EDITAR" como acción y "CONFIGURACION" como módulo
    await registrarLog(
      req,
      "EDITAR",
      "CONFIGURACION_SESION",
      `Se cambió la duración de sesión a: ${cantidad} ${unidad}`
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSessionConfig, updateSessionConfig };
