// controllers/dashboardController.js
const db = require("../config/db");
const getFullChartData = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const MY_CAJA = Number(process.env.CAJA_ID || 1); // 👈 Filtro por terminal
    const now = new Date();
    const currentYear = now.getFullYear();
    const selectedMonth = parseInt(req.query.month) || now.getMonth() + 1;

    let prevMonth = selectedMonth - 1;
    let prevMonthYear = currentYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevMonthYear = currentYear - 1;
    }

    // 1. Ganancias Brutas por Mes y Categoría (Calculado sobre Precio Real Cobrado)
    const [gananciasRaw] = await db.execute(
      `SELECT MONTH(v.fecha) as mes, c.nombre as categoria,
              SUM( (v.precio_total / (SELECT SUM(dv2.cantidad * dv2.precio_venta) FROM detalle_ventas dv2 WHERE dv2.venta_id = v.id)) * (dv.cantidad * (dv.precio_venta - dv.precio_compra)) ) as ganancia
       FROM detalle_ventas dv
       JOIN ventas v ON dv.venta_id = v.id
       JOIN productos p ON dv.producto_id = p.id
       JOIN categorias c ON p.categoria_id = c.id
       WHERE v.empresa_id = ? AND v.caja_id = ? AND YEAR(v.fecha) = ?
       GROUP BY mes, categoria`,
      [empresa_id, MY_CAJA, currentYear]
    );

    // 2. COMPARATIVA DIARIA (Usamos precio_total de cabecera para incluir PROMOS)
    const [comparativaDiaria] = await db.execute(
      `SELECT d.dia,
        (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND caja_id = ? AND DAY(fecha) = d.dia AND MONTH(fecha) = ? AND YEAR(fecha) = ?) as actual,
        (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND caja_id = ? AND DAY(fecha) = d.dia AND MONTH(fecha) = ? AND YEAR(fecha) = ?) as anterior
      FROM (SELECT 1 as dia UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION SELECT 31) d`,
      [
        empresa_id,
        MY_CAJA,
        selectedMonth,
        currentYear,
        empresa_id,
        MY_CAJA,
        prevMonth,
        prevMonthYear,
      ]
    );

    // 3. BALANCE MENSUAL (Sincronizado con Cabeceras de Ventas y Devoluciones)
    const [balanceMensual] = await db.execute(
      `SELECT m.mes,
        ( (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND caja_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) - 
          (SELECT IFNULL(SUM(precio_total),0) FROM devoluciones WHERE empresa_id = ? AND caja_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) ) as v_total,
        (SELECT IFNULL(SUM(precio_total),0) FROM compras WHERE empresa_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) as c_total,
        (SELECT IFNULL(SUM(monto),0) FROM gastos WHERE empresa_id = ? AND caja_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) as g_total,
        (SELECT IFNULL(SUM(v2.precio_total - (SELECT SUM(dv.cantidad * dv.precio_compra) FROM detalle_ventas dv WHERE dv.venta_id = v2.id)), 0) 
         FROM ventas v2 WHERE v2.empresa_id = ? AND v2.caja_id = ? AND MONTH(v2.fecha) = m.mes AND YEAR(v2.fecha) = ?) as ganancia_bruta
      FROM (SELECT 1 as mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) m`,
      [
        empresa_id,
        MY_CAJA,
        currentYear,
        empresa_id,
        MY_CAJA,
        currentYear,
        empresa_id,
        currentYear,
        empresa_id,
        MY_CAJA,
        currentYear,
        empresa_id,
        MY_CAJA,
        currentYear,
      ]
    );

    // 4. Ventas por Categoría (Prorrateado con el total real de la venta)
    const [catVentas] = await db.execute(
      `SELECT c.nombre, 
              SUM( (v.precio_total / (SELECT SUM(dv2.cantidad * dv2.precio_venta) FROM detalle_ventas dv2 WHERE dv2.venta_id = v.id)) * (dv.cantidad * dv.precio_venta) ) as total
       FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id
       JOIN productos p ON dv.producto_id = p.id JOIN categorias c ON p.categoria_id = c.id
       WHERE v.empresa_id = ? AND v.caja_id = ? AND MONTH(v.fecha) = ? AND YEAR(v.fecha) = ? GROUP BY c.id`,
      [empresa_id, MY_CAJA, selectedMonth, currentYear]
    );

    // 5. Gastos por Categoría
    const [catGastos] = await db.execute(
      `SELECT cg.nombre, SUM(g.monto) as total
       FROM gastos g JOIN categorias_gastos cg ON g.categoria_gasto_id = cg.id
       WHERE g.empresa_id = ? AND g.caja_id = ? AND MONTH(g.fecha) = ? AND YEAR(g.fecha) = ? GROUP BY cg.id`,
      [empresa_id, MY_CAJA, selectedMonth, currentYear]
    );

    // 6. Ventas por Caja (Esta sigue siendo global para comparar)
    const [ventasPorCaja] = await db.execute(
      `SELECT caja_id, SUM(precio_total) as total FROM ventas WHERE empresa_id = ? AND MONTH(fecha) = ? AND YEAR(fecha) = ? GROUP BY caja_id`,
      [empresa_id, selectedMonth, currentYear]
    );

    // 7. Ventas por Hora (Neto de la caja actual)
    const [ventasPorHora] = await db.execute(
      `SELECT HOUR(created_at) as hora, SUM(total) as total
       FROM (
           SELECT created_at, precio_total as total FROM ventas WHERE empresa_id = ? AND caja_id = ? AND MONTH(fecha) = ? AND YEAR(fecha) = ?
           UNION ALL
           SELECT created_at, precio_total * -1 as total FROM devoluciones WHERE empresa_id = ? AND caja_id = ? AND MONTH(fecha) = ? AND YEAR(fecha) = ?
       ) t GROUP BY hora`,
      [
        empresa_id,
        MY_CAJA,
        selectedMonth,
        currentYear,
        empresa_id,
        MY_CAJA,
        selectedMonth,
        currentYear,
      ]
    );

    res.json({
      gananciasRaw,
      comparativaDiaria,
      balanceMensual,
      catVentas,
      catGastos,
      ventasPorCaja,
      ventasPorHora,
      categoriasLista: (
        await db.execute("SELECT nombre FROM categorias WHERE empresa_id = ?", [
          empresa_id,
        ])
      )[0].map((c) => c.nombre),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPrediccionBI = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const MY_CAJA = Number(process.env.CAJA_ID || 1);

    const hoy = new Date();
    const ultimoDiaMes = new Date(
      hoy.getFullYear(),
      hoy.getMonth() + 1,
      0
    ).getDate();
    const diaActual = hoy.getDate();
    const diasRestantes = ultimoDiaMes - diaActual;

    // 1. UTILIDAD NETA ÚLTIMOS 30 DÍAS (Para sacar el promedio diario)
    // (Ventas - Devoluciones - Costo Mercadería - Gastos)
    const [historico] = await db.execute(
      `
      SELECT (
        (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND caja_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) -
        (SELECT IFNULL(SUM(precio_total),0) FROM devoluciones WHERE empresa_id = ? AND caja_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) -
        (SELECT IFNULL(SUM(dv.cantidad * dv.precio_compra), 0) FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id WHERE v.empresa_id = ? AND v.caja_id = ? AND v.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) -
        (SELECT IFNULL(SUM(monto),0) FROM gastos WHERE empresa_id = ? AND caja_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))
      ) as utilidad_30_dias`,
      [
        empresa_id,
        MY_CAJA,
        empresa_id,
        MY_CAJA,
        empresa_id,
        MY_CAJA,
        empresa_id,
        MY_CAJA,
      ]
    );

    const promedioDiario = historico[0].utilidad_30_dias / 30;

    // 2. UTILIDAD NETA ACUMULADA DEL MES ACTUAL
    const [actual] = await db.execute(
      `
      SELECT (
        (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND caja_id = ? AND MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())) -
        (SELECT IFNULL(SUM(precio_total),0) FROM devoluciones WHERE empresa_id = ? AND caja_id = ? AND MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())) -
        (SELECT IFNULL(SUM(dv.cantidad * dv.precio_compra), 0) FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id WHERE v.empresa_id = ? AND v.caja_id = ? AND MONTH(v.fecha) = MONTH(CURDATE()) AND YEAR(v.fecha) = YEAR(CURDATE())) -
        (SELECT IFNULL(SUM(monto),0) FROM gastos WHERE empresa_id = ? AND caja_id = ? AND MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE()))
      ) as acumulado_mes`,
      [
        empresa_id,
        MY_CAJA,
        empresa_id,
        MY_CAJA,
        empresa_id,
        MY_CAJA,
        empresa_id,
        MY_CAJA,
      ]
    );

    const acumuladoMes = parseFloat(actual[0].acumulado_mes) || 0;
    const proyeccionFinal = acumuladoMes + promedioDiario * diasRestantes;

    res.json({
      acumuladoActual: acumuladoMes,
      promedioDiario: promedioDiario,
      prediccionCierre: proyeccionFinal,
      diasRestantes,
      porcentajeMes: Math.round((diaActual / ultimoDiaMes) * 100),
    });
  } catch (error) {
    console.error("Error BI:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getFullChartData, getPrediccionBI };
