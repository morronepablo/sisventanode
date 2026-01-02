// controllers/comboController.js
const db = require("../config/db");

const getCombos = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM combos WHERE empresa_id = ?",
      [req.user.empresa_id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCombos };
