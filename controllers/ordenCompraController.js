// controllers/ordenCompraController.js
const db = require("../config/db");

const getOrdenes = async (req, res) => {
  try {
    const query = `
      SELECT oc.*, p.empresa as proveedor_nombre, u.name as usuario_nombre,
      (SELECT COUNT(*) FROM detalle_ordenes_compra WHERE orden_id = oc.id) as items
      FROM ordenes_compra oc
      JOIN proveedors p ON oc.proveedor_id = p.id
      JOIN users u ON oc.usuario_id = u.id
      WHERE oc.empresa_id = ?
      ORDER BY oc.fecha DESC
    `;
    const [rows] = await db.execute(query, [req.user.empresa_id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const storeOrden = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { proveedor_id, fecha, items, observaciones } = req.body;

    // 1. Calculamos el total estimado respetando la escala elegida
    const totalEstimado = items.reduce((acc, it) => {
      const costoTotalFila = it.es_bulto
        ? it.cantidad * (it.precio_compra * it.factor_conversion)
        : it.cantidad * it.precio_compra;
      return acc + costoTotalFila;
    }, 0);

    const [resOc] = await connection.execute(
      "INSERT INTO ordenes_compra (fecha, proveedor_id, usuario_id, empresa_id, observaciones, total_estimado) VALUES (?, ?, ?, ?, ?, ?)",
      [
        fecha,
        proveedor_id,
        req.user.id,
        req.user.empresa_id,
        observaciones,
        totalEstimado,
      ],
    );

    const orden_id = resOc.insertId;

    // 2. Guardamos los ítems con trazabilidad total
    for (const it of items) {
      const unidadesBase = it.es_bulto
        ? it.cantidad * it.factor_conversion
        : it.cantidad;

      await connection.execute(
        `INSERT INTO detalle_ordenes_compra 
         (orden_id, producto_id, cantidad_pedida, precio_estimado, es_bulto, factor_utilizado, cantidad_unidades_base) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orden_id,
          it.producto_id,
          it.cantidad, // La cantidad que el usuario ve (ej: 2)
          it.precio_compra, // Precio unitario base
          it.es_bulto ? 1 : 0,
          it.factor_conversion,
          unidadesBase, // El total real que entrará al stock (ej: 48)
        ],
      );
    }

    await connection.commit();
    res.json({ success: true, id: orden_id });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

const getOrdenById = async (req, res) => {
  try {
    const { id } = req.params;

    const [orden] = await db.execute(
      `SELECT oc.*, p.empresa as proveedor_nombre 
       FROM ordenes_compra oc
       JOIN proveedors p ON oc.proveedor_id = p.id
       WHERE oc.id = ?`,
      [id],
    );

    // 🛡️ QUERY ACTUALIZADA CON TRAZABILIDAD DE UNIDADES
    const [items] = await db.execute(
      `SELECT d.*, p.nombre as producto_nombre, 
              u.nombre as unidad_base_nombre
       FROM detalle_ordenes_compra d 
       JOIN productos p ON d.producto_id = p.id 
       LEFT JOIN unidads u ON p.unidad_id = u.id
       WHERE d.orden_id = ?`,
      [id],
    );

    if (orden.length === 0)
      return res.status(404).json({ message: "No encontrada" });

    res.json({ ...orden[0], items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const recibirOrden = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { items } = req.body;

    // 1. Actualizar las cantidades recibidas CONVIRTIENDO A UNIDADES BASE
    for (const it of items) {
      // cantidad_llegó viene en la escala pedida (ej: bultos).
      // La convertimos a unidades base para que la auditoría sea real contra el stock.
      const factor = parseFloat(it.factor_utilizado || 1);
      const unidadesBaseRecibidas = parseFloat(it.cantidad_llegó) * factor;

      await connection.execute(
        "UPDATE detalle_ordenes_compra SET cantidad_recibida = ? WHERE id = ?",
        [unidadesBaseRecibidas, it.id],
      );
    }

    // 2. Marcar la Orden de Compra como 'Recibida'
    await connection.execute(
      "UPDATE ordenes_compra SET estado = 'Recibida' WHERE id = ?",
      [id],
    );

    await connection.commit();
    res.json({
      success: true,
      message: "Recepción auditada y convertida correctamente",
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

module.exports = { getOrdenes, storeOrden, getOrdenById, recibirOrden };
