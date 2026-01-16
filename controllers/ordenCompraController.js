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

    // ✅ Calcula el total estimado
    const totalEstimado = items.reduce(
      (acc, item) => acc + item.cantidad * item.precio_compra,
      0
    );

    // ✅ Inserta la OC con el total estimado
    const [resOc] = await connection.execute(
      "INSERT INTO ordenes_compra (fecha, proveedor_id, usuario_id, empresa_id, observaciones, total_estimado) VALUES (?, ?, ?, ?, ?, ?)",
      [
        fecha,
        proveedor_id,
        req.user.id,
        req.user.empresa_id,
        observaciones,
        totalEstimado, // 👈 AQUÍ LO GUARDAMOS
      ]
    );

    const orden_id = resOc.insertId;

    // Guarda los ítems
    for (const item of items) {
      await connection.execute(
        "INSERT INTO detalle_ordenes_compra (orden_id, producto_id, cantidad_pedida, precio_estimado) VALUES (?, ?, ?, ?)",
        [orden_id, item.producto_id, item.cantidad, item.precio_compra]
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

    // 1. Consultar cabecera con el nombre del proveedor
    const [orden] = await db.execute(
      `SELECT oc.*, p.empresa as proveedor_nombre 
       FROM ordenes_compra oc
       JOIN proveedors p ON oc.proveedor_id = p.id
       WHERE oc.id = ?`,
      [id]
    );

    // 2. Consultar los ítems del pedido
    const [items] = await db.execute(
      `SELECT d.*, p.nombre as producto_nombre 
       FROM detalle_ordenes_compra d 
       JOIN productos p ON d.producto_id = p.id 
       WHERE d.orden_id = ?`,
      [id]
    );

    if (orden.length === 0) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    // 3. Devolver todo junto
    res.json({ ...orden[0], items });
  } catch (error) {
    console.error("Error al obtener OC:", error);
    res.status(500).json({ message: error.message });
  }
};

const recibirOrden = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { items } = req.body;

    // 1. Actualizar únicamente las cantidades recibidas en el detalle de la OC
    for (const it of items) {
      await connection.execute(
        "UPDATE detalle_ordenes_compra SET cantidad_recibida = ? WHERE id = ?",
        [it.cantidad_llegó, it.id]
      );
    }

    // 2. Marcar la Orden de Compra como 'Recibida'
    await connection.execute(
      "UPDATE ordenes_compra SET estado = 'Recibida' WHERE id = ?",
      [id]
    );

    await connection.commit();
    res.json({ success: true, message: "Recepción auditada correctamente" });
  } catch (error) {
    await connection.rollback();
    console.error("Error al recibir OC:", error);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

module.exports = { getOrdenes, storeOrden, getOrdenById, recibirOrden };
