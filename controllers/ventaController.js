// controllers/ventaController.js
const Venta = require("../models/Venta");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const { registrarLog } = require("../utils/logger");
const { sendWS } = require("../utils/whatsapp"); // 👈 1. Importar WhatsApp

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

const getListadoVentas = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const ventas = await Venta.getAll(empresa_id);
    const result = [];

    for (const v of ventas) {
      const detalles = await Venta.getDetallesByVentaId(v.id);
      result.push({ ...v, detalles });
    }
    res.json(result);
  } catch (error) {
    console.error("[VENTAS ERROR] Listado:", error.message);
    res.status(500).json({ message: "Error al obtener listado" });
  }
};

const getTmpVentas = async (req, res) => {
  try {
    const items = await Venta.getTmpItems(req.user.id);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const postTmpVenta = async (req, res) => {
  console.log("--- INICIO AGREGAR AL CARRITO VENTA ---");
  try {
    const { codigo, cantidad, usuario_id, producto_id, combo_id } = req.body;
    const userId = usuario_id || req.user.id;
    const empresa_id = req.user.empresa_id;

    let item = null;
    let tipo = null;

    if (producto_id) {
      const [rows] = await db.execute(
        "SELECT id, nombre, stock FROM productos WHERE id = ? AND empresa_id = ?",
        [producto_id, empresa_id]
      );
      if (rows.length > 0) {
        item = rows[0];
        tipo = "producto";
      }
    } else if (combo_id) {
      const [rows] = await db.execute(
        "SELECT id, nombre FROM combos WHERE id = ? AND empresa_id = ?",
        [combo_id, empresa_id]
      );
      if (rows.length > 0) {
        item = rows[0];
        tipo = "combo";
      }
    } else if (codigo) {
      const term = codigo.toString().trim();
      const [pRows] = await db.execute(
        "SELECT id, nombre, stock FROM productos WHERE (codigo = ? OR nombre LIKE ?) AND empresa_id = ? LIMIT 1",
        [term, `%${term}%`, empresa_id]
      );
      if (pRows.length > 0) {
        item = pRows[0];
        tipo = "producto";
      } else {
        const [cRows] = await db.execute(
          "SELECT id, nombre FROM combos WHERE (codigo = ? OR nombre LIKE ?) AND empresa_id = ? LIMIT 1",
          [term, `%${term}%`, empresa_id]
        );
        if (cRows.length > 0) {
          item = cRows[0];
          tipo = "combo";
        }
      }
    }

    if (!item) return res.json({ success: false, message: "No encontrado." });

    if (tipo === "producto" && item.stock < cantidad) {
      return res.json({
        success: false,
        message: `Stock insuficiente para ${item.nombre}.`,
      });
    }

    const columnaId = tipo === "producto" ? "producto_id" : "combo_id";
    await db.execute(
      `INSERT INTO tmp_ventas (cantidad, ${columnaId}, session_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`,
      [cantidad, item.id, userId]
    );

    console.log(
      `[VENTAS] Ítem agregado al temporal: ${item.nombre} (Cant: ${cantidad})`
    );
    res.json({ success: true });
  } catch (error) {
    console.error("[VENTAS ERROR] postTmpVenta:", error.message);
    res.status(500).json({ message: "Error interno" });
  }
  console.log("--- FIN AGREGAR AL CARRITO VENTA ---");
};

const deleteTmpVenta = async (req, res) => {
  try {
    await Venta.deleteTmpItem(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const storeVenta = async (req, res) => {
  console.log(
    "--- INICIO REGISTRO DE VENTA CON BOT DE FIDELIZACIÓN DINÁMICO ---"
  );
  try {
    const { precio_total, cliente_id, items } = req.body;
    const empresa_id = req.user.empresa_id;

    // 1. Guardar la venta (Maneja Multicaja, Stock y Puntos en la DB)
    const venta_id = await Venta.store(req.body, req.user.id, empresa_id);

    // EMITIR EVENTO EN TIEMPO REAL PARA EL DASHBOARD
    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");

    // 2. 🚀 LÓGICA DE WHATSAPP AUTOMÁTICO (Ticket + Fidelización) 🚀
    if (cliente_id && Number(cliente_id) !== 1) {
      const [clienteRows] = await db.execute(
        "SELECT nombre_cliente, telefono, puntos FROM clientes WHERE id = ?",
        [cliente_id]
      );

      if (clienteRows.length > 0 && clienteRows[0].telefono) {
        const cliente = clienteRows[0];
        const token = req.headers.authorization?.split(" ")[1];
        const baseUrl =
          process.env.NODE_ENV === "production"
            ? "https://sistema-ventas-backend-3nn3.onrender.com"
            : "http://localhost:3001";

        const linkTicket = `${baseUrl}/api/ventas/ticket/${venta_id}?token=${token}`;

        // --- MENSAJE A: ENVÍO DE TICKET ---
        const mensajeTicket =
          `¡Hola *${cliente.nombre_cliente}*! 👋\n\n` +
          `Gracias por tu compra. Aquí tenés el link para descargar tu ticket:\n\n` +
          `📄 *Ticket:* T-${venta_id.toString().padStart(8, "0")}\n` +
          `💰 *Total:* $${parseFloat(precio_total).toLocaleString(
            "es-AR"
          )}\n\n` +
          `🔗 *Link:* ${linkTicket}\n\n` +
          `¡Esperamos verte pronto!`;

        await sendWS(cliente.telefono, mensajeTicket).catch((e) =>
          console.error("Error WS Ticket:", e)
        );

        // --- MENSAJE B: 🤖 BOT DE FIDELIZACIÓN (Umbral desde .env) ---
        // Leemos del .env y convertimos a número. Si no existe, usamos 1000 por defecto.
        const UMBRAL_REGALO = Number(process.env.PUNTOS_UMBRAL_REGALO || 1000);

        if (cliente.puntos >= UMBRAL_REGALO) {
          const mensajeRegalo =
            `🎊 *¡FELICITACIONES ${cliente.nombre_cliente.toUpperCase()}!* 🎊\n\n` +
            `¡Ya acumulaste *${cliente.puntos} puntos* en nuestro sistema!\n\n` +
            `🎁 Tenés un beneficio de *$${cliente.puntos}* esperándote para tu próxima compra.\n\n` +
            `¡Gracias por elegirnos! 🥂`;

          setTimeout(() => {
            sendWS(cliente.telefono, mensajeRegalo).catch((e) =>
              console.error("Error WS Fidelización:", e)
            );
          }, 3500);
        }
      }
    }

    // 3. Lógica de WhatsApp al DUEÑO (Aviso de Stock Bajo)
    const telefonoEmpresa = await getEmpresaPhone(empresa_id);
    if (telefonoEmpresa && items) {
      for (const item of items) {
        if (item.producto_id) {
          const [prod] = await db.execute(
            "SELECT nombre, stock, stock_minimo FROM productos WHERE id = ?",
            [item.producto_id]
          );
          if (
            prod.length > 0 &&
            parseFloat(prod[0].stock) <= parseFloat(prod[0].stock_minimo)
          ) {
            const mensajeStock = `🚨 *ALERTA DE REPOSICIÓN* 🚨\n\nProducto: *${
              prod[0].nombre
            }*\nStock actual: ${prod[0].stock}\n\n_Caja: ${MY_CAJA()}_`;
            sendWS(telefonoEmpresa, mensajeStock).catch((e) =>
              console.error("Error WS Stock:", e)
            );
          }
        }
      }
    }

    // 4. REGISTRO DE LOG
    await registrarLog(
      req,
      "CREAR",
      "VENTAS",
      `Venta notificada. Ticket N°: ${venta_id}. Cliente ID: ${cliente_id}`
    );

    res.json({ success: true, venta_id });
  } catch (error) {
    console.error("[VENTAS ERROR] Fallo:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const generarReporte = async (req, res) => {
  try {
    const empresa_id = req.user?.empresa_id || 1;

    const [empresaRows] = await db.execute(
      "SELECT * FROM empresas WHERE id = ?",
      [empresa_id]
    );
    const empresa = empresaRows[0];

    if (!empresa)
      return res.status(404).send("Configuración de empresa no encontrada");

    const ventas = await Venta.getAll(empresa_id);

    const [devoluciones] = await db.execute(
      `SELECT d.*, cl.nombre_cliente 
       FROM devoluciones d 
       LEFT JOIN clientes cl ON d.cliente_id = cl.id 
       WHERE d.empresa_id = ?`,
      [empresa_id]
    );

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

    let tablaVentas = "";
    let totalVentas = 0;
    ventas.forEach((v, index) => {
      totalVentas += parseFloat(v.precio_total);
      tablaVentas += `
        <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td style="text-align: center;">${new Date(
              v.fecha
            ).toLocaleDateString("es-AR")}</td>
            <td style="text-align: center;">Venta T-${String(v.id).padStart(
              8,
              "0"
            )}</td>
            <td>${v.cliente_nombre || "Consumidor Final"}</td>
            <td style="text-align: right;">$ ${parseFloat(
              v.precio_total
            ).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
        </tr>`;
    });

    let tablaDevoluciones = "";
    let totalDevoluciones = 0;
    devoluciones.forEach((d, index) => {
      totalDevoluciones += parseFloat(d.precio_total);
      tablaDevoluciones += `
        <tr style="color: #d33;">
            <td style="text-align: center;">${index + 1}</td>
            <td style="text-align: center;">${new Date(
              d.fecha
            ).toLocaleDateString("es-AR")}</td>
            <td style="text-align: center;">Devol. D-${String(d.id).padStart(
              8,
              "0"
            )}</td>
            <td>${d.nombre_cliente || "Consumidor Final"}</td>
            <td style="text-align: right;">- $ ${parseFloat(
              d.precio_total
            ).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
        </tr>`;
    });

    const totalNeto = totalVentas - totalDevoluciones;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Helvetica', sans-serif; color: #333; font-size: 11px; margin: 0; padding: 0; }
                .header { border-bottom: 2px solid #28a745; padding: 10px; margin-bottom: 20px; }
                .table { width: 100%; border-collapse: collapse; }
                .table th { background-color: #343a40; color: #fff; padding: 8px; border: 1px solid #dee2e6; }
                .table td { padding: 8px; border: 1px solid #dee2e6; }
                .summary-box { margin-top: 20px; width: 280px; margin-left: auto; border: 1px solid #ccc; padding: 10px; background-color: #f9f9f9; }
                .summary-line { display: block; width: 100%; margin-bottom: 5px; font-size: 12px; }
                .neto { border-top: 2px solid #333; padding-top: 5px; font-weight: bold; color: #007bff; font-size: 14px; margin-top: 5px; }
                
                /* PIE DE PÁGINA CORREGIDO */
                #pageFooter {
                    position: fixed;
                    bottom: -15px; /* Empujamos el pie de página bien abajo */
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: 9px;
                    color: #999;
                    border-top: 1px solid #eee;
                    padding-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <table style="width:100%">
                    <tr>
                        <td style="width:70%">
                            <h1 style="margin:0">${empresa.nombre_empresa}</h1>
                            <p style="margin:5px 0">CUIT: ${empresa.cuit} | ${
      empresa.correo
    }</p>
                        </td>
                        <td style="text-align:right">
                            ${
                              logoBase64
                                ? `<img src="${logoBase64}" style="width:70px">`
                                : ""
                            }
                        </td>
                    </tr>
                </table>
            </div>

            <h2 style="font-size: 14px;">Listado de Movimientos (Ventas y Devoluciones)</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Fecha</th>
                        <th>Comprobante</th>
                        <th>Cliente</th>
                        <th>Importe</th>
                    </tr>
                </thead>
                <tbody>
                    ${tablaVentas}
                    ${tablaDevoluciones}
                </tbody>
            </table>

            <div class="summary-box">
                <div class="summary-line">Total Ventas (Bruto): <span style="float:right">$ ${totalVentas.toLocaleString(
                  "es-AR",
                  { minimumFractionDigits: 2 }
                )}</span></div>
                <div style="clear:both"></div>
                <div class="summary-line" style="color:red">Total Devoluciones: <span style="float:right">- $ ${totalDevoluciones.toLocaleString(
                  "es-AR",
                  { minimumFractionDigits: 2 }
                )}</span></div>
                <div style="clear:both"></div>
                <div class="summary-line neto">TOTAL NETO: <span style="float:right">$ ${totalNeto.toLocaleString(
                  "es-AR",
                  { minimumFractionDigits: 2 }
                )}</span></div>
                <div style="clear:both"></div>
            </div>

            <div id="pageFooter">
                Reporte generado el ${new Date().toLocaleString(
                  "es-AR"
                )} - Sistema de Ventas
            </div>
        </body>
        </html>
    `;

    // CONFIGURACIÓN DE MÁRGENES CORREGIDA
    const options = {
      format: "A4",
      border: {
        top: "5mm",
        right: "10mm",
        bottom: "5mm", // Aumentamos el margen inferior del contenido para que el footer no choque
        left: "10mm",
      },
    };

    pdf.create(htmlContent, options).toBuffer((err, buffer) => {
      if (err) return res.status(500).send("Error");
      res.setHeader("Content-Type", "application/pdf");
      res.send(buffer);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error interno");
  }
};

const getInformeProductos = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.user.empresa_id;
    const MY_CAJA = Number(process.env.CAJA_ID || 1); // 👈 Filtro por terminal

    const query = `
      SELECT 
          codigo, nombre, unidad,
          SUM(cantidad_neta) as cantidad,
          AVG(costo_unitario) as costo,
          SUM(total_neto) / SUM(cantidad_neta) as venta,
          SUM(total_neto - (cantidad_neta * costo_unitario)) as ganancia,
          SUM(total_neto) as total
      FROM (
          -- 1. PRODUCTOS VENDIDOS INDIVIDUALMENTE (Neto de Promos y Caja)
          SELECT 
              p.codigo, p.nombre, IFNULL(u.nombre, 'Unidad') as unidad,
              dv.cantidad as cantidad_neta,
              dv.precio_compra as costo_unitario,
              (dv.cantidad * dv.precio_venta) * 
              (CASE WHEN (SELECT SUM(dv2.cantidad * dv2.precio_venta) FROM detalle_ventas dv2 WHERE dv2.venta_id = v.id) = 0 THEN 1 
               ELSE (v.precio_total / (SELECT SUM(dv2.cantidad * dv2.precio_venta) FROM detalle_ventas dv2 WHERE dv2.venta_id = v.id)) END) as total_neto
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN productos p ON dv.producto_id = p.id
          LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? AND v.caja_id = ? AND DATE(v.fecha) BETWEEN ? AND ? AND dv.producto_id IS NOT NULL

          UNION ALL

          -- 2. PRODUCTOS VENDIDOS DENTRO DE COMBOS (Neto de Promos y Caja)
          SELECT 
              p.codigo, p.nombre, IFNULL(u.nombre, 'Unidad') as unidad,
              (dv.cantidad * cp.cantidad) as cantidad_neta,
              p.precio_compra as costo_unitario,
              ((dv.cantidad * cp.cantidad) * p.precio_venta) * 
              (CASE WHEN (SELECT SUM(dv3.cantidad * dv3.precio_venta) FROM detalle_ventas dv3 WHERE dv3.venta_id = v.id) = 0 THEN 1 
               ELSE (v.precio_total / (SELECT SUM(dv3.cantidad * dv3.precio_venta) FROM detalle_ventas dv3 WHERE dv3.venta_id = v.id)) END) as total_neto
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN combo_producto cp ON dv.combo_id = cp.combo_id
          JOIN productos p ON cp.producto_id = p.id
          LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? AND v.caja_id = ? AND DATE(v.fecha) BETWEEN ? AND ?

          UNION ALL

          -- 3. DEVOLUCIONES (Restan a la caja actual)
          SELECT 
              p.codigo, p.nombre, IFNULL(u.nombre, 'Unidad') as unidad,
              (dd.cantidad * -1) as cantidad_neta,
              p.precio_compra as costo_unitario,
              (dev.precio_total * ( (dd.cantidad * p.precio_venta) / (SELECT SUM(dd2.cantidad * p2.precio_venta) FROM detalle_devoluciones dd2 JOIN productos p2 ON dd2.producto_id = p2.id WHERE dd2.devolucion_id = dev.id) ) ) * -1 as total_neto
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id
          JOIN productos p ON dd.producto_id = p.id
          LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE dev.empresa_id = ? AND dev.caja_id = ? AND DATE(dev.fecha) BETWEEN ? AND ?
      ) as t
      GROUP BY codigo, nombre, unidad
      HAVING total <> 0
      ORDER BY total DESC
    `;

    const [rows] = await db.execute(query, [
      empresa_id,
      MY_CAJA,
      fecha_inicio,
      fecha_fin, // Bloque 1
      empresa_id,
      MY_CAJA,
      fecha_inicio,
      fecha_fin, // Bloque 2
      empresa_id,
      MY_CAJA,
      fecha_inicio,
      fecha_fin, // Bloque 3
    ]);

    res.json(rows);
  } catch (error) {
    console.error("ERROR INFORME PRODUCTOS:", error);
    res.status(500).json({ message: "Error en informe" });
  }
};

const generarInformeProductosPDF = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.query.empresa_id || 1;
    const MY_CAJA = Number(process.env.CAJA_ID || 1); // 👈 Filtro por terminal
    const fInicio = fecha_inicio.split("-").reverse().join("/");
    const fFin = fecha_fin.split("-").reverse().join("/");

    const query = `
      SELECT 
          codigo, nombre, unidad, SUM(cantidad_neta) as cantidad,
          AVG(costo_unitario) as costo, 
          SUM(total_neto) / SUM(cantidad_neta) as venta,
          SUM(total_neto - (cantidad_neta * costo_unitario)) as ganancia, 
          SUM(total_neto) as total
      FROM (
          SELECT p.codigo, p.nombre, IFNULL(u.nombre, 'Unid') as unidad, dv.cantidad as cantidad_neta, dv.precio_compra as costo_unitario,
          (dv.cantidad * dv.precio_venta) * (CASE WHEN (SELECT SUM(dv2.cantidad * dv2.precio_venta) FROM detalle_ventas dv2 WHERE dv2.venta_id = v.id) = 0 THEN 1 ELSE (v.precio_total / (SELECT SUM(dv2.cantidad * dv2.precio_venta) FROM detalle_ventas dv2 WHERE dv2.venta_id = v.id)) END) as total_neto
          FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id JOIN productos p ON dv.producto_id = p.id LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? AND v.caja_id = ? AND DATE(v.fecha) BETWEEN ? AND ? AND dv.producto_id IS NOT NULL
          UNION ALL
          SELECT p.codigo, p.nombre, IFNULL(u.nombre, 'Unid') as unidad, (dv.cantidad * cp.cantidad) as cantidad_neta, p.precio_compra as costo_unitario,
          ((dv.cantidad * cp.cantidad) * p.precio_venta) * (CASE WHEN (SELECT SUM(dv2.cantidad * dv2.precio_venta) FROM detalle_ventas dv2 WHERE dv2.venta_id = v.id) = 0 THEN 1 ELSE (v.precio_total / (SELECT SUM(dv2.cantidad * dv2.precio_venta) FROM detalle_ventas dv2 WHERE dv2.venta_id = v.id)) END) as total_neto
          FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id JOIN combo_producto cp ON dv.combo_id = cp.combo_id JOIN productos p ON cp.producto_id = p.id LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? AND v.caja_id = ? AND DATE(v.fecha) BETWEEN ? AND ?
          UNION ALL
          SELECT p.codigo, p.nombre, IFNULL(u.nombre, 'Unid') as unidad, (dd.cantidad * -1) as cantidad_neta, p.precio_compra as costo_unitario,
          (dev.precio_total * ((dd.cantidad * p.precio_venta) / (SELECT SUM(dd2.cantidad * p2.precio_venta) FROM detalle_devoluciones dd2 JOIN productos p2 ON dd2.producto_id = p2.id WHERE dd2.devolucion_id = dev.id))) * -1 as total_neto
          FROM detalle_devoluciones dd JOIN devoluciones dev ON dd.devolucion_id = dev.id JOIN productos p ON dd.producto_id = p.id LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE dev.empresa_id = ? AND dev.caja_id = ? AND DATE(dev.fecha) BETWEEN ? AND ?
      ) as t GROUP BY codigo, nombre, unidad ORDER BY total DESC`;

    const [productos] = await db.execute(query, [
      empresa_id,
      MY_CAJA,
      fecha_inicio,
      fecha_fin,
      empresa_id,
      MY_CAJA,
      fecha_inicio,
      fecha_fin,
      empresa_id,
      MY_CAJA,
      fecha_inicio,
      fecha_fin,
    ]);

    const fmt = (val) =>
      parseFloat(val).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    let filas = "";
    let tCant = 0;
    let tGan = 0;
    let tTot = 0;

    productos.forEach((p) => {
      tCant += parseFloat(p.cantidad);
      tGan += parseFloat(p.ganancia);
      tTot += parseFloat(p.total);
      filas += `<tr>
            <td style="text-align:center">${p.codigo}</td>
            <td>${p.nombre}</td>
            <td style="text-align:center">${parseFloat(p.cantidad)} ${
        p.unidad || "Unid"
      }</td>
            <td style="text-align:right">$ ${fmt(p.costo)}</td>
            <td style="text-align:right">$ ${fmt(p.venta)}</td>
            <td style="text-align:right">$ ${fmt(p.ganancia)}</td>
            <td style="text-align:right">$ ${fmt(p.total)}</td>
        </tr>`;
    });

    const html = `<html><head><meta charset="UTF-8"><style>body{font-family:sans-serif;font-size:10px;color:#333;}table{width:100%;border-collapse:collapse;}th{background:#1a73e8;color:white;padding:5px;}td{padding:5px;border:1px solid #ddd;}.total{font-weight:bold;background:#eee;}</style></head>
      <body><h1 style="text-align:center;color:#1a73e8">Informe de Ventas por Producto (Neto) - CAJA ${MY_CAJA}</h1><p style="text-align:center">Período: ${fInicio} - ${fFin}</p>
      <table><thead><tr><th>CÓDIGO</th><th>PRODUCTO</th><th>CANT.</th><th>COSTO</th><th>VENTA (NETA)</th><th>GANANCIA</th><th>TOTAL</th></tr></thead><tbody>${filas}
      <tr class="total"><td colspan="2">TOTALES</td><td style="text-align:center">${tCant}</td><td></td><td></td><td style="text-align:right">$ ${fmt(
      tGan
    )}</td><td style="text-align:right">$ ${fmt(tTot)}</td></tr>
      </tbody></table></body></html>`;

    const pdf = require("html-pdf");
    pdf
      .create(html, { format: "A4", orientation: "landscape", border: "10mm" })
      .toBuffer((err, buffer) => {
        if (err) return res.status(500).send("Error");
        res.setHeader("Content-Type", "application/pdf");
        res.send(buffer);
      });
  } catch (error) {
    res.status(500).send("Error");
  }
};

const getInformeClientes = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.user ? req.user.empresa_id : 1;
    const MY_CAJA = Number(process.env.CAJA_ID || 1); // 👈 Filtro por terminal

    const query = `
      SELECT 
          nombre,
          SUM(costo_total) as costo,
          SUM(total_neto) as total,
          (SUM(total_neto) - SUM(costo_total)) as ganancia
      FROM (
          -- A. VENTAS REALES DE ESTA CAJA (Sincronizado con Dashboard)
          SELECT 
              IFNULL(cl.nombre_cliente, 'Consumidor Final') as nombre,
              v.precio_total as total_neto,
              (SELECT IFNULL(SUM(dv.cantidad * dv.precio_compra), 0) FROM detalle_ventas dv WHERE dv.venta_id = v.id) as costo_total
          FROM ventas v
          LEFT JOIN clientes cl ON v.cliente_id = cl.id
          WHERE v.empresa_id = ? AND v.caja_id = ? AND DATE(v.fecha) BETWEEN ? AND ?

          UNION ALL

          -- B. DEVOLUCIONES DE ESTA CAJA (Restan al total)
          SELECT 
              IFNULL(cl.nombre_cliente, 'Consumidor Final') as nombre,
              dev.precio_total * -1 as total_neto,
              (SELECT IFNULL(SUM(dd.cantidad * p.precio_compra), 0) 
               FROM detalle_devoluciones dd 
               JOIN productos p ON dd.producto_id = p.id 
               WHERE dd.devolucion_id = dev.id) * -1 as costo_total
          FROM devoluciones dev
          LEFT JOIN clientes cl ON dev.cliente_id = cl.id
          WHERE dev.empresa_id = ? AND dev.caja_id = ? AND DATE(dev.fecha) BETWEEN ? AND ?
      ) as t
      GROUP BY nombre
      ORDER BY total DESC
    `;

    const [rows] = await db.execute(query, [
      empresa_id,
      MY_CAJA,
      fecha_inicio,
      fecha_fin, // Parámetros Ventas
      empresa_id,
      MY_CAJA,
      fecha_inicio,
      fecha_fin, // Parámetros Devoluciones
    ]);

    res.json(rows);
  } catch (error) {
    console.error("ERROR INFORME CLIENTES:", error);
    res.status(500).json({ message: "Error al procesar el informe" });
  }
};

const generarInformeClientesPDF = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.query.empresa_id || 1;
    const MY_CAJA = Number(process.env.CAJA_ID || 1); // 👈 Filtro por terminal
    const fInicio = fecha_inicio.split("-").reverse().join("/");
    const fFin = fecha_fin.split("-").reverse().join("/");

    const query = `
      SELECT nombre, SUM(costo_total) as costo, SUM(total_neto) as total, (SUM(total_neto) - SUM(costo_total)) as ganancia
      FROM (
          SELECT IFNULL(cl.nombre_cliente, 'Consumidor Final') as nombre, v.precio_total as total_neto, (SELECT IFNULL(SUM(dv.cantidad * dv.precio_compra), 0) FROM detalle_ventas dv WHERE dv.venta_id = v.id) as costo_total
          FROM ventas v LEFT JOIN clientes cl ON v.cliente_id = cl.id WHERE v.empresa_id = ? AND v.caja_id = ? AND DATE(v.fecha) BETWEEN ? AND ?
          UNION ALL
          SELECT IFNULL(cl.nombre_cliente, 'Consumidor Final') as nombre, dev.precio_total * -1 as total_neto, (SELECT IFNULL(SUM(dd.cantidad * p.precio_compra), 0) FROM detalle_devoluciones dd JOIN productos p ON dd.producto_id = p.id WHERE dd.devolucion_id = dev.id) * -1 as costo_total
          FROM devoluciones dev LEFT JOIN clientes cl ON dev.cliente_id = cl.id WHERE dev.empresa_id = ? AND dev.caja_id = ? AND DATE(dev.fecha) BETWEEN ? AND ?
      ) as t GROUP BY nombre ORDER BY total DESC`;

    const [clientes] = await db.execute(query, [
      empresa_id,
      MY_CAJA,
      fecha_inicio,
      fecha_fin,
      empresa_id,
      MY_CAJA,
      fecha_inicio,
      fecha_fin,
    ]);

    const fmt = (val) =>
      parseFloat(val).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    let filas = "";
    let totalCosto = 0;
    let totalGanancia = 0;
    let totalGral = 0;

    clientes.forEach((c) => {
      const costo = parseFloat(c.costo);
      const ganancia = parseFloat(c.ganancia);
      const total = parseFloat(c.total);
      totalCosto += costo;
      totalGanancia += ganancia;
      totalGral += total;

      filas += `
        <tr>
            <td style="text-align: left;">${c.nombre}</td>
            <td style="text-align: right;">$ ${fmt(costo)}</td>
            <td style="text-align: right;">$ ${fmt(ganancia)}</td>
            <td style="text-align: right;">$ ${fmt(total)}</td>
        </tr>`;
    });

    const html = `
      <html>
      <head>
          <meta charset="UTF-8">
          <style>
              body { font-family: sans-serif; font-size: 12px; padding: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; }
              .header h1 { color: #1a73e8; margin-bottom: 5px; }
              .table { width: 100%; border-collapse: collapse; }
              .table th { background-color: #1a73e8; color: white; padding: 10px; text-align: center; }
              .table td { padding: 10px; border-bottom: 1px solid #ddd; }
              .total-row { font-weight: bold; background-color: #e8f0fe; color: #1a73e8; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Informe de Ventas por Cliente - CAJA ${MY_CAJA}</h1>
              <p>Período: ${fInicio} - ${fFin}</p>
          </div>
          <table class="table">
              <thead>
                  <tr>
                      <th style="text-align: left;">CLIENTE</th>
                      <th style="text-align: right;">COSTO</th>
                      <th style="text-align: right;">GANANCIA</th>
                      <th style="text-align: right;">TOTAL</th>
                  </tr>
              </thead>
              <tbody>
                  ${filas}
                  <tr class="total-row">
                      <td>TOTAL GENERAL</td>
                      <td style="text-align: right;">$ ${fmt(totalCosto)}</td>
                      <td style="text-align: right;">$ ${fmt(
                        totalGanancia
                      )}</td>
                      <td style="text-align: right;">$ ${fmt(totalGral)}</td>
                  </tr>
              </tbody>
          </table>
      </body>
      </html>`;

    pdf
      .create(html, { format: "A4", orientation: "portrait", border: "10mm" })
      .toBuffer((err, buffer) => {
        if (err) return res.status(500).send("Error");
        res.setHeader("Content-Type", "application/pdf");
        res.send(buffer);
      });
  } catch (error) {
    console.error("ERROR PDF CLIENTES:", error);
    res.status(500).send("Error interno");
  }
};

const getInformeMetodosPago = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.user ? req.user.empresa_id : 1;
    const MY_CAJA = Number(process.env.CAJA_ID || 1); // 👈 Filtro por terminal

    const query = `
            SELECT 
                fecha,
                SUM(efectivo) as efectivo,
                SUM(tarjeta) as tarjeta,
                SUM(mercadopago) as mercadopago,
                SUM(transferencia) as transferencia,
                SUM(total) as total
            FROM (
                -- 1. VENTAS POR DÍA EN ESTA CAJA
                SELECT 
                    DATE(fecha) as fecha,
                    IFNULL(efectivo, 0) as efectivo,
                    IFNULL(tarjeta, 0) as tarjeta,
                    IFNULL(mercadopago, 0) as mercadopago,
                    IFNULL(transferencia, 0) as transferencia,
                    IFNULL(precio_total, 0) as total
                FROM ventas
                WHERE empresa_id = ? AND caja_id = ? AND DATE(fecha) BETWEEN ? AND ?

                UNION ALL

                -- 2. DEVOLUCIONES EN ESTA CAJA (Siempre restan del efectivo por defecto)
                SELECT 
                    DATE(fecha) as fecha,
                    (IFNULL(precio_total, 0) * -1) as efectivo,
                    0 as tarjeta,
                    0 as mercadopago,
                    0 as transferencia,
                    (IFNULL(precio_total, 0) * -1) as total
                FROM devoluciones
                WHERE empresa_id = ? AND caja_id = ? AND DATE(fecha) BETWEEN ? AND ?
            ) as consolidado
            GROUP BY fecha
            ORDER BY fecha ASC
        `;

    const [rows] = await db.execute(query, [
      empresa_id,
      MY_CAJA,
      fecha_inicio,
      fecha_fin, // Parámetros para Ventas
      empresa_id,
      MY_CAJA,
      fecha_inicio,
      fecha_fin, // Parámetros para Devoluciones
    ]);

    res.json(rows);
  } catch (error) {
    console.error("ERROR EN getInformeMetodosPago:", error);
    res.status(500).json({ message: "Error al procesar el informe" });
  }
};

const generarInformeMetodosPagoPDF = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.query.empresa_id || 1;
    const MY_CAJA = Number(process.env.CAJA_ID || 1); // 👈 Filtro por terminal
    const fInicio = fecha_inicio.split("-").reverse().join("/");
    const fFin = fecha_fin.split("-").reverse().join("/");

    const query = `
      SELECT 
          DATE_FORMAT(fecha, '%d/%m/%Y') as fecha_formateada,
          SUM(efectivo) as efectivo,
          SUM(tarjeta) as tarjeta,
          SUM(mercadopago) as mercadopago,
          SUM(transferencia) as transferencia,
          SUM(total) as total
      FROM (
          SELECT DATE(fecha) as fecha, IFNULL(efectivo, 0) as efectivo, IFNULL(tarjeta, 0) as tarjeta, IFNULL(mercadopago, 0) as mercadopago, IFNULL(transferencia, 0) as transferencia, IFNULL(precio_total, 0) as total
          FROM ventas 
          WHERE empresa_id = ? AND caja_id = ? AND DATE(fecha) BETWEEN ? AND ?
          UNION ALL
          SELECT DATE(fecha) as fecha, (IFNULL(precio_total, 0) * -1) as efectivo, 0 as tarjeta, 0 as mercadopago, 0 as transferencia, (IFNULL(precio_total, 0) * -1) as total
          FROM devoluciones 
          WHERE empresa_id = ? AND caja_id = ? AND DATE(fecha) BETWEEN ? AND ?
      ) as consolidado
      GROUP BY fecha
      ORDER BY fecha ASC`;

    const [datos] = await db.execute(query, [
      empresa_id,
      MY_CAJA,
      fecha_inicio,
      fecha_fin,
      empresa_id,
      MY_CAJA,
      fecha_inicio,
      fecha_fin,
    ]);

    // Helper para 2 decimales obligatorios
    const fmt = (val) =>
      parseFloat(val).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    let filas = "";
    let tEfe = 0,
      tTar = 0,
      tMP = 0,
      tTra = 0,
      tGral = 0;

    datos.forEach((d) => {
      const efe = parseFloat(d.efectivo);
      const tar = parseFloat(d.tarjeta);
      const mp = parseFloat(d.mercadopago);
      const tra = parseFloat(d.transferencia);
      const tot = parseFloat(d.total);
      tEfe += efe;
      tTar += tar;
      tMP += mp;
      tTra += tra;
      tGral += tot;

      filas += `
        <tr>
            <td style="text-align: left;">${d.fecha_formateada}</td>
            <td style="text-align: right;">$ ${fmt(efe)}</td>
            <td style="text-align: right;">$ ${fmt(tar)}</td>
            <td style="text-align: right;">$ ${fmt(mp)}</td>
            <td style="text-align: right;">$ ${fmt(tra)}</td>
            <td style="text-align: right; font-weight: bold;">$ ${fmt(tot)}</td>
        </tr>`;
    });

    const html = `
      <html>
      <head>
          <meta charset="UTF-8">
          <style>
              body { font-family: sans-serif; font-size: 11px; color: #333; }
              .header { text-align: center; margin-bottom: 20px; }
              .header h1 { color: #1a73e8; margin-bottom: 5px; }
              .table { width: 100%; border-collapse: collapse; }
              .table th { background-color: #1a73e8; color: white; padding: 8px; font-size: 10px; }
              .table td { padding: 8px; border-bottom: 1px solid #eee; }
              .total-row { font-weight: bold; background-color: #f1f1f1; border-top: 2px solid #1a73e8; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Ventas por Forma de Pago - CAJA ${MY_CAJA}</h1>
              <p>Período: ${fInicio} - ${fFin}</p>
          </div>
          <table class="table">
              <thead>
                  <tr>
                      <th style="text-align: left;">FECHA</th>
                      <th style="text-align: right;">EFECTIVO</th>
                      <th style="text-align: right;">TARJETA</th>
                      <th style="text-align: right;">M. PAGO</th>
                      <th style="text-align: right;">TRANSF.</th>
                      <th style="text-align: right;">TOTAL NETO</th>
                  </tr>
              </thead>
              <tbody>
                  ${
                    filas ||
                    '<tr><td colspan="6" style="text-align:center;">Sin movimientos</td></tr>'
                  }
                  <tr class="total-row">
                      <td style="text-align: left;">TOTALES</td>
                      <td style="text-align: right;">$ ${fmt(tEfe)}</td>
                      <td style="text-align: right;">$ ${fmt(tTar)}</td>
                      <td style="text-align: right;">$ ${fmt(tMP)}</td>
                      <td style="text-align: right;">$ ${fmt(tTra)}</td>
                      <td style="text-align: right; color: #1a73e8;">$ ${fmt(
                        tGral
                      )}</td>
                  </tr>
              </tbody>
          </table>
      </body>
      </html>`;

    pdf
      .create(html, { format: "A4", orientation: "landscape", border: "10mm" })
      .toBuffer((err, buffer) => {
        if (err) return res.status(500).send("Error");
        res.setHeader("Content-Type", "application/pdf");
        res.send(buffer);
      });
  } catch (error) {
    res.status(500).send("Error interno");
  }
};

const getInformeMovimientoStock = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.user ? req.user.empresa_id : 1;

    // 1. OBTENER PRODUCTOS CON MOVIMIENTO (Ventas - Devoluciones, incluyendo combos)
    const queryCon = `
      SELECT 
          nombre, 
          unidad, 
          SUM(cantidad_neta) as cantidad_vendida, 
          SUM(num_ventas_netas) as num_ventas
      FROM (
          -- PRODUCTOS VENDIDOS DIRECTAMENTE
          SELECT p.id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad, 
                 SUM(dv.cantidad) as cantidad_neta, 
                 COUNT(DISTINCT v.id) as num_ventas_netas
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN productos p ON dv.producto_id = p.id
          LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?
          GROUP BY p.id

          UNION ALL

          -- PRODUCTOS VENDIDOS DENTRO DE COMBOS
          SELECT p.id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad, 
                 SUM(dv.cantidad * cp.cantidad) as cantidad_neta, 
                 COUNT(DISTINCT v.id) as num_ventas_netas
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN combo_producto cp ON dv.combo_id = cp.combo_id
          JOIN productos p ON cp.producto_id = p.id
          LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?
          GROUP BY p.id

          UNION ALL

          -- PRODUCTOS DEVUELTOS DIRECTAMENTE (RESTAN)
          SELECT p.id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad, 
                 SUM(dd.cantidad * -1) as cantidad_neta, 
                 SUM(0) as num_ventas_netas
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id
          JOIN productos p ON dd.producto_id = p.id
          LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE dev.empresa_id = ? AND dev.fecha BETWEEN ? AND ?
          GROUP BY p.id

          UNION ALL

          -- PRODUCTOS DEVUELTOS DENTRO DE COMBOS (RESTAN)
          SELECT p.id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad, 
                 SUM(dd.cantidad * cp.cantidad * -1) as cantidad_neta, 
                 SUM(0) as num_ventas_netas
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id
          JOIN combo_producto cp ON dd.combo_id = cp.combo_id
          JOIN productos p ON cp.producto_id = p.id
          LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE dev.empresa_id = ? AND dev.fecha BETWEEN ? AND ?
          GROUP BY p.id
      ) as consolidado
      GROUP BY id, nombre, unidad
      HAVING cantidad_vendida > 0
      ORDER BY cantidad_vendida DESC
    `;

    // 2. PRODUCTOS SIN MOVIMIENTO
    const querySin = `
      SELECT p.nombre
      FROM productos p
      WHERE p.empresa_id = ? 
      AND p.id NOT IN (
          SELECT DISTINCT dv.producto_id FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id WHERE v.fecha BETWEEN ? AND ? AND dv.producto_id IS NOT NULL
          UNION
          SELECT DISTINCT cp.producto_id FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id JOIN combo_producto cp ON dv.combo_id = cp.combo_id WHERE v.fecha BETWEEN ? AND ?
      )
      ORDER BY p.nombre ASC
    `;

    const [conMovimiento] = await db.execute(queryCon, [
      empresa_id,
      fecha_inicio,
      fecha_fin, // Bloque 1
      empresa_id,
      fecha_inicio,
      fecha_fin, // Bloque 2
      empresa_id,
      fecha_inicio,
      fecha_fin, // Bloque 3
      empresa_id,
      fecha_inicio,
      fecha_fin, // Bloque 4
    ]);

    const [sinMovimiento] = await db.execute(querySin, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
      fecha_inicio,
      fecha_fin,
    ]);

    res.json({ conMovimiento, sinMovimiento });
  } catch (error) {
    console.error("ERROR MOV STOCK:", error);
    res.status(500).json({ message: "Error al procesar el informe" });
  }
};

const generarInformeMovimientoStockPDF = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.query.empresa_id || 1;

    const fInicio = fecha_inicio.split("-").reverse().join("/");
    const fFin = fecha_fin.split("-").reverse().join("/");

    // 1. QUERY PRODUCTOS CON MOVIMIENTO (Suma ventas y combos, resta devoluciones)
    const queryCon = `
      SELECT 
          nombre, unidad, 
          SUM(cantidad_neta) as cantidad_vendida, 
          SUM(num_ventas_netas) as num_ventas
      FROM (
          SELECT p.id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad, SUM(dv.cantidad) as cantidad_neta, COUNT(DISTINCT v.id) as num_ventas_netas
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id JOIN productos p ON dv.producto_id = p.id LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ? GROUP BY p.id
          UNION ALL
          SELECT p.id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad, SUM(dv.cantidad * cp.cantidad) as cantidad_neta, COUNT(DISTINCT v.id) as num_ventas_netas
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id JOIN combo_producto cp ON dv.combo_id = cp.combo_id JOIN productos p ON cp.producto_id = p.id LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ? GROUP BY p.id
          UNION ALL
          SELECT p.id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad, SUM(dd.cantidad * -1) as cantidad_neta, 0 as num_ventas_netas
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id JOIN productos p ON dd.producto_id = p.id LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE dev.empresa_id = ? AND dev.fecha BETWEEN ? AND ? GROUP BY p.id
          UNION ALL
          SELECT p.id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad, SUM(dd.cantidad * cp.cantidad * -1) as cantidad_neta, 0 as num_ventas_netas
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id JOIN combo_producto cp ON dd.combo_id = cp.combo_id JOIN productos p ON cp.producto_id = p.id LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE dev.empresa_id = ? AND dev.fecha BETWEEN ? AND ? GROUP BY p.id
      ) as consolidado
      GROUP BY id, nombre, unidad
      HAVING cantidad_vendida > 0
      ORDER BY cantidad_vendida DESC
    `;

    // 2. QUERY PRODUCTOS SIN MOVIMIENTO
    const querySin = `
      SELECT p.nombre
      FROM productos p
      WHERE p.empresa_id = ? 
      AND p.id NOT IN (
          SELECT DISTINCT dv.producto_id FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id WHERE v.fecha BETWEEN ? AND ? AND dv.producto_id IS NOT NULL
          UNION
          SELECT DISTINCT cp.producto_id FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id JOIN combo_producto cp ON dv.combo_id = cp.combo_id WHERE v.fecha BETWEEN ? AND ?
      )
      ORDER BY p.nombre ASC
    `;

    const [conMovimiento] = await db.execute(queryCon, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
      empresa_id,
      fecha_inicio,
      fecha_fin,
      empresa_id,
      fecha_inicio,
      fecha_fin,
      empresa_id,
      fecha_inicio,
      fecha_fin,
    ]);

    const [sinMovimiento] = await db.execute(querySin, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
      fecha_inicio,
      fecha_fin,
    ]);

    let filasCon = conMovimiento
      .map(
        (p, i) => `
      <tr>
          <td style="width: 40px;">${i + 1}</td>
          <td style="text-align: left;">${p.nombre}</td>
          <td style="width: 120px;">${p.cantidad_vendida} ${p.unidad}</td>
          <td style="width: 80px;">${p.num_ventas}</td>
      </tr>`
      )
      .join("");

    let filasSin = sinMovimiento
      .map(
        (p, i) => `
      <tr>
          <td style="width: 40px;">${i + 1}</td>
          <td style="text-align: left;">${p.nombre}</td>
          <td style="width: 80px;">0</td>
      </tr>`
      )
      .join("");

    const html = `
      <html>
      <head>
          <meta charset="UTF-8">
          <style>
              body { font-family: sans-serif; font-size: 11px; color: #333; padding: 10px; }
              .header { text-align: center; margin-bottom: 20px; }
              .header h1 { color: #1a73e8; margin-bottom: 5px; }
              .section-title { font-size: 13px; font-weight: bold; color: #1a73e8; margin-top: 20px; padding-bottom: 5px; border-bottom: 1px solid #1a73e8; }
              .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              .table th { background-color: #1a73e8; color: white; padding: 8px; font-size: 10px; text-transform: uppercase; }
              .table td { padding: 6px; border-bottom: 1px solid #eee; text-align: center; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Informe de Movimiento de Stock</h1>
              <p>Período: ${fInicio} - ${fFin}</p>
          </div>

          <div class="section-title">Movimientos Rápidos</div>
          <table class="table">
              <thead>
                  <tr>
                      <th>#</th>
                      <th style="text-align: left;">Producto</th>
                      <th>Cantidad Vendida</th>
                      <th>Ventas</th>
                  </tr>
              </thead>
              <tbody>${
                filasCon || '<tr><td colspan="4">No hay datos</td></tr>'
              }</tbody>
          </table>

          <div class="section-title">Sin Movimientos</div>
          <table class="table">
              <thead>
                  <tr>
                      <th>#</th>
                      <th style="text-align: left;">Producto</th>
                      <th>Ventas</th>
                  </tr>
              </thead>
              <tbody>${
                filasSin || '<tr><td colspan="3">No hay datos</td></tr>'
              }</tbody>
          </table>
      </body>
      </html>`;

    const options = { format: "A4", border: "10mm" };
    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) return res.status(500).send("Error");
      res.setHeader("Content-Type", "application/pdf");
      res.send(buffer);
    });
  } catch (error) {
    console.error("ERROR PDF STOCK:", error);
    res.status(500).send(error.message);
  }
};

const getDeudaCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    // 1. Calcular Deuda Total (Suma de deudas - Suma de pagos)
    const [totales] = await db.execute(
      `
      SELECT 
        (SELECT IFNULL(SUM(importe), 0) FROM compras_cta_cte WHERE cliente_id = ? AND empresa_id = ? AND tipo = 'deuda') as total_deuda,
        (SELECT IFNULL(SUM(importe), 0) FROM compras_cta_cte WHERE cliente_id = ? AND empresa_id = ? AND tipo = 'pago') as total_pagos
    `,
      [id, empresa_id, id, empresa_id]
    );

    const deuda_total =
      parseFloat(totales[0].total_deuda) - parseFloat(totales[0].total_pagos);

    // 2. Calcular Días de Mora (Si tiene deuda, buscar la fecha de la deuda más antigua)
    let dias_mora = 0;
    if (deuda_total > 0) {
      const [oldestDebt] = await db.execute(
        `
        SELECT fecha FROM compras_cta_cte 
        WHERE cliente_id = ? AND empresa_id = ? AND tipo = 'deuda' 
        ORDER BY fecha ASC LIMIT 1
      `,
        [id, empresa_id]
      );

      if (oldestDebt.length > 0) {
        const fechaDeuda = new Date(oldestDebt[0].fecha);
        const hoy = new Date();
        const diferencia = hoy.getTime() - fechaDeuda.getTime();
        dias_mora = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      }
    }

    res.json({
      success: true,
      deuda_total: Math.max(deuda_total, 0), // Evitar negativos
      dias_mora: dias_mora,
    });
  } catch (error) {
    console.error("Error en getDeudaCliente:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getVentaById = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    // 1. Obtener la venta
    const [ventaRows] = await db.execute(
      `
      SELECT v.*, cl.nombre_cliente, cl.cuil_codigo 
      FROM ventas v 
      LEFT JOIN clientes cl ON v.cliente_id = cl.id 
      WHERE v.id = ? AND v.empresa_id = ?`,
      [id, empresa_id]
    );

    if (ventaRows.length === 0)
      return res.status(404).json({ message: "Venta no encontrada" });
    const venta = ventaRows[0];

    // 2. Obtener los detalles
    const detalles = await Venta.getDetallesByVentaId(id);

    // 3. Procesar precios y componentes
    const detallesProcesados = await Promise.all(
      detalles.map(async (d) => {
        let componentes = [];
        if (d.combo_id) {
          const [compRows] = await db.execute(
            `
          SELECT p.nombre, cp.cantidad, u.nombre as unidad 
          FROM combo_producto cp 
          JOIN productos p ON cp.producto_id = p.id 
          LEFT JOIN unidads u ON p.unidad_id = u.id 
          WHERE cp.combo_id = ?`,
            [d.combo_id]
          );
          componentes = compRows;
        }

        // --- LÓGICA DE PRECIO SINCRONIZADA CON EL MODELO ---
        let precioUnitario = 0;
        if (d.producto_id) {
          // Si el producto tiene 'aplicar_porcentaje' activo
          if (d.aplicar_porcentaje == 1) {
            precioUnitario =
              parseFloat(d.precio_compra) *
              (1 + (parseFloat(d.valor_porcentaje) || 0) / 100);
          } else {
            precioUnitario = parseFloat(d.precio_venta) || 0;
          }
        } else if (d.combo_id) {
          // Si es combo, usamos combo_precio definido en el modelo
          precioUnitario = parseFloat(d.combo_precio) || 0;
        }

        return {
          ...d,
          precio_unitario: precioUnitario,
          subtotal: parseFloat(d.cantidad) * precioUnitario,
          componentes,
        };
      })
    );

    res.json({ ...venta, detalles: detallesProcesados });
  } catch (error) {
    console.error("Error detalle venta:", error);
    res.status(500).json({ message: "Error al obtener detalle" });
  }
};

const getVentaTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const [ventaRows] = await db.execute(
      `
        SELECT v.*, cl.id as cliente_id, cl.nombre_cliente 
        FROM ventas v 
        INNER JOIN clientes cl ON v.cliente_id = cl.id 
        WHERE v.id = ?`,
      [id]
    );

    const [empresaRows] = await db.execute("SELECT * FROM empresas LIMIT 1");
    const venta = ventaRows[0];
    const empresa = empresaRows[0];

    if (!venta) return res.status(404).send("Venta no encontrada");

    const [ctaCteRows] = await db.execute(
      `
        SELECT SUM(CASE WHEN tipo = 'deuda' THEN importe ELSE 0 END) - 
               SUM(CASE WHEN tipo = 'pago' THEN importe ELSE 0 END) as saldo_total
        FROM compras_cta_cte WHERE cliente_id = ?`,
      [venta.cliente_id]
    );

    const deudaAcumulada = parseFloat(ctaCteRows[0].saldo_total) || 0;
    const detalles = await Venta.getDetallesByVentaId(id);

    let subtotalSinDescuentos = 0;
    const itemsHtml = detalles
      .map((d) => {
        const nombre = (d.producto_nombre || d.combo_nombre || "N/A")
          .toUpperCase()
          .substring(0, 27);

        // --- LÓGICA DE PRECIO SINCRONIZADA ---
        let precio = 0;
        if (d.producto_id) {
          precio =
            d.aplicar_porcentaje == 1
              ? parseFloat(d.precio_compra) *
                (1 + (parseFloat(d.valor_porcentaje) || 0) / 100)
              : parseFloat(d.precio_venta) || 0;
        } else if (d.combo_id) {
          precio = parseFloat(d.combo_precio) || 0;
        }

        const subtotalItem = d.cantidad * precio;
        subtotalSinDescuentos += subtotalItem;

        return `
            ${
              d.cantidad > 1
                ? `<div style="text-align:left;">${
                    d.cantidad
                  } X ${precio.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}</div>`
                : ""
            }
            <table style="width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 2px;">
                <tr>
                    <td style="width: 75%; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${nombre}</td>
                    <td style="width: 25%; text-align: right;">${subtotalItem.toLocaleString(
                      "es-AR",
                      { minimumFractionDigits: 2 }
                    )}</td>
                </tr>
            </table>
        `;
      })
      .join("");

    const deudaHtml =
      deudaAcumulada > 0
        ? `
        <div style="margin-top:2px;">
            <div style="font-weight:bold">DEUDA TOTAL: ${deudaAcumulada.toLocaleString(
              "es-AR",
              { minimumFractionDigits: 2 }
            )}</div>
            <div>Cliente: ${venta.nombre_cliente}</div>
        </div>
    `
        : "";

    const hora24 = new Date(venta.created_at).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Courier New', Courier, monospace; 
                font-size: 10px; 
                line-height: 1.1; 
                width: 60mm; 
                color: #000;
            }
            .wrapper { padding: 4px; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .line { border-top: 1px dashed #000; margin: 4px 0; }
            .total-section { border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="text-center">
                <div style="font-weight:bold; font-size:11px;">${
                  empresa.nombre_empresa
                }</div>
                <div>CUIT Nro.: ${empresa.cuit || ""}</div>
                <div>Ing. Brutos: 1276868-05</div>
                <div>Dirección: ${empresa.direccion}</div>
                <div>CABA - CP ${empresa.codigo_postal || ""}</div>
                <div>IVA RESPONSABLE INSCRIPTO</div>
                <div>A CONSUMIDOR FINAL</div>
            </div>

            <div class="line"></div>

            <div class="text-center">
                <div>Cód. 083 - TIQUE</div>
                <div>P.V. Nro. ${String(empresa.id || 1).padStart(
                  5,
                  "0"
                )} - Nro. T. ${String(venta.id).padStart(8, "0")}</div>
                <div>Fecha ${new Date(venta.fecha).toLocaleDateString(
                  "es-AR"
                )} - Hora ${hora24}</div>
            </div>

            <div class="line"></div>
            
            ${itemsHtml}
            
            <div class="total-section">
                <div class="text-right">SUBTOTAL: ${subtotalSinDescuentos.toLocaleString(
                  "es-AR",
                  { minimumFractionDigits: 2 }
                )}</div>
                ${
                  venta.descuento_porcentaje > 0
                    ? `<div class="text-right">Descuento (${
                        venta.descuento_porcentaje
                      }%): ${(
                        subtotalSinDescuentos *
                        (venta.descuento_porcentaje / 100)
                      ).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}</div>`
                    : ""
                }
                ${
                  venta.descuento_monto > 0
                    ? `<div class="text-right">Descuento ($): ${parseFloat(
                        venta.descuento_monto
                      ).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}</div>`
                    : ""
                }
                <div class="text-right" style="font-size: 11px;">TOTAL: ${parseFloat(
                  venta.precio_total
                ).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
            </div>

            <div style="text-align:left; margin-top:8px;">
                <div>RECIBI(MOS)</div>
                <div style="font-weight:bold">PAGO</div>
                ${
                  venta.efectivo > 0
                    ? `<div>Efectivo: ${parseFloat(
                        venta.efectivo
                      ).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}</div>`
                    : ""
                }
                ${
                  venta.tarjeta > 0
                    ? `<div>Tarjeta: ${parseFloat(venta.tarjeta).toLocaleString(
                        "es-AR",
                        { minimumFractionDigits: 2 }
                      )}</div>`
                    : ""
                }
                ${
                  venta.mercadopago > 0
                    ? `<div>Mercado Pago: ${parseFloat(
                        venta.mercadopago
                      ).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}</div>`
                    : ""
                }
                ${
                  venta.transferencia > 0
                    ? `<div>Transferencia: ${parseFloat(
                        venta.transferencia
                      ).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}</div>`
                    : ""
                }
                ${deudaHtml}
            </div>

            <div class="text-center" style="margin-top:10px; font-size:8px; border-top: 1px dashed #000; padding-top:4px;">
                <div>${empresa.telefono || ""}</div>
                <div>GRATUITO C.A.B.A. ÁREA DE DEFENSA Y PROTECCIÓN AL CONSUMIDOR</div>
            </div>

            <div class="text-center" style="font-size: 8px; margin-top: 6px;">
                <div>SESHIA00000013450</div>
                <div>V: 1.01</div>
            </div>
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
    console.error(error);
    res.status(500).send("Error al generar el ticket");
  }
};

const updateTmpVentaQuantity = async (req, res) => {
  try {
    const { id } = req.params; // ID de la tabla tmp_ventas
    const { cantidad } = req.body;

    // 1. Buscamos el stock real del producto que está en el carrito
    const [rows] = await db.execute(
      `
      SELECT p.stock, p.nombre 
      FROM tmp_ventas t
      JOIN productos p ON t.producto_id = p.id
      WHERE t.id = ?
    `,
      [id]
    );

    if (rows.length > 0) {
      const stockDisponible = rows[0].stock;
      const nombreProducto = rows[0].nombre;

      // 2. Si la cantidad pedida es mayor al stock, bloqueamos
      if (cantidad > stockDisponible) {
        return res.json({
          success: false,
          message: `Stock insuficiente para ${nombreProducto}. Máximo disponible: ${stockDisponible}`,
        });
      }
    }

    // 3. Si pasó la validación, actualizamos
    await db.execute(
      "UPDATE tmp_ventas SET cantidad = ?, updated_at = NOW() WHERE id = ?",
      [cantidad, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error en updateTmpVentaQuantity:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

const enviarTicketPorWhatsApp = async (req, res) => {
  try {
    const { id } = req.params; // ID de la venta
    const empresa_id = req.user.empresa_id;

    // 1. Obtener datos de la venta y del cliente
    const [rows] = await db.execute(
      `SELECT v.id, v.precio_total, c.nombre_cliente, c.telefono 
       FROM ventas v 
       INNER JOIN clientes c ON v.cliente_id = c.id 
       WHERE v.id = ? AND v.empresa_id = ?`,
      [id, empresa_id]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Venta no encontrada" });
    const venta = rows[0];

    // 2. Validar si es Consumidor Final o no tiene teléfono
    if (venta.telefono === "99999999" || !venta.telefono) {
      return res.status(400).json({
        message:
          "El cliente es Consumidor Final o no tiene un teléfono válido.",
      });
    }

    // 3. Preparar la URL del ticket (Usando el token para que el cliente pueda verlo)
    const token = req.query.token || req.headers.authorization?.split(" ")[1];
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? "https://sistema-ventas-backend-3nn3.onrender.com"
        : "http://localhost:3001";

    const linkTicket = `${baseUrl}/api/ventas/ticket/${venta.id}?token=${token}`;

    // 4. Construir el mensaje
    const mensaje =
      `¡Hola *${venta.nombre_cliente}*! 👋\n\n` +
      `Gracias por tu compra. Te adjuntamos el link para que puedas descargar tu comprobante electrónico:\n\n` +
      `📄 *Ticket:* T-${venta.id.toString().padStart(8, "0")}\n` +
      `💰 *Monto:* $${parseFloat(venta.precio_total).toLocaleString(
        "es-AR"
      )}\n\n` +
      `🔗 *Link:* ${linkTicket}\n\n` +
      `¡Esperamos verte pronto!`;

    // 5. Enviar mensaje
    await sendWS(venta.telefono, mensaje);

    res.json({
      success: true,
      message: "Ticket enviado por WhatsApp con éxito.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al enviar el ticket." });
  }
};

const getReporteRentabilidad = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const empresa_id = req.user.empresa_id;
    const MY_CAJA = Number(process.env.CAJA_ID || 1); // 👈 Identidad de la terminal

    // 1. VENTAS NETAS DE ESTA CAJA (Sincronizado con Dashboard)
    // Calculamos: Suma de Tickets - Suma de Devoluciones
    const [vRows] = await db.execute(
      `SELECT IFNULL(SUM(precio_total), 0) as total FROM ventas 
       WHERE empresa_id = ? AND caja_id = ? AND DATE(fecha) BETWEEN ? AND ?`,
      [empresa_id, MY_CAJA, desde, hasta]
    );

    const [dRows] = await db.execute(
      `SELECT IFNULL(SUM(precio_total), 0) as total FROM devoluciones 
       WHERE empresa_id = ? AND caja_id = ? AND DATE(fecha) BETWEEN ? AND ?`,
      [empresa_id, MY_CAJA, desde, hasta]
    );

    // 2. COSTO DE MERCADERÍA (CMV) Y GASTOS DE ESTA CAJA
    const [cRows] = await db.execute(
      `SELECT IFNULL(SUM(dv.cantidad * dv.precio_compra), 0) as total 
       FROM detalle_ventas dv 
       JOIN ventas v ON dv.venta_id = v.id 
       WHERE v.empresa_id = ? AND v.caja_id = ? AND DATE(v.fecha) BETWEEN ? AND ?`,
      [empresa_id, MY_CAJA, desde, hasta]
    );

    const [gRows] = await db.execute(
      `SELECT IFNULL(SUM(monto), 0) as total FROM gastos 
       WHERE empresa_id = ? AND caja_id = ? AND DATE(fecha) BETWEEN ? AND ?`,
      [empresa_id, MY_CAJA, desde, hasta]
    );

    const totalVentasBrutas = parseFloat(vRows[0].total);
    const totalDevoluciones = parseFloat(dRows[0].total);
    const totalVentasNetas = totalVentasBrutas - totalDevoluciones;
    const totalCosto = parseFloat(cRows[0].total);
    const totalGastos = parseFloat(gRows[0].total);

    const gananciaBruta = totalVentasNetas - totalCosto;
    const gananciaNetaReal = gananciaBruta - totalGastos;

    // 3. RANKING DE PRODUCTOS (Incluyendo combos + prorrateo de descuentos de venta)
    const [ranking] = await db.execute(
      `SELECT 
        t.producto_id, t.nombre, t.unidad,
        SUM(t.cantidad_total) as cantidad_vendida,
        SUM(t.ganancia_real) as ganancia_periodo,
        SUM(t.venta_real) as total_venta_periodo
      FROM (
          -- A. VENTAS DIRECTAS (Prorrateadas con el descuento del ticket)
          SELECT 
            p.id as producto_id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad,
            SUM(dv.cantidad) as cantidad_total,
            SUM((dv.cantidad * dv.precio_venta) * (v.precio_total / (SELECT SUM(dv2.cantidad * dv2.precio_venta) FROM detalle_ventas dv2 WHERE dv2.venta_id = v.id))) as venta_real,
            SUM(((dv.cantidad * dv.precio_venta) * (v.precio_total / (SELECT SUM(dv2.cantidad * dv2.precio_venta) FROM detalle_ventas dv2 WHERE dv2.venta_id = v.id))) - (dv.cantidad * dv.precio_compra)) as ganancia_real
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN productos p ON dv.producto_id = p.id
          LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? AND v.caja_id = ? AND DATE(v.fecha) BETWEEN ? AND ?
          GROUP BY p.id, p.nombre, u.nombre

          UNION ALL

          -- B. VENTAS POR COMBOS (Prorrateadas con el descuento del ticket)
          SELECT 
            p.id as producto_id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad,
            SUM(dv.cantidad * cp.cantidad) as cantidad_total,
            SUM((dv.cantidad * cp.cantidad * p.precio_venta) * (v.precio_total / (SELECT SUM(dv3.cantidad * dv3.precio_venta) FROM detalle_ventas dv3 WHERE dv3.venta_id = v.id))) as venta_real,
            SUM(((dv.cantidad * cp.cantidad * p.precio_venta) * (v.precio_total / (SELECT SUM(dv3.cantidad * dv3.precio_venta) FROM detalle_ventas dv3 WHERE dv3.venta_id = v.id))) - (dv.cantidad * cp.cantidad * p.precio_compra)) as ganancia_real
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN combo_producto cp ON dv.combo_id = cp.combo_id
          JOIN productos p ON cp.producto_id = p.id
          LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? AND v.caja_id = ? AND DATE(v.fecha) BETWEEN ? AND ?
          GROUP BY p.id, p.nombre, u.nombre
      ) t
      GROUP BY t.producto_id, t.nombre, t.unidad`,
      [empresa_id, MY_CAJA, desde, hasta, empresa_id, MY_CAJA, desde, hasta]
    );

    // 4. Traer todos los productos para que figuren aunque tengan 0 ventas
    const [todosLosProductos] = await db.execute(
      `SELECT p.id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad 
       FROM productos p LEFT JOIN unidads u ON p.unidad_id = u.id 
       WHERE p.empresa_id = ?`,
      [empresa_id]
    );

    const rankingCompleto = todosLosProductos.map((p) => {
      const vData = ranking.find((r) => r.producto_id === p.id);
      const cantidad = vData ? parseFloat(vData.cantidad_vendida) : 0;
      const ganancia = vData ? parseFloat(vData.ganancia_periodo) : 0;
      const total_venta = vData ? parseFloat(vData.total_venta_periodo) : 0;

      let margen = total_venta > 0 ? (ganancia / total_venta) * 100 : 0;
      let participacion =
        gananciaBruta > 0 && ganancia > 0
          ? (ganancia / gananciaBruta) * 100
          : 0;

      return {
        nombre: p.nombre,
        unidad: p.unidad,
        cantidad,
        ganancia,
        total_venta,
        margen,
        participacion,
      };
    });

    res.json({
      totalVentas: totalVentasNetas, // Coincide con Dashboard
      totalCosto,
      totalGastos,
      gananciaBruta,
      gananciaNetaReal,
      rankingProductos: rankingCompleto.sort((a, b) => b.ganancia - a.ganancia),
    });
  } catch (error) {
    console.error("ERROR RENTABILIDAD:", error);
    res.status(500).json({ message: "Error interno" });
  }
};

const countVentas = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT COUNT(*) AS total FROM ventas");
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error al contar ventas:", error);
    res.status(500).json({ total: 0 });
  }
};

const getVentasSummary = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const [totalRows] = await db.execute(
      "SELECT COUNT(*) AS total FROM ventas"
    );
    const [yearRows] = await db.execute(
      "SELECT COUNT(*) AS totalAnio FROM ventas WHERE YEAR(fecha) = ?",
      [year]
    );

    res.json({
      total: totalRows[0].total || 0,
      totalAnio: yearRows[0].totalAnio || 0,
    });
  } catch (error) {
    res.status(500).json({ total: 0, totalAnio: 0 });
  }
};

const getVentasDashboard = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const MY_CAJA = Number(process.env.CAJA_ID || 1);

    const options = {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    };
    const todayStr = new Intl.DateTimeFormat("en-CA", options).format(
      new Date()
    );
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // 1. VENTAS NETAS (Filtro estricto por Caja y Empresa)
    const [v] = await db.execute(
      `SELECT 
        IFNULL(SUM(CASE WHEN DATE(fecha) = ? THEN precio_total ELSE 0 END), 0) as dia,
        IFNULL(SUM(CASE WHEN MONTH(fecha) = ? AND YEAR(fecha) = ? THEN precio_total ELSE 0 END), 0) as mes,
        IFNULL(SUM(CASE WHEN YEAR(fecha) = ? THEN precio_total ELSE 0 END), 0) as anio
      FROM ventas WHERE empresa_id = ? AND caja_id = ?`,
      [todayStr, currentMonth, currentYear, currentYear, empresa_id, MY_CAJA]
    );

    const [d] = await db.execute(
      `SELECT 
        IFNULL(SUM(CASE WHEN DATE(fecha) = ? THEN precio_total ELSE 0 END), 0) as dia,
        IFNULL(SUM(CASE WHEN MONTH(fecha) = ? AND YEAR(fecha) = ? THEN precio_total ELSE 0 END), 0) as mes,
        IFNULL(SUM(CASE WHEN YEAR(fecha) = ? THEN precio_total ELSE 0 END), 0) as anio
      FROM devoluciones WHERE empresa_id = ? AND caja_id = ?`,
      [todayStr, currentMonth, currentYear, currentYear, empresa_id, MY_CAJA]
    );

    // 2. GANANCIA NETA REAL (Precio Cobrado - Costo)
    const [gReal] = await db.execute(
      `SELECT 
        IFNULL(SUM(CASE WHEN DATE(fecha) = ? THEN (precio_total - costo_total) ELSE 0 END), 0) as dia,
        IFNULL(SUM(CASE WHEN MONTH(fecha) = ? AND YEAR(fecha) = ? THEN (precio_total - costo_total) ELSE 0 END), 0) as mes,
        IFNULL(SUM(CASE WHEN YEAR(fecha) = ? THEN (precio_total - costo_total) ELSE 0 END), 0) as anio
       FROM (
         SELECT v.fecha, v.precio_total, v.empresa_id, v.caja_id,
                (SELECT IFNULL(SUM(dv.cantidad * dv.precio_compra), 0) FROM detalle_ventas dv WHERE dv.venta_id = v.id) as costo_total
         FROM ventas v
       ) t WHERE empresa_id = ? AND caja_id = ?`,
      [todayStr, currentMonth, currentYear, currentYear, empresa_id, MY_CAJA]
    );

    // 3. GASTOS DE ESTA CAJA
    const [gas] = await db.execute(
      `SELECT 
        IFNULL(SUM(CASE WHEN DATE(fecha) = ? THEN monto ELSE 0 END), 0) as dia,
        IFNULL(SUM(CASE WHEN MONTH(fecha) = ? AND YEAR(fecha) = ? THEN monto ELSE 0 END), 0) as mes,
        IFNULL(SUM(CASE WHEN YEAR(fecha) = ? THEN monto ELSE 0 END), 0) as anio
      FROM gastos WHERE empresa_id = ? AND caja_id = ?`,
      [todayStr, currentMonth, currentYear, currentYear, empresa_id, MY_CAJA]
    );

    // 4. CONTEOS INFOBOXES
    const [counts] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM productos WHERE empresa_id = ${empresa_id}) as productos,
        (SELECT COUNT(*) FROM productos WHERE empresa_id = ${empresa_id} AND stock <= stock_minimo) as bajoStock,
        (SELECT COUNT(*) FROM clientes WHERE empresa_id = ${empresa_id}) as clientes,
        (SELECT COUNT(*) FROM ventas WHERE empresa_id = ${empresa_id} AND caja_id = ${MY_CAJA}) as ventasCount,
        (SELECT IFNULL(SUM(CASE WHEN tipo = 'deuda' THEN importe ELSE -importe END), 0) FROM compras_cta_cte WHERE empresa_id = ${empresa_id}) as deuda_gral
    `);

    // Top Productos de esta caja
    const [top] = await db.execute(
      `
      SELECT p.nombre, SUM(dv.cantidad) as veces_vendido 
      FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id JOIN productos p ON dv.producto_id = p.id 
      WHERE v.empresa_id = ? AND v.caja_id = ? GROUP BY p.id ORDER BY veces_vendido DESC LIMIT 10`,
      [empresa_id, MY_CAJA]
    );

    res.json({
      productosBajoStock: counts[0].bajoStock,
      ventas_dia: Math.max(parseFloat(v[0].dia) - parseFloat(d[0].dia), 0),
      ventas_mes: Math.max(parseFloat(v[0].mes) - parseFloat(d[0].mes), 0),
      ventas_anio: Math.max(parseFloat(v[0].anio) - parseFloat(d[0].anio), 0),
      ganancia_dia: parseFloat(gReal[0].dia) - parseFloat(gas[0].dia),
      ganancia_mes: parseFloat(gReal[0].mes) - parseFloat(gas[0].mes),
      ganancia_anio: parseFloat(gReal[0].anio) - parseFloat(gas[0].anio),
      deuda_general: parseFloat(counts[0].deuda_gral),
      topProductos: top,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getListadoVentas,
  getTmpVentas,
  postTmpVenta,
  deleteTmpVenta,
  storeVenta,
  generarReporte,
  getInformeProductos,
  generarInformeProductosPDF,
  getInformeClientes,
  generarInformeClientesPDF,
  getInformeMetodosPago,
  generarInformeMetodosPagoPDF,
  getInformeMovimientoStock,
  generarInformeMovimientoStockPDF,
  getDeudaCliente,
  getVentaById,
  getVentaTicket,
  updateTmpVentaQuantity,
  enviarTicketPorWhatsApp,
  getReporteRentabilidad,
  countVentas,
  getVentasSummary,
  getVentasDashboard,
};
