// models/Proveedor.js
const db = require("../config/db");

const Proveedor = {
  getAll: async () => {
    try {
      // Obtenemos los proveedores básicos
      const [rows] = await db.execute("SELECT * FROM proveedors");
      return rows;
    } catch (error) {
      console.error("Error en Proveedor.getAll:", error);
      throw error;
    }
  },

  getFacturasAdeudadas: async (proveedorId) => {
    try {
      // Basado en tu imagen de DB, la tabla 'compras' tiene 'proveedor_id' y 'usuario_id'
      const query = `
        SELECT c.*, u.name as usuario_nombre
        FROM compras c
        LEFT JOIN users u ON c.usuario_id = u.id
        WHERE c.proveedor_id = ?
      `;
      const [compras] = await db.execute(query, [proveedorId]);

      const facturas = [];
      for (const compra of compras) {
        // Buscamos cuánto se ha pagado de esta compra específica
        const [pagos] = await db.execute(
          "SELECT SUM(monto) as total_pagado FROM pago_compras WHERE compra_id = ?",
          [compra.id]
        );

        const totalPagado = parseFloat(pagos[0].total_pagado) || 0;
        const precioTotal = parseFloat(compra.precio_total) || 0;
        const saldo = precioTotal - totalPagado;

        if (saldo > 0) {
          facturas.push({
            ...compra,
            total_pagado: totalPagado,
            saldo_pendiente: saldo,
          });
        }
      }
      return facturas;
    } catch (error) {
      console.error(
        `Error en getFacturasAdeudadas para ID ${proveedorId}:`,
        error
      );
      return []; // Devolvemos vacío para que no rompa el loop principal
    }
  },

  getPagosRealizados: async (proveedorId) => {
    try {
      const query = `
        SELECT p.*, c.comprobante, u.name as usuario_nombre
        FROM pago_compras p
        LEFT JOIN compras c ON p.compra_id = c.id
        LEFT JOIN users u ON p.usuario_id = u.id
        WHERE p.proveedor_id = ?
        ORDER BY p.fecha_pago DESC
      `;
      const [rows] = await db.execute(query, [proveedorId]);
      return rows;
    } catch (error) {
      console.error(
        `Error en getPagosRealizados para ID ${proveedorId}:`,
        error
      );
      return [];
    }
  },

  findById: async (id) => {
    const [rows] = await db.execute("SELECT * FROM proveedors WHERE id = ?", [
      id,
    ]);
    return rows[0];
  },

  create: async (datos) => {
    const {
      empresa,
      marca,
      direccion,
      telefono,
      email,
      contacto,
      celular,
      empresa_id,
    } = datos;
    const query = `
      INSERT INTO proveedors 
      (empresa, marca, direccion, telefono, email, contacto, celular, empresa_id, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await db.execute(query, [
      empresa,
      marca,
      direccion,
      telefono,
      email,
      contacto,
      celular,
      empresa_id || 1,
    ]);
    return result.insertId;
  },

  updateById: async (id, datos) => {
    const { empresa, marca, direccion, telefono, email, contacto, celular } =
      datos;
    const query = `
      UPDATE proveedors 
      SET empresa = ?, marca = ?, direccion = ?, telefono = ?, email = ?, contacto = ?, celular = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [
      empresa,
      marca,
      direccion,
      telefono,
      email,
      contacto,
      celular,
      id,
    ]);
    return result.affectedRows > 0;
  },

  getGestionPagos: async (proveedorId) => {
    try {
      // 1. Obtener compras con deuda pendiente
      const [comprasPendientes] = await db.execute(
        "SELECT * FROM compras WHERE proveedor_id = ? AND deuda > 0 ORDER BY fecha ASC",
        [proveedorId]
      );

      // 2. CORRECCIÓN: Obtener Historial de Pagos cruzando con Compras
      // Filtramos por c.proveedor_id para capturar pagos hechos en el registro de compra
      const [historial] = await db.execute(
        `SELECT p.*, c.comprobante, u.name as usuario_nombre 
         FROM pago_compras p 
         INNER JOIN compras c ON p.compra_id = c.id 
         LEFT JOIN users u ON p.usuario_id = u.id 
         WHERE c.proveedor_id = ? 
         ORDER BY p.fecha_pago DESC, p.id DESC`,
        [proveedorId]
      );

      // 3. Totales reales sumando de la tabla compras
      const [totales] = await db.execute(
        `SELECT 
          SUM(precio_total) as deuda_total_historica,
          SUM(deuda) as saldo_actual
         FROM compras WHERE proveedor_id = ?`,
        [proveedorId]
      );

      const deudaTotal = parseFloat(totales[0].deuda_total_historica) || 0;
      const saldoPendiente = parseFloat(totales[0].saldo_actual) || 0;

      return {
        comprasPendientes,
        historial,
        resumen: {
          deudaTotal: deudaTotal,
          saldoPendiente: saldoPendiente,
          pagosRealizados: deudaTotal - saldoPendiente,
        },
      };
    } catch (error) {
      console.error("Error en getGestionPagos:", error);
      throw error;
    }
  },

  registrarPagoDistribuido: async (datos) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const {
        proveedor_id,
        usuario_id,
        empresa_id,
        fecha,
        metodo_pago,
        distribucion,
      } = datos;

      console.log("Iniciando registro de pagos para proveedor:", proveedor_id);

      for (const item of distribucion) {
        const monto = parseFloat(item.monto);
        if (monto > 0) {
          // 1. Insertar en pago_compras
          await connection.execute(
            `INSERT INTO pago_compras (compra_id, proveedor_id, empresa_id, usuario_id, monto, metodo_pago, fecha_pago, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              item.compra_id,
              proveedor_id,
              empresa_id,
              usuario_id,
              monto,
              metodo_pago,
              fecha,
            ]
          );

          // 2. Actualizar deuda en la tabla compras
          await connection.execute(
            "UPDATE compras SET deuda = deuda - ? WHERE id = ?",
            [monto, item.compra_id]
          );

          // 3. Registrar en Arqueo si es Efectivo
          if (metodo_pago === "efectivo") {
            const [arqueo] = await connection.execute(
              "SELECT id FROM arqueos WHERE fecha_cierre IS NULL AND empresa_id = ? LIMIT 1",
              [empresa_id]
            );
            if (arqueo.length > 0) {
              await connection.execute(
                "INSERT INTO movimiento_cajas (tipo, monto, descripcion, arqueo_id, created_at, updated_at) VALUES ('Egreso', ?, ?, ?, NOW(), NOW())",
                [monto, `Pago a proveedor (Cta. Cte.)`, arqueo[0].id]
              );
            }
          }
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error(
        "ERROR CRÍTICO EN registrarPagoDistribuido:",
        error.message
      );
      throw error; // Lanza el error para que el controlador lo atrape y lo mande al frontend
    } finally {
      connection.release();
    }
  },

  getMovimientosCompletos: async (proveedorId) => {
    // 1. Obtener todas las compras del proveedor
    const [compras] = await db.execute(
      `SELECT c.*, u.name as usuario_nombre 
       FROM compras c 
       LEFT JOIN users u ON c.usuario_id = u.id 
       WHERE c.proveedor_id = ? 
       ORDER BY c.fecha DESC`,
      [proveedorId]
    );

    // 2. Para cada compra, obtener el desglose de pagos por método
    const comprasConPagos = await Promise.all(
      compras.map(async (c) => {
        const [pagos] = await db.execute(
          `SELECT metodo_pago, SUM(monto) as total 
         FROM pago_compras 
         WHERE compra_id = ? 
         GROUP BY metodo_pago`,
          [c.id]
        );

        // Mapeamos los totales por método
        const desglose = { efectivo: 0, tarjeta: 0, mercadopago: 0, banco: 0 };
        pagos.forEach((p) => {
          if (desglose.hasOwnProperty(p.metodo_pago)) {
            desglose[p.metodo_pago] = parseFloat(p.total);
          }
        });

        const totalPagado = Object.values(desglose).reduce((a, b) => a + b, 0);

        return {
          ...c,
          ...desglose,
          total_pagado: totalPagado,
          saldo_pendiente: parseFloat(c.precio_total) - totalPagado,
        };
      })
    );

    // 3. Obtener historial global de pagos (igual que en Gestión de Pagos)
    const [historialPagos] = await db.execute(
      `SELECT p.*, c.comprobante, u.name as usuario_nombre 
       FROM pago_compras p 
       JOIN compras c ON p.compra_id = c.id 
       LEFT JOIN users u ON p.usuario_id = u.id 
       WHERE p.proveedor_id = ? 
       ORDER BY p.fecha_pago DESC`,
      [proveedorId]
    );

    return {
      compras: comprasConPagos,
      pagos: historialPagos,
    };
  },
};

module.exports = Proveedor;
