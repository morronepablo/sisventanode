// controllers/logController.js
const db = require("../config/db");

const getListadoLogs = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const query = `
      SELECT l.*, u.name as usuario_nombre, u.email as usuario_email
      FROM logs l
      JOIN users u ON l.usuario_id = u.id
      WHERE l.empresa_id = ?
      ORDER BY l.created_at DESC
    `;

    const [rows] = await db.execute(query, [empresa_id]);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener logs:", error);
    res.status(500).json({ message: "Error al obtener el historial" });
  }
};

const countLogs = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT COUNT(*) AS total FROM logs");
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error al contar logs:", error);
    res.status(500).json({ total: 0 });
  }
};

module.exports = { getListadoLogs, countLogs };
