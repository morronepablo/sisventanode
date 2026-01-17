// controllers/auditoriaController.js
const db = require("../config/db");

const getAnomalias = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // 1. DETECTAR RÁFAGAS DE DEVOLUCIONES
    const [devoluciones] = await db.execute(
      `
      SELECT d1.usuario_id, u.name as usuario_nombre, d1.caja_id,
        COUNT(*) as cantidad_devoluciones,
        MIN(d1.created_at) as inicio_periodo,
        MAX(d1.created_at) as fin_periodo
      FROM devoluciones d1
      JOIN users u ON d1.usuario_id = u.id
      WHERE d1.empresa_id = ? AND d1.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY d1.usuario_id, d1.caja_id, DATE_FORMAT(d1.created_at, '%Y-%m-%d %H')
      HAVING cantidad_devoluciones >= 3
    `,
      [empresa_id]
    );

    // 2. DETECTAR FALTANTES DE ARQUEO
    const [faltantes] = await db.execute(
      `
      SELECT a.id as arqueo_id, u.name as usuario_nombre, a.caja_id,
        a.diferencia, a.fecha_cierre
      FROM arqueos a
      JOIN users u ON a.usuario_id = u.id
      WHERE a.empresa_id = ? AND a.diferencia < -50
      ORDER BY a.fecha_cierre DESC LIMIT 10
    `,
      [empresa_id]
    );

    // 3. VENTAS EN HORARIOS INUSUALES
    const [horarios] = await db.execute(
      `
      SELECT v.id, v.precio_total, v.created_at, v.caja_id, u.name as usuario_nombre
      FROM ventas v
      JOIN users u ON v.usuario_id = u.id
      WHERE v.empresa_id = ? AND (HOUR(v.created_at) >= 22 OR HOUR(v.created_at) <= 7)
      LIMIT 10
    `,
      [empresa_id]
    );

    // 4. RANKING DE GENEROSIDAD (Control de Descuentos)
    const [descuentos] = await db.execute(
      `
      SELECT u.name as usuario_nombre, 
             AVG(v.descuento_porcentaje) as promedio_descuento,
             COUNT(v.id) as total_ventas_con_desc
      FROM ventas v
      JOIN users u ON v.usuario_id = u.id
      WHERE v.empresa_id = ? AND v.descuento_porcentaje > 0
      GROUP BY u.id, u.name
      ORDER BY promedio_descuento DESC
    `,
      [empresa_id]
    );

    // 5. TICKETS ANULADOS (Basado en tu tabla LOGS - columna MODULO)
    const [anulaciones] = await db.execute(
      `
      SELECT u.name as usuario_nombre, COUNT(*) as cantidad_anulaciones
      FROM logs l
      JOIN users u ON l.usuario_id = u.id
      WHERE l.empresa_id = ? 
        AND l.modulo = 'VENTAS'
        AND (l.accion = 'ELIMINAR' OR l.accion = 'BORRAR' OR l.accion = 'ANULAR')
      GROUP BY u.id, u.name
      ORDER BY cantidad_anulaciones DESC
    `,
      [empresa_id]
    );

    res.json({
      devoluciones_sospechosas: devoluciones || [],
      arqueos_con_faltante: faltantes || [],
      horarios_extranos: horarios || [],
      ranking_generosidad: descuentos || [],
      tickets_anulados: anulaciones || [],
    });
  } catch (error) {
    console.error("❌ ERROR CRÍTICO EN AUDITORÍA:", error);
    res.status(500).json({ error: error.message });
  }
};

const getReporteIntegridad = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // 🚀 MEJORA: Agregamos u.id para poder identificar al usuario en el frontend
    const query = `
      SELECT 
        u.id as usuario_id,
        u.name as usuario,
        COUNT(CASE WHEN a.tipo_evento = 'ITEM_BORRADO' THEN 1 END) as borrados,
        IFNULL(SUM(CASE WHEN a.tipo_evento = 'ITEM_BORRADO' THEN a.monto_afectado END), 0) as monto_borrados,
        (SELECT COUNT(*) FROM ventas WHERE usuario_id = u.id AND precio_total = 0) as tickets_cero,
        (SELECT COUNT(*) FROM ventas WHERE usuario_id = u.id AND descuento_porcentaje > 20) as descuentos_altos
      FROM users u
      LEFT JOIN auditoria_seguridad a ON u.id = a.usuario_id
      WHERE u.empresa_id = ?
      GROUP BY u.id, u.name
    `;

    const [stats] = await db.execute(query, [empresa_id]);

    const reporte = stats.map((s) => {
      let riesgo = "BAJO";
      let color = "success";
      let puntos =
        s.borrados * 2 + s.tickets_cero * 10 + s.descuentos_altos * 5;

      if (puntos > 50) {
        riesgo = "CRÍTICO";
        color = "danger";
      } else if (puntos > 20) {
        riesgo = "MEDIO";
        color = "warning text-dark";
      }

      return { ...s, riesgo, color, puntos };
    });

    res.json(reporte);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🚀 NUEVA FUNCIÓN: Obtiene el "Relato del Hecho" de los borrados
const getDetalleBorrados = async (req, res) => {
  try {
    const { usuario_id } = req.params;
    const empresa_id = req.user.empresa_id;

    // 🚀 CONSULTA CORREGIDA 🚀
    // Seleccionamos las columnas una por una para evitar conflictos de nombres
    const query = `
      SELECT 
        a.detalle, 
        a.monto_afectado, 
        a.created_at, 
        u.name as usuario_nombre
      FROM auditoria_seguridad a
      INNER JOIN users u ON a.usuario_id = u.id
      WHERE a.usuario_id = ? 
        AND u.empresa_id = ? 
        AND a.tipo_evento = 'ITEM_BORRADO'
      ORDER BY a.id DESC -- Usamos el ID para ordenar si created_at diera problemas
      LIMIT 50
    `;

    const [rows] = await db.execute(query, [usuario_id, empresa_id]);
    res.json(rows);
  } catch (error) {
    console.error("❌ ERROR DETALLE BORRADOS:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAnomalias, getReporteIntegridad, getDetalleBorrados };
