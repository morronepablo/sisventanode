// controllers/movimientoController.js
const db = require("../config/db");

// 1. Obtener lista de productos para el historial
const getProductosList = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const query =
      "SELECT id, codigo, nombre, stock FROM productos WHERE empresa_id = ? ORDER BY nombre ASC";
    const [rows] = await db.execute(query, [empresa_id]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener productos" });
  }
};

// 2. Obtener movimientos de un producto específico
const getMovimientosByProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    // Obtener info del producto
    const [prod] = await db.execute(
      "SELECT nombre, codigo FROM productos WHERE id = ? AND empresa_id = ?",
      [id, empresa_id]
    );
    if (prod.length === 0)
      return res.status(404).json({ message: "Producto no encontrado" });

    // Obtener historial
    const query = `
      SELECT m.*, u.name as usuario_nombre
      FROM movimientos m
      JOIN users u ON m.usuario_id = u.id
      WHERE m.producto_id = ? AND m.empresa_id = ?
      ORDER BY m.fecha DESC, m.id DESC
    `;
    const [rows] = await db.execute(query, [id, empresa_id]);

    res.json({ producto: prod[0], movimientos: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener movimientos" });
  }
};

// 3. Función de reconstrucción (ya la tenías)
const rebuildMovimientos = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const empresa_id = req.user.empresa_id;
    const usuario_id = req.user.id;

    await connection.beginTransaction();

    // 1. Deshabilitar restricciones y limpiar tabla
    await connection.execute("SET FOREIGN_KEY_CHECKS = 0");
    await connection.execute("DELETE FROM movimientos WHERE empresa_id = ?", [
      empresa_id,
    ]);
    await connection.execute("ALTER TABLE movimientos AUTO_INCREMENT = 1");

    // 2. RECONSTRUIR DESDE COMPRAS
    const [compras] = await connection.execute(
      `
      SELECT dc.*, c.fecha as fecha_doc 
      FROM detalle_compras dc 
      JOIN compras c ON dc.compra_id = c.id 
      WHERE c.empresa_id = ?`,
      [empresa_id]
    );

    for (const item of compras) {
      await connection.execute(
        `INSERT INTO movimientos (producto_id, empresa_id, tipo, origen, origen_id, compra_id, cantidad, fecha, usuario_id, created_at, updated_at) 
         VALUES (?, ?, 'entrada', 'compra', ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          item.producto_id,
          empresa_id,
          item.id,
          item.compra_id,
          item.cantidad,
          item.fecha_doc,
          usuario_id,
        ]
      );
    }

    // 3. RECONSTRUIR DESDE VENTAS (Productos individuales)
    const [ventas] = await connection.execute(
      `
      SELECT dv.*, v.fecha as fecha_doc 
      FROM detalle_ventas dv 
      JOIN ventas v ON dv.venta_id = v.id 
      WHERE v.empresa_id = ? AND dv.producto_id IS NOT NULL`,
      [empresa_id]
    );

    for (const item of ventas) {
      await connection.execute(
        `INSERT INTO movimientos (producto_id, empresa_id, tipo, origen, origen_id, venta_id, cantidad, fecha, usuario_id, created_at, updated_at) 
         VALUES (?, ?, 'salida', 'venta', ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          item.producto_id,
          empresa_id,
          item.id,
          item.venta_id,
          item.cantidad,
          item.fecha_doc,
          usuario_id,
        ]
      );
    }

    // 4. RECONSTRUIR DESDE VENTAS (Desglosando Combos)
    const [ventasCombos] = await connection.execute(
      `
      SELECT dv.*, v.fecha as fecha_doc, cp.producto_id as prod_id, cp.cantidad as cant_interna
      FROM detalle_ventas dv 
      JOIN ventas v ON dv.venta_id = v.id 
      JOIN combo_producto cp ON dv.combo_id = cp.combo_id
      WHERE v.empresa_id = ? AND dv.combo_id IS NOT NULL`,
      [empresa_id]
    );

    for (const item of ventasCombos) {
      const cantidadTotal = item.cantidad * item.cant_interna;
      await connection.execute(
        `INSERT INTO movimientos (producto_id, empresa_id, tipo, origen, origen_id, venta_id, cantidad, fecha, usuario_id, created_at, updated_at) 
         VALUES (?, ?, 'salida', 'venta', ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          item.prod_id,
          empresa_id,
          item.id,
          item.venta_id,
          cantidadTotal,
          item.fecha_doc,
          usuario_id,
        ]
      );
    }

    // 5. RECONSTRUIR DESDE DEVOLUCIONES
    const [devoluciones] = await connection.execute(
      `
      SELECT dd.*, d.fecha as fecha_doc 
      FROM detalle_devoluciones dd 
      JOIN devoluciones d ON dd.devolucion_id = d.id 
      WHERE d.empresa_id = ?`,
      [empresa_id]
    );

    for (const item of devoluciones) {
      await connection.execute(
        `INSERT INTO movimientos (producto_id, empresa_id, tipo, origen, origen_id, cantidad, fecha, usuario_id, created_at, updated_at) 
         VALUES (?, ?, 'entrada', 'devolucion', ?, ?, ?, ?, NOW(), NOW())`,
        [
          item.producto_id,
          empresa_id,
          item.id,
          item.cantidad,
          item.fecha_doc,
          usuario_id,
        ]
      );
    }

    // 6. RECONSTRUIR DESDE AJUSTES
    const [ajustes] = await connection.execute(
      `
      SELECT * FROM ajustes WHERE empresa_id = ?`,
      [empresa_id]
    );

    for (const item of ajustes) {
      await connection.execute(
        `INSERT INTO movimientos (producto_id, empresa_id, tipo, origen, origen_id, ajuste_id, cantidad, fecha, usuario_id, created_at, updated_at) 
         VALUES (?, ?, ?, 'ajuste', ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          item.producto_id,
          empresa_id,
          item.tipo === "entrada" ? "entrada" : "salida",
          item.id,
          item.id,
          item.cantidad,
          item.fecha,
          usuario_id,
        ]
      );
    }

    await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
    await connection.commit();

    res.json({
      success: true,
      message: "Movimientos reconstruidos correctamente.",
    });
  } catch (error) {
    await connection.rollback();
    await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error al reconstruir movimientos." });
  } finally {
    connection.release();
  }
};

const countMovimientos = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS total FROM movimientos WHERE empresa_id = ?",
      [req.user.empresa_id]
    );
    res.json({ total: rows[0].total });
  } catch (error) {
    res.status(500).json({ total: 0 });
  }
};

module.exports = {
  getProductosList,
  getMovimientosByProducto,
  rebuildMovimientos,
  countMovimientos,
};
