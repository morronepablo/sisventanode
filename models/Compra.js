// src/models/Compra.js
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
      // LOG DE DEPURACIÓN: Revisa tu consola de Node/Backend cuando cargues la página
      console.log(`Buscando detalles para la Compra ID: ${compraId}`);

      const query = `
        SELECT dc.*, prod.nombre as producto_nombre, prod.codigo as producto_codigo, prod.stock as producto_stock
        FROM detalle_compras dc
        LEFT JOIN productos prod ON dc.producto_id = prod.id
        WHERE dc.compra_id = ?
      `;
      const [rows] = await db.execute(query, [compraId]);

      console.log(`Resultados encontrados para ID ${compraId}:`, rows.length);
      return rows;
    } catch (error) {
      // SI HAY UN ERROR AQUÍ, AHORA LO VERÁS EN LA CONSOLA
      console.error("ERROR CRÍTICO EN SQL DETALLES:", error.message);
      return [];
    }
  },

  getTmpItems: async (usuario_id) => {
    try {
      // Ajustamos el nombre de la columna: usamos 'usuario_id'
      // Si tu tabla tiene 'session_id', lo trataremos como el ID del usuario en Node
      const query = `
        SELECT t.*, p.nombre, p.codigo, p.precio_compra, u.nombre as unidad_nombre 
        FROM tmp_compras t
        JOIN productos p ON t.producto_id = p.id
        LEFT JOIN unidads u ON p.unidad_id = u.id
        WHERE t.usuario_id = ? OR t.session_id = ?`;

      const [rows] = await db.execute(query, [usuario_id, usuario_id]);
      return rows;
    } catch (error) {
      console.error("ERROR SQL en getTmpItems:", error.message);
      throw error;
    }
  },

  addTmpItem: async (datos) => {
    try {
      const { producto_id, cantidad, usuario_id } = datos;

      // Buscamos si ya existe el producto para ese usuario
      const [exist] = await db.execute(
        "SELECT id, cantidad FROM tmp_compras WHERE producto_id = ? AND (usuario_id = ? OR session_id = ?)",
        [producto_id, usuario_id, usuario_id]
      );

      if (exist.length > 0) {
        const nuevaCant = parseFloat(exist[0].cantidad) + parseFloat(cantidad);
        return await db.execute(
          "UPDATE tmp_compras SET cantidad = ? WHERE id = ?",
          [nuevaCant, exist[0].id]
        );
      }

      // Insertamos usando ambas columnas por compatibilidad
      const query = `INSERT INTO tmp_compras (producto_id, cantidad, usuario_id, session_id, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, NOW(), NOW())`;
      return await db.execute(query, [
        producto_id,
        cantidad,
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

  store: async (datos, usuario_id, empresa_id) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const { id_proveedor, comprobante, numero, fecha, precio_total, pagos } =
        datos;

      // 1. Insertar la Compra Principal
      const [resCompra] = await connection.execute(
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
      const [tmpItems] = await connection.execute(
        "SELECT * FROM tmp_compras WHERE usuario_id = ? OR session_id = ?",
        [usuario_id, usuario_id]
      );

      let totalPagado = 0;
      for (const item of tmpItems) {
        await connection.execute(
          "INSERT INTO detalle_compras (cantidad, compra_id, producto_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
          [item.cantidad, compra_id, item.producto_id]
        );
        await connection.execute(
          "UPDATE productos SET stock = stock + ? WHERE id = ?",
          [item.cantidad, item.producto_id]
        );
        await connection.execute(
          "INSERT INTO movimientos (producto_id, empresa_id, tipo, origen, origen_id, compra_id, cantidad, fecha, usuario_id, created_at, updated_at) VALUES (?, ?, 'entrada', 'compra', ?, ?, ?, ?, ?, NOW(), NOW())",
          [
            item.producto_id,
            empresa_id,
            compra_id,
            compra_id,
            item.cantidad,
            fecha,
            usuario_id,
          ]
        );
      }

      // 3. Procesar Pagos (CORREGIDO: Manejo de NaN)
      const metodos = ["efectivo", "tarjeta", "mercadopago", "banco"];
      for (const m of metodos) {
        // Aseguramos que el monto sea un número válido, si no, es 0
        const monto = parseFloat(pagos[m]) || 0;

        if (monto > 0) {
          totalPagado += monto;
          await connection.execute(
            "INSERT INTO pago_compras (compra_id, proveedor_id, empresa_id, usuario_id, monto, metodo_pago, fecha_pago, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
            [compra_id, id_proveedor, empresa_id, usuario_id, monto, m, fecha]
          );

          if (m === "efectivo") {
            const [arqueo] = await connection.execute(
              "SELECT id FROM arqueos WHERE fecha_cierre IS NULL AND empresa_id = ? LIMIT 1",
              [empresa_id]
            );
            if (arqueo.length > 0) {
              await connection.execute(
                "INSERT INTO movimiento_cajas (tipo, monto, descripcion, arqueo_id, created_at, updated_at) VALUES ('Egreso', ?, ?, ?, NOW(), NOW())",
                [
                  monto,
                  `Pago inicial compra - ${comprobante} - ${numero}`,
                  arqueo[0].id,
                ]
              );
            }
          }
        }
      }

      // 4. Actualizar Deuda
      const deudaFinal = parseFloat(precio_total) - totalPagado;
      await connection.execute("UPDATE compras SET deuda = ? WHERE id = ?", [
        deudaFinal,
        compra_id,
      ]);

      // 5. Limpiar temporal
      await connection.execute(
        "DELETE FROM tmp_compras WHERE usuario_id = ? OR session_id = ?",
        [usuario_id, usuario_id]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error("ERROR DETALLADO EN COMPRA:", error); // Esto te dirá el error real en la terminal
      throw error;
    } finally {
      connection.release();
    }
  },
};

module.exports = Compra;
