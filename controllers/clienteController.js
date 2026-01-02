// controllers/clienteController.js
const Cliente = require("../models/Cliente");
const pdf = require("html-pdf");
const db = require("../config/db");

const getListadoClientes = async (req, res) => {
  try {
    // Asumiendo que obtienes empresa_id del token (req.user)
    const empresaId = req.user.empresa_id || 1;
    const clientes = await Cliente.getAll(empresaId);
    res.json(clientes);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener clientes", error: error.message });
  }
};

const createCliente = async (req, res) => {
  try {
    const { nombre_cliente, cuil_codigo, telefono, email } = req.body;
    const empresa_id = req.user.empresa_id;

    if (!nombre_cliente || !cuil_codigo) {
      return res
        .status(400)
        .json({ message: "Nombre y CUIL son obligatorios" });
    }

    const id = await Cliente.create({
      nombre_cliente,
      cuil_codigo,
      telefono,
      email,
      empresa_id,
    });

    res.status(201).json({ message: "Cliente registrado con éxito", id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al registrar el cliente" });
  }
};

const getClienteById = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el cliente" });
  }
};

const getClientesConDeuda = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const query = `
      SELECT 
        c.id, 
        c.nombre_cliente as nombre_completo,
        SUM(CASE WHEN ct.tipo = 'deuda' THEN ct.importe ELSE 0 END) - 
        SUM(CASE WHEN ct.tipo = 'pago' THEN ct.importe ELSE 0 END) as deuda,
        MIN(CASE WHEN ct.tipo = 'deuda' THEN ct.fecha ELSE NULL END) as fecha_antigua
      FROM clientes c
      INNER JOIN compras_cta_cte ct ON c.id = ct.cliente_id
      WHERE c.empresa_id = ?
      GROUP BY c.id
      HAVING deuda > 0
    `;

    const [rows] = await db.execute(query, [empresa_id]);

    // Calcular días de mora en el servidor
    const result = rows.map((row) => {
      const hoy = new Date();
      const fechaDeuda = new Date(row.fecha_antigua);
      const mora = Math.floor((hoy - fechaDeuda) / (1000 * 60 * 60 * 24));
      return {
        id: row.id,
        nombre_completo: row.nombre_completo,
        deuda: parseFloat(row.deuda),
        mora: mora > 0 ? mora : 0,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getGestionPagos = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = req.user.empresa_id;
    const cliente = await Cliente.findById(id);
    const data = await Cliente.getGestionPagos(id, empresaId);

    // Verificar si hay arqueo abierto
    const [arqueo] = await db.execute(
      "SELECT id FROM arqueos WHERE fecha_cierre IS NULL AND empresa_id = ? LIMIT 1",
      [empresaId]
    );

    res.json({
      ...data,
      cliente,
      cajaAbierta: arqueo.length > 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const registrarPago = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { fecha, importe, metodo_pago } = req.body;
    const empresa_id = req.user.empresa_id;

    const [arqueo] = await connection.execute(
      "SELECT id FROM arqueos WHERE fecha_cierre IS NULL AND empresa_id = ? LIMIT 1",
      [empresa_id]
    );
    const arqueo_id = arqueo.length > 0 ? arqueo[0].id : null;

    // 1. Registro en Cuenta Corriente
    const [resultCtaCte] = await connection.execute(
      `INSERT INTO compras_cta_cte (cliente_id, empresa_id, importe, tipo, fecha, metodo_pago, created_at, updated_at) 
             VALUES (?, ?, ?, 'pago', ?, ?, NOW(), NOW())`,
      [id, empresa_id, importe, fecha, metodo_pago]
    );
    const cta_cte_id = resultCtaCte.insertId;

    if (arqueo_id) {
      // 2. Registrar en la tabla 'pagos' y obtener SU ID (pago_real_id)
      const [resultPagosTable] = await connection.execute(
        `INSERT INTO pagos (cliente_id, compra_cta_cte_id, monto, metodo_pago, fecha_pago, descripcion, empresa_id, arqueo_id, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          id,
          cta_cte_id,
          importe,
          metodo_pago,
          fecha,
          "Pago de Cuenta Corriente",
          empresa_id,
          arqueo_id,
        ]
      );
      const pago_real_id = resultPagosTable.insertId; // Este es el ID de la tabla pagos

      // 3. SI ES EFECTIVO -> Registrar en movimiento_cajas usando pago_real_id
      if (metodo_pago === "efectivo") {
        const [cliente] = await connection.execute(
          "SELECT nombre_cliente FROM clientes WHERE id = ?",
          [id]
        );
        await connection.execute(
          `INSERT INTO movimiento_cajas (tipo, monto, descripcion, arqueo_id, pago_id, created_at) 
                     VALUES ('Ingreso', ?, ?, ?, ?, NOW())`,
          [
            importe,
            `Pago Cta. Cte. Cliente: ${cliente[0].nombre_cliente} (Pago ID: ${pago_real_id})`,
            arqueo_id,
            pago_real_id,
          ]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, pago_id: cta_cte_id });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

const updatePago = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { pagoId } = req.params; // ID de compras_cta_cte
    const { fecha, importe, metodo_pago } = req.body;

    // 1. Actualizar Cuenta Corriente
    await connection.execute(
      "UPDATE compras_cta_cte SET fecha = ?, importe = ?, metodo_pago = ? WHERE id = ?",
      [fecha, importe, metodo_pago, pagoId]
    );

    // 2. Obtener el ID de la tabla 'pagos'
    const [pagoTab] = await connection.execute(
      "SELECT id, arqueo_id, cliente_id FROM pagos WHERE compra_cta_cte_id = ?",
      [pagoId]
    );

    if (pagoTab.length > 0) {
      const pago_real_id = pagoTab[0].id;
      const arqueo_id = pagoTab[0].arqueo_id;

      // 3. Actualizar Tabla Pagos
      await connection.execute(
        "UPDATE pagos SET monto = ?, metodo_pago = ?, fecha_pago = ? WHERE id = ?",
        [importe, metodo_pago, fecha, pago_real_id]
      );

      // 4. ACTUALIZAR CAJA (Buscando por el pago_id de la tabla pagos)
      const [existeEnCaja] = await connection.execute(
        "SELECT id FROM movimiento_cajas WHERE pago_id = ?",
        [pago_real_id]
      );

      if (existeEnCaja.length > 0) {
        // SOLO MODIFICAR EL IMPORTE (Como pediste)
        await connection.execute(
          "UPDATE movimiento_cajas SET monto = ? WHERE pago_id = ?",
          [importe, pago_real_id]
        );
      } else {
        // Si el item fue borrado antes o no existe, lo recreamos para que no falte
        const [cliente] = await connection.execute(
          "SELECT nombre_cliente FROM clientes WHERE id = ?",
          [pagoTab[0].cliente_id]
        );
        await connection.execute(
          `INSERT INTO movimiento_cajas (tipo, monto, descripcion, arqueo_id, pago_id, created_at) 
                     VALUES ('Ingreso', ?, ?, ?, ?, NOW())`,
          [
            importe,
            `Pago Cta. Cte. Cliente: ${cliente[0].nombre_cliente} (Pago ID: ${pago_real_id})`,
            arqueo_id,
            pago_real_id,
          ]
        );
      }
    }

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

const getComprasCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    const [cliente] = await db.execute(
      "SELECT nombre_cliente FROM clientes WHERE id = ?",
      [id]
    );

    const [ventas] = await db.execute(
      `SELECT v.*, 
            (SELECT COUNT(*) FROM detalle_ventas WHERE venta_id = v.id) as cantidad_productos
            FROM ventas v 
            WHERE v.cliente_id = ? AND v.empresa_id = ? 
            ORDER BY v.fecha DESC`,
      [id, empresa_id]
    );

    for (let v of ventas) {
      const [detalles] = await db.execute(
        `SELECT dv.cantidad, p.nombre as producto_nombre, c.nombre as combo_nombre, 
                        u.nombre as unidad_nombre, dv.combo_id, dv.producto_id
                 FROM detalle_ventas dv
                 LEFT JOIN productos p ON dv.producto_id = p.id
                 LEFT JOIN combos c ON dv.combo_id = c.id
                 LEFT JOIN unidads u ON p.unidad_id = u.id
                 WHERE dv.venta_id = ?`,
        [v.id]
      );

      // 👇 NUEVA LÓGICA: Si es combo, buscar sus productos internos
      for (let d of detalles) {
        if (d.combo_id) {
          const [componentes] = await db.execute(
            `SELECT p.nombre, cp.cantidad, u.nombre as unidad
                         FROM combo_producto cp
                         JOIN productos p ON cp.producto_id = p.id
                         LEFT JOIN unidads u ON p.unidad_id = u.id
                         WHERE cp.combo_id = ?`,
            [d.combo_id]
          );
          d.componentes = componentes;
        }
      }
      v.detalles = detalles;
    }

    res.json({ cliente: cliente[0], ventas });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getHistorialCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    const [cliente] = await db.execute(
      "SELECT nombre_cliente FROM clientes WHERE id = ?",
      [id]
    );
    if (!cliente[0])
      return res.status(404).json({ message: "Cliente no encontrado" });

    // 1. Obtener Ventas
    const [ventas] = await db.execute(
      "SELECT 'Venta' as tipo, id, fecha, precio_total as monto, CONCAT('Venta Ticket: ', id) as detalle FROM ventas WHERE cliente_id = ? AND empresa_id = ?",
      [id, empresa_id]
    );

    // 2. Obtener Movimientos de Cuenta Corriente (Pagos, Deudas manuales, Devoluciones)
    const [ctaCte] = await db.execute(
      `SELECT 
                tipo, 
                id, 
                fecha, 
                importe as monto, 
                CASE 
                    WHEN tipo = 'pago' THEN CONCAT('Pago - Método: ', IFNULL(metodo_pago, 'N/A'))
                    WHEN tipo = 'deuda' THEN CONCAT('Deuda - Referencia ID: ', IFNULL(venta_id, id))
                    WHEN tipo = 'devolucion' THEN CONCAT('Devolución - ID: ', IFNULL(devolucion_id, id))
                    ELSE 'Movimiento'
                END as detalle
             FROM compras_cta_cte 
             WHERE cliente_id = ? AND empresa_id = ?`,
      [id, empresa_id]
    );

    // 3. Unificar y Ordenar por fecha descendente
    const transacciones = [...ventas, ...ctaCte].sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );

    res.json({
      cliente: cliente[0],
      transacciones,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_cliente, cuil_codigo, telefono, email } = req.body;
    const empresa_id = req.user.empresa_id;

    // Validación básica
    if (!nombre_cliente || !cuil_codigo) {
      return res
        .status(400)
        .json({ message: "Nombre y CUIL son obligatorios" });
    }

    const query = `
      UPDATE clientes 
      SET nombre_cliente = ?, cuil_codigo = ?, telefono = ?, email = ?, updated_at = NOW()
      WHERE id = ? AND empresa_id = ?
    `;

    const [result] = await db.execute(query, [
      nombre_cliente,
      cuil_codigo,
      telefono,
      email,
      id,
      empresa_id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    res.json({ message: "Cliente actualizado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar el cliente" });
  }
};

const getReciboPagoTicket = async (req, res) => {
  try {
    const { pagoId } = req.params;
    const empresa_id = req.user.empresa_id;

    // 1. Obtener datos del pago (movimiento)
    const [pagoRows] = await db.execute(
      "SELECT * FROM compras_cta_cte WHERE id = ?",
      [pagoId]
    );
    const pago = pagoRows[0];
    if (!pago) return res.status(404).send("Pago no encontrado");

    // 2. Obtener datos del cliente
    const [clienteRows] = await db.execute(
      "SELECT * FROM clientes WHERE id = ?",
      [pago.cliente_id]
    );
    const cliente = clienteRows[0];

    // 3. Obtener datos de la empresa
    const [empresaRows] = await db.execute(
      "SELECT * FROM empresas WHERE id = ?",
      [empresa_id]
    );
    const empresa = empresaRows[0];

    // 4. Calcular Saldo Actual (Deuda - Pagos)
    const [[totales]] = await db.execute(
      `SELECT 
                SUM(CASE WHEN tipo = 'deuda' THEN importe ELSE 0 END) - 
                SUM(CASE WHEN tipo = 'pago' THEN importe ELSE 0 END) as saldo_total
             FROM compras_cta_cte WHERE cliente_id = ?`,
      [pago.cliente_id]
    );
    const deudaPendiente = parseFloat(totales.saldo_total) || 0;

    // Formatear hora y fecha
    const fecha = new Date(pago.fecha).toLocaleDateString("es-AR");
    const hora = new Date(pago.created_at).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // 5. HTML del Ticket (Réplica exacta de tu diseño Laravel)
    const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Courier New', Courier, monospace; 
                    font-size: 10px; 
                    line-height: 1.2; 
                    width: 60mm; 
                    color: #000;
                    padding: 2px;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .header { border-bottom: 1px dashed #000; padding-bottom: 3px; margin-bottom: 3px; }
                .line { border-top: 1px dashed #000; margin: 4px 0; }
                .total { border-top: 1px dashed #000; padding-top: 3px; margin-top: 3px; font-weight: bold; }
                .footer { border-top: 1px dashed #000; padding-top: 3px; margin-top: 3px; font-size: 8px; }
            </style>
        </head>
        <body>
            <div class="header text-center">
                <div style="font-weight:bold; font-size:11px;">${
                  empresa.nombre_empresa
                }</div>
                <div>CUIT Nro.: ${empresa.cuit || ""}</div>
                <div>Ing. Brutos: 1276868-05</div>
                <div>Dirección: ${empresa.direccion || ""}</div>
                <div>CABA - CP ${empresa.codigo_postal || ""}</div>
                <div>IVA RESPONSABLE INSCRIPTO</div>
            </div>

            <div class="text-center">
                <div style="font-weight:bold;">RECIBO DE PAGO - CTA. CTE.</div>
                <div>P.V. Nro. ${String(empresa.id || 1).padStart(
                  5,
                  "0"
                )} - Nro. Recibo ${String(pagoId).padStart(8, "0")}</div>
                <div>Fecha ${fecha} - Hora ${hora}</div>
            </div>

            <div class="line"></div>

            <div style="text-align:left;">
                <div>Cliente: ${cliente.nombre_cliente}</div>
                ${
                  pago.venta_id
                    ? `<div>Venta Nro.: ${String(pago.venta_id).padStart(
                        8,
                        "0"
                      )}</div>`
                    : ""
                }
                <div>Monto Pagado: ${parseFloat(pago.importe).toLocaleString(
                  "es-AR",
                  { minimumFractionDigits: 2 }
                )}</div>
                <div>Forma de Pago: ${(
                  pago.metodo_pago || "N/A"
                ).toUpperCase()}</div>
                <div>Deuda Pendiente: ${deudaPendiente.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}</div>
            </div>

            <div class="total">
                <div class="text-right">TOTAL PAGADO: ${parseFloat(
                  pago.importe
                ).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
            </div>

            <div class="footer text-center">
                <div>${empresa.telefono || ""}</div>
                <div>GRATUITO C.A.B.A. ÁREA DE DEFENSA Y PROTECCIÓN AL CONSUMIDOR</div>
            </div>

            <div class="text-center" style="font-size: 8px; margin-top: 5px;">
                <div>SESHIA00000013450</div>
                <div>V: 1.01</div>
            </div>
        </body>
        </html>`;

    const options = {
      width: "60mm",
      height: "200mm",
      border: "0",
      type: "pdf",
    };

    pdf.create(html, options).toStream((err, stream) => {
      if (err) return res.status(500).send(err);
      res.setHeader("Content-Type", "application/pdf");
      stream.pipe(res);
    });
  } catch (error) {
    console.error("Error al generar ticket de pago:", error);
    res.status(500).send("Error al generar el ticket");
  }
};

const countClientes = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT COUNT(*) AS total FROM clientes");
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error al contar clientes:", error);
    res.status(500).json({ total: 0 });
  }
};

const getClientesSummary = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // Obtenemos el conteo total de clientes y la deuda neta global
    const [rows] = await db.execute(
      `
      SELECT 
        (SELECT COUNT(*) FROM clientes WHERE empresa_id = ?) AS total,
        IFNULL(
          (SELECT SUM(CASE WHEN tipo = 'deuda' THEN importe ELSE 0 END) - 
                  SUM(CASE WHEN tipo = 'pago' THEN importe ELSE 0 END)
           FROM compras_cta_cte 
           WHERE empresa_id = ?), 
        0) AS totalDeuda
    `,
      [empresa_id, empresa_id]
    );

    res.json({
      total: rows[0].total || 0,
      totalDeuda: parseFloat(rows[0].totalDeuda) || 0,
    });
  } catch (error) {
    console.error("Error en getClientesSummary:", error);
    res.status(500).json({ total: 0, totalDeuda: 0 });
  }
};

const eliminarCliente = async (req, res) => {
  try {
    await Cliente.delete(req.params.id);
    res.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar" });
  }
};

module.exports = {
  getListadoClientes,
  createCliente,
  eliminarCliente,
  getClienteById,
  getClientesConDeuda,
  getGestionPagos,
  registrarPago,
  updatePago,
  getComprasCliente,
  getHistorialCliente,
  updateCliente,
  getReciboPagoTicket,
  countClientes,
  getClientesSummary,
};
