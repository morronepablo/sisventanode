// controllers/devolucionController.js
const Devolucion = require("../models/Devolucion");
const db = require("../config/db");
const { registrarLog } = require("../utils/logger"); // 👈 Importamos el logger

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
    console.error("[DEVOLUCIONES ERROR] Listado:", error.message);
    res
      .status(500)
      .json({ message: "Error al obtener listado", error: error.message });
  }
};

const getTmpDevoluciones = async (req, res) => {
  try {
    const { usuario_id } = req.query;
    const [rows] = await db.execute(
      `SELECT t.*, p.nombre, p.codigo, p.precio_venta, p.precio_compra, p.aplicar_porcentaje, p.valor_porcentaje,
             u.nombre as unidad_nombre, c.nombre as combo_nombre, c.codigo as combo_codigo, c.precio_venta as combo_precio
      FROM tmp_devoluciones t
      LEFT JOIN productos p ON t.producto_id = p.id
      LEFT JOIN unidads u ON p.unidad_id = u.id 
      LEFT JOIN combos c ON t.combo_id = c.id
      WHERE t.session_id = ?`,
      [usuario_id],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const postTmpDevolucion = async (req, res) => {
  console.log("--- INICIO AGREGAR ITEM TEMPORAL DEVOLUCION ---");
  try {
    const { codigo, cantidad, usuario_id } = req.body;
    const empresa_id = req.user.empresa_id;

    let item = null;
    let tipo = null;

    const [pRows] = await db.execute(
      "SELECT id, nombre FROM productos WHERE codigo = ? AND empresa_id = ? LIMIT 1",
      [codigo, empresa_id],
    );
    if (pRows.length > 0) {
      item = pRows[0];
      tipo = "producto";
    } else {
      const [cRows] = await db.execute(
        "SELECT id, nombre FROM combos WHERE codigo = ? AND empresa_id = ? LIMIT 1",
        [codigo, empresa_id],
      );
      if (cRows.length > 0) {
        item = cRows[0];
        tipo = "combo";
      }
    }

    if (!item) {
      console.warn(`[DEVOLUCIONES] Ítem no encontrado: ${codigo}`);
      return res.json({ success: false, message: "Ítem no encontrado." });
    }

    const columnaId = tipo === "producto" ? "producto_id" : "combo_id";
    await db.execute(
      `INSERT INTO tmp_devoluciones (cantidad, ${columnaId}, session_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`,
      [cantidad, item.id, usuario_id],
    );

    console.log(
      `[DEVOLUCIONES] Agregado al carrito: ${item.nombre} (Cantidad: ${cantidad})`,
    );
    res.json({ success: true });
  } catch (error) {
    console.error("[DEVOLUCIONES ERROR] postTmpDevolucion:", error.message);
    res.status(500).json({ message: error.message });
  }
  console.log("--- FIN AGREGAR ITEM TEMPORAL DEVOLUCION ---");
};

const deleteTmpDevolucion = async (req, res) => {
  console.log(`--- ELIMINANDO ITEM TEMPORAL ID: ${req.params.id} ---`);
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
  console.log("--- INICIO REGISTRO DE DEVOLUCIÓN ---");
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { cliente_id, fecha, precio_total, motivo, usuario_id, empresa_id } =
      req.body;

    // 1. OBTENER CAJA ACTIVA (Para que coincidan las gráficas de Guerra de Cajas)
    const [arqueoActivo] = await connection.execute(
      "SELECT id, caja_id FROM arqueos WHERE empresa_id = ? AND (fecha_cierre IS NULL OR fecha_cierre = '') LIMIT 1",
      [empresa_id],
    );

    if (arqueoActivo.length === 0) {
      throw new Error(
        "No se encontró un arqueo de caja abierto para esta empresa.",
      );
    }

    const current_caja_id = arqueoActivo[0].caja_id;
    const arqueo_id = arqueoActivo[0].id;

    // 2. INSERTAR DEVOLUCIÓN (Corregido: Incluye usuario_id y caja_id)
    const [resDev] = await connection.execute(
      `INSERT INTO devoluciones (
        fecha, precio_total, motivo, cliente_id, empresa_id, usuario_id, caja_id, venta_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NOW(), NOW())`,
      [
        fecha,
        precio_total,
        motivo,
        cliente_id,
        empresa_id,
        usuario_id,
        current_caja_id,
      ],
    );

    const devolucion_id = resDev.insertId;
    console.log(
      `[DEVOLUCIONES] Cabecera creada. ID: ${devolucion_id} | Usuario: ${usuario_id} | Caja: ${current_caja_id}`,
    );

    // 3. Traer ítems temporales
    const [tmpItems] = await connection.execute(
      "SELECT * FROM tmp_devoluciones WHERE session_id = ?",
      [usuario_id],
    );

    for (const item of tmpItems) {
      await connection.execute(
        "INSERT INTO detalle_devoluciones (cantidad, devolucion_id, producto_id, combo_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
        [
          item.cantidad,
          devolucion_id,
          item.producto_id || null,
          item.combo_id || null,
        ],
      );

      // Actualizar Stock y Movimientos
      if (item.producto_id) {
        await connection.execute(
          "UPDATE productos SET stock = stock + ? WHERE id = ?",
          [item.cantidad, item.producto_id],
        );
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
          ],
        );
      } else if (item.combo_id) {
        const [comps] = await connection.execute(
          "SELECT producto_id, cantidad FROM combo_producto WHERE combo_id = ?",
          [item.combo_id],
        );
        for (const c of comps) {
          const totalEntra = item.cantidad * c.cantidad;
          await connection.execute(
            "UPDATE productos SET stock = stock + ? WHERE id = ?",
            [totalEntra, c.producto_id],
          );
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
            ],
          );
        }
      }
    }

    // 4. MANEJO FINANCIERO (Utilizamos el arqueo_id que ya encontramos arriba)
    if (parseInt(cliente_id) === 1) {
      // Consumidor final: Sale efectivo de la caja
      await connection.execute(
        "INSERT INTO movimiento_cajas (tipo, monto, descripcion, arqueo_id, created_at, updated_at) VALUES ('Egreso', ?, ?, ?, NOW(), NOW())",
        [precio_total, `Devolución N° ${devolucion_id}`, arqueo_id],
      );
    } else {
      // Cliente cuenta corriente: Se le genera un "pago" (nota de crédito) a su favor
      await connection.execute(
        `INSERT INTO compras_cta_cte (cliente_id, empresa_id, devolucion_id, importe, tipo, metodo_pago, fecha, created_at, updated_at) 
         VALUES (?, ?, ?, ?, 'pago', 'devolucion', ?, NOW(), NOW())`,
        [cliente_id, empresa_id, devolucion_id, precio_total, fecha],
      );
    }

    await connection.execute(
      "DELETE FROM tmp_devoluciones WHERE session_id = ?",
      [usuario_id],
    );

    await connection.commit();

    // Notificar al Dashboard vía Socket.io
    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");

    await registrarLog(
      req,
      "CREAR",
      "DEVOLUCIONES",
      `Se registró devolución N° ${devolucion_id} por $${precio_total}. Cajero ID: ${usuario_id}`,
    );

    res.json({ success: true });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("[DEVOLUCIONES ERROR] Crítico:", error.message);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
};

const getDevolucionById = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;
    const [devRows] = await db.execute(
      `SELECT d.*, cl.nombre_cliente, cl.cuil_codigo FROM devoluciones d LEFT JOIN clientes cl ON d.cliente_id = cl.id WHERE d.id = ? AND d.empresa_id = ?`,
      [id, empresa_id],
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
      [req.user.empresa_id],
    );
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error al contar devoluciones:", error);
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
