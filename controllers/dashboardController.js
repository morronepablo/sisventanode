// controllers/dashboardController.js
const db = require("../config/db");
const axios = require("axios");

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
   WHERE v.empresa_id = ? AND YEAR(v.fecha) = ?
   GROUP BY mes, categoria
   ORDER BY mes ASC`,
      [empresa_id, currentYear],
    );

    // 2. 📈 COMPARATIVA DIARIA (Mes Actual vs Mes Anterior - Global y Neto)
    const [comparativaDiaria] = await db.execute(
      `SELECT d.dia,
    (
      IFNULL((SELECT SUM(precio_total) FROM ventas WHERE empresa_id = ? AND DAY(fecha) = d.dia AND MONTH(fecha) = ? AND YEAR(fecha) = ?), 0) -
      IFNULL((SELECT SUM(precio_total) FROM devoluciones WHERE empresa_id = ? AND DAY(fecha) = d.dia AND MONTH(fecha) = ? AND YEAR(fecha) = ?), 0)
    ) as actual,
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
      ],
    );

    // 3. ⚖️ BALANCE MENSUAL ANUAL (Sincronizado al 100% con Informes)
    const [balanceMensual] = await db.execute(
      `SELECT m.mes,
    ( (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) - 
      (SELECT IFNULL(SUM(precio_total),0) FROM devoluciones WHERE empresa_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) ) as v_total,
    (SELECT IFNULL(SUM(precio_total),0) FROM compras WHERE empresa_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) as c_total,
    (SELECT IFNULL(SUM(monto),0) FROM gastos WHERE empresa_id = ? AND MONTH(fecha) = m.mes AND YEAR(fecha) = ?) as g_total,
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
        currentYear,
        empresa_id,
        currentYear,
        empresa_id,
        currentYear,
        empresa_id,
        currentYear,
        empresa_id,
        currentYear,
      ],
    );

    // 4. 🏷️ VENTAS POR CATEGORÍA (Visión Global del Mes - Prorrateado con Promos)
    const [catVentas] = await db.execute(
      `SELECT 
      c.nombre, 
      SUM( (v.precio_total / (SELECT SUM(dv2.cantidad * dv2.precio_venta) FROM detalle_ventas dv2 WHERE dv2.venta_id = v.id)) * (dv.cantidad * dv.precio_venta) ) as total
   FROM detalle_ventas dv 
   JOIN ventas v ON dv.venta_id = v.id
   JOIN productos p ON dv.producto_id = p.id 
   JOIN categorias c ON p.categoria_id = c.id
   WHERE v.empresa_id = ? AND MONTH(v.fecha) = ? AND YEAR(v.fecha) = ?
   GROUP BY c.id`,
      [empresa_id, selectedMonth, currentYear],
    );

    // 5. 💸 ESTRUCTURA DE GASTOS (Visión Global del Mes)
    const [catGastos] = await db.execute(
      `SELECT cg.nombre, SUM(g.monto) as total
   FROM gastos g 
   JOIN categorias_gastos cg ON g.categoria_gasto_id = cg.id
   WHERE g.empresa_id = ? AND MONTH(g.fecha) = ? AND YEAR(g.fecha) = ?
   GROUP BY cg.id 
   ORDER BY total DESC`,
      [empresa_id, selectedMonth, currentYear],
    );

    // =========================================================================
    // ⚔️ REFACTOR: UNIFICACIÓN DE GUERRA DE CAJAS Y USUARIOS (SECCIONES 6 Y 8) ⚔️
    // =========================================================================

    // Obtenemos un solo set de datos con LEFT JOIN para no perder ninguna transacción
    const [universoTransacciones] = await db.execute(
      `SELECT 
          v.caja_id, 
          u.name as usuario_nombre,
          v.precio_total as monto
       FROM ventas v
       LEFT JOIN users u ON v.usuario_id = u.id
       WHERE v.empresa_id = ? AND MONTH(v.fecha) = ? AND YEAR(v.fecha) = ?
       
       UNION ALL
       
       SELECT 
          d.caja_id, 
          u.name as usuario_nombre,
          d.precio_total * -1 as monto
       FROM devoluciones d
       LEFT JOIN users u ON d.usuario_id = u.id
       WHERE d.empresa_id = ? AND MONTH(d.fecha) = ? AND YEAR(d.fecha) = ?`,
      [
        empresa_id,
        selectedMonth,
        currentYear,
        empresa_id,
        selectedMonth,
        currentYear,
      ],
    );

    const cajasMap = {};
    const usuariosMap = {};

    universoTransacciones.forEach((t) => {
      const monto = parseFloat(t.monto || 0);

      // Procesar Cajas (Si no tiene caja_id, lo agrupamos en 'Sin Caja' para detectar errores de carga)
      const cLabel = t.caja_id ? `Caja ${t.caja_id}` : "Admin/S-C";
      cajasMap[cLabel] = (cajasMap[cLabel] || 0) + monto;

      // Procesar Usuarios (Si el nombre es null por usuario eliminado, usamos un fallback)
      const uLabel = t.usuario_nombre || "Usuario Desconocido";
      usuariosMap[uLabel] = (usuariosMap[uLabel] || 0) + monto;
    });

    // Formateamos para mantener compatibilidad total con el Frontend
    const ventasPorCaja = Object.entries(cajasMap)
      .map(([label, total]) => ({
        caja_id: label.replace("Caja ", ""),
        total: total,
      }))
      .sort((a, b) => a.caja_id - b.caja_id);

    const ventasPorUsuario = Object.entries(usuariosMap)
      .map(([usuario, total]) => ({
        usuario: usuario,
        total: total,
      }))
      .sort((a, b) => b.total - a.total);

    // =========================================================================

    // 7. 🕒 VENTAS POR HORA (Visión Global de Flujo de Clientes - Neto)
    const [ventasPorHora] = await db.execute(
      `SELECT HOUR(created_at) as hora, SUM(total) as total
   FROM (
       SELECT created_at, precio_total as total FROM ventas WHERE empresa_id = ? AND MONTH(fecha) = ? AND YEAR(fecha) = ?
       UNION ALL
       SELECT created_at, precio_total * -1 as total FROM devoluciones WHERE empresa_id = ? AND MONTH(fecha) = ? AND YEAR(fecha) = ?
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
      ],
    );

    // 9. Lista de Categorías
    const [cats] = await db.execute(
      "SELECT nombre FROM categorias WHERE empresa_id = ?",
      [empresa_id],
    );

    // 10. ⏱️ RANKING DE EFICIENCIA
    const [rankingEficiencia] = await db.execute(
      `SELECT 
    u.name as usuario,
    SUM(v.precio_total) as facturacion,
    COUNT(v.id) as total_tickets,
    SUM((SELECT SUM(cantidad) FROM detalle_ventas WHERE venta_id = v.id)) as total_items,
    AVG((SELECT SUM(cantidad) FROM detalle_ventas WHERE venta_id = v.id)) as items_por_ticket
   FROM ventas v
   JOIN users u ON v.usuario_id = u.id
   WHERE v.empresa_id = ? AND MONTH(v.fecha) = ? AND YEAR(v.fecha) = ?
   GROUP BY v.usuario_id
   ORDER BY facturacion DESC`,
      [empresa_id, selectedMonth, currentYear],
    );

    res.json({
      gananciasRaw,
      comparativaDiaria,
      balanceMensual,
      catVentas,
      catGastos,
      ventasPorCaja,
      ventasPorHora,
      ventasPorUsuario,
      rankingEficiencia,
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
      0,
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
      ],
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
      ],
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

const getTermometroCategorias = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const query = `
      SELECT hora, categoria, SUM(volumen_ajustado) as cantidad_items
      FROM (
          -- A. Productos vendidos directamente (Normalizados por Unidad de Medida)
          SELECT 
            HOUR(v.created_at) as hora, 
            c.nombre as categoria, 
            -- Si la unidad es 'Unidad', sumamos cantidad. Si es peso (gramos/kg), contamos como 1 evento de venta.
            CASE 
              WHEN u.nombre = 'Unidad' THEN dv.cantidad 
              ELSE 1 
            END as volumen_ajustado
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN productos p ON dv.producto_id = p.id
          JOIN categorias c ON p.categoria_id = c.id
          JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? 
            AND v.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)

          UNION ALL

          -- B. Productos vendidos dentro de combos (Normalizados)
          SELECT 
            HOUR(v.created_at) as hora, 
            c.nombre as categoria, 
            CASE 
              WHEN u.nombre = 'Unidad' THEN (dv.cantidad * cp.cantidad) 
              ELSE 1 
            END as volumen_ajustado
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN combo_producto cp ON dv.combo_id = cp.combo_id
          JOIN productos p ON cp.producto_id = p.id
          JOIN categorias c ON p.categoria_id = c.id
          JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? 
            AND v.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ) as t
      GROUP BY hora, categoria
      ORDER BY hora ASC, cantidad_items DESC
    `;

    const [rows] = await db.execute(query, [empresa_id, empresa_id]);
    res.json(rows);
  } catch (error) {
    console.error("ERROR TERMÓMETRO:", error);
    res.status(500).json({ error: error.message });
  }
};

const getPuntoEquilibrio = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // 1. Obtener la Meta de Gastos Fijos de la empresa
    const [empresa] = await db.execute(
      "SELECT meta_gastos_fijos FROM empresas WHERE id = ?",
      [empresa_id],
    );
    const meta = parseFloat(empresa[0].meta_gastos_fijos || 0);

    // 2. Calcular Utilidad Neta Real del mes (Ventas - Devoluciones - CMV - Gastos Variables)
    // Usamos la misma lógica que en el Dashboard Global para que los números coincidan
    const [utilidad] = await db.execute(
      `
      SELECT (
        (SELECT IFNULL(SUM(precio_total),0) FROM ventas WHERE empresa_id = ? AND MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())) - 
        (SELECT IFNULL(SUM(precio_total),0) FROM devoluciones WHERE empresa_id = ? AND MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())) -
        (SELECT IFNULL(SUM(dv.cantidad * dv.precio_compra), 0) FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id WHERE v.empresa_id = ? AND MONTH(v.fecha) = MONTH(CURDATE()) AND YEAR(v.fecha) = YEAR(CURDATE())) -
        (SELECT IFNULL(SUM(monto),0) FROM gastos WHERE empresa_id = ? AND MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE()))
      ) as neta`,
      [empresa_id, empresa_id, empresa_id, empresa_id],
    );

    const utilidadNeta = parseFloat(utilidad[0].neta || 0);
    const faltante = meta - utilidadNeta;
    const porcentaje =
      meta > 0 ? Math.min((utilidadNeta / meta) * 100, 100) : 0;

    res.json({
      meta,
      utilidadNeta,
      faltante: faltante > 0 ? faltante : 0,
      porcentaje: porcentaje.toFixed(2),
      objetivoCumplido: utilidadNeta >= meta,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getGodModeStats = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // 📈 1. Ventas de HOY
    const [ventasHoy] = await db.execute(
      `SELECT HOUR(created_at) as hora, SUM(precio_total) as total 
       FROM ventas 
       WHERE empresa_id = ? AND DATE(created_at) = CURDATE() 
       GROUP BY hora ORDER BY hora ASC`,
      [empresa_id],
    );

    // 📈 2. Ventas de AYER
    const [ventasAyer] = await db.execute(
      `SELECT HOUR(created_at) as hora, SUM(precio_total) as total 
       FROM ventas 
       WHERE empresa_id = ? AND DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) 
       GROUP BY hora ORDER BY hora ASC`,
      [empresa_id],
    );

    // 💰 3. Anatomía Financiera (Mes Actual)
    const [profit] = await db.execute(
      `SELECT 
        IFNULL(SUM(v.precio_total), 0) as ingresos_brutos,
        IFNULL(SUM(dv.cantidad * p.precio_compra), 0) as costo_mercaderia
      FROM detalle_ventas dv
      JOIN ventas v ON dv.venta_id = v.id
      JOIN productos p ON dv.producto_id = p.id
      WHERE v.empresa_id = ? 
        AND MONTH(v.created_at) = MONTH(CURDATE()) 
        AND YEAR(v.created_at) = YEAR(CURDATE())`,
      [empresa_id],
    );

    // 🏆 4. Top 5 Categorías
    const [categorias] = await db.execute(
      `SELECT c.nombre, SUM(dv.cantidad * dv.precio_venta) as total
      FROM detalle_ventas dv
      JOIN productos p ON dv.producto_id = p.id
      JOIN categorias c ON p.categoria_id = c.id
      JOIN ventas v ON dv.venta_id = v.id
      WHERE v.empresa_id = ? AND MONTH(v.created_at) = MONTH(CURDATE())
      GROUP BY c.id ORDER BY total DESC LIMIT 5`,
      [empresa_id],
    );

    // 📈 5. INFLACIÓN REAL DEL LOCAL
    const [inflacion] = await db.execute(
      `SELECT IFNULL(AVG((costo_nuevo - costo_anterior) / costo_anterior) * 100, 0) as variacion
      FROM historial_precios hp
      JOIN productos p ON hp.producto_id = p.id
      WHERE p.empresa_id = ? AND hp.fecha_cambio >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [empresa_id],
    );

    // 📦 6. ALERTAS Y PATRIMONIO ARS
    const [alertas] = await db.execute(
      `SELECT 
        (SELECT COUNT(*) FROM productos WHERE empresa_id = ? AND stock <= stock_minimo) as bajo_stock,
        (SELECT COUNT(*) FROM ventas WHERE empresa_id = ? AND DATE(created_at) = CURDATE()) as tickets_hoy,
        (SELECT IFNULL(SUM(stock * precio_compra), 0) FROM productos WHERE empresa_id = ?) as patrimonio_ars`,
      [empresa_id, empresa_id, empresa_id],
    );

    // 🏆 7. PRODUCTO MÁS VENDIDO DEL DÍA
    const [topProducto] = await db.execute(
      `SELECT p.nombre FROM detalle_ventas dv
      JOIN ventas v ON dv.venta_id = v.id
      JOIN productos p ON dv.producto_id = p.id
      WHERE v.empresa_id = ? AND DATE(v.created_at) = CURDATE()
      GROUP BY p.id ORDER BY SUM(dv.cantidad) DESC LIMIT 1`,
      [empresa_id],
    );

    // 💵 8. FETCH DOLAR MEP REAL (Con Headers de identificación y Timeout)
    let cotizacionFinal = 1469;
    try {
      const response = await axios.get(
        "https://dolarapi.com/v1/dolares/bolsa",
        {
          timeout: 5000,
          headers: { "User-Agent": "MorroneBI-Agent/1.0" },
        },
      );

      if (response.data && response.data.venta) {
        cotizacionFinal = parseFloat(response.data.venta);
        console.log(`✅ [Oracle Eye] Dólar actualizado: ${cotizacionFinal}`);
      }
    } catch (e) {
      console.error("❌ ERROR API DÓLAR:", e.message);
    }

    const patrimonioARS = parseFloat(alertas[0].patrimonio_ars || 0);

    // 💸 9. GASTOS REALES DEL MES (Fijos + Variables del Cirujano)
    const [gastosRes] = await db.execute(
      `
      SELECT IFNULL(SUM(monto), 0) as total_mensual 
      FROM gastos 
      WHERE empresa_id = ? 
        AND MONTH(fecha) = MONTH(CURDATE()) 
        AND YEAR(fecha) = YEAR(CURDATE())
    `,
      [empresa_id],
    );

    const gastosReales = parseFloat(gastosRes[0].total_mensual);

    // 📦 10. RENDIMIENTO POR CAJA (Hoy)
    const [cajasRes] = await db.execute(
      `
      SELECT 
        v.caja_id, 
        SUM(v.precio_total) as monto, 
        COUNT(*) as tickets 
      FROM ventas v
      WHERE v.empresa_id = ? AND DATE(v.created_at) = CURDATE()
      GROUP BY v.caja_id 
      ORDER BY monto DESC
    `,
      [empresa_id],
    );

    // 💳 11. MIX DE PAGOS REAL (SOLO HOY)
    const [pagosHoy] = await db.execute(
      `
      SELECT 
        IFNULL(SUM(efectivo), 0) as EFECTIVO,
        IFNULL(SUM(tarjeta), 0) as TARJETA,
        IFNULL(SUM(mercadopago), 0) as MERCADOPAGO,
        IFNULL(SUM(transferencia), 0) as TRANSFERENCIA
      FROM ventas 
      WHERE empresa_id = ? 
        AND DATE(created_at) = CURDATE()`,
      [empresa_id],
    );

    // Formateamos para el gráfico
    const r = pagosHoy[0];
    const pagosMix = [
      { label: "Efectivo", value: parseFloat(r.EFECTIVO) },
      { label: "Tarjeta", value: parseFloat(r.TARJETA) },
      { label: "Mercado Pago", value: parseFloat(r.MERCADOPAGO) },
      { label: "Transferencia", value: parseFloat(r.TRANSFERENCIA) },
    ].filter((item) => item.value > 0); // Solo los que tienen movimientos hoy

    // 📅 12. RENDIMIENTO SEMANAL (Español)
    const [semanal] = await db.execute(
      `
      SELECT 
        CASE DAYOFWEEK(created_at)
          WHEN 1 THEN 'Dom' WHEN 2 THEN 'Lun' WHEN 3 THEN 'Mar' 
          WHEN 4 THEN 'Mie' WHEN 5 THEN 'Jue' WHEN 6 THEN 'Vie' WHEN 7 THEN 'Sab'
        END as dia,
        SUM(precio_total) as total,
        MAX(created_at) as fecha_orden
      FROM ventas 
      WHERE empresa_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY dia ORDER BY fecha_orden ASC`,
      [empresa_id],
    );

    res.json({
      hoy: ventasHoy,
      ayer: ventasAyer,
      profit: profit[0],
      gastos_mes: gastosReales,
      cajas: cajasRes,
      pagosMix,
      semanal,
      categorias,
      inflacion_real: parseFloat(inflacion[0].variacion).toFixed(2),
      stock_critico: alertas[0].bajo_stock,
      tickets_hoy: alertas[0].tickets_hoy,
      dolar_mep: cotizacionFinal.toFixed(2),
      // ✅ CORREGIDO: Usamos cotizacionFinal para el cálculo del Equity Shield
      patrimonio_usd: (patrimonioARS / cotizacionFinal).toFixed(2),
      top_hoy: topProducto[0]?.nombre || "Sin ventas hoy",
    });
  } catch (error) {
    console.error("❌ ERROR MONITOR BI:", error.message);
    res.status(500).json({ message: "Error en el motor de BI" });
  }
};

module.exports = {
  getFullChartData,
  getPrediccionBI,
  getTermometroCategorias,
  getPuntoEquilibrio,
  getGodModeStats,
};
