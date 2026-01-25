// models/Venta.js - VERSIÓN ORIGINAL FUNCIONAL
const db = require("../config/db");

const Venta = {
  getAll: async (empresa_id) => {
    const query = `
      SELECT v.*, cl.nombre_cliente as cliente_nombre, cl.cuil_codigo as cliente_cuil, u.name as usuario_nombre
      FROM ventas v
      LEFT JOIN clientes cl ON v.cliente_id = cl.id
      LEFT JOIN users u ON v.usuario_id = u.id
      WHERE v.empresa_id = ?
      ORDER BY v.fecha DESC, v.id DESC`;
    const [rows] = await db.execute(query, [empresa_id]);
    return rows;
  },

  getDetallesByVentaId: async (ventaId) => {
    const query = `
    SELECT dv.*, 
           p.nombre as producto_nombre, 
           p.codigo as producto_codigo,
           u1.nombre as unidad_base_nombre, 
           u2.nombre as unidad_bulto_nombre,
           p.precio_venta, 
           p.precio_compra, 
           p.aplicar_porcentaje, 
           p.valor_porcentaje,
           c.nombre as combo_nombre, 
           c.precio_venta as combo_precio,
           -- Campos de bultos (usando el sistema existente)
           dv.es_bulto,
           dv.factor_utilizado
    FROM detalle_ventas dv
    LEFT JOIN productos p ON dv.producto_id = p.id
    LEFT JOIN unidads u1 ON p.unidad_id = u1.id
    LEFT JOIN unidads u2 ON p.unidad_compra_id = u2.id
    LEFT JOIN combos c ON dv.combo_id = c.id
    WHERE dv.venta_id = ?`;
    const [rows] = await db.execute(query, [ventaId]);
    return rows;
  },

  getTmpItems: async (usuario_id) => {
    try {
      const query = `
        SELECT t.*,
               p.nombre, p.codigo, p.precio_venta, p.precio_compra, p.aplicar_porcentaje, p.valor_porcentaje,
               p.stock as producto_stock,
               u1.nombre as unidad_nombre,       -- Unidad Base
               u2.nombre as unidad_bulto_nombre, -- Unidad Bulto (Caja)
               c.nombre as combo_nombre, c.precio_venta as combo_precio
        FROM tmp_ventas t
        LEFT JOIN productos p ON t.producto_id = p.id
        LEFT JOIN unidads u1 ON p.unidad_id = u1.id
        LEFT JOIN unidads u2 ON p.unidad_compra_id = u2.id
        LEFT JOIN combos c ON t.combo_id = c.id
        WHERE t.session_id = ?`;
      const [rows] = await db.execute(query, [usuario_id]);
      return rows;
    } catch (error) {
      console.error("ERROR SQL getTmpItems:", error.message);
      throw error;
    }
  },

  deleteTmpItem: async (id) => {
    return await db.execute("DELETE FROM tmp_ventas WHERE id = ?", [id]);
  },

  store: async (datos, usuario_id, empresa_id) => {
    const MY_CAJA = Number(process.env.CAJA_ID || 1);
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const {
        cliente_id,
        fecha,
        precio_total,
        pagos,
        es_cuenta_corriente,
        descuento_porcentaje,
        descuento_monto,
      } = datos;

      // 1. BUSCAR ARQUEO ABIERTO
      const [arqueoRows] = await connection.execute(
        "SELECT id FROM arqueos WHERE empresa_id = ? AND caja_id = ? AND fecha_cierre IS NULL LIMIT 1",
        [empresa_id, MY_CAJA],
      );
      const current_arqueo_id = arqueoRows.length > 0 ? arqueoRows[0].id : null;

      // 2. INSERTAR VENTA PRINCIPAL
      const [resVenta] = await connection.execute(
        `INSERT INTO ventas (fecha, precio_total, cliente_id, arqueo_id, empresa_id, caja_id, usuario_id, efectivo, tarjeta, mercadopago, transferencia, es_cuenta_corriente, descuento_porcentaje, descuento_monto, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          fecha,
          precio_total,
          cliente_id,
          current_arqueo_id,
          empresa_id,
          MY_CAJA,
          usuario_id,
          pagos.efectivo || 0,
          pagos.tarjeta || 0,
          pagos.mercadopago || 0,
          pagos.transferencia || 0,
          es_cuenta_corriente ? 1 : 0,
          descuento_porcentaje || 0,
          descuento_monto || 0,
        ],
      );
      const venta_id = resVenta.insertId;

      // 3. PROCESAR ITEMS DESDE TMP_VENTAS
      const [tmpItems] = await connection.execute(
        "SELECT * FROM tmp_ventas WHERE session_id = ?",
        [usuario_id],
      );

      for (const item of tmpItems) {
        const factor = parseFloat(item.factor_utilizado || 1);
        const cantBase =
          item.es_bulto === 1 ? item.cantidad * factor : item.cantidad;

        // OBTENER PRECIO DESDE LA TABLA PRODUCTOS/COMBOS (NO desde tmp_ventas)
        let precioVentaFinal = 0;
        let precioCompraFinal = 0;

        if (item.producto_id) {
          const [producto] = await connection.execute(
            "SELECT precio_venta, precio_compra FROM productos WHERE id = ?",
            [item.producto_id],
          );
          if (producto.length > 0) {
            precioVentaFinal = producto[0].precio_venta;
            precioCompraFinal = producto[0].precio_compra;
          }
        } else if (item.combo_id) {
          const [combo] = await connection.execute(
            "SELECT precio_venta FROM combos WHERE id = ?",
            [item.combo_id],
          );
          if (combo.length > 0) {
            precioVentaFinal = combo[0].precio_venta;
          }
        }

        // Registrar detalle con bultos
        await connection.execute(
          `INSERT INTO detalle_ventas (cantidad, venta_id, producto_id, combo_id, precio_compra, precio_venta, es_bulto, factor_utilizado, cantidad_unidades_base, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            item.cantidad,
            venta_id,
            item.producto_id,
            item.combo_id,
            precioCompraFinal,
            precioVentaFinal,
            item.es_bulto,
            factor,
            cantBase,
          ],
        );

        if (item.producto_id) {
          await connection.execute(
            "UPDATE productos SET stock = stock - ? WHERE id = ?",
            [cantBase, item.producto_id],
          );
          await connection.execute(
            "INSERT INTO movimientos (producto_id, empresa_id, tipo, origen, origen_id, venta_id, cantidad, fecha, usuario_id, created_at) VALUES (?, ?, 'salida', 'venta', ?, ?, ?, ?, ?, NOW())",
            [
              item.producto_id,
              empresa_id,
              venta_id,
              venta_id,
              cantBase,
              fecha,
              usuario_id,
            ],
          );
        }
      }

      // 4. REGISTRAR MOVIMIENTO DE CAJA (SI HAY EFECTIVO)
      const efectivoReal = parseFloat(pagos.efectivo || 0);
      if (current_arqueo_id && efectivoReal > 0) {
        await connection.execute(
          "INSERT INTO movimiento_cajas (tipo, monto, descripcion, arqueo_id, caja_id, created_at, updated_at) VALUES ('Ingreso', ?, ?, ?, ?, NOW(), NOW())",
          [
            efectivoReal,
            `Venta Ticket N° ${venta_id}`,
            current_arqueo_id,
            MY_CAJA,
          ],
        );
      }

      // 5. LIMPIEZA Y CIERRE
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
