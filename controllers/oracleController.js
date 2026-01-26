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
