// controllers/devolucionController.js
const Devolucion = require("../models/Devolucion");
const db = require("../config/db");

const getListadoDevoluciones = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const devoluciones = await Devolucion.getAll(empresa_id);
    const result = [];
    for (const d of devoluciones) {
      const detalles = await Devolucion.getDetallesByDevolucionId(d.id);
      result.push({ ...d, detalles });
    }
    res.json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener listado", error: error.message });
  }
};

const getTmpDevoluciones = async (req, res) => {
  try {
    const { usuario_id } = req.query;
    const [rows] = await db.execute(
      `
      SELECT t.*, p.nombre, p.codigo, p.precio_venta, p.precio_compra, p.aplicar_porcentaje, p.valor_porcentaje,
             u.nombre as unidad_nombre, c.nombre as combo_nombre, c.codigo as combo_codigo, c.precio_venta as combo_precio
      FROM tmp_devoluciones t
      LEFT JOIN productos p ON t.producto_id = p.id
      LEFT JOIN unidads u ON p.unidad_id = u.id 
      LEFT JOIN combos c ON t.combo_id = c.id
      WHERE t.session_id = ?`,
      [usuario_id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const postTmpDevolucion = async (req, res) => {
  try {
    const { codigo, cantidad, usuario_id } = req.body;
    const empresa_id = req.user.empresa_id;

    let item = null;
    let tipo = null;

    const [pRows] = await db.execute(
      "SELECT id, nombre FROM productos WHERE codigo = ? AND empresa_id = ? LIMIT 1",
      [codigo, empresa_id]
    );
    if (pRows.length > 0) {
      item = pRows[0];
      tipo = "producto";
    } else {
      const [cRows] = await db.execute(
        "SELECT id, nombre FROM combos WHERE codigo = ? AND empresa_id = ? LIMIT 1",
        [codigo, empresa_id]
      );
      if (cRows.length > 0) {
        item = cRows[0];
        tipo = "combo";
      }
    }

    if (!item)
      return res.json({ success: false, message: "Ítem no encontrado." });

    const columnaId = tipo === "producto" ? "producto_id" : "combo_id";
    await db.execute(
      `INSERT INTO tmp_devoluciones (cantidad, ${columnaId}, session_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`,
      [cantidad, item.id, usuario_id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTmpDevolucion = async (req, res) => {
  try {
    await db.execute("DELETE FROM tmp_devoluciones WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const storeDevolucion = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { cliente_id, fecha, precio_total, motivo, usuario_id, empresa_id } =
      req.body;

    // 1. Insertar Devolución
    const [resDev] = await connection.execute(
      `INSERT INTO devoluciones (fecha, precio_total, motivo, cliente_id, empresa_id, venta_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, NULL, NOW(), NOW())`,
      [fecha, precio_total, motivo, cliente_id, empresa_id]
    );
    const devolucion_id = resDev.insertId;

    // 2. Traer ítems temporales
    const [tmpItems] = await connection.execute(
      "SELECT * FROM tmp_devoluciones WHERE session_id = ?",
      [usuario_id]
    );

    for (const item of tmpItems) {
      // Insertar Detalle de Devolución
      await connection.execute(
        "INSERT INTO detalle_devoluciones (cantidad, devolucion_id, producto_id, combo_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
        [
          item.cantidad,
          devolucion_id,
          item.producto_id || null,
          item.combo_id || null,
        ]
      );

      if (item.producto_id) {
        // Aumentar Stock Producto
        await connection.execute(
          "UPDATE productos SET stock = stock + ? WHERE id = ?",
          [item.cantidad, item.producto_id]
        );

        // REGISTRAR MOVIMIENTO (Incluyendo la nueva columna devolucion_id)
        await connection.execute(
          `INSERT INTO movimientos (producto_id, empresa_id, tipo, origen, origen_id, devolucion_id, cantidad, fecha, usuario_id, created_at, updated_at) 
           VALUES (?, ?, 'entrada', 'devolucion', ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            item.producto_id,
            empresa_id,
            devolucion_id,
            devolucion_id,
            item.cantidad,
            fecha,
            usuario_id,
          ]
        );
      } else if (item.combo_id) {
        // Aumentar Stock de componentes del combo
        const [comps] = await connection.execute(
          "SELECT producto_id, cantidad FROM combo_producto WHERE combo_id = ?",
          [item.combo_id]
        );
        for (const c of comps) {
          const totalEntra = item.cantidad * c.cantidad;
          await connection.execute(
            "UPDATE productos SET stock = stock + ? WHERE id = ?",
            [totalEntra, c.producto_id]
          );

          // REGISTRAR MOVIMIENTO (Incluyendo la nueva columna devolucion_id)
          await connection.execute(
            `INSERT INTO movimientos (producto_id, empresa_id, tipo, origen, origen_id, devolucion_id, cantidad, fecha, usuario_id, created_at, updated_at) 
             VALUES (?, ?, 'entrada', 'devolucion', ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              c.producto_id,
              empresa_id,
              devolucion_id,
              devolucion_id,
              totalEntra,
              fecha,
              usuario_id,
            ]
          );
        }
      }
    }

    // 3. Manejo Financiero (Caja o Cta Cte)
    if (parseInt(cliente_id) === 1) {
      const [arqueo] = await connection.execute(
        "SELECT id FROM arqueos WHERE empresa_id = ? AND (fecha_cierre IS NULL OR fecha_cierre = '') LIMIT 1",
        [empresa_id]
      );
      if (arqueo.length > 0) {
        await connection.execute(
          "INSERT INTO movimiento_cajas (tipo, monto, descripcion, arqueo_id, created_at, updated_at) VALUES ('Egreso', ?, ?, ?, NOW(), NOW())",
          [precio_total, `Devolución N° ${devolucion_id}`, arqueo[0].id]
        );
      }
    } else {
      await connection.execute(
        `INSERT INTO compras_cta_cte (cliente_id, empresa_id, devolucion_id, importe, tipo, metodo_pago, fecha, created_at, updated_at) 
         VALUES (?, ?, ?, ?, 'pago', 'devolucion', ?, NOW(), NOW())`,
        [cliente_id, empresa_id, devolucion_id, precio_total, fecha]
      );
    }

    // 4. Limpiar temporal
    await connection.execute(
      "DELETE FROM tmp_devoluciones WHERE session_id = ?",
      [usuario_id]
    );

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error("ERROR EN DEVOLUCIÓN:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

const getDevolucionById = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;
    const [devRows] = await db.execute(
      `SELECT d.*, cl.nombre_cliente, cl.cuil_codigo FROM devoluciones d LEFT JOIN clientes cl ON d.cliente_id = cl.id WHERE d.id = ? AND d.empresa_id = ?`,
      [id, empresa_id]
    );
    if (devRows.length === 0)
      return res.status(404).json({ message: "No encontrada" });
    const detalles = await Devolucion.getDetallesByDevolucionId(id);
    res.json({ ...devRows[0], detalles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const countDevoluciones = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS total FROM devoluciones WHERE empresa_id = ?",
      [req.user.empresa_id]
    );
    res.json({ total: rows[0].total });
  } catch (error) {
    res.status(500).json({ total: 0 });
  }
};

module.exports = {
  getListadoDevoluciones,
  getTmpDevoluciones,
  postTmpDevolucion,
  deleteTmpDevolucion,
  storeDevolucion,
  getDevolucionById,
  countDevoluciones,
};
