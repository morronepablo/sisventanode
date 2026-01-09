// controllers/comboController.js
const db = require("../config/db");
const { registrarLog } = require("../utils/logger"); // 👈 Importamos el logger
const { calcularDiferencias } = require("../utils/differences"); // 👈 1. Importar utilidad

const getCombos = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // Consulta con subconsulta para contar cuántas veces se vendió este combo
    const query = `
      SELECT c.*, 
      (SELECT COUNT(*) FROM detalle_ventas WHERE combo_id = c.id) as ventas_count
      FROM combos c 
      WHERE c.empresa_id = ? 
      ORDER BY c.id DESC
    `;

    const [combos] = await db.execute(query, [empresa_id]);

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
        return {
          ...combo,
          productos,
          // Propiedad para el frontend
          puede_eliminarse: combo.ventas_count === 0,
        };
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
  console.log("--- INICIO CREATE COMBO (AUDITADO) ---");
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { nombre, codigo, precio_venta, productos } = req.body;
    const empresa_id = req.user.empresa_id;

    const [resCombo] = await connection.execute(
      "INSERT INTO combos (nombre, codigo, precio_venta, empresa_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [nombre, codigo, precio_venta, empresa_id]
    );

    const combo_id = resCombo.insertId;

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

    // LOG DE CREACIÓN DETALLADO
    await registrarLog(
      req,
      "CREAR",
      "COMBOS",
      `Nuevo combo: ${nombre}. Código: ${codigo}. Precio: $${precio_venta}. Contiene ${productos.length} productos.`
    );

    res.json({
      success: true,
      message: "Combo registrado con éxito",
      id: combo_id,
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: "Error al registrar" });
  } finally {
    connection.release();
  }
};

const updateCombo = async (req, res) => {
  console.log("--- INICIO UPDATE COMBO (AUDITADO) ---");
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { nombre, codigo, precio_venta, productos } = req.body;
    const empresa_id = req.user.empresa_id;

    // 2. OBTENER ESTADO ANTERIOR (Combo y sus productos)
    const [comboRows] = await connection.execute(
      "SELECT * FROM combos WHERE id = ?",
      [id]
    );
    if (comboRows.length === 0)
      return res.status(404).json({ message: "No encontrado" });
    const comboAnterior = comboRows[0];

    const [productosAnteriores] = await connection.execute(
      "SELECT producto_id, cantidad FROM combo_producto WHERE combo_id = ?",
      [id]
    );

    // 3. CALCULAR DIFERENCIAS EN DATOS BÁSICOS
    const detalleCambios = calcularDiferencias(comboAnterior, req.body, [
      "id",
      "empresa_id",
      "created_at",
      "updated_at",
    ]);

    // 4. ACTUALIZAR COMBO
    await connection.execute(
      "UPDATE combos SET nombre = ?, codigo = ?, precio_venta = ?, updated_at = NOW() WHERE id = ? AND empresa_id = ?",
      [nombre, codigo, precio_venta, id, empresa_id]
    );

    // 5. ACTUALIZAR PRODUCTOS (Borrar y reinsertar)
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

    // 6. COMPARAR CANTIDAD DE PRODUCTOS PARA EL LOG
    let logProductos = "";
    if (productosAnteriores.length !== productos.length) {
      logProductos = ` | ITEMS: ${productosAnteriores.length} ➡️ ${productos.length}`;
    }

    await connection.commit();

    // 7. REGISTRO DE LOG DETALLADO
    await registrarLog(
      req,
      "EDITAR",
      "COMBOS",
      `Se actualizó el combo: ${comboAnterior.nombre}. Cambios: ${detalleCambios}${logProductos}`
    );

    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

const deleteCombo = async (req, res) => {
  console.log("--- INICIO DELETE COMBO ---");
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    // 1. Verificación de seguridad en el servidor: ¿Se ha vendido?
    const [check] = await db.execute(
      "SELECT COUNT(*) as total FROM detalle_ventas WHERE combo_id = ?",
      [id]
    );

    if (check[0].total > 0) {
      return res.status(400).json({
        message:
          "No se puede eliminar el combo porque ya tiene ventas registradas en el historial.",
      });
    }

    const [rows] = await db.execute(
      "SELECT nombre FROM combos WHERE id = ? AND empresa_id = ?",
      [id, empresa_id]
    );
    const comboNombre = rows.length > 0 ? rows[0].nombre : "ID " + id;

    // 2. Eliminar relación y combo (La DB debería tener ON DELETE CASCADE, si no, borrar combo_producto primero)
    await db.execute("DELETE FROM combo_producto WHERE combo_id = ?", [id]);
    await db.execute("DELETE FROM combos WHERE id = ? AND empresa_id = ?", [
      id,
      empresa_id,
    ]);

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
