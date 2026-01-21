// controllers/gastoController.js
const db = require("../config/db");
const { registrarLog } = require("../utils/logger"); // 👈 Importamos el logger

// Obtener todas las categorías de gastos
const getCategoriasGastos = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM categorias_gastos WHERE empresa_id = ?",
      [req.user.empresa_id],
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
      [empresa_id, MY_CAJA],
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
      ],
    );
    const gasto_id = result.insertId;
    console.log(
      `[GASTOS] Gasto insertado con ID: ${gasto_id} en Caja ${MY_CAJA}`,
    );

    // 3. Si el pago fue en EFECTIVO y hay caja abierta, registrar el Egreso en movimiento_cajas
    if (metodo_pago === "efectivo" && arqueo_id) {
      await connection.execute(
        `INSERT INTO movimiento_cajas (tipo, monto, descripcion, arqueo_id, caja_id, created_at, updated_at) 
         VALUES ('Egreso', ?, ?, ?, ?, NOW(), NOW())`,
        [monto, `Gasto: ${descripcion}`, arqueo_id, MY_CAJA],
      );
      console.log(
        `[GASTOS] Egreso de caja registrado para Arqueo ID: ${arqueo_id} (Caja ${MY_CAJA})`,
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
      `Se registró un gasto por $${monto} (${metodo_pago}) en Caja ${MY_CAJA}. Descripción: ${descripcion}`,
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
      [id, empresa_id],
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
        ],
      );
      console.log(
        `[GASTOS] Movimiento de caja eliminado para sincronizar arqueo de la Caja ${gasto.caja_id}`,
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
      `Se eliminó gasto de $${gasto.monto} de la Caja ${gasto.caja_id}. Motivo: ${gasto.descripcion}. Se sincronizó con caja.`,
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

    // Usamos el primer y último día del mes actual
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    // 1. Consulta de Gastos con desglose por categoría
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

    // 2. 🚀 CÁLCULO DE VENTAS NETAS (Ventas - Devoluciones) 🚀
    const queryVentasNetas = `
      SELECT (
        (SELECT IFNULL(SUM(precio_total), 0) FROM ventas WHERE empresa_id = ? AND fecha BETWEEN ? AND ?) -
        (SELECT IFNULL(SUM(precio_total), 0) FROM devoluciones WHERE empresa_id = ? AND fecha BETWEEN ? AND ?)
      ) as total_ventas_netas
    `;

    const [gastosRows] = await db.execute(queryGastos, [
      empresa_id,
      inicioMes,
      finMes,
    ]);

    // Ejecutamos el cálculo de ventas netas pasando los parámetros para ambas subconsultas
    const [ventasRes] = await db.execute(queryVentasNetas, [
      empresa_id,
      inicioMes,
      finMes, // Para ventas
      empresa_id,
      inicioMes,
      finMes, // Para devoluciones
    ]);

    const ventasNetasTotales = parseFloat(ventasRes[0].total_ventas_netas || 0);

    // Separar los datos para el frontend
    const fijos_lista = gastosRows.filter((g) => g.tipo === "fijo");
    const variables_lista = gastosRows.filter((g) => g.tipo === "variable");

    const totalFijos = fijos_lista.reduce(
      (acc, curr) => acc + parseFloat(curr.total_categoria),
      0,
    );
    const totalVariables = variables_lista.reduce(
      (acc, curr) => acc + parseFloat(curr.total_categoria),
      0,
    );

    res.json({
      totales: {
        fijos: totalFijos,
        variables: totalVariables,
        ventas_totales: ventasNetasTotales, // 🚀 Ahora refleja la realidad del bolsillo
      },
      desglose: {
        fijos: fijos_lista,
        variables: variables_lista,
      },
    });
  } catch (error) {
    console.error("ERROR CIRUJANO:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const storeCategoriaGasto = async (req, res) => {
  try {
    const { nombre, tipo } = req.body;
    const [result] = await db.execute(
      "INSERT INTO categorias_gastos (nombre, tipo, empresa_id) VALUES (?, ?, ?)",
      [nombre, tipo, req.user.empresa_id],
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
      [req.params.id],
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
      [nombre, tipo, req.params.id],
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

    // 1. SUMAR GASTOS TOTALES (Se mantiene igual)
    const [gastosRes] = await db.execute(
      "SELECT SUM(monto) as total FROM gastos WHERE empresa_id = ? AND (fecha BETWEEN ? AND ?)",
      [empresa_id, inicioMes, finMes],
    );
    const gastosTotales = parseFloat(gastosRes[0].total || 0);

    // 2. OBTENER VENTAS BRUTAS Y SU COSTO
    const queryVentas = `
      SELECT 
        IFNULL(SUM(v.precio_total), 0) as bruto,
        IFNULL(SUM((SELECT SUM(dv.cantidad * p.precio_compra) FROM detalle_ventas dv JOIN productos p ON dv.producto_id = p.id WHERE dv.venta_id = v.id)), 0) as costo
      FROM ventas v
      WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?
    `;

    // 3. 🚀 OBTENER DEVOLUCIONES Y SU COSTO (Para descontar del margen) 🚀
    const queryDevoluciones = `
      SELECT 
        IFNULL(SUM(d.precio_total), 0) as bruto,
        IFNULL(SUM((SELECT SUM(dd.cantidad * p.precio_compra) FROM detalle_devoluciones dd JOIN productos p ON dd.producto_id = p.id WHERE dd.devolucion_id = d.id)), 0) as costo
      FROM devoluciones d
      WHERE d.empresa_id = ? AND d.fecha BETWEEN ? AND ?
    `;

    const [vRes] = await db.execute(queryVentas, [
      empresa_id,
      inicioMes,
      finMes,
    ]);
    const [dRes] = await db.execute(queryDevoluciones, [
      empresa_id,
      inicioMes,
      finMes,
    ]);

    // --- CÁLCULOS NETOS BI ---

    // Ventas Netas = Ventas Brutas - Devoluciones
    const ventasNetas = parseFloat(vRes[0].bruto) - parseFloat(dRes[0].bruto);

    // Costo Neto = Costo de lo vendido - Costo de lo que volvió por devolución
    const costoNeto = parseFloat(vRes[0].costo) - parseFloat(dRes[0].costo);

    let margenPromedio = 0;
    if (ventasNetas > 0) {
      // Margen Real = (Ventas Netas - Costo Neto) / Ventas Netas
      margenPromedio = (ventasNetas - costoNeto) / ventasNetas;
    } else {
      // Fallback: Si no hay ventas, usamos el 30% como proyección estándar
      margenPromedio = 0.3;
    }

    // 4. PUNTO DE EQUILIBRIO REAL (Gasto / Margen Neto)
    const puntoEquilibrio =
      margenPromedio > 0 ? gastosTotales / margenPromedio : 0;

    res.json({
      success: true,
      gastosTotales,
      margenPromedio: (margenPromedio * 100).toFixed(2),
      puntoEquilibrio,
      ventasActuales: ventasNetas, // 🚀 Ahora enviamos el valor NETO al frontend
      faltante: Math.max(puntoEquilibrio - ventasNetas, 0),
      porcentajeAlcanzado:
        puntoEquilibrio > 0
          ? ((ventasNetas / puntoEquilibrio) * 100).toFixed(1)
          : 0,
      objetivoCumplido: ventasNetas >= puntoEquilibrio && puntoEquilibrio > 0,
    });
  } catch (error) {
    console.error("❌ ERROR EN PUNTO DE EQUILIBRIO:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getGastosHormiga = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    // Definimos qué es un "Gasto Hormiga".
    // En Argentina hoy, pongamos $5.000 como base, pero el usuario podría verlo.
    const UMBRAL_HORMIGA = 5000;

    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const inicioMesAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
      .toISOString()
      .split("T")[0];
    const finMesAnt = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
      .toISOString()
      .split("T")[0];

    // 1. Gastos Hormiga MES ACTUAL
    const queryActual = `
      SELECT COUNT(*) as cantidad, SUM(monto) as total 
      FROM gastos 
      WHERE empresa_id = ? AND monto <= ? AND (fecha BETWEEN ? AND ?)
    `;

    // 2. Gastos Hormiga MES ANTERIOR (Para comparar tendencia)
    const [actualRes] = await db.execute(queryActual, [
      empresa_id,
      UMBRAL_HORMIGA,
      inicioMes,
      finMes,
    ]);
    const [anteriorRes] = await db.execute(queryActual, [
      empresa_id,
      UMBRAL_HORMIGA,
      inicioMesAnt,
      finMesAnt,
    ]);

    const actual = {
      cantidad: actualRes[0].cantidad || 0,
      total: parseFloat(actualRes[0].total || 0),
    };

    const anterior = {
      cantidad: anteriorRes[0].cantidad || 0,
      total: parseFloat(anteriorRes[0].total || 0),
    };

    // 3. Ranking de categorías "más hormigas" (donde más se escapa la plata)
    const queryRanking = `
      SELECT cg.nombre as categoria, COUNT(*) as cantidad, SUM(g.monto) as total
      FROM gastos g
      JOIN categorias_gastos cg ON g.categoria_gasto_id = cg.id
      WHERE g.empresa_id = ? AND g.monto <= ? AND (g.fecha BETWEEN ? AND ?)
      GROUP BY cg.id
      ORDER BY total DESC
    `;
    const [ranking] = await db.execute(queryRanking, [
      empresa_id,
      UMBRAL_HORMIGA,
      inicioMes,
      finMes,
    ]);

    // 4. Calcular tendencia
    let tendenciaMonto = 0;
    if (anterior.total > 0) {
      tendenciaMonto = ((actual.total - anterior.total) / anterior.total) * 100;
    }

    res.json({
      success: true,
      umbral: UMBRAL_HORMIGA,
      actual,
      anterior,
      tendenciaMonto: tendenciaMonto.toFixed(1),
      ranking,
    });
  } catch (error) {
    console.error("❌ ERROR EN RADAR HORMIGA:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSaludFinanciera = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    // 1. VENTAS BRUTAS DEL MES
    const [ventasRes] = await db.execute(
      "SELECT IFNULL(SUM(precio_total), 0) as total FROM ventas WHERE empresa_id = ? AND (fecha BETWEEN ? AND ?)",
      [empresa_id, inicioMes, finMes],
    );
    const ventasBrutas = parseFloat(ventasRes[0].total || 0);

    // 2. 🚀 DEVOLUCIONES (El dinero que salió de la caja) 🚀
    const [devolucionesRes] = await db.execute(
      "SELECT IFNULL(SUM(precio_total), 0) as total FROM devoluciones WHERE empresa_id = ? AND (fecha BETWEEN ? AND ?)",
      [empresa_id, inicioMes, finMes],
    );
    const totalDevoluciones = parseFloat(devolucionesRes[0].total || 0);

    // --- CÁLCULO DE INGRESOS NETOS (Ventas Reales - Devoluciones) ---
    const ingresosNetosReal = ventasBrutas - totalDevoluciones;

    // 3. EGRESOS OPERATIVOS: Suma de Gastos (monto)
    const [gastosRes] = await db.execute(
      "SELECT IFNULL(SUM(monto), 0) as total FROM gastos WHERE empresa_id = ? AND (fecha BETWEEN ? AND ?)",
      [empresa_id, inicioMes, finMes],
    );
    const egresosGastos = parseFloat(gastosRes[0].total || 0);

    // 4. EGRESOS INVERSIÓN: Suma de Compras (precio_total)
    const [comprasRes] = await db.execute(
      "SELECT IFNULL(SUM(precio_total), 0) as total FROM compras WHERE empresa_id = ? AND (fecha BETWEEN ? AND ?)",
      [empresa_id, inicioMes, finMes],
    );
    const egresosCompras = parseFloat(comprasRes[0].total || 0);

    const totalEgresos = egresosGastos + egresosCompras;
    const balanceNeto = ingresosNetosReal - totalEgresos;

    res.json({
      success: true,
      ingresos: ingresosNetosReal, // 🚀 Ahora es el Ingreso Neto de Bolsillo
      egresos: {
        totales: totalEgresos,
        operativos: egresosGastos,
        mercaderia: egresosCompras,
      },
      balanceNeto,
      estado: balanceNeto >= 0 ? "SALUDABLE" : "CRÍTICO",
    });
  } catch (error) {
    console.error("❌ ERROR EN SALUD FINANCIERA:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOraculoFinanciero = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // 1. SALDO ACTUAL (Ventas - Compras - Gastos del mes actual)
    const [balanceRes] = await db.execute(
      `
      SELECT 
        (SELECT COALESCE(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND MONTH(fecha) = MONTH(CURDATE())) -
        (SELECT COALESCE(SUM(precio_total),0) FROM compras WHERE empresa_id = ? AND MONTH(fecha) = MONTH(CURDATE())) -
        (SELECT COALESCE(SUM(monto),0) FROM gastos WHERE empresa_id = ? AND MONTH(fecha) = MONTH(CURDATE())) as saldo_caja
    `,
      [empresa_id, empresa_id, empresa_id],
    );

    let saldoCajaActual = parseFloat(balanceRes[0].saldo_caja || 0);

    // 2. CUENTAS POR COBRAR (Sincronizado con el Navbar - Saldo Neto Real)
    const [cobrarRes] = await db.execute(
      `
        SELECT SUM(saldo) as total FROM (
          SELECT 
            SUM(CASE WHEN tipo = 'deuda' THEN importe ELSE 0 END) - 
            SUM(CASE WHEN tipo = 'pago' THEN importe ELSE 0 END) as saldo
          FROM compras_cta_cte
          WHERE empresa_id = ?
          GROUP BY cliente_id
          HAVING saldo > 0
        ) as subquery
      `,
      [empresa_id],
    );

    const totalCobrar = parseFloat(cobrarRes[0].total || 0);

    // 3. CUENTAS POR PAGAR (Lo que debés a proveedores en CTA CTE)
    // Usamos el cálculo: precio_total de compra - lo pagado
    const [pagarRes] = await db.execute(
      `
      SELECT SUM(deuda) as total FROM compras WHERE empresa_id = ?
    `,
      [empresa_id],
    );
    const totalPagar = parseFloat(pagarRes[0].total || 0);

    // 4. PROMEDIO DE VENTA DIARIA (Basado en los últimos 15 días)
    const [promedioRes] = await db.execute(
      `
      SELECT SUM(precio_total) / 15 as promedio 
      FROM ventas 
      WHERE empresa_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 15 DAY)
    `,
      [empresa_id],
    );
    const ventaDiariaPromedio = parseFloat(promedioRes[0].promedio || 0);

    // 5. GENERAR PROYECCIÓN A 30 DÍAS (Semana a semana)
    const proyeccion = [];
    let saldoProyectado = saldoCajaActual;

    // Simulamos 4 semanas
    for (let i = 1; i <= 4; i++) {
      const ingresosEstimados = ventaDiariaPromedio * 7 + totalCobrar * 0.2; // Ventas + 20% de cobranza
      const egresosEstimados = totalPagar * 0.25; // Pagamos el 25% de la deuda por semana

      saldoProyectado = saldoProyectado + ingresosEstimados - egresosEstimados;

      proyeccion.push({
        semana: `Semana ${i}`,
        saldo: saldoProyectado.toFixed(2),
        ingresos: ingresosEstimados.toFixed(2),
        egresos: egresosEstimados.toFixed(2),
      });
    }

    res.json({
      saldoActual: saldoCajaActual,
      totalCobrar,
      totalPagar,
      proyeccion,
      riesgo: saldoProyectado < 0 ? "ALTO" : "BAJO",
    });
  } catch (error) {
    console.error("❌ ERROR EN EL ORÁCULO FINANCIERO:", error);
    res.status(500).json({ message: error.message });
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
  getGastosHormiga,
  getSaludFinanciera,
  getOraculoFinanciero,
  countGastos,
};
