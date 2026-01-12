// controllers/dashboardController.js
const db = require("../config/db");

const getFullChartData = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const now = new Date();
    const currentYear = now.getFullYear();
    const selectedMonth = parseInt(req.query.month) || now.getMonth() + 1;

    let prevMonth = selectedMonth - 1;
    let prevMonthYear = currentYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevMonthYear = currentYear - 1;
    }

    const [categorias] = await db.execute(
      "SELECT nombre FROM categorias WHERE empresa_id = ?",
      [empresa_id]
    );

    // 1. Ganancias Brutas por Mes y Categoría
    const [gananciasRaw] = await db.execute(
      `SELECT MONTH(v.fecha) as mes, c.nombre as categoria,
              SUM(dv.cantidad * (dv.precio_venta - dv.precio_compra)) as ganancia
       FROM detalle_ventas dv
       JOIN ventas v ON dv.venta_id = v.id
       JOIN productos p ON dv.producto_id = p.id
       JOIN categorias c ON p.categoria_id = c.id
       WHERE v.empresa_id = ? AND YEAR(v.fecha) = ?
       GROUP BY mes, categoria`,
      [empresa_id, currentYear]
    );

    // 2. Comparativa Diaria Mes Actual vs Anterior
    const [comparativaDiaria] = await db.execute(
      `SELECT d.dia,
        (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND DAY(fecha) = d.dia AND MONTH(fecha) = ? AND YEAR(fecha) = ?) as actual,
        (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND DAY(fecha) = d.dia AND MONTH(fecha) = ? AND YEAR(fecha) = ?) as anterior
      FROM (SELECT 1 as dia UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30 UNION SELECT 31) d`,
      [
        empresa_id,
        selectedMonth,
        currentYear,
        empresa_id,
        prevMonth,
        prevMonthYear,
      ]
    );

    // 3. Balance Mensual
    const [balanceMensual] = await db.execute(
      `SELECT m.mes,
        (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) as v_total,
        (SELECT IFNULL(SUM(precio_total),0) FROM compras WHERE empresa_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) as c_total,
        (SELECT IFNULL(SUM(monto),0) FROM gastos WHERE empresa_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) as g_total,
        (SELECT IFNULL(SUM(dv.cantidad * (dv.precio_venta - dv.precio_compra)),0) FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id WHERE v.empresa_id = ? AND MONTH(v.fecha) = m.mes AND YEAR(v.fecha) = ?) as ganancia_bruta
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

    // 4. Ventas por Categoría
    const [catVentas] = await db.execute(
      `SELECT c.nombre, SUM(dv.cantidad * dv.precio_venta) as total
       FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id
       JOIN productos p ON dv.producto_id = p.id JOIN categorias c ON p.categoria_id = c.id
       WHERE v.empresa_id = ? AND MONTH(v.fecha) = ? AND YEAR(v.fecha) = ? GROUP BY c.id`,
      [empresa_id, selectedMonth, currentYear]
    );

    // 5. Gastos por Categoría
    const [catGastos] = await db.execute(
      `SELECT cg.nombre, SUM(g.monto) as total
       FROM gastos g JOIN categorias_gastos cg ON g.categoria_gasto_id = cg.id
       WHERE g.empresa_id = ? AND MONTH(g.fecha) = ? AND YEAR(g.fecha) = ? GROUP BY cg.id`,
      [empresa_id, selectedMonth, currentYear]
    );

    // ✨ NUEVO: 6. Ventas por Caja (Guerra de Cajas)
    const [ventasPorCaja] = await db.execute(
      `SELECT caja_id, SUM(precio_total) as total
       FROM ventas
       WHERE empresa_id = ? AND MONTH(fecha) = ? AND YEAR(fecha) = ?
       GROUP BY caja_id`,
      [empresa_id, selectedMonth, currentYear]
    );

    res.json({
      gananciasRaw,
      comparativaDiaria,
      balanceMensual,
      catVentas,
      catGastos,
      ventasPorCaja, // 👈 Se envía al frontend
      categoriasLista: categorias.map((c) => c.nombre),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getFullChartData };
