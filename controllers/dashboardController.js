// controllers/dashboardController.js
const db = require("../config/db");

const getFullChartData = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const MY_CAJA = Number(process.env.CAJA_ID || 1);
    const now = new Date();
    const currentYear = now.getFullYear();
    const selectedMonth = parseInt(req.query.month) || now.getMonth() + 1;

    let prevMonth = selectedMonth - 1;
    let prevMonthYear = currentYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevMonthYear = currentYear - 1;
    }

    // 1. 💰 GANANCIA BRUTA POR MES Y CATEGORÍA (Visión Global - Prorrateada)
    const [gananciasRaw] = await db.execute(
      `SELECT 
      MONTH(v.fecha) as mes, 
      c.nombre as categoria,
      -- Fórmula de Prorrateo: (Total Cobrado Real / Total Teórico) * Ganancia Teórica
      SUM( 
        (v.precio_total / (SELECT SUM(dv2.cantidad * dv2.precio_venta) FROM detalle_ventas dv2 WHERE dv2.venta_id = v.id)) * 
        (dv.cantidad * (dv.precio_venta - dv.precio_compra)) 
      ) as ganancia
   FROM detalle_ventas dv
   JOIN ventas v ON dv.venta_id = v.id
   JOIN productos p ON dv.producto_id = p.id
   JOIN categorias c ON p.categoria_id = c.id
   WHERE v.empresa_id = ? AND YEAR(v.fecha) = ? -- 👈 Eliminamos filtro de caja_id
   GROUP BY mes, categoria
   ORDER BY mes ASC`,
      [empresa_id, currentYear]
    );

    // 2. 📈 COMPARATIVA DIARIA (Mes Actual vs Mes Anterior - Global y Neto)
    const [comparativaDiaria] = await db.execute(
      `SELECT d.dia,
    -- Cálculo NETO para el Mes Actual (Ventas - Devoluciones de toda la empresa)
    (
      IFNULL((SELECT SUM(precio_total) FROM ventas WHERE empresa_id = ? AND DAY(fecha) = d.dia AND MONTH(fecha) = ? AND YEAR(fecha) = ?), 0) -
      IFNULL((SELECT SUM(precio_total) FROM devoluciones WHERE empresa_id = ? AND DAY(fecha) = d.dia AND MONTH(fecha) = ? AND YEAR(fecha) = ?), 0)
    ) as actual,
    
    -- Cálculo NETO para el Mes Anterior (Ventas - Devoluciones de toda la empresa)
    (
      IFNULL((SELECT SUM(precio_total) FROM ventas WHERE empresa_id = ? AND DAY(fecha) = d.dia AND MONTH(fecha) = ? AND YEAR(fecha) = ?), 0) -
      IFNULL((SELECT SUM(precio_total) FROM devoluciones WHERE empresa_id = ? AND DAY(fecha) = d.dia AND MONTH(fecha) = ? AND YEAR(fecha) = ?), 0)
    ) as anterior
  FROM (
    SELECT 1 as dia UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 
    UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 
    UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 
    UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 
    UNION SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION SELECT 31
  ) d`,
      [
        // Parámetros para 'actual'
        empresa_id,
        selectedMonth,
        currentYear,
        empresa_id,
        selectedMonth,
        currentYear,
        // Parámetros para 'anterior'
        empresa_id,
        prevMonth,
        prevMonthYear,
        empresa_id,
        prevMonth,
        prevMonthYear,
      ]
    );

    // 3. ⚖️ BALANCE MENSUAL ANUAL (Sincronizado al 100% con Informes)
    const [balanceMensual] = await db.execute(
      `SELECT m.mes,
    -- Ventas Netas (Ventas - Devoluciones)
    ( (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) - 
      (SELECT IFNULL(SUM(precio_total),0) FROM devoluciones WHERE empresa_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) ) as v_total,
    
    (SELECT IFNULL(SUM(precio_total),0) FROM compras WHERE empresa_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) as c_total,
    
    (SELECT IFNULL(SUM(monto),0) FROM gastos WHERE empresa_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) as g_total,
    
    -- GANANCIA BRUTA REAL: (Ventas - Costo Ventas) - (Devoluciones - Costo Devoluciones)
    (
      IFNULL((SELECT SUM(v2.precio_total - (SELECT SUM(dv.cantidad * dv.precio_compra) FROM detalle_ventas dv WHERE dv.venta_id = v2.id)) 
       FROM ventas v2 WHERE v2.empresa_id = ? AND MONTH(v2.fecha) = m.mes AND YEAR(v2.fecha) = ?), 0)
      -
      IFNULL((SELECT SUM(d2.precio_total - (SELECT SUM(dd.cantidad * p.precio_compra) FROM detalle_devoluciones dd JOIN productos p ON dd.producto_id = p.id WHERE dd.devolucion_id = d2.id)) 
       FROM devoluciones d2 WHERE d2.empresa_id = ? AND MONTH(d2.fecha) = m.mes AND YEAR(d2.fecha) = ?), 0)
    ) as ganancia_bruta

  FROM (SELECT 1 as mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) m`,
      [
        empresa_id,
        currentYear,
        empresa_id,
        currentYear, // v_total
        empresa_id,
        currentYear, // c_total
        empresa_id,
        currentYear, // g_total
        empresa_id,
        currentYear, // Ganancia Ventas
        empresa_id,
        currentYear, // Ganancia Devoluciones
      ]
    );

    // 4. 🏷️ VENTAS POR CATEGORÍA (Visión Global del Mes - Prorrateado con Promos)
    const [catVentas] = await db.execute(
      `SELECT 
      c.nombre, 
      -- Fórmula de Prorrateo: asegura que si hubo un 3x2, el total sea el real cobrado
      SUM( 
        (v.precio_total / (SELECT SUM(dv2.cantidad * dv2.precio_venta) FROM detalle_ventas dv2 WHERE dv2.venta_id = v.id)) * 
        (dv.cantidad * dv.precio_venta) 
      ) as total
   FROM detalle_ventas dv 
   JOIN ventas v ON dv.venta_id = v.id
   JOIN productos p ON dv.producto_id = p.id 
   JOIN categorias c ON p.categoria_id = c.id
   WHERE v.empresa_id = ? 
     AND MONTH(v.fecha) = ? 
     AND YEAR(v.fecha) = ? -- 👈 Eliminamos filtro de caja_id
   GROUP BY c.id`,
      [empresa_id, selectedMonth, currentYear]
    );

    // 5. 💸 ESTRUCTURA DE GASTOS (Visión Global del Mes)
    const [catGastos] = await db.execute(
      `SELECT 
      cg.nombre, 
      SUM(g.monto) as total
   FROM gastos g 
   JOIN categorias_gastos cg ON g.categoria_gasto_id = cg.id
   WHERE g.empresa_id = ? 
     AND MONTH(g.fecha) = ? 
     AND YEAR(g.fecha) = ? -- 👈 Eliminamos filtro de caja_id
   GROUP BY cg.id 
   ORDER BY total DESC`,
      [empresa_id, selectedMonth, currentYear]
    );

    // 6. ⚔️ GUERRA DE CAJAS (Neto: Ventas - Devoluciones) ⚔️
    // Esta consulta imita tu lógica: busca cada caja y le resta sus devoluciones
    const [ventasPorCaja] = await db.execute(
      `SELECT 
          caja_id,
          (
            IFNULL((SELECT SUM(precio_total) FROM ventas WHERE caja_id = v.caja_id AND empresa_id = ? AND MONTH(fecha) = ? AND YEAR(fecha) = ?), 0) -
            IFNULL((SELECT SUM(precio_total) FROM devoluciones WHERE caja_id = v.caja_id AND empresa_id = ? AND MONTH(fecha) = ? AND YEAR(fecha) = ?), 0)
          ) as total
       FROM (SELECT DISTINCT caja_id FROM ventas WHERE empresa_id = ?) v`,
      [
        empresa_id,
        selectedMonth,
        currentYear,
        empresa_id,
        selectedMonth,
        currentYear,
        empresa_id,
      ]
    );

    // 7. 🕒 VENTAS POR HORA (Visión Global de Flujo de Clientes - Neto)
    const [ventasPorHora] = await db.execute(
      `SELECT HOUR(created_at) as hora, SUM(total) as total
   FROM (
       -- Ventas de todas las cajas
       SELECT created_at, precio_total as total 
       FROM ventas 
       WHERE empresa_id = ? AND MONTH(fecha) = ? AND YEAR(fecha) = ?
       
       UNION ALL
       
       -- Devoluciones de todas las cajas (restan flujo)
       SELECT created_at, precio_total * -1 as total 
       FROM devoluciones 
       WHERE empresa_id = ? AND MONTH(fecha) = ? AND YEAR(fecha) = ?
   ) t 
   GROUP BY hora 
   ORDER BY hora ASC`,
      [
        empresa_id,
        selectedMonth,
        currentYear,
        empresa_id,
        selectedMonth,
        currentYear,
      ]
    );

    // 8. ⚔️ GUERRA DE USUARIOS (Venta Neta por Persona) ⚔️
    // Usamos la tabla 'users' y columna 'name' como en tu DB
    const [ventasPorUsuario] = await db.execute(
      `SELECT 
          u.name as usuario,
          (
            IFNULL((SELECT SUM(precio_total) FROM ventas WHERE usuario_id = u.id AND empresa_id = ? AND MONTH(fecha) = ? AND YEAR(fecha) = ?), 0) -
            IFNULL((SELECT SUM(precio_total) FROM devoluciones WHERE usuario_id = u.id AND empresa_id = ? AND MONTH(fecha) = ? AND YEAR(fecha) = ?), 0)
          ) as total
       FROM users u 
       WHERE u.empresa_id = ?
       HAVING total > 0
       ORDER BY total DESC`,
      [
        empresa_id,
        selectedMonth,
        currentYear,
        empresa_id,
        selectedMonth,
        currentYear,
        empresa_id,
      ]
    );

    // 9. Lista de Categorías para el gráfico de barras apiladas
    const [cats] = await db.execute(
      "SELECT nombre FROM categorias WHERE empresa_id = ?",
      [empresa_id]
    );

    res.json({
      gananciasRaw,
      comparativaDiaria,
      balanceMensual,
      catVentas,
      catGastos,
      ventasPorCaja,
      ventasPorHora,
      ventasPorUsuario, // 👈 Enviamos los datos al Frontend
      categoriasLista: cats.map((c) => c.nombre),
    });
  } catch (error) {
    console.error("ERROR DASHBOARD CHARTS:", error);
    res.status(500).json({ error: error.message });
  }
};

const getPrediccionBI = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const hoy = new Date();
    const ultimoDiaMes = new Date(
      hoy.getFullYear(),
      hoy.getMonth() + 1,
      0
    ).getDate();
    const diaActual = hoy.getDate();
    const diasRestantes = ultimoDiaMes - diaActual;

    // 1. UTILIDAD NETA GLOBAL ÚLTIMOS 30 DÍAS (Para el ritmo diario)
    // Calculamos: (Ventas - Devoluciones - CMV - Gastos) de TODA la empresa
    const [historico] = await db.execute(
      `
      SELECT (
        (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) -
        (SELECT IFNULL(SUM(precio_total),0) FROM devoluciones WHERE empresa_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) -
        (SELECT IFNULL(SUM(dv.cantidad * dv.precio_compra), 0) FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id WHERE v.empresa_id = ? AND v.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) -
        (SELECT IFNULL(SUM(monto),0) FROM gastos WHERE empresa_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))
      ) as utilidad_30_dias`,
      [
        empresa_id, // Ventas
        empresa_id, // Devoluciones
        empresa_id, // CMV (Costo mercadería)
        empresa_id, // Gastos
      ]
    );

    const promedioDiario = historico[0].utilidad_30_dias / 30;

    // 2. UTILIDAD NETA ACUMULADA GLOBAL DEL MES ACTUAL
    const [actual] = await db.execute(
      `
      SELECT (
        (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())) -
        (SELECT IFNULL(SUM(precio_total),0) FROM devoluciones WHERE empresa_id = ? AND MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())) -
        (SELECT IFNULL(SUM(dv.cantidad * dv.precio_compra), 0) FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id WHERE v.empresa_id = ? AND MONTH(v.fecha) = MONTH(CURDATE()) AND YEAR(v.fecha) = YEAR(CURDATE())) -
        (SELECT IFNULL(SUM(monto),0) FROM gastos WHERE empresa_id = ? AND MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE()))
      ) as acumulado_mes`,
      [
        empresa_id, // Ventas mes
        empresa_id, // Devoluciones mes
        empresa_id, // CMV mes
        empresa_id, // Gastos mes
      ]
    );

    const acumuladoMes = parseFloat(actual[0].acumulado_mes) || 0;

    // Proyección: Lo que ya ganamos + (Ritmo diario * Días que faltan)
    const proyeccionFinal =
      acumuladoMes + promedioDiario * (diasRestantes > 0 ? diasRestantes : 0);

    res.json({
      acumuladoActual: acumuladoMes,
      promedioDiario: promedioDiario,
      prediccionCierre: proyeccionFinal,
      diasRestantes: diasRestantes > 0 ? diasRestantes : 0,
      porcentajeMes: Math.round((diaActual / ultimoDiaMes) * 100),
    });
  } catch (error) {
    console.error("Error BI:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getFullChartData, getPrediccionBI };
