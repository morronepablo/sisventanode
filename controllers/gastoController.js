// controllers/gastoController.js
const db = require("../config/db");
const { registrarLog } = require("../utils/logger"); // 👈 Importamos el logger

// Obtener todas las categorías de gastos
const getCategoriasGastos = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM categorias_gastos WHERE empresa_id = ?",
      [req.user.empresa_id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Listado de gastos con su categoría y usuario
const getListadoGastos = async (req, res) => {
  try {
    const query = `
      SELECT g.*, cg.nombre as categoria_nombre, u.name as usuario_nombre
      FROM gastos g
      JOIN categorias_gastos cg ON g.categoria_gasto_id = cg.id
      JOIN users u ON g.usuario_id = u.id
      WHERE g.empresa_id = ?
      ORDER BY g.fecha DESC
    `;
    const [rows] = await db.execute(query, [req.user.empresa_id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Registrar un nuevo gasto
const storeGasto = async (req, res) => {
  console.log("--- INICIO REGISTRO DE GASTO ---");
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { monto, descripcion, fecha, categoria_gasto_id, metodo_pago } =
      req.body;
    const empresa_id = req.user.empresa_id;
    const usuario_id = req.user.id;

    // 1. Buscar si hay un arqueo abierto
    const [arqueo] = await connection.execute(
      "SELECT id FROM arqueos WHERE empresa_id = ? AND (fecha_cierre IS NULL OR fecha_cierre = '') LIMIT 1",
      [empresa_id]
    );
    const arqueo_id = arqueo.length > 0 ? arqueo[0].id : null;

    // 2. Insertar Gasto
    const [result] = await connection.execute(
      `INSERT INTO gastos (monto, descripcion, fecha, categoria_gasto_id, metodo_pago, usuario_id, empresa_id, arqueo_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        monto,
        descripcion,
        fecha,
        categoria_gasto_id,
        metodo_pago,
        usuario_id,
        empresa_id,
        arqueo_id,
      ]
    );
    const gasto_id = result.insertId;
    console.log(`[GASTOS] Gasto insertado con ID: ${gasto_id}`);

    // 3. Si el pago fue en EFECTIVO y hay caja abierta, registrar el Egreso
    if (metodo_pago === "efectivo" && arqueo_id) {
      await connection.execute(
        `INSERT INTO movimiento_cajas (tipo, monto, descripcion, arqueo_id, created_at, updated_at) 
         VALUES ('Egreso', ?, ?, ?, NOW(), NOW())`,
        [monto, `Gasto: ${descripcion}`, arqueo_id]
      );
      console.log(
        `[GASTOS] Egreso de caja registrado para Arqueo ID: ${arqueo_id}`
      );
    }

    await connection.commit();
    console.log("[GASTOS] Transacción completada con éxito.");

    // 👈 2. EMITIR EVENTO EN TIEMPO REAL PARA EL DASHBOARD
    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");

    // --- REGISTRO DE LOG ---
    await registrarLog(
      req,
      "CREAR",
      "GASTOS",
      `Se registró un gasto por $${monto} (${metodo_pago}). Descripción: ${descripcion}`
    );

    res.json({ success: true, message: "Gasto registrado correctamente" });
  } catch (error) {
    await connection.rollback();
    console.error("[GASTOS ERROR] Fallo al registrar gasto:", error.message);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
  console.log("--- FIN REGISTRO DE GASTO ---");
};

const getGastoById = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    const query = `
      SELECT g.*, cg.nombre as categoria_nombre, u.name as usuario_nombre
      FROM gastos g
      JOIN categorias_gastos cg ON g.categoria_gasto_id = cg.id
      JOIN users u ON g.usuario_id = u.id
      WHERE g.id = ? AND g.empresa_id = ?
    `;

    const [rows] = await db.execute(query, [id, empresa_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Gasto no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener detalle del gasto:", error);
    res.status(500).json({ message: "Error al obtener los detalles" });
  }
};

const deleteGasto = async (req, res) => {
  console.log("--- INICIO ELIMINACIÓN DE GASTO (CON CAJA) ---");
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    // 1. Obtener datos del gasto antes de borrar
    const [rows] = await connection.execute(
      "SELECT * FROM gastos WHERE id = ? AND empresa_id = ?",
      [id, empresa_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Gasto no encontrado" });
    }

    const gasto = rows[0];

    // 2. Si el gasto fue en EFECTIVO, borrar el movimiento de caja relacionado
    if (gasto.metodo_pago === "efectivo" && gasto.arqueo_id) {
      await connection.execute(
        `DELETE FROM movimiento_cajas 
         WHERE arqueo_id = ? AND monto = ? AND tipo = 'Egreso' AND descripcion LIKE ?`,
        [gasto.arqueo_id, gasto.monto, `%Gasto: ${gasto.descripcion}%`]
      );
      console.log(
        `[GASTOS] Movimiento de caja eliminado para sincronizar arqueo.`
      );
    }

    // 3. Borrar el gasto
    await connection.execute("DELETE FROM gastos WHERE id = ?", [id]);

    await connection.commit();

    // 👈 2. EMITIR EVENTO EN TIEMPO REAL PARA EL DASHBOARD
    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");

    // 4. LOG DE AUDITORÍA
    await registrarLog(
      req,
      "ELIMINAR",
      "GASTOS",
      `Se eliminó gasto de $${gasto.monto}. Motivo: ${gasto.descripcion}. Se sincronizó con caja.`
    );

    res.json({
      success: true,
      message: "Gasto y movimiento de caja eliminados.",
    });
  } catch (error) {
    await connection.rollback();
    console.error("[GASTOS ERROR] Fallo al eliminar:", error.message);
    res.status(500).json({ message: "Error al procesar la eliminación" });
  } finally {
    connection.release();
  }
};

const countGastos = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT COUNT(*) AS total FROM gastos");
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error al contar gastos:", error);
    res.status(500).json({ total: 0 });
  }
};

module.exports = {
  getCategoriasGastos,
  getListadoGastos,
  storeGasto,
  getGastoById,
  deleteGasto,
  countGastos,
};
