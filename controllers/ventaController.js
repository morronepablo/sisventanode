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
  console.log("--- INICIO REGISTRO DE VENTA ---");
  try {
    // 1. Extraer 'items' de req.body para poder recorrerlos después
    const { precio_total, cliente_id, items } = req.body;
    const empresa_id = req.user.empresa_id;

    // 2. Guardar la venta
    const venta_id = await Venta.store(req.body, req.user.id, empresa_id);

    console.log(`[VENTAS] Venta guardada con éxito. ID: ${venta_id}`);

    // 3. OBTENER EL TELÉFONO (Esto es lo que faltaba definir)
    const telefonoDestino = await getEmpresaPhone(empresa_id);

    // 4. Lógica de WhatsApp
    if (telefonoDestino && items && items.length > 0) {
      for (const item of items) {
        if (item.producto_id) {
          const [prod] = await db.execute(
            "SELECT nombre, stock, stock_minimo FROM productos WHERE id = ?",
            [item.producto_id]
          );

          if (prod.length > 0) {
            const p = prod[0];
            if (parseFloat(p.stock) <= parseFloat(p.stock_minimo)) {
              const mensaje = `🚨 *ALERTA DE REPOSICIÓN* 🚨\n\nEl producto *${
                p.nombre
              }* acaba de quedar con stock bajo tras la venta *T-${venta_id
                .toString()
                .padStart(8, "0")}*.\n\n*Stock actual:* ${
                p.stock
              }\n*Mínimo permitido:* ${
                p.stock_minimo
              }\n\n_Por favor, genere un pedido al proveedor._`;

              await sendWS(telefonoDestino, mensaje);
              console.log(
                `[WHATSAPP] Aviso enviado para el producto: ${p.nombre}`
              );
            }
          }
        }
      }
    }

    // 5. REGISTRO DE LOG
    await registrarLog(
      req,
      "CREAR",
      "VENTAS",
      `Se registró una venta por un total de $${precio_total}. Ticket N°: ${venta_id}. Cliente ID: ${cliente_id}`
    );

    res.json({ success: true, venta_id });
  } catch (error) {
    console.error("[VENTAS ERROR] Fallo al registrar venta:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
  console.log("--- FIN REGISTRO DE VENTA ---");
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
    const empresa_id = req.user ? req.user.empresa_id : 1;

    const query = `
      SELECT 
          codigo, nombre, unidad,
          SUM(cantidad_neta) as cantidad,
          costo_unitario as costo,
          precio_venta_unitario as venta,
          SUM(ganancia_neta) as ganancia,
          SUM(total_neto) as total
      FROM (
          -- 1. PRODUCTOS VENDIDOS INDIVIDUALMENTE
          SELECT 
              p.codigo, p.nombre, IFNULL(u.nombre, 'Unidad') as unidad,
              dv.cantidad as cantidad_neta,
              p.precio_compra as costo_unitario,
              p.precio_venta as precio_venta_unitario,
              (dv.cantidad * (p.precio_venta - p.precio_compra)) as ganancia_neta,
              (dv.cantidad * p.precio_venta) as total_neto
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN productos p ON dv.producto_id = p.id
          LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?

          UNION ALL

          -- 2. COMBOS VENDIDOS (Tratados como un solo producto)
          SELECT 
              c.codigo, c.nombre, 'Combo' as unidad,
              dv.cantidad as cantidad_neta,
              -- El costo del combo es la suma del costo de sus componentes
              (SELECT SUM(cp.cantidad * p2.precio_compra) FROM combo_producto cp JOIN productos p2 ON cp.producto_id = p2.id WHERE cp.combo_id = c.id) as costo_unitario,
              c.precio_venta as precio_venta_unitario,
              (dv.cantidad * (c.precio_venta - (SELECT SUM(cp.cantidad * p2.precio_compra) FROM combo_producto cp JOIN productos p2 ON cp.producto_id = p2.id WHERE cp.combo_id = c.id))) as ganancia_neta,
              (dv.cantidad * c.precio_venta) as total_neto
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN combos c ON dv.combo_id = c.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?

          UNION ALL

          -- 3. DEVOLUCIONES DE PRODUCTOS (RESTAN)
          SELECT 
              p.codigo, p.nombre, IFNULL(u.nombre, 'Unidad') as unidad,
              (dd.cantidad * -1) as cantidad_neta,
              p.precio_compra as costo_unitario,
              p.precio_venta as precio_venta_unitario,
              (dd.cantidad * (p.precio_venta - p.precio_compra) * -1) as ganancia_neta,
              (dd.cantidad * p.precio_venta * -1) as total_neto
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id
          JOIN productos p ON dd.producto_id = p.id
          LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE dev.empresa_id = ? AND dev.fecha BETWEEN ? AND ?

          UNION ALL

          -- 4. DEVOLUCIONES DE COMBOS (RESTAN)
          SELECT 
              c.codigo, c.nombre, 'Combo' as unidad,
              (dd.cantidad * -1) as cantidad_neta,
              (SELECT SUM(cp.cantidad * p2.precio_compra) FROM combo_producto cp JOIN productos p2 ON cp.producto_id = p2.id WHERE cp.combo_id = c.id) as costo_unitario,
              c.precio_venta as precio_venta_unitario,
              (dd.cantidad * (c.precio_venta - (SELECT SUM(cp.cantidad * p2.precio_compra) FROM combo_producto cp JOIN productos p2 ON cp.producto_id = p2.id WHERE cp.combo_id = c.id)) * -1) as ganancia_neta,
              (dd.cantidad * c.precio_venta * -1) as total_neto
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id
          JOIN combos c ON dd.combo_id = c.id
          WHERE dev.empresa_id = ? AND dev.fecha BETWEEN ? AND ?
      ) as t
      GROUP BY codigo, nombre, unidad, costo_unitario, precio_venta_unitario
      HAVING total <> 0
      ORDER BY total DESC
    `;

    const [rows] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin, // Ventas Prods
      empresa_id,
      fecha_inicio,
      fecha_fin, // Ventas Combos
      empresa_id,
      fecha_inicio,
      fecha_fin, // Dev Prods
      empresa_id,
      fecha_inicio,
      fecha_fin, // Dev Combos
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

    const fInicio = fecha_inicio.split("-").reverse().join("/");
    const fFin = fecha_fin.split("-").reverse().join("/");

    // MISMA QUERY QUE USAMOS EN EL DETALLE PARA QUE LOS DATOS SEAN IDÉNTICOS
    const query = `
      SELECT 
          codigo, nombre, unidad,
          SUM(cantidad_neta) as cantidad,
          costo_unitario as costo,
          precio_venta_unitario as venta,
          SUM(ganancia_neta) as ganancia,
          SUM(total_neto) as total
      FROM (
          -- 1. PRODUCTOS VENDIDOS INDIVIDUALMENTE
          SELECT 
              p.codigo, p.nombre, IFNULL(u.nombre, 'Unidad') as unidad,
              dv.cantidad as cantidad_neta,
              p.precio_compra as costo_unitario,
              p.precio_venta as precio_venta_unitario,
              (dv.cantidad * (p.precio_venta - p.precio_compra)) as ganancia_neta,
              (dv.cantidad * p.precio_venta) as total_neto
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN productos p ON dv.producto_id = p.id
          LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?

          UNION ALL

          -- 2. COMBOS VENDIDOS (Tratados como un solo producto)
          SELECT 
              c.codigo, c.nombre, 'Combo' as unidad,
              dv.cantidad as cantidad_neta,
              (SELECT SUM(cp.cantidad * p2.precio_compra) FROM combo_producto cp JOIN productos p2 ON cp.producto_id = p2.id WHERE cp.combo_id = c.id) as costo_unitario,
              c.precio_venta as precio_venta_unitario,
              (dv.cantidad * (c.precio_venta - (SELECT SUM(cp.cantidad * p2.precio_compra) FROM combo_producto cp JOIN productos p2 ON cp.producto_id = p2.id WHERE cp.combo_id = c.id))) as ganancia_neta,
              (dv.cantidad * c.precio_venta) as total_neto
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN combos c ON dv.combo_id = c.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?

          UNION ALL

          -- 3. DEVOLUCIONES DE PRODUCTOS (RESTAN)
          SELECT 
              p.codigo, p.nombre, IFNULL(u.nombre, 'Unidad') as unidad,
              (dd.cantidad * -1) as cantidad_neta,
              p.precio_compra as costo_unitario,
              p.precio_venta as precio_venta_unitario,
              (dd.cantidad * (p.precio_venta - p.precio_compra) * -1) as ganancia_neta,
              (dd.cantidad * p.precio_venta * -1) as total_neto
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id
          JOIN productos p ON dd.producto_id = p.id
          LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE dev.empresa_id = ? AND dev.fecha BETWEEN ? AND ?

          UNION ALL

          -- 4. DEVOLUCIONES DE COMBOS (RESTAN)
          SELECT 
              c.codigo, c.nombre, 'Combo' as unidad,
              (dd.cantidad * -1) as cantidad_neta,
              (SELECT SUM(cp.cantidad * p2.precio_compra) FROM combo_producto cp JOIN productos p2 ON cp.producto_id = p2.id WHERE cp.combo_id = c.id) as costo_unitario,
              c.precio_venta as precio_venta_unitario,
              (dd.cantidad * (c.precio_venta - (SELECT SUM(cp.cantidad * p2.precio_compra) FROM combo_producto cp JOIN productos p2 ON cp.producto_id = p2.id WHERE cp.combo_id = c.id)) * -1) as ganancia_neta,
              (dd.cantidad * c.precio_venta * -1) as total_neto
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id
          JOIN combos c ON dd.combo_id = c.id
          WHERE dev.empresa_id = ? AND dev.fecha BETWEEN ? AND ?
      ) as t
      GROUP BY codigo, nombre, unidad, costo_unitario, precio_venta_unitario
      HAVING total <> 0
      ORDER BY total DESC
    `;

    const [productos] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin, // Ventas Prods
      empresa_id,
      fecha_inicio,
      fecha_fin, // Ventas Combos
      empresa_id,
      fecha_inicio,
      fecha_fin, // Dev Prods
      empresa_id,
      fecha_inicio,
      fecha_fin, // Dev Combos
    ]);

    let filas = "";
    let totalCant = 0;
    let totalGanancia = 0;
    let totalGral = 0;

    productos.forEach((p) => {
      totalCant += parseFloat(p.cantidad);
      totalGanancia += parseFloat(p.ganancia);
      totalGral += parseFloat(p.total);

      filas += `
        <tr>
            <td style="text-align: center;">${p.codigo}</td>
            <td style="text-align: left;">${p.nombre}</td>
            <td style="text-align: center;">${p.cantidad}</td>
            <td style="text-align: center;">${p.unidad}</td>
            <td style="text-align: right;">$ ${parseFloat(
              p.costo
            ).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
            <td style="text-align: right;">$ ${parseFloat(
              p.venta
            ).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
            <td style="text-align: right;">$ ${parseFloat(
              p.ganancia
            ).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
            <td style="text-align: right;">$ ${parseFloat(
              p.total
            ).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
        </tr>`;
    });

    const html = `
      <html>
      <head>
          <meta charset="UTF-8">
          <style>
              body { font-family: sans-serif; font-size: 11px; }
              .header { text-align: center; color: #1a73e8; }
              .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .table th { background-color: #1a73e8; color: white; padding: 8px; border: 1px solid #1a73e8; }
              .table td { padding: 8px; border: 1px solid #eee; }
              .total-row { font-weight: bold; background-color: #f1f1f1; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Informe de Ventas por Productos</h1>
              <p>Período: ${fInicio} - ${fFin}</p>
          </div>
          <table class="table">
              <thead>
                  <tr>
                      <th>CÓDIGO</th>
                      <th>PRODUCTO</th>
                      <th>CANT.</th>
                      <th>UNIDAD</th>
                      <th>COSTO</th>
                      <th>VENTA</th>
                      <th>GANANCIA</th>
                      <th>TOTAL</th>
                  </tr>
              </thead>
              <tbody>
                  ${filas}
                  <tr class="total-row">
                      <td colspan="2" style="text-align: center;">TOTALES</td>
                      <td style="text-align: center;">${totalCant}</td>
                      <td colspan="3"></td>
                      <td style="text-align: right;">$ ${totalGanancia.toLocaleString(
                        "es-AR",
                        { minimumFractionDigits: 2 }
                      )}</td>
                      <td style="text-align: right;">$ ${totalGral.toLocaleString(
                        "es-AR",
                        { minimumFractionDigits: 2 }
                      )}</td>
                  </tr>
              </tbody>
          </table>
      </body>
      </html>`;

    const options = { format: "A4", orientation: "landscape", border: "10mm" };
    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) return res.status(500).send("Error al generar PDF");
      res.setHeader("Content-Type", "application/pdf");
      res.send(buffer);
    });
  } catch (error) {
    console.error("ERROR PDF:", error);
    res.status(500).send(error.message);
  }
};

const getInformeClientes = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.user ? req.user.empresa_id : 1;

    const query = `
      SELECT 
          nombre,
          SUM(costo_total) as costo,
          SUM(total_neto) as total,
          (SUM(total_neto) - SUM(costo_total)) as ganancia
      FROM (
          -- 1. VENTAS DE PRODUCTOS INDIVIDUALES
          SELECT 
              IFNULL(cl.nombre_cliente, 'Consumidor Final') as nombre,
              v.cliente_id,
              (dv.cantidad * p.precio_compra) as costo_total,
              (dv.cantidad * p.precio_venta) as total_neto
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN productos p ON dv.producto_id = p.id
          LEFT JOIN clientes cl ON v.cliente_id = cl.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?

          UNION ALL

          -- 2. VENTAS DE COMBOS
          SELECT 
              IFNULL(cl.nombre_cliente, 'Consumidor Final') as nombre,
              v.cliente_id,
              (dv.cantidad * (SELECT SUM(cp.cantidad * p2.precio_compra) FROM combo_producto cp JOIN productos p2 ON cp.producto_id = p2.id WHERE cp.combo_id = c.id)) as costo_total,
              (dv.cantidad * c.precio_venta) as total_neto
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN combos c ON dv.combo_id = c.id
          LEFT JOIN clientes cl ON v.cliente_id = cl.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?

          UNION ALL

          -- 3. DEVOLUCIONES DE PRODUCTOS (RESTAN)
          SELECT 
              IFNULL(cl.nombre_cliente, 'Consumidor Final') as nombre,
              dev.cliente_id,
              (dd.cantidad * p.precio_compra * -1) as costo_total,
              (dd.cantidad * p.precio_venta * -1) as total_neto
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id
          JOIN productos p ON dd.producto_id = p.id
          LEFT JOIN clientes cl ON dev.cliente_id = cl.id
          WHERE dev.empresa_id = ? AND dev.fecha BETWEEN ? AND ?

          UNION ALL

          -- 4. DEVOLUCIONES DE COMBOS (RESTAN)
          SELECT 
              IFNULL(cl.nombre_cliente, 'Consumidor Final') as nombre,
              dev.cliente_id,
              (dd.cantidad * (SELECT SUM(cp.cantidad * p2.precio_compra) FROM combo_producto cp JOIN productos p2 ON cp.producto_id = p2.id WHERE cp.combo_id = c.id) * -1) as costo_total,
              (dd.cantidad * c.precio_venta * -1) as total_neto
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id
          JOIN combos c ON dd.combo_id = c.id
          LEFT JOIN clientes cl ON dev.cliente_id = cl.id
          WHERE dev.empresa_id = ? AND dev.fecha BETWEEN ? AND ?
      ) as t
      GROUP BY cliente_id, nombre
      ORDER BY total DESC
    `;

    const [rows] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin, // Ventas Prods
      empresa_id,
      fecha_inicio,
      fecha_fin, // Ventas Combos
      empresa_id,
      fecha_inicio,
      fecha_fin, // Dev Prods
      empresa_id,
      fecha_inicio,
      fecha_fin, // Dev Combos
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

    const fInicio = fecha_inicio.split("-").reverse().join("/");
    const fFin = fecha_fin.split("-").reverse().join("/");

    // REPLICAMOS LA QUERY EXACTA DEL DETALLE (4 BLOQUES: VENTAS + COMBOS - DEVOLUCIONES)
    const query = `
      SELECT 
          nombre,
          SUM(costo_total) as costo,
          SUM(total_neto) as total,
          (SUM(total_neto) - SUM(costo_total)) as ganancia
      FROM (
          -- 1. VENTAS DE PRODUCTOS INDIVIDUALES
          SELECT 
              IFNULL(cl.nombre_cliente, 'Consumidor Final') as nombre,
              v.cliente_id,
              (dv.cantidad * p.precio_compra) as costo_total,
              (dv.cantidad * p.precio_venta) as total_neto
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN productos p ON dv.producto_id = p.id
          LEFT JOIN clientes cl ON v.cliente_id = cl.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?

          UNION ALL

          -- 2. VENTAS DE COMBOS
          SELECT 
              IFNULL(cl.nombre_cliente, 'Consumidor Final') as nombre,
              v.cliente_id,
              (dv.cantidad * (SELECT SUM(cp.cantidad * p2.precio_compra) FROM combo_producto cp JOIN productos p2 ON cp.producto_id = p2.id WHERE cp.combo_id = c.id)) as costo_total,
              (dv.cantidad * c.precio_venta) as total_neto
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN combos c ON dv.combo_id = c.id
          LEFT JOIN clientes cl ON v.cliente_id = cl.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?

          UNION ALL

          -- 3. DEVOLUCIONES DE PRODUCTOS (RESTAN)
          SELECT 
              IFNULL(cl.nombre_cliente, 'Consumidor Final') as nombre,
              dev.cliente_id,
              (dd.cantidad * p.precio_compra * -1) as costo_total,
              (dd.cantidad * p.precio_venta * -1) as total_neto
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id
          JOIN productos p ON dd.producto_id = p.id
          LEFT JOIN clientes cl ON dev.cliente_id = cl.id
          WHERE dev.empresa_id = ? AND dev.fecha BETWEEN ? AND ?

          UNION ALL

          -- 4. DEVOLUCIONES DE COMBOS (RESTAN)
          SELECT 
              IFNULL(cl.nombre_cliente, 'Consumidor Final') as nombre,
              dev.cliente_id,
              (dd.cantidad * (SELECT SUM(cp.cantidad * p2.precio_compra) FROM combo_producto cp JOIN productos p2 ON cp.producto_id = p2.id WHERE cp.combo_id = c.id) * -1) as costo_total,
              (dd.cantidad * c.precio_venta * -1) as total_neto
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id
          JOIN combos c ON dd.combo_id = c.id
          LEFT JOIN clientes cl ON dev.cliente_id = cl.id
          WHERE dev.empresa_id = ? AND dev.fecha BETWEEN ? AND ?
      ) as t
      GROUP BY cliente_id, nombre
      ORDER BY total DESC
    `;

    const [clientes] = await db.execute(query, [
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
            <td style="text-align: right;">$ ${costo.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
            })}</td>
            <td style="text-align: right;">$ ${ganancia.toLocaleString(
              "es-AR",
              { minimumFractionDigits: 2 }
            )}</td>
            <td style="text-align: right;">$ ${total.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
            })}</td>
        </tr>`;
    });

    const html = `
      <html>
      <head>
          <meta charset="UTF-8">
          <style>
              body { font-family: sans-serif; font-size: 12px; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .header h1 { color: #1a73e8; margin-bottom: 5px; }
              .table { width: 100%; border-collapse: collapse; }
              .table th { background-color: #1a73e8; color: white; padding: 10px; text-align: center; }
              .table td { padding: 10px; border-bottom: 1px solid #ddd; }
              .total-row { font-weight: bold; background-color: #e8f0fe; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Informe de Ventas por Cliente</h1>
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
                      <td style="text-align: right;">$ ${totalCosto.toLocaleString(
                        "es-AR",
                        { minimumFractionDigits: 2 }
                      )}</td>
                      <td style="text-align: right;">$ ${totalGanancia.toLocaleString(
                        "es-AR",
                        { minimumFractionDigits: 2 }
                      )}</td>
                      <td style="text-align: right;">$ ${totalGral.toLocaleString(
                        "es-AR",
                        { minimumFractionDigits: 2 }
                      )}</td>
                  </tr>
              </tbody>
          </table>
      </body>
      </html>`;

    const options = { format: "A4", orientation: "portrait", border: "10mm" };
    pdf.create(html, options).toBuffer((err, buffer) => {
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

    const query = `
            SELECT 
                fecha,
                SUM(efectivo) as efectivo,
                SUM(tarjeta) as tarjeta,
                SUM(mercadopago) as mercadopago,
                SUM(transferencia) as transferencia,
                SUM(total) as total
            FROM (
                -- 1. SUMAR LAS VENTAS POR DÍA
                SELECT 
                    DATE(fecha) as fecha,
                    IFNULL(efectivo, 0) as efectivo,
                    IFNULL(tarjeta, 0) as tarjeta,
                    IFNULL(mercadopago, 0) as mercadopago,
                    IFNULL(transferencia, 0) as transferencia,
                    IFNULL(precio_total, 0) as total
                FROM ventas
                WHERE empresa_id = ? AND fecha BETWEEN ? AND ?

                UNION ALL

                -- 2. RESTAR LAS DEVOLUCIONES (Siempre del efectivo)
                SELECT 
                    DATE(fecha) as fecha,
                    (IFNULL(precio_total, 0) * -1) as efectivo,
                    0 as tarjeta,
                    0 as mercadopago,
                    0 as transferencia,
                    (IFNULL(precio_total, 0) * -1) as total
                FROM devoluciones
                WHERE empresa_id = ? AND fecha BETWEEN ? AND ?
            ) as consolidado
            GROUP BY fecha
            ORDER BY fecha ASC
        `;

    const [rows] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin, // Parámetros para Ventas
      empresa_id,
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

    // Formateo de fechas para el título
    const fInicio = fecha_inicio.split("-").reverse().join("/");
    const fFin = fecha_fin.split("-").reverse().join("/");

    // QUERY CONSOLIDADA: Ventas (Suman) + Devoluciones (Restan del efectivo)
    const query = `
      SELECT 
          DATE_FORMAT(fecha, '%d/%m/%Y') as fecha_formateada,
          SUM(efectivo) as efectivo,
          SUM(tarjeta) as tarjeta,
          SUM(mercadopago) as mercadopago,
          SUM(transferencia) as transferencia,
          SUM(total) as total
      FROM (
          -- 1. VENTAS (Valores positivos)
          SELECT 
              DATE(fecha) as fecha, 
              IFNULL(efectivo, 0) as efectivo, 
              IFNULL(tarjeta, 0) as tarjeta, 
              IFNULL(mercadopago, 0) as mercadopago, 
              IFNULL(transferencia, 0) as transferencia, 
              IFNULL(precio_total, 0) as total
          FROM ventas 
          WHERE empresa_id = ? AND fecha BETWEEN ? AND ?

          UNION ALL

          -- 2. DEVOLUCIONES (Restan del efectivo y del total)
          SELECT 
              DATE(fecha) as fecha, 
              (IFNULL(precio_total, 0) * -1) as efectivo, 
              0 as tarjeta, 
              0 as mercadopago, 
              0 as transferencia, 
              (IFNULL(precio_total, 0) * -1) as total
          FROM devoluciones 
          WHERE empresa_id = ? AND fecha BETWEEN ? AND ?
      ) as consolidado
      GROUP BY fecha
      ORDER BY fecha ASC
    `;

    const [datos] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin, // Paratemetros Ventas
      empresa_id,
      fecha_inicio,
      fecha_fin, // Paratemetros Devoluciones
    ]);

    let filas = "";
    let tEfe = 0,
      tTar = 0,
      tMP = 0,
      tTra = 0,
      tGral = 0;

    datos.forEach((d) => {
      const efe = parseFloat(d.efectivo) || 0;
      const tar = parseFloat(d.tarjeta) || 0;
      const mp = parseFloat(d.mercadopago) || 0;
      const tra = parseFloat(d.transferencia) || 0;
      const tot = parseFloat(d.total) || 0;

      tEfe += efe;
      tTar += tar;
      tMP += mp;
      tTra += tra;
      tGral += tot;

      filas += `
        <tr>
            <td style="text-align: left;">${d.fecha_formateada}</td>
            <td style="text-align: right;">$ ${efe.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
            })}</td>
            <td style="text-align: right;">$ ${tar.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
            })}</td>
            <td style="text-align: right;">$ ${mp.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
            })}</td>
            <td style="text-align: right;">$ ${tra.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
            })}</td>
            <td style="text-align: right; font-weight: bold;">$ ${tot.toLocaleString(
              "es-AR",
              { minimumFractionDigits: 2 }
            )}</td>
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
              .table th { background-color: #1a73e8; color: white; padding: 8px; font-size: 10px; text-transform: uppercase; }
              .table td { padding: 8px; border-bottom: 1px solid #eee; }
              .total-row { font-weight: bold; background-color: #f1f1f1; border-top: 2px solid #1a73e8; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Informe de Ventas por Forma de Pago</h1>
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
                    '<tr><td colspan="6" style="text-align:center;">No hay movimientos en este período</td></tr>'
                  }
                  <tr class="total-row">
                      <td style="text-align: left;">TOTALES</td>
                      <td style="text-align: right;">$ ${tEfe.toLocaleString(
                        "es-AR",
                        { minimumFractionDigits: 2 }
                      )}</td>
                      <td style="text-align: right;">$ ${tTar.toLocaleString(
                        "es-AR",
                        { minimumFractionDigits: 2 }
                      )}</td>
                      <td style="text-align: right;">$ ${tMP.toLocaleString(
                        "es-AR",
                        { minimumFractionDigits: 2 }
                      )}</td>
                      <td style="text-align: right;">$ ${tTra.toLocaleString(
                        "es-AR",
                        { minimumFractionDigits: 2 }
                      )}</td>
                      <td style="text-align: right; color: #1a73e8;">$ ${tGral.toLocaleString(
                        "es-AR",
                        { minimumFractionDigits: 2 }
                      )}</td>
                  </tr>
              </tbody>
          </table>
      </body>
      </html>`;

    const options = { format: "A4", orientation: "landscape", border: "10mm" };

    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        console.error("ERROR CREANDO PDF:", err);
        return res.status(500).send("Error al generar el PDF");
      }
      res.setHeader("Content-Type", "application/pdf");
      res.send(buffer);
    });
  } catch (error) {
    console.error("ERROR GENERAL PDF:", error);
    res.status(500).send("Error interno del servidor");
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
    const empresa_id = req.user ? req.user.empresa_id : 1;

    // --- 1. CÁLCULO DE FECHA LOCAL ARGENTINA ---
    const options = {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    };
    const formatter = new Intl.DateTimeFormat("en-CA", options);
    const parts = formatter.formatToParts(new Date());
    const dateParts = {};
    parts.forEach((p) => (dateParts[p.type] = p.value));

    const todayStr = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
    const currentMonth = parseInt(dateParts.month);
    const currentYear = parseInt(dateParts.year);

    // --- 2. CONSULTA DE VENTAS Y DEVOLUCIONES (MONTO BRUTO) ---
    const [v] = await db.execute(
      `
      SELECT 
        IFNULL(SUM(CASE WHEN DATE(fecha) = ? THEN precio_total ELSE 0 END), 0) as dia,
        IFNULL(SUM(CASE WHEN MONTH(fecha) = ? AND YEAR(fecha) = ? THEN precio_total ELSE 0 END), 0) as mes,
        IFNULL(SUM(CASE WHEN YEAR(fecha) = ? THEN precio_total ELSE 0 END), 0) as anio
      FROM ventas WHERE empresa_id = ?
    `,
      [todayStr, currentMonth, currentYear, currentYear, empresa_id]
    );

    const [d] = await db.execute(
      `
      SELECT 
        IFNULL(SUM(CASE WHEN DATE(fecha) = ? THEN precio_total ELSE 0 END), 0) as dia,
        IFNULL(SUM(CASE WHEN MONTH(fecha) = ? AND YEAR(fecha) = ? THEN precio_total ELSE 0 END), 0) as mes,
        IFNULL(SUM(CASE WHEN YEAR(fecha) = ? THEN precio_total ELSE 0 END), 0) as anio,
        COUNT(id) as total_cantidad
      FROM devoluciones WHERE empresa_id = ?
    `,
      [todayStr, currentMonth, currentYear, currentYear, empresa_id]
    );

    // --- 3. GANANCIA BRUTA DE VENTAS (Incluye Productos y Combos) ---
    const [gVentas] = await db.execute(
      `
      SELECT 
        IFNULL(SUM(CASE WHEN DATE(fecha_v) = ? THEN ganancia ELSE 0 END), 0) as dia,
        IFNULL(SUM(CASE WHEN MONTH(fecha_v) = ? AND YEAR(fecha_v) = ? THEN ganancia ELSE 0 END), 0) as mes,
        IFNULL(SUM(CASE WHEN YEAR(fecha_v) = ? THEN ganancia ELSE 0 END), 0) as anio
      FROM (
        SELECT v.fecha as fecha_v, (dv.cantidad * (p.precio_venta - p.precio_compra)) as ganancia
        FROM detalle_ventas dv
        JOIN ventas v ON dv.venta_id = v.id
        JOIN productos p ON dv.producto_id = p.id
        WHERE v.empresa_id = ? AND dv.producto_id IS NOT NULL
        UNION ALL
        SELECT v.fecha as fecha_v, (dv.cantidad * (c.precio_venta - (SELECT SUM(cp.cantidad * p2.precio_compra) FROM combo_producto cp JOIN productos p2 ON cp.producto_id = p2.id WHERE cp.combo_id = c.id))) as ganancia
        FROM detalle_ventas dv
        JOIN ventas v ON dv.venta_id = v.id
        JOIN combos c ON dv.combo_id = c.id
        WHERE v.empresa_id = ? AND dv.combo_id IS NOT NULL
      ) as t_ventas
    `,
      [todayStr, currentMonth, currentYear, currentYear, empresa_id, empresa_id]
    );

    // --- 4. GANANCIA PERDIDA POR DEVOLUCIONES (Para restar de la ganancia bruta) ---
    const [gDevs] = await db.execute(
      `
        SELECT 
          IFNULL(SUM(CASE WHEN DATE(fecha_d) = ? THEN g_p ELSE 0 END), 0) as dia,
          IFNULL(SUM(CASE WHEN MONTH(fecha_d) = ? AND YEAR(fecha_d) = ? THEN g_p ELSE 0 END), 0) as mes,
          IFNULL(SUM(CASE WHEN YEAR(fecha_d) = ? THEN g_p ELSE 0 END), 0) as anio
        FROM (
          SELECT dev.fecha as fecha_d, (dd.cantidad * (p.precio_venta - p.precio_compra)) as g_p
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id
          JOIN productos p ON dd.producto_id = p.id
          WHERE dev.empresa_id = ? AND dd.producto_id IS NOT NULL
          UNION ALL
          SELECT dev.fecha as fecha_d, (dd.cantidad * (c.precio_venta - (SELECT SUM(cp.cantidad * p2.precio_compra) FROM combo_producto cp JOIN productos p2 ON cp.producto_id = p2.id WHERE cp.combo_id = c.id))) as g_p
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id
          JOIN combos c ON dd.combo_id = c.id
          WHERE dev.empresa_id = ? AND dd.combo_id IS NOT NULL
        ) as t_devs
    `,
      [todayStr, currentMonth, currentYear, currentYear, empresa_id, empresa_id]
    );

    // --- 5. TOTAL GASTOS (Egresos operativos) ---
    const [gas] = await db.execute(
      `
      SELECT 
        IFNULL(SUM(CASE WHEN DATE(fecha) = ? THEN monto ELSE 0 END), 0) as dia,
        IFNULL(SUM(CASE WHEN MONTH(fecha) = ? AND YEAR(fecha) = ? THEN monto ELSE 0 END), 0) as mes,
        IFNULL(SUM(CASE WHEN YEAR(fecha) = ? THEN monto ELSE 0 END), 0) as anio
      FROM gastos WHERE empresa_id = ?
    `,
      [todayStr, currentMonth, currentYear, currentYear, empresa_id]
    );

    // --- 6. DEUDA GENERAL ---
    const [deudaRows] = await db.execute(
      `
      SELECT IFNULL(SUM(CASE WHEN tipo = 'deuda' THEN importe ELSE 0 END), 0) - 
             IFNULL(SUM(CASE WHEN tipo = 'pago' THEN importe ELSE 0 END), 0) as total 
      FROM compras_cta_cte WHERE empresa_id = ?
    `,
      [empresa_id]
    );

    // --- 7. RANKING TOP 10 ---
    const [top] = await db.execute(
      `
        SELECT nombre, SUM(cant) as veces_vendido FROM (
          -- 1. PRODUCTOS VENDIDOS INDIVIDUALMENTE (Filtrados por unidad)
          SELECT p.nombre, SUM(dv.cantidad) as cant 
          FROM detalle_ventas dv 
          JOIN ventas v ON dv.venta_id = v.id 
          JOIN productos p ON dv.producto_id = p.id
          JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? 
            AND dv.producto_id IS NOT NULL 
            AND u.nombre = 'Unidad' -- 👈 SOLO CONTAMOS LOS QUE SON POR UNIDAD
          GROUP BY p.id, p.nombre

          UNION ALL

          -- 2. PRODUCTOS DENTRO DE COMBOS (Filtrados por unidad)
          SELECT p.nombre, SUM(dv.cantidad * cp.cantidad) as cant 
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id 
          JOIN combo_producto cp ON dv.combo_id = cp.combo_id
          JOIN productos p ON cp.producto_id = p.id 
          JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? 
            AND dv.combo_id IS NOT NULL 
            AND u.nombre = 'Unidad' -- 👈 SOLO CONTAMOS LOS QUE SON POR UNIDAD
          GROUP BY p.id, p.nombre
        ) t 
        GROUP BY nombre 
        ORDER BY veces_vendido DESC 
        LIMIT 10
    `,
      [empresa_id, empresa_id]
    );

    // --- CÁLCULOS FINALES ---
    // Ventas Neta = Ventas Brutas - Devoluciones
    const ventas_dia = Math.max(parseFloat(v[0].dia) - parseFloat(d[0].dia), 0);
    const ventas_mes = Math.max(parseFloat(v[0].mes) - parseFloat(d[0].mes), 0);
    const ventas_anio = Math.max(
      parseFloat(v[0].anio) - parseFloat(d[0].anio),
      0
    );

    // Ganancia Neta Real = (Ganancia Ventas - Ganancia Devoluciones) - Gastos
    const ganancia_dia =
      parseFloat(gVentas[0].dia) -
      parseFloat(gDevs[0].dia) -
      parseFloat(gas[0].dia);
    const ganancia_mes =
      parseFloat(gVentas[0].mes) -
      parseFloat(gDevs[0].mes) -
      parseFloat(gas[0].mes);
    const ganancia_anio =
      parseFloat(gVentas[0].anio) -
      parseFloat(gDevs[0].anio) -
      parseFloat(gas[0].anio);

    res.json({
      ventas_dia,
      ventas_mes,
      ventas_anio,
      ganancia_dia, // Puede ser negativo si hay pérdidas
      ganancia_mes,
      ganancia_anio,
      deuda_general: parseFloat(deudaRows[0].total || 0),
      devoluciones_dia: parseFloat(d[0].dia),
      devoluciones_mes: parseFloat(d[0].mes),
      devoluciones_anio: parseFloat(d[0].anio),
      devoluciones_total_cant: d[0].total_cantidad,
      topProductos: top,
    });
  } catch (error) {
    console.error("ERROR DASHBOARD:", error);
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
  countVentas,
  getVentasSummary,
  getVentasDashboard,
};
