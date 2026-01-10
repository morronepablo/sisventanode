// controllers/clienteController.js
const Cliente = require("../models/Cliente");
const pdf = require("html-pdf");
const db = require("../config/db");
const { registrarLog } = require("../utils/logger"); // 👈 Importamos el logger
const { calcularDiferencias } = require("../utils/differences");
const { sendWS } = require("../utils/whatsapp"); // 👈 Importamos WhatsApp

// --- FUNCIÓN AUXILIAR PARA EL TELÉFONO DE LA EMPRESA ---
const getEmpresaPhone = async (empresa_id) => {
  const [rows] = await db.execute(
    "SELECT telefono FROM empresas WHERE id = ?",
    [empresa_id]
  );
  if (rows.length > 0 && rows[0].telefono) {
    let phone = rows[0].telefono.replace(/\D/g, "");
    if (!phone.startsWith("54")) phone = "549" + phone;
    return phone;
  }
  return null;
};

const getListadoClientes = async (req, res) => {
  try {
    const empresaId = req.user.empresa_id || 1;
    const clientes = await Cliente.getAll(empresaId);
    res.json(clientes);
  } catch (error) {
    console.error("[CLIENTES ERROR] Listado:", error.message);
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

    await registrarLog(
      req,
      "CREAR",
      "CLIENTES",
      `Nuevo cliente: ${nombre_cliente}. CUIL: ${cuil_codigo}. Contacto: ${
        telefono || "N/A"
      }`
    );

    res.status(201).json({ message: "Cliente registrado con éxito", id });
  } catch (error) {
    res.status(500).json({ message: "Error al registrar" });
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
  console.log("--- INICIO REGISTRO PAGO CLIENTE (CAJA + WS) ---");
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { fecha, importe, metodo_pago } = req.body;
    const empresa_id = req.user.empresa_id;

    // 1. Buscar si hay caja abierta
    const [arqueo] = await connection.execute(
      "SELECT id FROM arqueos WHERE fecha_cierre IS NULL AND empresa_id = ? LIMIT 1",
      [empresa_id]
    );
    const arqueo_id = arqueo.length > 0 ? arqueo[0].id : null;

    // 2. Registrar en Cuenta Corriente
    const [resultCtaCte] = await connection.execute(
      `INSERT INTO compras_cta_cte (cliente_id, empresa_id, importe, tipo, fecha, metodo_pago, created_at, updated_at) 
       VALUES (?, ?, ?, 'pago', ?, ?, NOW(), NOW())`,
      [id, empresa_id, importe, fecha, metodo_pago]
    );
    const cta_cte_id = resultCtaCte.insertId;

    // 3. Sincronizar con tabla de Pagos y Caja
    if (arqueo_id) {
      const [resultPagosTable] = await connection.execute(
        `INSERT INTO pagos (cliente_id, compra_cta_cte_id, monto, metodo_pago, fecha_pago, descripcion, empresa_id, arqueo_id, created_at) 
         VALUES (?, ?, ?, ?, ?, 'Pago de Cuenta Corriente', ?, ?, NOW())`,
        [id, cta_cte_id, importe, metodo_pago, fecha, empresa_id, arqueo_id]
      );
      const pago_real_id = resultPagosTable.insertId;

      // Movimiento de caja solo si es Efectivo
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
            `Pago Cta. Cte. Cliente: ${cliente[0].nombre_cliente}`,
            arqueo_id,
            pago_real_id,
          ]
        );
      }
    }

    await connection.commit();

    // 4. NOTIFICACIÓN WHATSAPP (Opción C)
    const telefonoDestino = await getEmpresaPhone(empresa_id);
    if (telefonoDestino) {
      const [cli] = await connection.execute(
        "SELECT nombre_cliente FROM clientes WHERE id = ?",
        [id]
      );

      // Convertimos YYYY-MM-DD a DD/MM/YYYY
      const fechaFormateada = fecha.split("-").reverse().join("/");

      const msg =
        `💰 *COBRO REGISTRADO* 💰\n\n` +
        `*Cliente:* ${cli[0].nombre_cliente}\n` +
        `*Monto:* $${parseFloat(importe).toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}\n` +
        `*Método:* ${metodo_pago.toUpperCase()}\n` +
        `*Fecha:* ${fechaFormateada}\n\n` + // 👈 Usamos la fecha formateada
        `_Dinero ingresado al sistema correctamente._`;

      sendWS(telefonoDestino, msg);
    }

    // 5. LOG DE AUDITORÍA
    await registrarLog(
      req,
      "PAGO",
      "CLIENTES_CTA_CTE",
      `Se registró un pago de $${importe} para el cliente ID: ${id}`
    );

    res.json({ success: true, pago_id: cta_cte_id });
  } catch (error) {
    await connection.rollback();
    console.error("[CLIENTES ERROR] Registro de pago:", error.message);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

const updatePago = async (req, res) => {
  console.log("--- INICIO UPDATE PAGO CLIENTE (CAJA + AUDIT + WS) ---");
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { pagoId } = req.params;
    const { fecha, importe, metodo_pago } = req.body;
    const empresa_id = req.user.empresa_id;

    // A. Datos anteriores para auditoría
    const [old] = await connection.execute(
      "SELECT * FROM compras_cta_cte WHERE id = ?",
      [pagoId]
    );
    if (old.length === 0)
      return res.status(404).json({ message: "Pago no encontrado" });
    const detalleCambios = calcularDiferencias(old[0], req.body, [
      "id",
      "cliente_id",
      "empresa_id",
      "tipo",
      "created_at",
      "updated_at",
    ]);

    // B. Update Cuenta Corriente
    await connection.execute(
      "UPDATE compras_cta_cte SET fecha = ?, importe = ?, metodo_pago = ? WHERE id = ?",
      [fecha, importe, metodo_pago, pagoId]
    );

    // C. Sincronizar con tabla Pagos y Movimiento Cajas
    const [pagoTab] = await connection.execute(
      "SELECT id, arqueo_id, cliente_id FROM pagos WHERE compra_cta_cte_id = ?",
      [pagoId]
    );

    if (pagoTab.length > 0) {
      const pago_real_id = pagoTab[0].id;
      await connection.execute(
        "UPDATE pagos SET monto = ?, metodo_pago = ?, fecha_pago = ? WHERE id = ?",
        [importe, metodo_pago, fecha, pago_real_id]
      );

      const [existeEnCaja] = await connection.execute(
        "SELECT id FROM movimiento_cajas WHERE pago_id = ?",
        [pago_real_id]
      );

      if (existeEnCaja.length > 0) {
        if (metodo_pago !== "efectivo") {
          await connection.execute(
            "DELETE FROM movimiento_cajas WHERE id = ?",
            [existeEnCaja[0].id]
          );
        } else {
          await connection.execute(
            "UPDATE movimiento_cajas SET monto = ? WHERE pago_id = ?",
            [importe, pago_real_id]
          );
        }
      } else if (metodo_pago === "efectivo" && pagoTab[0].arqueo_id) {
        const [cliente] = await connection.execute(
          "SELECT nombre_cliente FROM clientes WHERE id = ?",
          [pagoTab[0].cliente_id]
        );
        await connection.execute(
          `INSERT INTO movimiento_cajas (tipo, monto, descripcion, arqueo_id, pago_id, created_at) VALUES ('Ingreso', ?, ?, ?, ?, NOW())`,
          [
            importe,
            `Pago Cta. Cte. Cliente: ${cliente[0].nombre_cliente}`,
            pagoTab[0].arqueo_id,
            pago_real_id,
          ]
        );
      }
    }

    await connection.commit();

    // D. NOTIFICACIÓN WHATSAPP DE EDICIÓN
    const telefonoDestino = await getEmpresaPhone(empresa_id);
    if (telefonoDestino) {
      const [cli] = await connection.execute(
        "SELECT nombre_cliente FROM clientes WHERE id = ?",
        [pagoTab[0].cliente_id]
      );

      // Convertimos YYYY-MM-DD a DD/MM/YYYY
      const fechaFormateada = fecha.split("-").reverse().join("/");

      const msg =
        `✏️ *PAGO MODIFICADO* ✏️\n\n` +
        `Se editó un cobro del cliente: *${cli[0].nombre_cliente}*\n\n` +
        `*Nuevos Datos:* \n` +
        `- Monto: $${parseFloat(importe).toLocaleString("es-AR", {
          minimumFractionDigits: 2,
        })}\n` +
        `- Método: ${metodo_pago.toUpperCase()}\n` +
        `- Fecha: ${fechaFormateada}\n\n` + // 👈 Agregada fecha al aviso de edición
        `_Auditado en el historial._`;

      sendWS(telefonoDestino, msg);
    }

    await registrarLog(
      req,
      "EDITAR",
      "CLIENTES_CTA_CTE",
      `Se actualizó el pago ID: ${pagoId}. Cambios: ${detalleCambios}`
    );

    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error("[CLIENTES ERROR] Update pago:", error.message);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

const generarReporte = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // 1. Obtener datos de la empresa
    const [empresaRows] = await db.execute(
      "SELECT * FROM empresas WHERE id = ?",
      [empresa_id]
    );
    const empresa = empresaRows[0];
    if (!empresa) return res.status(404).send("Empresa no encontrada");

    // 2. Obtener listado de clientes con saldos calculados
    const query = `
      SELECT 
        c.nombre_cliente, 
        c.cuil_codigo, 
        c.telefono,
        IFNULL(SUM(CASE WHEN ct.tipo = 'deuda' THEN ct.importe ELSE 0 END), 0) as total_deuda,
        IFNULL(SUM(CASE WHEN ct.tipo = 'pago' THEN ct.importe ELSE 0 END), 0) as total_pagos
      FROM clientes c
      LEFT JOIN compras_cta_cte ct ON c.id = ct.cliente_id
      WHERE c.empresa_id = ?
      GROUP BY c.id
      ORDER BY c.nombre_cliente ASC
    `;
    const [clientes] = await db.execute(query, [empresa_id]);

    // 3. Logo en Base64
    let logoBase64 = "";
    try {
      const logoPath = path.join(__dirname, "../src/assets/img", empresa.logo);
      if (fs.existsSync(logoPath)) {
        const bitmap = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${bitmap.toString("base64")}`;
      }
    } catch (e) {
      console.error("Error logo:", e);
    }

    // 4. Construir filas
    let filas = "";
    let sumaSaldos = 0;

    clientes.forEach((c, i) => {
      const saldo = parseFloat(c.total_deuda) - parseFloat(c.total_pagos);
      sumaSaldos += saldo;
      filas += `
        <tr>
          <td style="text-align:center">${i + 1}</td>
          <td>${c.nombre_cliente}</td>
          <td style="text-align:center">${c.cuil_codigo}</td>
          <td style="text-align:center">${c.telefono || "-"}</td>
          <td style="text-align:right">$ ${parseFloat(
            c.total_deuda
          ).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
          <td style="text-align:right">$ ${parseFloat(
            c.total_pagos
          ).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
          <td style="text-align:right; font-weight:bold; color: ${
            saldo > 0 ? "#d33" : "#28a745"
          }">
            $ ${saldo.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </td>
        </tr>`;
    });

    const htmlContent = `
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Helvetica; font-size: 10px; color: #333; }
          .header { border-bottom: 2px solid #007bff; padding: 10px; margin-bottom: 20px; }
          .table { width: 100%; border-collapse: collapse; }
          .table th { background-color: #343a40; color: #fff; padding: 6px; }
          .table td { padding: 6px; border: 1px solid #eee; }
          .total-box { text-align: right; margin-top: 20px; font-size: 12px; font-weight: bold; }
          #pageFooter { position: fixed; bottom: -15px; left: 0; right: 0; text-align: center; font-size: 8px; color: #999; border-top: 1px solid #eee; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <table style="width:100%">
            <tr>
              <td><h1>${
                empresa.nombre_empresa
              }</h1><p>Reporte de Saldos de Clientes</p></td>
              <td style="text-align:right">${
                logoBase64 ? `<img src="${logoBase64}" style="width:60px">` : ""
              }</td>
            </tr>
          </table>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>CUIL/DNI</th>
              <th>Teléfono</th>
              <th>Deuda Tot.</th>
              <th>Pagos Tot.</th>
              <th>Saldo Pend.</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
        <div class="total-box">SALDO TOTAL A COBRAR: $ ${sumaSaldos.toLocaleString(
          "es-AR",
          { minimumFractionDigits: 2 }
        )}</div>
        <div id="pageFooter">Generado el ${new Date().toLocaleString()} - Sistema de Ventas</div>
      </body>
      </html>`;

    pdf
      .create(htmlContent, { format: "A4", border: "10mm" })
      .toBuffer((err, buffer) => {
        if (err) return res.status(500).send("Error");
        res.setHeader("Content-Type", "application/pdf");
        res.send(buffer);
      });
  } catch (e) {
    console.error(e);
    res.status(500).send("Error interno");
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
      `SELECT v.*, (SELECT COUNT(*) FROM detalle_ventas WHERE venta_id = v.id) as cantidad_productos FROM ventas v WHERE v.cliente_id = ? AND v.empresa_id = ? ORDER BY v.fecha DESC`,
      [id, empresa_id]
    );

    for (let v of ventas) {
      const [detalles] = await db.execute(
        `SELECT dv.cantidad, p.nombre as producto_nombre, c.nombre as combo_nombre, u.nombre as unidad_nombre, dv.combo_id, dv.producto_id FROM detalle_ventas dv LEFT JOIN productos p ON dv.producto_id = p.id LEFT JOIN combos c ON dv.combo_id = c.id LEFT JOIN unidads u ON p.unidad_id = u.id WHERE dv.venta_id = ?`,
        [v.id]
      );
      for (let d of detalles) {
        if (d.combo_id) {
          const [componentes] = await db.execute(
            `SELECT p.nombre, cp.cantidad, u.nombre as unidad FROM combo_producto cp JOIN productos p ON cp.producto_id = p.id LEFT JOIN unidads u ON p.unidad_id = u.id WHERE cp.combo_id = ?`,
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

    const [ventas] = await db.execute(
      "SELECT 'Venta' as tipo, id, fecha, precio_total as monto, CONCAT('Venta Ticket: ', id) as detalle FROM ventas WHERE cliente_id = ? AND empresa_id = ?",
      [id, empresa_id]
    );
    const [ctaCte] = await db.execute(
      `SELECT tipo, id, fecha, importe as monto, CASE WHEN tipo = 'pago' THEN CONCAT('Pago - Método: ', IFNULL(metodo_pago, 'N/A')) WHEN tipo = 'deuda' THEN CONCAT('Deuda - Referencia ID: ', IFNULL(venta_id, id)) WHEN tipo = 'devolucion' THEN CONCAT('Devolución - ID: ', IFNULL(devolucion_id, id)) ELSE 'Movimiento' END as detalle FROM compras_cta_cte WHERE cliente_id = ? AND empresa_id = ?`,
      [id, empresa_id]
    );
    const transacciones = [...ventas, ...ctaCte].sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha)
    );
    res.json({ cliente: cliente[0], transacciones });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    const clienteAnterior = await Cliente.findById(id);
    if (!clienteAnterior)
      return res.status(404).json({ message: "Cliente no encontrado" });

    const detalleCambios = calcularDiferencias(clienteAnterior, req.body, [
      "id",
      "empresa_id",
      "updated_at",
      "created_at",
    ]);

    await db.execute(
      `UPDATE clientes SET nombre_cliente = ?, cuil_codigo = ?, telefono = ?, email = ?, updated_at = NOW() 
       WHERE id = ? AND empresa_id = ?`,
      [
        req.body.nombre_cliente,
        req.body.cuil_codigo,
        req.body.telefono,
        req.body.email,
        id,
        empresa_id,
      ]
    );

    await registrarLog(
      req,
      "EDITAR",
      "CLIENTES",
      `Editó cliente: ${clienteAnterior.nombre_cliente}. Cambios: ${detalleCambios}`
    );

    res.json({ message: "Cliente actualizado" });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar" });
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

const getInformeCobranzas = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const query = `
      SELECT 
        c.id, c.nombre_cliente, c.telefono,
        SUM(CASE WHEN ct.tipo = 'deuda' THEN ct.importe ELSE 0 END) as total_deuda,
        SUM(CASE WHEN ct.tipo = 'pago' THEN ct.importe ELSE 0 END) as total_pagos,
        (SUM(CASE WHEN ct.tipo = 'deuda' THEN ct.importe ELSE 0 END) - 
         SUM(CASE WHEN ct.tipo = 'pago' THEN ct.importe ELSE 0 END)) as saldo_pend,
        MIN(CASE WHEN ct.tipo = 'deuda' THEN ct.fecha ELSE NULL END) as fecha_deuda_antigua
      FROM clientes c
      INNER JOIN compras_cta_cte ct ON c.id = ct.cliente_id
      WHERE c.empresa_id = ?
      GROUP BY c.id
      HAVING saldo_pend > 0
      ORDER BY saldo_pend DESC
    `;
    const [rows] = await db.execute(query, [empresa_id]);

    const result = rows.map((r) => {
      const hoy = new Date();
      const fechaD = new Date(r.fecha_deuda_antigua);
      const dias = Math.floor((hoy - fechaD) / (1000 * 60 * 60 * 24));
      return { ...r, dias_mora: dias > 0 ? dias : 0 };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generarReporteCobranzasPDF = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const [empRows] = await db.execute("SELECT * FROM empresas WHERE id = ?", [
      empresa_id,
    ]);
    const empresa = empRows[0];

    // Reutilizamos la lógica del ranking
    const query = `
      SELECT c.nombre_cliente, c.telefono,
        (SUM(CASE WHEN ct.tipo = 'deuda' THEN ct.importe ELSE 0 END) - 
         SUM(CASE WHEN ct.tipo = 'pago' THEN ct.importe ELSE 0 END)) as saldo
      FROM clientes c
      INNER JOIN compras_cta_cte ct ON c.id = ct.cliente_id
      WHERE c.empresa_id = ? GROUP BY c.id HAVING saldo > 0 ORDER BY saldo DESC`;

    const [deudores] = await db.execute(query, [empresa_id]);

    let filas = "";
    let totalCartera = 0;
    deudores.forEach((d, i) => {
      totalCartera += parseFloat(d.saldo);
      filas += `<tr><td>${i + 1}</td><td>${d.nombre_cliente}</td><td>${
        d.telefono || "-"
      }</td><td style="text-align:right; color:red; font-weight:bold">$ ${parseFloat(
        d.saldo
      ).toLocaleString("es-AR")}</td></tr>`;
    });

    const html = `<html><head><style>body{font-family:Helvetica;size:12px}.header{border-bottom:2px solid #dc3545} table{width:100%; border-collapse:collapse; margin-top:20px} th{background:#343a40; color:#fff; padding:8px} td{padding:8px; border:1px solid #eee}</style></head>
    <body><div class="header"><h1>${
      empresa.nombre_empresa
    }</h1><h3>Ranking de Cuentas por Cobrar (Deudores)</h3></div>
    <table><thead><tr><th>#</th><th>Cliente</th><th>Teléfono</th><th>Saldo Pendiente</th></tr></thead><tbody>${filas}</tbody></table>
    <h2 style="text-align:right">TOTAL CARTERA DEUDORA: $ ${totalCartera.toLocaleString(
      "es-AR"
    )}</h2>
    </body></html>`;

    pdf
      .create(html, { format: "A4", border: "10mm" })
      .toBuffer((err, buffer) => {
        res.setHeader("Content-Type", "application/pdf");
        res.send(buffer);
      });
  } catch (e) {
    res.status(500).send(e.message);
  }
};

const reclamarDeuda = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    // 1. Obtener datos del cliente y su saldo actual
    const query = `
      SELECT 
        c.nombre_cliente, c.telefono,
        (SUM(CASE WHEN ct.tipo = 'deuda' THEN ct.importe ELSE 0 END) - 
         SUM(CASE WHEN ct.tipo = 'pago' THEN ct.importe ELSE 0 END)) as saldo
      FROM clientes c
      INNER JOIN compras_cta_cte ct ON c.id = ct.cliente_id
      WHERE c.id = ? AND c.empresa_id = ?
      GROUP BY c.id`;

    const [rows] = await db.execute(query, [id, empresa_id]);

    if (rows.length === 0)
      return res
        .status(404)
        .json({ message: "Cliente no encontrado o sin deuda" });

    const cliente = rows[0];
    const [empresa] = await db.execute(
      "SELECT nombre_empresa FROM empresas WHERE id = ?",
      [empresa_id]
    );

    // 2. Validar que tenga teléfono
    if (!cliente.telefono) {
      return res
        .status(400)
        .json({ message: "El cliente no tiene un teléfono registrado." });
    }

    // 3. Construir el mensaje
    const mensaje =
      `🔔 *RECORDATORIO DE PAGO* 🔔\n\n` +
      `Estimado/a *${cliente.nombre_cliente}*,\n` +
      `Le informamos que registra un saldo pendiente de *${new Intl.NumberFormat(
        "es-AR",
        { style: "currency", currency: "ARS" }
      ).format(cliente.saldo)}* en nuestra tienda.\n\n` +
      `Le agradeceríamos que se acerque a la brevedad para regularizar su situación.\n\n` +
      `Atentamente,\n` +
      `*${empresa[0].nombre_empresa}*`;

    // 4. Enviar mediante el bot (sendWS ya limpia el número internamente)
    await sendWS(cliente.telefono, mensaje);

    // 5. Registrar en Log
    await registrarLog(
      req,
      "WHATSAPP",
      "CLIENTES",
      `Se envió reclamo de deuda automático a ${cliente.nombre_cliente}. Monto: $${cliente.saldo}`
    );

    res.json({
      success: true,
      message: "Mensaje de reclamo enviado correctamente.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al enviar el mensaje" });
  }
};

const generarEstadoCuentaPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    // 1. Datos de Empresa y Cliente
    const [empRows] = await db.execute("SELECT * FROM empresas WHERE id = ?", [
      empresa_id,
    ]);
    const [cliRows] = await db.execute("SELECT * FROM clientes WHERE id = ?", [
      id,
    ]);
    const empresa = empRows[0];
    const cliente = cliRows[0];

    if (!cliente) return res.status(404).send("Cliente no encontrado");

    // 2. Obtener toda la historia (Ventas y Pagos)
    // Buscamos deudas y pagos en la tabla compras_cta_cte
    const [movimientos] = await db.execute(
      `SELECT fecha, tipo, importe, metodo_pago, created_at 
       FROM compras_cta_cte 
       WHERE cliente_id = ? AND empresa_id = ? 
       ORDER BY fecha ASC, created_at ASC`,
      [id, empresa_id]
    );

    // 3. Preparar Logo
    let logoBase64 = "";
    try {
      if (empresa.logo) {
        const logoPath = path.join(
          __dirname,
          "../src/assets/img",
          empresa.logo
        );
        if (fs.existsSync(logoPath)) {
          const bitmap = fs.readFileSync(logoPath);
          logoBase64 = `data:image/png;base64,${bitmap.toString("base64")}`;
        }
      }
    } catch (e) {}

    // 4. Construir filas y calcular Saldo Progresivo
    let filas = "";
    let saldoAcumulado = 0;

    movimientos.forEach((m) => {
      const esDeuda = m.tipo === "deuda";
      const monto = parseFloat(m.importe);

      if (esDeuda) saldoAcumulado += monto;
      else saldoAcumulado -= monto;

      filas += `
        <tr>
          <td style="text-align:center">${new Date(m.fecha).toLocaleDateString(
            "es-AR"
          )}</td>
          <td>${
            esDeuda
              ? "COMPRA (Venta Ticket)"
              : "PAGO (" + m.metodo_pago.toUpperCase() + ")"
          }</td>
          <td style="text-align:right">${
            esDeuda ? "$ " + monto.toLocaleString("es-AR") : "-"
          }</td>
          <td style="text-align:right">${
            !esDeuda ? "$ " + monto.toLocaleString("es-AR") : "-"
          }</td>
          <td style="text-align:right; font-weight:bold">$ ${saldoAcumulado.toLocaleString(
            "es-AR"
          )}</td>
        </tr>`;
    });

    const html = `
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Helvetica; font-size: 11px; color: #333; }
          .header { border-bottom: 2px solid #007bff; padding: 10px; margin-bottom: 20px; }
          .table { width: 100%; border-collapse: collapse; }
          .table th { background-color: #f4f4f4; padding: 8px; border: 1px solid #ddd; }
          .table td { padding: 8px; border: 1px solid #eee; }
          .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 9px; color: #999; }
          .resumen { text-align: right; margin-top: 20px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <table style="width:100%">
            <tr>
              <td><h1>ESTADO DE CUENTA</h1><p>${empresa.nombre_empresa}</p></td>
              <td style="text-align:right">${
                logoBase64 ? `<img src="${logoBase64}" style="width:60px">` : ""
              }</td>
            </tr>
          </table>
        </div>
        
        <div style="margin-bottom: 20px;">
          <strong>CLIENTE:</strong> ${cliente.nombre_cliente}<br>
          <strong>CUIL/DNI:</strong> ${cliente.cuil_codigo}<br>
          <strong>FECHA EMISIÓN:</strong> ${new Date().toLocaleDateString(
            "es-AR"
          )}
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th>Debe (Compras)</th>
              <th>Haber (Pagos)</th>
              <th>Saldo Acumulado</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>

        <div class="resumen">
          <strong>SALDO TOTAL PENDIENTE: $ ${saldoAcumulado.toLocaleString(
            "es-AR"
          )}</strong>
        </div>

        <div class="footer">Este documento es un resumen informativo de cuenta corriente.</div>
      </body>
      </html>`;

    pdf
      .create(html, { format: "A4", border: "10mm" })
      .toBuffer((err, buffer) => {
        res.setHeader("Content-Type", "application/pdf");
        res.send(buffer);
      });
  } catch (e) {
    res.status(500).send("Error al generar el estado de cuenta.");
  }
};

const countClientes = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS total FROM clientes WHERE empresa_id = ?",
      [empresa_id]
    );
    res.json({ total: rows[0].total });
  } catch (error) {
    res.status(500).json({ total: 0 });
  }
};

const getClientesSummary = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const [rows] = await db.execute(
      `SELECT (SELECT COUNT(*) FROM clientes WHERE empresa_id = ?) AS total, IFNULL((SELECT SUM(CASE WHEN tipo = 'deuda' THEN importe ELSE 0 END) - SUM(CASE WHEN tipo = 'pago' THEN importe ELSE 0 END) FROM compras_cta_cte WHERE empresa_id = ?), 0) AS totalDeuda`,
      [empresa_id, empresa_id]
    );
    res.json({
      total: rows[0].total || 0,
      totalDeuda: parseFloat(rows[0].totalDeuda) || 0,
    });
  } catch (error) {
    res.status(500).json({ total: 0, totalDeuda: 0 });
  }
};

const eliminarCliente = async (req, res) => {
  console.log("--- INICIO ELIMINAR CLIENTE ---");
  try {
    const cliente = await Cliente.findById(req.params.id);
    const nombre = cliente ? cliente.nombre_cliente : "ID " + req.params.id;
    await Cliente.delete(req.params.id);

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "ELIMINAR",
      "CLIENTES",
      `Se eliminó al cliente: ${nombre}`
    );

    res.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
  console.log("--- FIN ELIMINAR CLIENTE ---");
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
  generarReporte,
  getComprasCliente,
  getHistorialCliente,
  updateCliente,
  getReciboPagoTicket,
  getInformeCobranzas,
  generarReporteCobranzasPDF,
  reclamarDeuda,
  generarEstadoCuentaPDF,
  countClientes,
  getClientesSummary,
};
