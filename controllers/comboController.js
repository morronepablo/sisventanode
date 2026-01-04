// controllers/comboController.js
const db = require("../config/db");

const getCombos = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const [combos] = await db.execute(
      "SELECT * FROM combos WHERE empresa_id = ? ORDER BY id DESC",
      [empresa_id]
    );

    const combosConDetalle = await Promise.all(
      combos.map(async (combo) => {
        const [productos] = await db.execute(
          `SELECT p.id as producto_id, p.nombre, p.stock, u.nombre as unidad, cp.cantidad
           FROM combo_producto cp
           JOIN productos p ON cp.producto_id = p.id
           LEFT JOIN unidads u ON p.unidad_id = u.id
           WHERE cp.combo_id = ?`,
          [combo.id]
        );
        return { ...combo, productos };
      })
    );
    res.json(combosConDetalle);
  } catch (error) {
    console.error("Error en getCombos:", error);
    res.status(500).json({ message: "Error al obtener combos" });
  }
};

const getComboById = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    // 1. Obtener datos básicos
    const [comboRows] = await db.execute(
      "SELECT * FROM combos WHERE id = ? AND empresa_id = ?",
      [id, empresa_id]
    );

    if (comboRows.length === 0)
      return res.status(404).json({ message: "No encontrado" });

    const combo = comboRows[0];

    // 2. Obtener productos vinculados (CORREGIDO: p.id as producto_id)
    const [productos] = await db.execute(
      `SELECT p.id as producto_id, p.nombre, p.stock, cp.cantidad, u.nombre as unidad
       FROM combo_producto cp
       JOIN productos p ON cp.producto_id = p.id
       LEFT JOIN unidads u ON p.unidad_id = u.id
       WHERE cp.combo_id = ?`,
      [id]
    );

    res.json({ ...combo, productos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const storeCombo = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { nombre, codigo, precio_venta, productos } = req.body;
    const empresa_id = req.user.empresa_id;

    // 1. Insertar el Combo
    const [resCombo] = await connection.execute(
      "INSERT INTO combos (nombre, codigo, precio_venta, empresa_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [nombre, codigo, precio_venta, empresa_id]
    );

    const combo_id = resCombo.insertId;

    // 2. Insertar los productos asociados
    if (productos && productos.length > 0) {
      for (const prod of productos) {
        if (prod.producto_id && prod.cantidad > 0) {
          await connection.execute(
            "INSERT INTO combo_producto (combo_id, producto_id, cantidad, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
            [combo_id, prod.producto_id, prod.cantidad]
          );
        }
      }
    }

    await connection.commit();
    res.json({
      success: true,
      message: "Combo registrado con éxito",
      id: combo_id,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al registrar combo:", error);
    res
      .status(500)
      .json({ message: "Error al registrar el combo", error: error.message });
  } finally {
    connection.release();
  }
};

const updateCombo = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { nombre, codigo, precio_venta, productos } = req.body;
    const empresa_id = req.user.empresa_id;

    // Actualizar datos básicos
    await connection.execute(
      "UPDATE combos SET nombre = ?, codigo = ?, precio_venta = ?, updated_at = NOW() WHERE id = ? AND empresa_id = ?",
      [nombre, codigo, precio_venta, id, empresa_id]
    );

    // Limpiar tabla pivot
    await connection.execute("DELETE FROM combo_producto WHERE combo_id = ?", [
      id,
    ]);

    // Insertar nuevos
    if (productos && productos.length > 0) {
      for (const prod of productos) {
        if (prod.producto_id && prod.cantidad > 0) {
          await connection.execute(
            "INSERT INTO combo_producto (combo_id, producto_id, cantidad, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
            [id, prod.producto_id, prod.cantidad]
          );
        }
      }
    }

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

const deleteCombo = async (req, res) => {
  try {
    const { id } = req.params;
    // La base de datos debería tener ON DELETE CASCADE en combo_producto
    await db.execute("DELETE FROM combos WHERE id = ?", [id]);
    res.json({ success: true, message: "Combo eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el combo" });
  }
};

const countCombos = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id; // Obtenido del token
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS total FROM combos WHERE empresa_id = ?",
      [empresa_id]
    );
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error al contar combos:", error);
    res.status(500).json({ total: 0 });
  }
};

module.exports = {
  getCombos,
  getComboById,
  storeCombo,
  updateCombo,
  deleteCombo,
  countCombos,
};
