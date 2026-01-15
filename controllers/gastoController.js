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
  console.log("--- INICIO REGISTRO DE GASTO (MULTICAJA) ---");
  const connection = await db.getConnection();
  const MY_CAJA = Number(process.env.CAJA_ID || 1); // 👈 Identidad de la terminal

  try {
    await connection.beginTransaction();
    const { monto, descripcion, fecha, categoria_gasto_id, metodo_pago } =
      req.body;
    const empresa_id = req.user.empresa_id;
    const usuario_id = req.user.id;

    // 1. Buscar si hay un arqueo abierto EN ESTA CAJA ESPECÍFICA
    const [arqueo] = await connection.execute(
      "SELECT id FROM arqueos WHERE empresa_id = ? AND caja_id = ? AND (fecha_cierre IS NULL OR fecha_cierre = '' OR estado = 'Abierto') LIMIT 1",
      [empresa_id, MY_CAJA]
    );
    const arqueo_id = arqueo.length > 0 ? arqueo[0].id : null;

    // 2. Insertar Gasto (Incluyendo caja_id)
    const [result] = await connection.execute(
      `INSERT INTO gastos (monto, descripcion, fecha, categoria_gasto_id, metodo_pago, usuario_id, empresa_id, arqueo_id, caja_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        monto,
        descripcion,
        fecha,
        categoria_gasto_id,
        metodo_pago,
        usuario_id,
        empresa_id,
        arqueo_id,
        MY_CAJA, // 👈 Se guarda la caja que origina el gasto
      ]
    );
    const gasto_id = result.insertId;
    console.log(
      `[GASTOS] Gasto insertado con ID: ${gasto_id} en Caja ${MY_CAJA}`
    );

    // 3. Si el pago fue en EFECTIVO y hay caja abierta, registrar el Egreso en movimiento_cajas
    if (metodo_pago === "efectivo" && arqueo_id) {
      await connection.execute(
        `INSERT INTO movimiento_cajas (tipo, monto, descripcion, arqueo_id, caja_id, created_at, updated_at) 
         VALUES ('Egreso', ?, ?, ?, ?, NOW(), NOW())`,
        [monto, `Gasto: ${descripcion}`, arqueo_id, MY_CAJA]
      );
      console.log(
        `[GASTOS] Egreso de caja registrado para Arqueo ID: ${arqueo_id} (Caja ${MY_CAJA})`
      );
    }

    await connection.commit();
    console.log("[GASTOS] Transacción completada con éxito.");

    // EMITIR EVENTO EN TIEMPO REAL PARA EL DASHBOARD
    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");

    // --- REGISTRO DE LOG ---
    await registrarLog(
      req,
      "CREAR",
      "GASTOS",
      `Se registró un gasto por $${monto} (${metodo_pago}) en Caja ${MY_CAJA}. Descripción: ${descripcion}`
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
  const MY_CAJA = Number(process.env.CAJA_ID || 1); // 👈 Identidad de la terminal

  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    // 1. Obtener datos del gasto antes de borrar para saber si afectó la caja
    const [rows] = await connection.execute(
      "SELECT * FROM gastos WHERE id = ? AND empresa_id = ?",
      [id, empresa_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Gasto no encontrado" });
    }

    const gasto = rows[0];

    // 2. Si el gasto fue en EFECTIVO, borrar el movimiento de caja relacionado filtrando por arqueo y CAJA
    if (gasto.metodo_pago === "efectivo" && gasto.arqueo_id) {
      await connection.execute(
        `DELETE FROM movimiento_cajas 
         WHERE arqueo_id = ? AND caja_id = ? AND monto = ? AND tipo = 'Egreso' AND descripcion LIKE ?`,
        [
          gasto.arqueo_id,
          gasto.caja_id,
          gasto.monto,
          `%Gasto: ${gasto.descripcion}%`,
        ]
      );
      console.log(
        `[GASTOS] Movimiento de caja eliminado para sincronizar arqueo de la Caja ${gasto.caja_id}`
      );
    }

    // 3. Borrar el gasto
    await connection.execute("DELETE FROM gastos WHERE id = ?", [id]);

    await connection.commit();

    // EMITIR EVENTO EN TIEMPO REAL
    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");

    // 4. LOG DE AUDITORÍA
    await registrarLog(
      req,
      "ELIMINAR",
      "GASTOS",
      `Se eliminó gasto de $${gasto.monto} de la Caja ${gasto.caja_id}. Motivo: ${gasto.descripcion}. Se sincronizó con caja.`
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

const getInformeCirujano = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    // Consulta con DESGLOSE por categoría
    const queryGastos = `
      SELECT 
        cg.nombre as categoria,
        cg.tipo,
        SUM(g.monto) as total_categoria
      FROM gastos g
      JOIN categorias_gastos cg ON g.categoria_gasto_id = cg.id
      WHERE g.empresa_id = ? AND g.fecha BETWEEN ? AND ?
      GROUP BY cg.id
    `;

    const queryVentas = `SELECT SUM(precio_total) as total_ventas FROM ventas WHERE empresa_id = ? AND fecha BETWEEN ? AND ?`;

    const [gastosRows] = await db.execute(queryGastos, [
      empresa_id,
      inicioMes,
      finMes,
    ]);
    const [[ventasRes]] = await db.execute(queryVentas, [
      empresa_id,
      inicioMes,
      finMes,
    ]);

    // Separar los datos para el frontend
    const fijos_lista = gastosRows.filter((g) => g.tipo === "fijo");
    const variables_lista = gastosRows.filter((g) => g.tipo === "variable");

    const totalFijos = fijos_lista.reduce(
      (acc, curr) => acc + parseFloat(curr.total_categoria),
      0
    );
    const totalVariables = variables_lista.reduce(
      (acc, curr) => acc + parseFloat(curr.total_categoria),
      0
    );

    res.json({
      totales: {
        fijos: totalFijos,
        variables: totalVariables,
        ventas_totales: parseFloat(ventasRes.total_ventas || 0),
      },
      desglose: {
        fijos: fijos_lista,
        variables: variables_lista,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const storeCategoriaGasto = async (req, res) => {
  try {
    const { nombre, tipo } = req.body;
    const [result] = await db.execute(
      "INSERT INTO categorias_gastos (nombre, tipo, empresa_id) VALUES (?, ?, ?)",
      [nombre, tipo, req.user.empresa_id]
    );
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener una sola categoría
const getCategoriaGastoById = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM categorias_gastos WHERE id = ?",
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar categoría
const updateCategoriaGasto = async (req, res) => {
  try {
    const { nombre, tipo } = req.body;
    await db.execute(
      "UPDATE categorias_gastos SET nombre = ?, tipo = ? WHERE id = ?",
      [nombre, tipo, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar categoría
const deleteCategoriaGasto = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute("DELETE FROM categorias_gastos WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({ message: "No se puede eliminar porque tiene gastos asociados" });
  }
};

const getPuntoEquilibrio = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    // 1. SUMAR GASTOS TOTALES
    const [gastosRes] = await db.execute(
      "SELECT SUM(monto) as total FROM gastos WHERE empresa_id = ? AND (fecha BETWEEN ? AND ?)",
      [empresa_id, inicioMes, finMes]
    );
    const gastosTotales = parseFloat(gastosRes[0].total || 0);

    // 2. CALCULAR MARGEN REAL (Usando tus columnas: precio_venta y precio_compra)
    const queryMargen = `
      SELECT 
        SUM(dv.cantidad * dv.precio_venta) as ventas_totales,
        SUM(dv.cantidad * dv.precio_compra) as costo_total_mercaderia
      FROM detalle_ventas dv
      JOIN ventas v ON dv.venta_id = v.id
      WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?
    `;

    const [margenRes] = await db.execute(queryMargen, [
      empresa_id,
      inicioMes,
      finMes,
    ]);

    const ventasActuales = parseFloat(margenRes[0].ventas_totales || 0);
    const costoMercaderia = parseFloat(
      margenRes[0].costo_total_mercaderia || 0
    );

    let margenPromedio = 0;
    if (ventasActuales > 0) {
      // Margen = (Ventas Totales - Costo Total de lo vendido) / Ventas Totales
      margenPromedio = (ventasActuales - costoMercaderia) / ventasActuales;
    } else {
      // Si no hay ventas todavía, usamos un 30% estimado para la proyección
      margenPromedio = 0.3;
    }

    // 3. PUNTO DE EQUILIBRIO (Venta necesaria para cubrir gastos)
    const puntoEquilibrio =
      margenPromedio > 0 ? gastosTotales / margenPromedio : 0;

    res.json({
      success: true,
      gastosTotales,
      margenPromedio: (margenPromedio * 100).toFixed(2),
      puntoEquilibrio,
      ventasActuales,
      faltante: Math.max(puntoEquilibrio - ventasActuales, 0),
      porcentajeAlcanzado:
        puntoEquilibrio > 0
          ? ((ventasActuales / puntoEquilibrio) * 100).toFixed(1)
          : 0,
    });
  } catch (error) {
    console.error("❌ ERROR EN PUNTO DE EQUILIBRIO:", error);
    res.status(500).json({ success: false, message: error.message });
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
  getInformeCirujano,
  storeCategoriaGasto,
  getCategoriaGastoById,
  updateCategoriaGasto,
  deleteCategoriaGasto,
  getPuntoEquilibrio,
  countGastos,
};
