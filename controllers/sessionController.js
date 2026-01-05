// controllers/sessionController.js
const db = require("../config/db");

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
    await db.execute(
      "UPDATE config_sessions SET unidad = ?, cantidad = ? WHERE id = 1",
      [unidad, cantidad]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSessionConfig, updateSessionConfig };
