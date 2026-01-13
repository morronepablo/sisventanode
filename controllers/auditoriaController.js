// controllers/auditoriaController.js
const db = require("../config/db");

const getAnomalias = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // 1. DETECTAR RÁFAGAS DE DEVOLUCIONES
    // Buscamos usuarios que hicieron más de 2 devoluciones en un lapso de 60 minutos
    const [devoluciones] = await db.execute(
      `
      SELECT 
        d1.usuario_id, u.name as usuario_nombre, d1.caja_id,
        COUNT(*) as cantidad_devoluciones,
        GROUP_CONCAT(d1.precio_total) as montos,
        MIN(d1.created_at) as inicio_periodo,
        MAX(d1.created_at) as fin_periodo
      FROM devoluciones d1
      JOIN users u ON d1.usuario_id = u.id
      WHERE d1.empresa_id = ? AND d1.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY d1.usuario_id, d1.caja_id, HOUR(d1.created_at)
      HAVING cantidad_devoluciones >= 3
    `,
      [empresa_id]
    );

    // 2. DETECTAR FALTANTES DE ARQUEO (Diferencias negativas)
    const [faltantes] = await db.execute(
      `
      SELECT 
        a.id as arqueo_id, u.name as usuario_nombre, a.caja_id,
        a.diferencia, a.fecha_cierre
      FROM arqueos a
      JOIN users u ON a.usuario_id = u.id
      WHERE a.empresa_id = ? AND a.diferencia < -50 -- Faltantes mayores a $50
      ORDER BY a.fecha_cierre DESC LIMIT 10
    `,
      [empresa_id]
    );

    // 3. VENTAS SOSPECHOSAS (Monto alto, duración muy corta - requiere logs de tmp_ventas)
    // En este caso, usaremos una lógica de "Ventas de madrugada" o fuera de horario si aplica
    const [horarios] = await db.execute(
      `
      SELECT id, precio_total, created_at, caja_id, 
      (SELECT name FROM users WHERE id = usuario_id) as usuario_nombre
      FROM ventas 
      WHERE empresa_id = ? 
      AND (HOUR(created_at) > 22 OR HOUR(created_at) < 7)
      LIMIT 10
    `,
      [empresa_id]
    );

    res.json({
      devoluciones_sospechosas: devoluciones,
      arqueos_con_faltante: faltantes,
      horarios_extranos: horarios,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAnomalias };
