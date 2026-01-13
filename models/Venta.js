// models/Venta.js
const db = require("../config/db");

const Venta = {
  // 1. Obtener todas las ventas filtradas por empresa
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

  // 2. Obtener detalles de una venta específica
  getDetallesByVentaId: async (ventaId) => {
    try {
      const query = `
        SELECT dv.*, 
               p.nombre as producto_nombre, p.codigo as producto_codigo, p.stock as producto_stock,
               p.precio_venta, p.precio_compra, p.aplicar_porcentaje, p.valor_porcentaje,
               c.nombre as combo_nombre, c.codigo as combo_codigo, c.precio_venta as combo_precio,
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

  // 3. Obtener ítems del carrito temporal
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

  // 4. Eliminar ítem del carrito
  deleteTmpItem: async (id) => {
    return await db.execute("DELETE FROM tmp_ventas WHERE id = ?", [id]);
  },

  // 5. PROCESO PRINCIPAL DE VENTA (MULTICAJA + STOCK COMBOS + FIDELIZACIÓN + MOTOR DE PROMOS)
  store: async (datos, usuario_id, empresa_id) => {
    const MY_CAJA = Number(process.env.CAJA_ID || 1);
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const precio_total_recibido = parseFloat(datos.precio_total || 0);
      const {
        cliente_id,
        fecha,
        pagos,
        es_cuenta_corriente,
        descuento_porcentaje,
        descuento_monto,
        puntos_canjeados,
      } = datos;

      // A. BUSCAR EL ARQUEO ABIERTO DE ESTA CAJA
      const [arqueoRows] = await connection.execute(
        "SELECT id FROM arqueos WHERE empresa_id = ? AND caja_id = ? AND (fecha_cierre IS NULL OR fecha_cierre = '' OR estado = 'Abierto') LIMIT 1",
        [empresa_id, MY_CAJA]
      );
      const current_arqueo_id = arqueoRows.length > 0 ? arqueoRows[0].id : null;

      // B. PROCESAR ITEMS TEMPORALES Y CALCULAR PROMOCIONES
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

      let ahorroTotalPromos = 0;

      for (const item of tmpItems) {
        if (item.producto_id) {
          // 🚀 BUSCAR PROMOCIÓN ACTIVA PARA EL PRODUCTO
          const [promoRows] = await connection.execute(
            "SELECT tipo FROM promociones WHERE producto_id = ? AND empresa_id = ? AND estado = 1 LIMIT 1",
            [item.producto_id, empresa_id]
          );

          if (promoRows.length > 0) {
            const tipoPromo = promoRows[0].tipo;
            const precioUnidad = parseFloat(item.p_venta);
            const cant = parseFloat(item.cantidad);

            if (tipoPromo === "3x2" && cant >= 3) {
              ahorroTotalPromos += Math.floor(cant / 3) * precioUnidad;
            } else if (tipoPromo === "2da_al_70" && cant >= 2) {
              ahorroTotalPromos += Math.floor(cant / 2) * (precioUnidad * 0.7);
            } else if (tipoPromo === "2da_al_50" && cant >= 2) {
              ahorroTotalPromos += Math.floor(cant / 2) * (precioUnidad * 0.5);
            } else if (tipoPromo === "4x3" && cant >= 4) {
              ahorroTotalPromos += Math.floor(cant / 4) * precioUnidad;
            }
          }
        }
      }

      // El precio final es el total recibido (que ya debería venir calculado del front)
      // Pero recalculamos puntos basándonos en ese total real.
      let puntosGanados = 0;
      if (Number(cliente_id) !== 1) {
        puntosGanados = Math.floor(precio_total_recibido / 100);
      }

      // C. INSERTAR CABECERA DE VENTA
      const [resVenta] = await connection.execute(
        `INSERT INTO ventas (fecha, precio_total, puntos_ganados, puntos_canjeados, cliente_id, arqueo_id, empresa_id, caja_id, usuario_id, efectivo, tarjeta, mercadopago, transferencia, es_cuenta_corriente, descuento_porcentaje, descuento_monto, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          fecha,
          precio_total_recibido,
          puntosGanados,
          Number(puntos_canjeados || 0),
          cliente_id,
          current_arqueo_id,
          empresa_id,
          MY_CAJA,
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

      // D. ACTUALIZAR PUNTOS CLIENTE
      if (Number(cliente_id) !== 1) {
        await connection.execute(
          "UPDATE clientes SET puntos = puntos + ? - ? WHERE id = ?",
          [puntosGanados, Number(puntos_canjeados || 0), cliente_id]
        );
      }

      // E. PROCESAR DETALLES Y STOCK
      for (const item of tmpItems) {
        let costoFinal = 0;
        let precioFinal = 0;

        if (item.producto_id) {
          costoFinal = parseFloat(item.p_costo || 0);
          precioFinal =
            item.aplicar_porcentaje == 1
              ? costoFinal * (1 + parseFloat(item.valor_porcentaje) / 100)
              : parseFloat(item.p_venta || 0);

          await connection.execute(
            "UPDATE productos SET stock = stock - ? WHERE id = ?",
            [item.cantidad, item.producto_id]
          );
          await connection.execute(
            "INSERT INTO movimientos (producto_id, empresa_id, tipo, origen, origen_id, venta_id, cantidad, fecha, usuario_id, created_at, updated_at) VALUES (?, ?, 'salida', 'venta', ?, ?, ?, ?, ?, NOW(), NOW())",
            [
              item.producto_id,
              empresa_id,
              venta_id,
              venta_id,
              item.cantidad,
              fecha,
              usuario_id,
            ]
          );
        } else if (item.combo_id) {
          const [componentes] = await connection.execute(
            "SELECT producto_id, cantidad FROM combo_producto WHERE combo_id = ?",
            [item.combo_id]
          );
          precioFinal = parseFloat(item.c_venta || 0);
          let costoAcumulado = 0;
          for (const comp of componentes) {
            const cantADescontar =
              parseFloat(item.cantidad) * parseFloat(comp.cantidad);
            await connection.execute(
              "UPDATE productos SET stock = stock - ? WHERE id = ?",
              [cantADescontar, comp.producto_id]
            );
            await connection.execute(
              "INSERT INTO movimientos (producto_id, empresa_id, tipo, origen, origen_id, venta_id, cantidad, fecha, usuario_id, created_at, updated_at) VALUES (?, ?, 'salida', 'venta', ?, ?, ?, ?, ?, NOW(), NOW())",
              [
                comp.producto_id,
                empresa_id,
                venta_id,
                venta_id,
                cantADescontar,
                fecha,
                usuario_id,
              ]
            );
            const [pInfo] = await connection.execute(
              "SELECT precio_compra FROM productos WHERE id = ?",
              [comp.producto_id]
            );
            costoAcumulado +=
              parseFloat(pInfo[0].precio_compra || 0) *
              parseFloat(comp.cantidad);
          }
          costoFinal = costoAcumulado;
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

      // F. MOVIMIENTO DE CAJA
      const efectivoReal = parseFloat(pagos.efectivo || 0);
      if (current_arqueo_id && efectivoReal > 0) {
        await connection.execute(
          "INSERT INTO movimiento_cajas (tipo, monto, descripcion, arqueo_id, caja_id, created_at, updated_at) VALUES ('Ingreso', ?, ?, ?, ?, NOW(), NOW())",
          [
            efectivoReal,
            `Venta Ticket N° ${venta_id}`,
            current_arqueo_id,
            MY_CAJA,
          ]
        );
      }

      // G. CUENTA CORRIENTE
      const pagadoTotal =
        parseFloat(pagos.efectivo || 0) +
        parseFloat(pagos.tarjeta || 0) +
        parseFloat(pagos.mercadopago || 0) +
        parseFloat(pagos.transferencia || 0);
      if (es_cuenta_corriente && pagadoTotal < precio_total_recibido) {
        await connection.execute(
          "INSERT INTO compras_cta_cte (cliente_id, empresa_id, caja_id, venta_id, importe, tipo, fecha, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'deuda', ?, NOW(), NOW())",
          [
            cliente_id,
            empresa_id,
            MY_CAJA,
            venta_id,
            precio_total_recibido - pagadoTotal,
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
      console.error("ERROR TRANSACCION VENTA:", error);
      throw error;
    } finally {
      connection.release();
    }
  },
};

module.exports = Venta;
