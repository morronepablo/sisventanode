// controllers/promocionController.js
const db = require("../config/db");

const getPromociones = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT pr.*, p.nombre as producto_nombre 
       FROM promociones pr 
       JOIN productos p ON pr.producto_id = p.id 
       WHERE pr.empresa_id = ?`,
      [req.user.empresa_id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const storePromocion = async (req, res) => {
  const { producto_id, nombre_promo, tipo } = req.body;
  try {
    await db.execute(
      "INSERT INTO promociones (empresa_id, producto_id, nombre_promo, tipo) VALUES (?, ?, ?, ?)",
      [req.user.empresa_id, producto_id, nombre_promo, tipo]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePromocion = async (req, res) => {
  try {
    await db.execute("DELETE FROM promociones WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPromociones, storePromocion, deletePromocion };
