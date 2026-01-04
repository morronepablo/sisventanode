// controllers/dashboardController.js
const db = require("../config/db");

const getFullChartData = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const currentYear = new Date().getFullYear();
    const selectedMonth =
      parseInt(req.query.month) || new Date().getMonth() + 1;

    // 1. Ganancias por Mes y Ganancias por Mes/Categoría (Año Actual)
    const [categorias] = await db.execute(
      "SELECT id, nombre FROM categorias WHERE empresa_id = ?",
      [empresa_id]
    );

    const [gananciasRaw] = await db.execute(
      `
      SELECT 
        MONTH(v.fecha) as mes,
        c.nombre as categoria,
        SUM(dv.cantidad * (p.precio_venta - p.precio_compra)) as ganancia
      FROM detalle_ventas dv
      JOIN ventas v ON dv.venta_id = v.id
      JOIN productos p ON dv.producto_id = p.id
      JOIN categorias c ON p.categoria_id = c.id
      WHERE v.empresa_id = ? AND YEAR(v.fecha) = ?
      GROUP BY mes, categoria
    `,
      [empresa_id, currentYear]
    );

    // 2. Stats Mensuales (Ventas vs Compras - Cantidad y Monto)
    const [statsMensuales] = await db.execute(
      `
      SELECT 
        m.mes,
        (SELECT COUNT(*) FROM ventas WHERE MONTH(fecha) = m.mes AND YEAR(fecha) = ? AND empresa_id = ?) as v_cant,
        (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE MONTH(fecha) = m.mes AND YEAR(fecha) = ? AND empresa_id = ?) as v_total,
        (SELECT COUNT(*) FROM compras WHERE MONTH(fecha) = m.mes AND YEAR(fecha) = ? AND empresa_id = ?) as c_cant,
        (SELECT IFNULL(SUM(precio_total),0) FROM compras WHERE MONTH(fecha) = m.mes AND YEAR(fecha) = ? AND empresa_id = ?) as c_total
      FROM (SELECT 1 as mes UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) m
    `,
      [
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

    // 3. Categorías (Ventas y Compras del mes seleccionado)
    const [catVentas] = await db.execute(
      `
      SELECT c.nombre, SUM(dv.cantidad * p.precio_venta) as total
      FROM detalle_ventas dv
      JOIN ventas v ON dv.venta_id = v.id
      JOIN productos p ON dv.producto_id = p.id
      JOIN categorias c ON p.categoria_id = c.id
      WHERE v.empresa_id = ? AND MONTH(v.fecha) = ? AND YEAR(v.fecha) = ?
      GROUP BY c.id
    `,
      [empresa_id, selectedMonth, currentYear]
    );

    const [catCompras] = await db.execute(
      `
      SELECT c.nombre, SUM(dc.cantidad * p.precio_compra) as total
      FROM detalle_compras dc
      JOIN compras co ON dc.compra_id = co.id
      JOIN productos p ON dc.producto_id = p.id
      JOIN categorias c ON p.categoria_id = c.id
      WHERE co.empresa_id = ? AND MONTH(co.fecha) = ? AND YEAR(co.fecha) = ?
      GROUP BY c.id
    `,
      [empresa_id, selectedMonth, currentYear]
    );

    // 4. Datos Diarios (Monto - Mes seleccionado)
    const [diarios] = await db.execute(
      `
      SELECT 
        DAY(t.fecha) as dia,
        SUM(CASE WHEN t.tipo = 'venta' THEN t.monto ELSE 0 END) as v_monto,
        SUM(CASE WHEN t.tipo = 'compra' THEN t.monto ELSE 0 END) as c_monto
      FROM (
        SELECT fecha, precio_total as monto, 'venta' as tipo FROM ventas WHERE empresa_id = ? AND MONTH(fecha) = ? AND YEAR(fecha) = ?
        UNION ALL
        SELECT fecha, precio_total as monto, 'compra' as tipo FROM compras WHERE empresa_id = ? AND MONTH(fecha) = ? AND YEAR(fecha) = ?
      ) t
      GROUP BY dia ORDER BY dia
    `,
      [
        empresa_id,
        selectedMonth,
        currentYear,
        empresa_id,
        selectedMonth,
        currentYear,
      ]
    );

    res.json({
      gananciasRaw,
      statsMensuales,
      catVentas,
      catCompras,
      diarios,
      categoriasLista: categorias.map((c) => c.nombre),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getFullChartData };
