// controllers/dashboardController.js
const db = require("../config/db");

// const getFullChartData = async (req, res) => {
//   try {
//     const empresa_id = req.user.empresa_id;
//     const now = new Date();
//     const currentYear = now.getFullYear();
//     const selectedMonth = parseInt(req.query.month) || now.getMonth() + 1;

//     // Calcular mes anterior para la comparativa
//     let prevMonth = selectedMonth - 1;
//     let prevMonthYear = currentYear;
//     if (prevMonth === 0) {
//       prevMonth = 12;
//       prevMonthYear = currentYear - 1;
//     }

//     // 1. Obtener lista de categorías
//     const [categorias] = await db.execute(
//       "SELECT nombre FROM categorias WHERE empresa_id = ?",
//       [empresa_id]
//     );

//     // 2. Ganancias por Mes y Categoría (Año Actual)
//     const [gananciasRaw] = await db.execute(
//       `SELECT MONTH(v.fecha) as mes, c.nombre as categoria,
//               SUM(dv.cantidad * (p.precio_venta - p.precio_compra)) as ganancia
//        FROM detalle_ventas dv
//        JOIN ventas v ON dv.venta_id = v.id
//        JOIN productos p ON dv.producto_id = p.id
//        JOIN categorias c ON p.categoria_id = c.id
//        WHERE v.empresa_id = ? AND YEAR(v.fecha) = ?
//        GROUP BY mes, categoria`,
//       [empresa_id, currentYear]
//     );

//     // 3. COMPARATIVA DIARIA: Ventas Mes Seleccionado vs Mes Anterior
//     const [comparativaDiaria] = await db.execute(
//       `
//       SELECT d.dia,
//         (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND DAY(fecha) = d.dia AND MONTH(fecha) = ? AND YEAR(fecha) = ?) as actual,
//         (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND DAY(fecha) = d.dia AND MONTH(fecha) = ? AND YEAR(fecha) = ?) as anterior
//       FROM (
//         SELECT 1 as dia UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
//         SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
//         SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION SELECT 31
//       ) d ORDER BY d.dia`,
//       [
//         empresa_id,
//         selectedMonth,
//         currentYear,
//         empresa_id,
//         prevMonth,
//         prevMonthYear,
//       ]
//     );

//     // 4. BALANCE FINANCIERO MENSUAL (Año Completo para Gráfico de Barras)
//     const [balanceMensual] = await db.execute(
//       `
//       SELECT m.mes,
//         (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) as v_total,
//         (SELECT IFNULL(SUM(precio_total),0) FROM compras WHERE empresa_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) as c_total,
//         (SELECT IFNULL(SUM(monto),0) FROM gastos WHERE empresa_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) as g_total
//       FROM (SELECT 1 as mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) m`,
//       [
//         empresa_id,
//         currentYear,
//         empresa_id,
//         currentYear,
//         empresa_id,
//         currentYear,
//       ]
//     );

//     // 5. Distribución por Categorías (Ventas y Compras del mes seleccionado)
//     const [catVentas] = await db.execute(
//       `SELECT c.nombre, SUM(dv.cantidad * p.precio_venta) as total
//        FROM detalle_ventas dv
//        JOIN ventas v ON dv.venta_id = v.id
//        JOIN productos p ON dv.producto_id = p.id
//        JOIN categorias c ON p.categoria_id = c.id
//        WHERE v.empresa_id = ? AND MONTH(v.fecha) = ? AND YEAR(v.fecha) = ?
//        GROUP BY c.id`,
//       [empresa_id, selectedMonth, currentYear]
//     );

//     const [catCompras] = await db.execute(
//       `SELECT c.nombre, SUM(dc.cantidad * p.precio_compra) as total
//        FROM detalle_compras dc
//        JOIN compras co ON dc.compra_id = co.id
//        JOIN productos p ON dc.producto_id = p.id
//        JOIN categorias c ON p.categoria_id = c.id
//        WHERE co.empresa_id = ? AND MONTH(co.fecha) = ? AND YEAR(co.fecha) = ?
//        GROUP BY c.id`,
//       [empresa_id, selectedMonth, currentYear]
//     );

//     // 6. Stats Mensuales (Ventas vs Compras - Cantidad y Monto) para Gráficos Lineales
//     const [statsMensuales] = await db.execute(
//       `SELECT m.mes,
//         (SELECT COUNT(*) FROM ventas WHERE MONTH(fecha) = m.mes AND YEAR(fecha) = ? AND empresa_id = ?) as v_cant,
//         (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE MONTH(fecha) = m.mes AND YEAR(fecha) = ? AND empresa_id = ?) as v_total,
//         (SELECT COUNT(*) FROM compras WHERE MONTH(fecha) = m.mes AND YEAR(fecha) = ? AND empresa_id = ?) as c_cant,
//         (SELECT IFNULL(SUM(precio_total),0) FROM compras WHERE MONTH(fecha) = m.mes AND YEAR(fecha) = ? AND empresa_id = ?) as c_total
//       FROM (SELECT 1 as mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) m`,
//       [
//         currentYear,
//         empresa_id,
//         currentYear,
//         empresa_id,
//         currentYear,
//         empresa_id,
//         currentYear,
//         empresa_id,
//       ]
//     );

//     res.json({
//       gananciasRaw,
//       comparativaDiaria,
//       balanceMensual,
//       catVentas,
//       catCompras,
//       statsMensuales,
//       categoriasLista: categorias.map((c) => c.nombre),
//     });
//   } catch (error) {
//     console.error("Error en getFullChartData:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

const getFullChartData = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const now = new Date();
    const currentYear = now.getFullYear();
    const selectedMonth = parseInt(req.query.month) || now.getMonth() + 1;

    // Calcular mes anterior para la comparativa
    let prevMonth = selectedMonth - 1;
    let prevMonthYear = currentYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevMonthYear = currentYear - 1;
    }

    // 1. Obtener lista de categorías
    const [categorias] = await db.execute(
      "SELECT nombre FROM categorias WHERE empresa_id = ?",
      [empresa_id]
    );

    // 2. Ganancias Reales por Mes y Categoría (Venta - Costo - Devoluciones)
    const [gananciasRaw] = await db.execute(
      `SELECT MONTH(v.fecha) as mes, c.nombre as categoria,
              SUM(dv.cantidad * (p.precio_venta - p.precio_compra)) as ganancia
       FROM detalle_ventas dv
       JOIN ventas v ON dv.venta_id = v.id
       JOIN productos p ON dv.producto_id = p.id
       JOIN categorias c ON p.categoria_id = c.id
       WHERE v.empresa_id = ? AND YEAR(v.fecha) = ?
       GROUP BY mes, categoria`,
      [empresa_id, currentYear]
    );

    // 3. COMPARATIVA DIARIA: Ventas Mes Seleccionado vs Mes Anterior (Neta)
    const [comparativaDiaria] = await db.execute(
      `
      SELECT d.dia,
        (
          (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND DAY(fecha) = d.dia AND MONTH(fecha) = ? AND YEAR(fecha) = ?) -
          (SELECT IFNULL(SUM(precio_total),0) FROM devoluciones WHERE empresa_id = ? AND DAY(fecha) = d.dia AND MONTH(fecha) = ? AND YEAR(fecha) = ?)
        ) as actual,
        (
          (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND DAY(fecha) = d.dia AND MONTH(fecha) = ? AND YEAR(fecha) = ?) -
          (SELECT IFNULL(SUM(precio_total),0) FROM devoluciones WHERE empresa_id = ? AND DAY(fecha) = d.dia AND MONTH(fecha) = ? AND YEAR(fecha) = ?)
        ) as anterior
      FROM (
        SELECT 1 as dia UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION 
        SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION 
        SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION SELECT 31
      ) d ORDER BY d.dia`,
      [
        empresa_id,
        selectedMonth,
        currentYear,
        empresa_id,
        selectedMonth,
        currentYear,
        empresa_id,
        prevMonth,
        prevMonthYear,
        empresa_id,
        prevMonth,
        prevMonthYear,
      ]
    );

    // 4. BALANCE FINANCIERO MENSUAL: Ventas Netas (Ventas - Devoluciones) vs Egresos (Compras + Gastos)
    const [balanceMensual] = await db.execute(
      `
      SELECT m.mes,
        (
          (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) - 
          (SELECT IFNULL(SUM(precio_total),0) FROM devoluciones WHERE empresa_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?)
        ) as v_total,
        (SELECT IFNULL(SUM(precio_total),0) FROM compras WHERE empresa_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) as c_total,
        (SELECT IFNULL(SUM(monto),0) FROM gastos WHERE empresa_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) as g_total
      FROM (SELECT 1 as mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) m`,
      [
        empresa_id,
        currentYear,
        empresa_id,
        currentYear,
        empresa_id,
        currentYear,
        empresa_id,
        currentYear,
      ]
    );

    // 5. Distribución por Categorías de Ventas Netas
    const [catVentas] = await db.execute(
      `SELECT c.nombre, SUM(dv.cantidad * p.precio_venta) as total
       FROM detalle_ventas dv
       JOIN ventas v ON dv.venta_id = v.id
       JOIN productos p ON dv.producto_id = p.id
       JOIN categorias c ON p.categoria_id = c.id
       WHERE v.empresa_id = ? AND MONTH(v.fecha) = ? AND YEAR(v.fecha) = ?
       GROUP BY c.id`,
      [empresa_id, selectedMonth, currentYear]
    );

    // 6. Distribución por Categorías de Compras
    const [catCompras] = await db.execute(
      `SELECT c.nombre, SUM(dc.cantidad * p.precio_compra) as total
       FROM detalle_compras dc
       JOIN compras co ON dc.compra_id = co.id
       JOIN productos p ON dc.producto_id = p.id
       JOIN categorias c ON p.categoria_id = c.id
       WHERE co.empresa_id = ? AND MONTH(co.fecha) = ? AND YEAR(co.fecha) = ?
       GROUP BY c.id`,
      [empresa_id, selectedMonth, currentYear]
    );

    // 7. Stats Mensuales (Corregido para restar devoluciones en v_total)
    const [statsMensuales] = await db.execute(
      `SELECT m.mes,
        (SELECT COUNT(*) FROM ventas WHERE MONTH(fecha) = m.mes AND YEAR(fecha) = ? AND empresa_id = ?) as v_cant,
        (
          (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE MONTH(fecha) = m.mes AND YEAR(fecha) = ? AND empresa_id = ?) -
          (SELECT IFNULL(SUM(precio_total),0) FROM devoluciones WHERE MONTH(fecha) = m.mes AND YEAR(fecha) = ? AND empresa_id = ?)
        ) as v_total,
        (SELECT COUNT(*) FROM compras WHERE MONTH(fecha) = m.mes AND YEAR(fecha) = ? AND empresa_id = ?) as c_cant,
        (SELECT IFNULL(SUM(precio_total),0) FROM compras WHERE MONTH(fecha) = m.mes AND YEAR(fecha) = ? AND empresa_id = ?) as c_total
      FROM (SELECT 1 as mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) m`,
      [
        currentYear,
        empresa_id,
        currentYear,
        empresa_id,
        currentYear,
        empresa_id,
        currentYear,
        empresa_id,
        currentYear,
        empresa_id,
      ]
    );

    res.json({
      gananciasRaw,
      comparativaDiaria,
      balanceMensual,
      catVentas,
      catCompras,
      statsMensuales,
      categoriasLista: categorias.map((c) => c.nombre),
    });
  } catch (error) {
    console.error("Error en getFullChartData:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getFullChartData };
