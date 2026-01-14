// models/Compra.js
const db = require("../config/db");

const Compra = {
  getAll: async () => {
    try {
      const query = `
        SELECT c.*, p.empresa as proveedor_nombre, p.marca as proveedor_marca, u.name as usuario_nombre
        FROM compras c
        LEFT JOIN proveedors p ON c.proveedor_id = p.id
        LEFT JOIN users u ON c.usuario_id = u.id
        ORDER BY c.fecha DESC
      `;
      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error("Error en Compra.getAll:", error);
      throw error;
    }
  },

  getDetallesByCompraId: async (compraId) => {
    try {
      const query = `
      SELECT 
        dc.*, 
        prod.nombre as producto_nombre, 
        prod.codigo as producto_codigo, 
        prod.stock as producto_stock,
        dc.precio_compra 
      FROM detalle_compras dc
      LEFT JOIN productos prod ON dc.producto_id = prod.id
      WHERE dc.compra_id = ?
    `;
      const [rows] = await db.execute(query, [compraId]);
      return rows;
    } catch (error) {
      console.error("ERROR EN SQL DETALLES COMPRA:", error.message);
      return [];
    }
  },

  getTmpItems: async (usuario_id) => {
    const [rows] = await db.execute(
      `SELECT t.id, t.producto_id, t.cantidad, t.precio_compra, p.nombre, p.codigo 
     FROM tmp_compras t 
     JOIN productos p ON t.producto_id = p.id 
     WHERE t.usuario_id = ?`,
      [usuario_id]
    );
    return rows;
  },

  addTmpItem: async (datos) => {
    try {
      const { producto_id, cantidad, usuario_id } = datos;

      const [exist] = await db.execute(
        "SELECT id, cantidad FROM tmp_compras WHERE producto_id = ? AND (usuario_id = ? OR session_id = ?)",
        [producto_id, usuario_id, usuario_id]
      );

      // Traemos el costo actual para inicializar el temporal
      const [pData] = await db.execute(
        "SELECT precio_compra FROM productos WHERE id = ?",
        [producto_id]
      );
      const costoActual = pData[0] ? pData[0].precio_compra : 0;

      if (exist.length > 0) {
        const nuevaCant = parseFloat(exist[0].cantidad) + parseFloat(cantidad);
        return await db.execute(
          "UPDATE tmp_compras SET cantidad = ? WHERE id = ?",
          [nuevaCant, exist[0].id]
        );
      }

      const query = `INSERT INTO tmp_compras (producto_id, cantidad, precio_compra, usuario_id, session_id, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, ?, NOW(), NOW())`;
      return await db.execute(query, [
        producto_id,
        cantidad,
        costoActual,
        usuario_id,
        usuario_id,
      ]);
    } catch (error) {
      console.error("ERROR SQL en addTmpItem:", error.message);
      throw error;
    }
  },

  deleteTmpItem: async (id) => {
    return await db.execute("DELETE FROM tmp_compras WHERE id = ?", [id]);
  },

  // 🚀 REFACCIÓN: Recibe 'externalConn' para evitar el Lock Timeout 🚀
  store: async (datos, usuario_id, empresa_id, externalConn = null) => {
    // Si viene una conexión externa (transacción), la usamos. Si no, usamos el pool.
    const conn = externalConn || db;

    try {
      const { id_proveedor, comprobante, numero, fecha, precio_total, pagos } =
        datos;

      // 1. Insertar la Compra Principal
      const [resCompra] = await conn.execute(
        "INSERT INTO compras (fecha, comprobante, precio_total, proveedor_id, empresa_id, usuario_id, deuda, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
        [
          fecha,
          `${comprobante} - ${numero}`,
          precio_total,
          id_proveedor,
          empresa_id,
          usuario_id,
          0,
        ]
      );
      const compra_id = resCompra.insertId;

      // 2. Traer items temporales
      const [tmpItems] = await conn.execute(
        "SELECT * FROM tmp_compras WHERE usuario_id = ? OR session_id = ?",
        [usuario_id, usuario_id]
      );

      let totalPagado = 0;
      for (const item of tmpItems) {
        // Guardamos el precio_compra que el usuario editó en la grilla
        await conn.execute(
          "INSERT INTO detalle_compras (cantidad, precio_compra, compra_id, producto_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
          [item.cantidad, item.precio_compra, compra_id, item.producto_id]
        );

        // Actualizamos stock
        await conn.execute(
          "UPDATE productos SET stock = stock + ? WHERE id = ?",
          [item.cantidad, item.producto_id]
        );

        // Registrar movimiento de inventario
        await conn.execute(
          "INSERT INTO movimientos (producto_id, empresa_id, tipo, origen, origen_id, cantidad, fecha, usuario_id, created_at, updated_at) VALUES (?, ?, 'entrada', 'compra', ?, ?, ?, ?, NOW(), NOW())",
          [
            item.producto_id,
            empresa_id,
            compra_id,
            item.cantidad,
            fecha,
            usuario_id,
          ]
        );
      }

      // 3. Procesar Pagos
      const metodos = ["efectivo", "tarjeta", "mercadopago", "banco"];
      const caja_id = datos.caja_id || 1; // Capturamos caja_id de la terminal

      for (const m of metodos) {
        const monto = parseFloat(pagos[m]) || 0;
        if (monto > 0) {
          totalPagado += monto;
          await conn.execute(
            "INSERT INTO pago_compras (compra_id, proveedor_id, empresa_id, usuario_id, monto, metodo_pago, fecha_pago, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
            [compra_id, id_proveedor, empresa_id, usuario_id, monto, m, fecha]
          );

          if (m === "efectivo") {
            const [arqueo] = await conn.execute(
              "SELECT id FROM arqueos WHERE fecha_cierre IS NULL AND empresa_id = ? AND caja_id = ? LIMIT 1",
              [empresa_id, caja_id]
            );
            if (arqueo.length > 0) {
              await conn.execute(
                "INSERT INTO movimiento_cajas (tipo, monto, descripcion, arqueo_id, created_at, updated_at) VALUES ('Egreso', ?, ?, ?, NOW(), NOW())",
                [
                  monto,
                  `Pago compra - ${comprobante} - ${numero}`,
                  arqueo[0].id,
                ]
              );
            }
          }
        }
      }

      // 4. Actualizar Deuda
      const deudaFinal = parseFloat(precio_total) - totalPagado;
      await conn.execute("UPDATE compras SET deuda = ? WHERE id = ?", [
        deudaFinal,
        compra_id,
      ]);

      // 5. Limpiar temporal
      await conn.execute(
        "DELETE FROM tmp_compras WHERE usuario_id = ? OR session_id = ?",
        [usuario_id, usuario_id]
      );

      return true;
    } catch (error) {
      console.error("ERROR EN MODELO COMPRA:", error);
      throw error; // Propagamos el error para que el controlador haga rollback
    }
  },
};

module.exports = Compra;
