// // models/Venta.js
// const db = require("../config/db");

// const Venta = {
//   getAll: async (empresa_id) => {
//     try {
//       const query = `
//         SELECT v.*, cl.nombre_cliente as cliente_nombre, cl.cuil_codigo as cliente_cuil, u.name as usuario_nombre
//         FROM ventas v
//         LEFT JOIN clientes cl ON v.cliente_id = cl.id
//         LEFT JOIN users u ON v.usuario_id = u.id
//         WHERE v.empresa_id = ?
//         ORDER BY v.fecha DESC, v.id DESC
//       `;
//       const [rows] = await db.execute(query, [empresa_id]);
//       return rows;
//     } catch (error) {
//       console.error("Error en Venta.getAll:", error);
//       throw error;
//     }
//   },

//   getDetallesByVentaId: async (ventaId) => {
//     try {
//       const query = `
//         SELECT dv.*,
//                p.nombre as producto_nombre, p.codigo as producto_codigo, p.stock as producto_stock,
//                p.precio_venta, p.precio_compra, p.aplicar_porcentaje, p.valor_porcentaje,
//                c.nombre as combo_nombre, c.codigo as combo_codigo, c.precio_venta as combo_precio,
//                un.nombre as unidad_nombre
//         FROM detalle_ventas dv
//         LEFT JOIN productos p ON dv.producto_id = p.id
//         LEFT JOIN combos c ON dv.combo_id = c.id
//         LEFT JOIN unidads un ON p.unidad_id = un.id
//         WHERE dv.venta_id = ?
//       `;
//       const [rows] = await db.execute(query, [ventaId]);
//       return rows;
//     } catch (error) {
//       console.error("Error en getDetallesByVentaId:", error);
//       return [];
//     }
//   },

//   getTmpItems: async (usuario_id) => {
//     try {
//       const query = `
//         SELECT t.*, p.nombre, p.codigo, p.precio_venta, p.precio_compra,
//               p.stock as producto_stock, -- 👈 ESTO ES LO QUE FALTA
//               u.nombre as unidad_nombre, c.nombre as combo_nombre, c.codigo as combo_codigo, c.precio_venta as combo_precio
//         FROM tmp_ventas t
//         LEFT JOIN productos p ON t.producto_id = p.id
//         LEFT JOIN unidads u ON p.unidad_id = u.id
//         LEFT JOIN combos c ON t.combo_id = c.id
//         WHERE t.session_id = ?`;
//       const [rows] = await db.execute(query, [usuario_id]);
//       return rows;
//     } catch (error) {
//       throw error;
//     }
//   },

//   addTmpItem: async (datos) => {
//     const { producto_id, combo_id, cantidad, usuario_id } = datos;
//     const columna = producto_id ? "producto_id" : "combo_id";
//     const id_valor = producto_id || combo_id;
//     const [exist] = await db.execute(
//       `SELECT id, cantidad FROM tmp_ventas WHERE ${columna} = ? AND session_id = ?`,
//       [id_valor, usuario_id]
//     );

//     if (exist.length > 0) {
//       const nuevaCant = parseFloat(exist[0].cantidad) + parseFloat(cantidad);
//       return await db.execute(
//         "UPDATE tmp_ventas SET cantidad = ? WHERE id = ?",
//         [nuevaCant, exist[0].id]
//       );
//     }
//     const query = `INSERT INTO tmp_ventas (cantidad, ${columna}, session_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`;
//     return await db.execute(query, [cantidad, id_valor, usuario_id]);
//   },

//   deleteTmpItem: async (id) => {
//     return await db.execute("DELETE FROM tmp_ventas WHERE id = ?", [id]);
//   },

//   // PROCESO PRINCIPAL DE VENTA (Espejo de Compra + Lógica de Venta)
//   store: async (datos, usuario_id, empresa_id) => {
//     const connection = await db.getConnection();
//     try {
//       await connection.beginTransaction();

//       // Aseguramos que los valores sean numéricos para evitar errores de cálculo
//       const precio_total = parseFloat(datos.precio_total || 0);
//       const {
//         cliente_id,
//         fecha,
//         pagos,
//         es_cuenta_corriente,
//         descuento_porcentaje,
//         descuento_monto,
//       } = datos;

//       // 1. BUSCAR EL ARQUEO ABIERTO ACTUAL
//       const [arqueoRows] = await connection.execute(
//         "SELECT id FROM arqueos WHERE empresa_id = ? AND (fecha_cierre IS NULL OR fecha_cierre = '') LIMIT 1",
//         [empresa_id]
//       );
//       const current_arqueo_id = arqueoRows.length > 0 ? arqueoRows[0].id : null;

//       // 2. INSERTAR VENTA
//       const [resVenta] = await connection.execute(
//         `INSERT INTO ventas (fecha, precio_total, cliente_id, arqueo_id, empresa_id, usuario_id, efectivo, tarjeta, mercadopago, transferencia, es_cuenta_corriente, descuento_porcentaje, descuento_monto, created_at, updated_at)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
//         [
//           fecha,
//           precio_total,
//           cliente_id,
//           current_arqueo_id,
//           empresa_id,
//           usuario_id,
//           parseFloat(pagos.efectivo || 0),
//           parseFloat(pagos.tarjeta || 0),
//           parseFloat(pagos.mercadopago || 0),
//           parseFloat(pagos.transferencia || 0),
//           es_cuenta_corriente ? 1 : 0,
//           descuento_porcentaje || 0,
//           descuento_monto || 0,
//         ]
//       );
//       const venta_id = resVenta.insertId;

//       // 3. PROCESAR ITEMS Y MOVIMIENTOS DE STOCK
//       const [tmpItems] = await connection.execute(
//         "SELECT * FROM tmp_ventas WHERE session_id = ?",
//         [usuario_id]
//       );
//       for (const item of tmpItems) {
//         await connection.execute(
//           "INSERT INTO detalle_ventas (cantidad, venta_id, producto_id, combo_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
//           [item.cantidad, venta_id, item.producto_id, item.combo_id]
//         );

//         if (item.producto_id) {
//           await connection.execute(
//             "UPDATE productos SET stock = stock - ? WHERE id = ?",
//             [item.cantidad, item.producto_id]
//           );
//           await connection.execute(
//             "INSERT INTO movimientos (producto_id, empresa_id, tipo, origen, origen_id, venta_id, cantidad, fecha, usuario_id, created_at, updated_at) VALUES (?, ?, 'salida', 'venta', ?, ?, ?, ?, ?, NOW(), NOW())",
//             [
//               item.producto_id,
//               empresa_id,
//               venta_id,
//               venta_id,
//               item.cantidad,
//               fecha,
//               usuario_id,
//             ]
//           );
//         } else if (item.combo_id) {
//           const [componentes] = await connection.execute(
//             "SELECT producto_id, cantidad FROM combo_producto WHERE combo_id = ?",
//             [item.combo_id]
//           );
//           for (const comp of componentes) {
//             const totalADescontar = item.cantidad * comp.cantidad;
//             await connection.execute(
//               "UPDATE productos SET stock = stock - ? WHERE id = ?",
//               [totalADescontar, comp.producto_id]
//             );
//             await connection.execute(
//               "INSERT INTO movimientos (producto_id, empresa_id, tipo, origen, origen_id, venta_id, cantidad, fecha, usuario_id, created_at, updated_at) VALUES (?, ?, 'salida', 'venta', ?, ?, ?, ?, ?, NOW(), NOW())",
//               [
//                 comp.producto_id,
//                 empresa_id,
//                 venta_id,
//                 venta_id,
//                 totalADescontar,
//                 fecha,
//                 usuario_id,
//               ]
//             );
//           }
//         }
//       }

//       // 4. CÁLCULO DE PAGOS REALIZADOS EN EL MOMENTO
//       const totalPagadoActo =
//         parseFloat(pagos.efectivo || 0) +
//         parseFloat(pagos.tarjeta || 0) +
//         parseFloat(pagos.mercadopago || 0) +
//         parseFloat(pagos.transferencia || 0);

//       // 5. ASENTAR EN ARQUEO DE CAJA
//       if (current_arqueo_id && totalPagadoActo > 0) {
//         await connection.execute(
//           "INSERT INTO movimiento_cajas (tipo, monto, descripcion, arqueo_id, created_at, updated_at) VALUES ('Ingreso', ?, ?, ?, NOW(), NOW())",
//           [totalPagadoActo, `Venta Ticket N° ${venta_id}`, current_arqueo_id]
//         );
//       }

//       // 6. REGISTRAR DEUDA EN CUENTA CORRIENTE (Si aplica)
//       // Solo si el checkbox está activo y el total pagado es menor al total de la venta
//       if (es_cuenta_corriente && totalPagadoActo < precio_total) {
//         const saldoPendiente = precio_total - totalPagadoActo;
//         await connection.execute(
//           "INSERT INTO compras_cta_cte (cliente_id, empresa_id, venta_id, importe, tipo, fecha, created_at, updated_at) VALUES (?, ?, ?, ?, 'deuda', ?, NOW(), NOW())",
//           [cliente_id, empresa_id, venta_id, saldoPendiente, fecha]
//         );
//       }

//       // 7. LIMPIAR TEMPORAL Y FINALIZAR
//       await connection.execute("DELETE FROM tmp_ventas WHERE session_id = ?", [
//         usuario_id,
//       ]);
//       await connection.commit();
//       return venta_id;
//     } catch (error) {
//       await connection.rollback();
//       console.error("Error crítico en store venta:", error);
//       throw error;
//     } finally {
//       connection.release();
//     }
//   },
// };

// module.exports = Venta;

// models/Venta.js
const db = require("../config/db");

const Venta = {
  getAll: async (empresa_id) => {
    try {
      const query = `
        SELECT v.*, cl.nombre_cliente as cliente_nombre, cl.cuil_codigo as cliente_cuil, u.name as usuario_nombre
        FROM ventas v
        LEFT JOIN clientes cl ON v.cliente_id = cl.id
        LEFT JOIN users u ON v.usuario_id = u.id
        WHERE v.empresa_id = ?
        ORDER BY v.fecha DESC, v.id DESC
      `;
      const [rows] = await db.execute(query, [empresa_id]);
      return rows;
    } catch (error) {
      console.error("Error en Venta.getAll:", error);
      throw error;
    }
  },

  getDetallesByVentaId: async (ventaId) => {
    try {
      const query = `
        SELECT dv.*, 
               p.nombre as producto_nombre, p.codigo as producto_codigo, p.stock as producto_stock,
               c.nombre as combo_nombre, c.codigo as combo_codigo,
               un.nombre as unidad_nombre
        FROM detalle_ventas dv
        LEFT JOIN productos p ON dv.producto_id = p.id
        LEFT JOIN combos c ON dv.combo_id = c.id
        LEFT JOIN unidads un ON p.unidad_id = un.id
        WHERE dv.venta_id = ?
      `;
      const [rows] = await db.execute(query, [ventaId]);
      return rows;
    } catch (error) {
      console.error("Error en getDetallesByVentaId:", error);
      return [];
    }
  },

  getTmpItems: async (usuario_id) => {
    try {
      const query = `
        SELECT t.*, p.nombre, p.codigo, p.precio_venta, p.precio_compra, p.aplicar_porcentaje, p.valor_porcentaje,
              p.stock as producto_stock,
              u.nombre as unidad_nombre, c.nombre as combo_nombre, c.codigo as combo_codigo, c.precio_venta as combo_precio
        FROM tmp_ventas t
        LEFT JOIN productos p ON t.producto_id = p.id
        LEFT JOIN unidads u ON p.unidad_id = u.id 
        LEFT JOIN combos c ON t.combo_id = c.id
        WHERE t.session_id = ?`;
      const [rows] = await db.execute(query, [usuario_id]);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  deleteTmpItem: async (id) => {
    return await db.execute("DELETE FROM tmp_ventas WHERE id = ?", [id]);
  },

  store: async (datos, usuario_id, empresa_id) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const precio_total = parseFloat(datos.precio_total || 0);
      const {
        cliente_id,
        fecha,
        pagos,
        es_cuenta_corriente,
        descuento_porcentaje,
        descuento_monto,
      } = datos;

      const [arqueoRows] = await connection.execute(
        "SELECT id FROM arqueos WHERE empresa_id = ? AND (fecha_cierre IS NULL OR fecha_cierre = '') LIMIT 1",
        [empresa_id]
      );
      const current_arqueo_id = arqueoRows.length > 0 ? arqueoRows[0].id : null;

      const [resVenta] = await connection.execute(
        `INSERT INTO ventas (fecha, precio_total, cliente_id, arqueo_id, empresa_id, usuario_id, efectivo, tarjeta, mercadopago, transferencia, es_cuenta_corriente, descuento_porcentaje, descuento_monto, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          fecha,
          precio_total,
          cliente_id,
          current_arqueo_id,
          empresa_id,
          usuario_id,
          parseFloat(pagos.efectivo || 0),
          parseFloat(pagos.tarjeta || 0),
          parseFloat(pagos.mercadopago || 0),
          parseFloat(pagos.transferencia || 0),
          es_cuenta_corriente ? 1 : 0,
          descuento_porcentaje || 0,
          descuento_monto || 0,
        ]
      );
      const venta_id = resVenta.insertId;

      const [tmpItems] = await connection.execute(
        `SELECT t.*, 
                p.precio_compra as p_costo, p.precio_venta as p_venta, p.aplicar_porcentaje, p.valor_porcentaje,
                c.precio_venta as c_venta
         FROM tmp_ventas t 
         LEFT JOIN productos p ON t.producto_id = p.id 
         LEFT JOIN combos c ON t.combo_id = c.id 
         WHERE t.session_id = ?`,
        [usuario_id]
      );

      for (const item of tmpItems) {
        let costoFinal = 0;
        let precioFinal = 0;

        if (item.producto_id) {
          costoFinal = parseFloat(item.p_costo);
          precioFinal =
            item.aplicar_porcentaje == 1
              ? costoFinal * (1 + parseFloat(item.valor_porcentaje) / 100)
              : parseFloat(item.p_venta);

          await connection.execute(
            "UPDATE productos SET stock = stock - ? WHERE id = ?",
            [item.cantidad, item.producto_id]
          );
        } else if (item.combo_id) {
          const [comp] = await connection.execute(
            "SELECT cp.cantidad, p.precio_compra FROM combo_producto cp JOIN productos p ON cp.producto_id = p.id WHERE cp.combo_id = ?",
            [item.combo_id]
          );
          costoFinal = comp.reduce(
            (acc, c) =>
              acc + parseFloat(c.cantidad) * parseFloat(c.precio_compra),
            0
          );
          precioFinal = parseFloat(item.c_venta);

          for (const c of comp) {
            await connection.execute(
              "UPDATE productos SET stock = stock - ? WHERE id = ?",
              [item.cantidad * c.cantidad, item.producto_id]
            );
          }
        }

        await connection.execute(
          "INSERT INTO detalle_ventas (cantidad, venta_id, producto_id, combo_id, precio_compra, precio_venta, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
          [
            item.cantidad,
            venta_id,
            item.producto_id,
            item.combo_id,
            costoFinal,
            precioFinal,
          ]
        );
      }

      const totalPagadoActo =
        parseFloat(pagos.efectivo || 0) +
        parseFloat(pagos.tarjeta || 0) +
        parseFloat(pagos.mercadopago || 0) +
        parseFloat(pagos.transferencia || 0);
      if (current_arqueo_id && totalPagadoActo > 0) {
        await connection.execute(
          "INSERT INTO movimiento_cajas (tipo, monto, descripcion, arqueo_id, created_at, updated_at) VALUES ('Ingreso', ?, ?, ?, NOW(), NOW())",
          [totalPagadoActo, `Venta Ticket N° ${venta_id}`, current_arqueo_id]
        );
      }

      if (es_cuenta_corriente && totalPagadoActo < precio_total) {
        await connection.execute(
          "INSERT INTO compras_cta_cte (cliente_id, empresa_id, venta_id, importe, tipo, fecha, created_at, updated_at) VALUES (?, ?, ?, ?, 'deuda', ?, NOW(), NOW())",
          [
            cliente_id,
            empresa_id,
            venta_id,
            precio_total - totalPagadoActo,
            fecha,
          ]
        );
      }

      await connection.execute("DELETE FROM tmp_ventas WHERE session_id = ?", [
        usuario_id,
      ]);
      await connection.commit();
      return venta_id;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};

module.exports = Venta;
