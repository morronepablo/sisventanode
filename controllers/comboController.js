// controllers/comboController.js
const db = require("../config/db");
const { registrarLog } = require("../utils/logger"); // 👈 Importamos el logger

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

    const [comboRows] = await db.execute(
      "SELECT * FROM combos WHERE id = ? AND empresa_id = ?",
      [id, empresa_id]
    );

    if (comboRows.length === 0)
      return res.status(404).json({ message: "No encontrado" });

    const combo = comboRows[0];

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
  console.log("--- INICIO CREATE COMBO ---");
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
    console.log(`[COMBOS] Combo registrado con éxito. ID: ${combo_id}`);

    // 👈 REGISTRO DE LOG
    await registrarLog(
      req,
      "CREAR",
      "COMBOS",
      `Se registró un nuevo combo: ${nombre} (Código: ${codigo}) con un precio de $${precio_venta}`
    );

    res.json({
      success: true,
      message: "Combo registrado con éxito",
      id: combo_id,
    });
  } catch (error) {
    await connection.rollback();
    console.error("[COMBOS ERROR] Fallo al registrar:", error.message);
    res.status(500).json({ message: "Error al registrar el combo" });
  } finally {
    connection.release();
  }
  console.log("--- FIN CREATE COMBO ---");
};

const updateCombo = async (req, res) => {
  console.log("--- INICIO UPDATE COMBO ---");
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { nombre, codigo, precio_venta, productos } = req.body;
    const empresa_id = req.user.empresa_id;

    await connection.execute(
      "UPDATE combos SET nombre = ?, codigo = ?, precio_venta = ?, updated_at = NOW() WHERE id = ? AND empresa_id = ?",
      [nombre, codigo, precio_venta, id, empresa_id]
    );

    await connection.execute("DELETE FROM combo_producto WHERE combo_id = ?", [
      id,
    ]);

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
    console.log(`[COMBOS] Combo ID ${id} actualizado.`);

    // 👈 REGISTRO DE LOG
    await registrarLog(
      req,
      "EDITAR",
      "COMBOS",
      `Se actualizaron los datos del combo: ${nombre} (ID: ${id})`
    );

    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error("[COMBOS ERROR] Fallo al actualizar:", error.message);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
  console.log("--- FIN UPDATE COMBO ---");
};

const deleteCombo = async (req, res) => {
  console.log("--- INICIO DELETE COMBO ---");
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    // Obtener nombre antes de borrar para el log
    const [rows] = await db.execute(
      "SELECT nombre FROM combos WHERE id = ? AND empresa_id = ?",
      [id, empresa_id]
    );
    const comboNombre = rows.length > 0 ? rows[0].nombre : "ID " + id;

    await db.execute("DELETE FROM combos WHERE id = ? AND empresa_id = ?", [
      id,
      empresa_id,
    ]);
    console.log(`[COMBOS] Combo ${comboNombre} eliminado.`);

    // 👈 REGISTRO DE LOG
    await registrarLog(
      req,
      "ELIMINAR",
      "COMBOS",
      `Se eliminó el combo: ${comboNombre}`
    );

    res.json({ success: true, message: "Combo eliminado correctamente" });
  } catch (error) {
    console.error("[COMBOS ERROR] Fallo al eliminar:", error.message);
    res.status(500).json({ message: "Error al eliminar el combo" });
  }
  console.log("--- FIN DELETE COMBO ---");
};

const countCombos = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
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
