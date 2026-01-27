// // controllers/oracleController.js
// const db = require("../config/db");
// const axios = require("axios");

// exports.getPulse = async (req, res) => {
//   // 🛡️ Validación Staff: Si no hay usuario por error de middleware, no crasheamos
//   if (!req.user) {
//     return res
//       .status(401)
//       .json({ message: "No autorizado. Falta token de seguridad." });
//   }

//   const empresa_id = req.user.empresa_id;
//   console.log(`🚀 [ORACLE] Petición para Empresa ID: ${empresa_id}`);

//   try {
//     // 💵 1. FETCH DOLAR MEP REAL
//     let cotizacionFinal = 1460.0;
//     try {
//       const response = await axios.get(
//         "https://dolarapi.com/v1/dolares/bolsa",
//         { timeout: 2000 },
//       );
//       if (response.data?.venta)
//         cotizacionFinal = parseFloat(response.data.venta);
//     } catch (e) {
//       console.log("⚠️ Dolar API no responde, usando respaldo.");
//     }

//     // 📈 2. VENTAS HOY
//     const [statsHoy] = await db.execute(
//       `
//       SELECT
//         COALESCE(SUM(precio_total), 0) as total_hoy,
//         COUNT(id) as tickets_hoy,
//         COALESCE(AVG(duracion_segundos), 0) as velocidad_promedio
//       FROM ventas
//       WHERE empresa_id = ? AND DATE(created_at) = CURDATE()
//     `,
//       [empresa_id],
//     );

//     // 📈 3. VENTAS AYER
//     const [statsAyer] = await db.execute(
//       `
//       SELECT COALESCE(SUM(precio_total), 0) as total_ayer
//       FROM ventas
//       WHERE empresa_id = ? AND DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
//     `,
//       [empresa_id],
//     );

//     // 📦 4. ALERTAS DE REPOSICIÓN
//     const [criticos] = await db.execute(
//       `
//       SELECT nombre, stock as stock_base, factor_conversion, stock_minimo
//       FROM productos
//       WHERE empresa_id = ? AND stock <= stock_minimo
//       ORDER BY stock ASC LIMIT 8
//     `,
//       [empresa_id],
//     );

//     // 💸 5. PASIVO INDEXADO
//     const [pasivos] = await db.execute(
//       `
//       SELECT COALESCE(SUM(deuda), 0) as deuda_total
//       FROM compras
//       WHERE empresa_id = ? AND deuda > 0
//     `,
//       [empresa_id],
//     );

//     res.json({
//       ventas: {
//         hoy: parseFloat(statsHoy[0].total_hoy),
//         ayer: parseFloat(statsAyer[0].total_ayer),
//         tickets: statsHoy[0].tickets_hoy,
//         velocidad: parseFloat(statsHoy[0].velocidad_promedio),
//       },
//       criticos: criticos,
//       deuda: parseFloat(pasivos[0].deuda_total),
//       mep_referencia: cotizacionFinal,
//     });
//   } catch (error) {
//     console.error("❌ [ORACLE PULSE ERROR]:", error.message);
//     res
//       .status(500)
//       .json({ message: "Error interno en el pulso de inteligencia" });
//   }
// };

const db = require("../config/db");
const axios = require("axios");

exports.getPulse = async (req, res) => {
  const empresa_id = req.user.empresa_id;

  try {
    // 💵 1. FETCH DOLAR MEP REAL
    let cotizacionFinal = 1460.0;
    try {
      const response = await axios.get(
        "https://dolarapi.com/v1/dolares/bolsa",
        { timeout: 2000 },
      );
      if (response.data?.venta)
        cotizacionFinal = parseFloat(response.data.venta);
    } catch (e) {
      console.log("⚠️ Dolar API Fail");
    }

    // 📈 2. VENTAS, TICKETS Y MIX DE PAGOS (Hoy)
    const [statsHoy] = await db.execute(
      `
      SELECT 
        COALESCE(SUM(precio_total), 0) as total_hoy,
        COUNT(id) as tickets_hoy,
        COALESCE(AVG(duracion_segundos), 0) as velocidad_promedio,
        COALESCE(SUM(efectivo), 0) as efectivo,
        COALESCE(SUM(mercadopago), 0) as mercadopago,
        COALESCE(SUM(tarjeta + transferencia), 0) as otros_pagos
      FROM ventas 
      WHERE empresa_id = ? AND DATE(created_at) = CURDATE()
    `,
      [empresa_id],
    );

    // 📈 3. VENTAS AYER
    const [statsAyer] = await db.execute(
      `
      SELECT COALESCE(SUM(precio_total), 0) as total_ayer 
      FROM ventas 
      WHERE empresa_id = ? AND DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
    `,
      [empresa_id],
    );

    // 📦 4. ALERTAS DE REPOSICIÓN
    const [criticos] = await db.execute(
      `
      SELECT nombre, stock as stock_base, factor_conversion, stock_minimo
      FROM productos 
      WHERE empresa_id = ? AND stock <= stock_minimo
      ORDER BY stock ASC LIMIT 6
    `,
      [empresa_id],
    );

    // 💸 5. PASIVOS Y GASTOS DEL MES
    const [pasivos] = await db.execute(
      `
      SELECT COALESCE(SUM(deuda), 0) as deuda_total FROM compras WHERE empresa_id = ? AND deuda > 0
    `,
      [empresa_id],
    );

    const [gastos] = await db.execute(
      `
      SELECT COALESCE(SUM(monto), 0) as total_gastos FROM gastos 
      WHERE empresa_id = ? AND MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())
    `,
      [empresa_id],
    );

    res.json({
      ventas: {
        hoy: parseFloat(statsHoy[0].total_hoy),
        ayer: parseFloat(statsAyer[0].total_ayer),
        tickets: statsHoy[0].tickets_hoy,
        velocidad: parseFloat(statsHoy[0].velocidad_promedio),
        mix: {
          efectivo: parseFloat(statsHoy[0].efectivo),
          mp: parseFloat(statsHoy[0].mercadopago),
          otros: parseFloat(statsHoy[0].otros_pagos),
        },
      },
      criticos: criticos,
      deuda: parseFloat(pasivos[0].deuda_total),
      gastos_mes: parseFloat(gastos[0].total_gastos),
      mep_referencia: cotizacionFinal,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMarkupAnalysis = async (req, res) => {
  const empresa_id = req.user.empresa_id;

  try {
    // 1. Obtener Métricas Generales
    const [metricas] = await db.execute(
      `
      SELECT 
        (SELECT COALESCE(SUM(monto), 0) FROM gastos WHERE empresa_id = ? AND MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())) as total_gastos,
        (SELECT COALESCE(SUM(precio_total), 1) FROM ventas WHERE empresa_id = ? AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())) as total_ventas,
        (SELECT COUNT(*) FROM productos WHERE empresa_id = ?) as total_productos
    `,
      [empresa_id, empresa_id, empresa_id],
    );

    const overhead =
      parseFloat(metricas[0].total_ventas) > 0
        ? parseFloat(metricas[0].total_gastos) /
          parseFloat(metricas[0].total_ventas)
        : 0.15;

    // 2. QUERY MAESTRA CON EXPLOSIÓN DE COMBOS
    const [analisis] = await db.execute(
      `
      SELECT 
        p.id, p.nombre, p.precio_venta, p.precio_compra as costo_reposicion, p.factor_conversion,
        (? * p.precio_venta) as gastos_proyectados,
        (p.precio_venta - p.precio_compra - (? * p.precio_venta)) as utilidad_neta_real,
        IFNULL(stats.vta_dia, 0) as vta_dia,
        IFNULL(stats.vta_mes, 0) as vta_mes,
        IFNULL(stats.vta_anio, 0) as vta_anio,
        IFNULL(stats.vta_total, 0) as vta_total
      FROM productos p
      LEFT JOIN (
        SELECT 
          sub.producto_id,
          SUM(CASE WHEN DATE(sub.fecha) = CURDATE() THEN sub.importe ELSE 0 END) as vta_dia,
          SUM(CASE WHEN MONTH(sub.fecha) = MONTH(CURDATE()) AND YEAR(sub.fecha) = YEAR(CURDATE()) THEN sub.importe ELSE 0 END) as vta_mes,
          SUM(CASE WHEN YEAR(sub.fecha) = YEAR(CURDATE()) THEN sub.importe ELSE 0 END) as vta_anio,
          SUM(sub.importe) as vta_total
        FROM (
          -- A. VENTAS DIRECTAS
          SELECT dv.producto_id, v.created_at as fecha, (dv.precio_venta * COALESCE(dv.cantidad_unidades_base, dv.cantidad)) as importe
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          WHERE v.empresa_id = ? AND dv.producto_id IS NOT NULL
          
          UNION ALL
          
          -- B. VENTAS POR COMBOS (Explosión)
          -- Aquí asumo que detalle_ventas tiene combo_id y hay una tabla combo_producto
          SELECT cp.producto_id, v.created_at as fecha, (p.precio_venta * (dv.cantidad * cp.cantidad)) as importe
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN combo_producto cp ON dv.combo_id = cp.combo_id
          JOIN productos p ON cp.producto_id = p.id
          WHERE v.empresa_id = ? AND dv.combo_id IS NOT NULL
        ) AS sub
        GROUP BY sub.producto_id
      ) AS stats ON p.id = stats.producto_id
      WHERE p.empresa_id = ? AND p.precio_venta > 0
      ORDER BY p.nombre ASC
    `,
      [overhead, overhead, empresa_id, empresa_id, empresa_id],
    );

    // 3. Multiplica solo bultos
    const resultados = analisis.map((item) => {
      if (item.factor_conversion > 1) {
        return {
          ...item,
          vta_dia: parseFloat(
            (item.vta_dia * item.factor_conversion).toFixed(2),
          ),
          vta_mes: parseFloat(
            (item.vta_mes * item.factor_conversion).toFixed(2),
          ),
          vta_anio: parseFloat(
            (item.vta_anio * item.factor_conversion).toFixed(2),
          ),
          vta_total: parseFloat(
            (item.vta_total * item.factor_conversion).toFixed(2),
          ),
        };
      }
      return item;
    });

    res.json({
      overhead_actual: (overhead * 100).toFixed(2),
      total_analizado: metricas[0].total_productos,
      productos_riesgo: analisis || [],
    });
  } catch (error) {
    console.error("❌ ERROR BI COMBOS:", error.message);
    res.status(500).json({ message: error.message });
  }
};
