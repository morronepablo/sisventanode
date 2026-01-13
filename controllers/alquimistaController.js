// controllers/alquimistaController.js
const db = require("../config/db");

const getSugerenciasCombos = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // ALGORITMO DE AFINIDAD:
    // 1. Cruza detalle_ventas consigo mismo por venta_id.
    // 2. Busca productos distintos en el mismo ticket.
    // 3. Cuenta cuántas veces se repite esa pareja.
    const query = `
      SELECT 
        p1.id as id1, p1.nombre as producto1, p1.precio_venta as precio1,
        p2.id as id2, p2.nombre as producto2, p2.precio_venta as precio2,
        COUNT(*) as veces_juntos,
        (SELECT COUNT(*) FROM ventas v WHERE v.empresa_id = ?) as total_ventas_empresa
      FROM detalle_ventas dv1
      JOIN detalle_ventas dv2 ON dv1.venta_id = dv2.venta_id
      JOIN productos p1 ON dv1.producto_id = p1.id
      JOIN productos p2 ON dv2.producto_id = p2.id
      JOIN ventas v ON dv1.venta_id = v.id
      WHERE v.empresa_id = ? 
        AND dv1.producto_id < dv2.producto_id -- Evita duplicados (A-B y B-A)
        AND v.fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY p1.id, p2.id
      HAVING veces_juntos >= 5 -- Umbral de confianza
      ORDER BY veces_juntos DESC
      LIMIT 15
    `;

    const [parejas] = await db.execute(query, [empresa_id, empresa_id]);

    const sugerencias = parejas.map((p) => {
      const sumaPrecios = parseFloat(p.precio1) + parseFloat(p.precio2);
      const sugerenciaPrecioCombo = sumaPrecios * 0.9; // Sugerimos un 10% de ahorro
      const probabilidad = (
        (p.veces_juntos / p.total_ventas_empresa) *
        100
      ).toFixed(1);

      return {
        id1: p.id1,
        producto1: p.producto1,
        id2: p.id2,
        producto2: p.producto2,
        frecuencia: p.veces_juntos,
        probabilidad: probabilidad,
        precio_actual: sumaPrecios.toFixed(2),
        precio_sugerido: sugerenciaPrecioCombo.toFixed(2),
        impacto_estimado: (
          p.veces_juntos *
          (sugerenciaPrecioCombo * 0.2)
        ).toFixed(2), // Estimación de ganancia extra
      };
    });

    res.json(sugerencias);
  } catch (error) {
    console.error("ERROR ALQUIMISTA:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getSugerenciasCombos };
