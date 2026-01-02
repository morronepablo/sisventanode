// controllers/ventaController.js
const Venta = require("../models/Venta");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");

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
    res
      .status(500)
      .json({ message: "Error al obtener listado", error: error.message });
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
  try {
    const { codigo, cantidad, usuario_id, producto_id, combo_id } = req.body;
    const userId = usuario_id || req.user.id;
    const empresa_id = req.user.empresa_id;

    let item = null;
    let tipo = null;

    // 1. Prioridad: Si el frontend ya nos manda el ID (desde el modal), lo usamos directamente
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
    }
    // 2. Si no hay ID, buscamos por CÓDIGO (para el escáner o escritura manual)
    else if (codigo) {
      const term = codigo.toString().trim();
      // Buscamos en productos
      const [pRows] = await db.execute(
        "SELECT id, nombre, stock FROM productos WHERE (codigo = ? OR nombre LIKE ?) AND empresa_id = ? LIMIT 1",
        [term, `%${term}%`, empresa_id]
      );
      if (pRows.length > 0) {
        item = pRows[0];
        tipo = "producto";
      } else {
        // Buscamos en combos
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

    if (!item) {
      return res.json({
        success: false,
        message: "El producto o combo no fue encontrado.",
      });
    }

    // 3. Validación de Stock si es producto
    if (tipo === "producto" && item.stock < cantidad) {
      return res.json({
        success: false,
        message: `Stock insuficiente para ${item.nombre}.`,
      });
    }

    // 4. Insertar en tmp_ventas (Usamos session_id para el carrito)
    const columnaId = tipo === "producto" ? "producto_id" : "combo_id";
    await db.execute(
      `INSERT INTO tmp_ventas (cantidad, ${columnaId}, session_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`,
      [cantidad, item.id, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error en postTmpVenta:", error);
    res.status(500).json({ message: "Error interno", error: error.message });
  }
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
  try {
    const venta_id = await Venta.store(
      req.body,
      req.user.id,
      req.user.empresa_id
    );
    res.json({ success: true, venta_id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generarReporte = async (req, res) => {
  try {
    // 1. Obtener datos de empresa y ventas
    const [empresaRows] = await db.execute("SELECT * FROM empresas LIMIT 1");
    const empresa = empresaRows[0];

    // Obtenemos las ventas (Asegúrate de que Venta.getAll() esté funcionando)
    const ventas = await Venta.getAll(req.user?.empresa_id || 1);

    if (!empresa)
      return res.status(404).send("Configuración de empresa no encontrada");

    // 2. Preparar el Logo en Base64
    let logoBase64 = "";
    try {
      const logoPath = path.join(__dirname, "../src/assets/img", empresa.logo);
      if (fs.existsSync(logoPath)) {
        const bitmap = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${bitmap.toString("base64")}`;
      }
    } catch (e) {
      console.error("Error al cargar logo:", e);
    }

    // 3. Construir las filas de la tabla
    let tablaFilas = "";
    let totalGeneral = 0;

    ventas.forEach((v, index) => {
      const fecha = new Date(v.fecha).toLocaleDateString("es-AR");
      const precioTotal = parseFloat(v.precio_total);
      totalGeneral += precioTotal;

      tablaFilas += `
                <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td style="text-align: center;">${fecha}</td>
                    <td style="text-align: center;">T-${String(v.id).padStart(
                      8,
                      "0"
                    )}</td>
                    <td style="text-align: left;">${
                      v.cliente_nombre || "Consumidor Final"
                    }</td>
                    <td style="text-align: right;">$ ${precioTotal.toLocaleString(
                      "es-AR",
                      { minimumFractionDigits: 2 }
                    )}</td>
                </tr>
            `;
    });

    // 4. HTML del Reporte con ajuste en el Footer
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Helvetica', Arial, sans-serif; color: #333; margin: 0; }
                .header { background-color: #f8f9fa; padding: 20px; border-bottom: 2px solid #28a745; }
                .header table { width: 100%; }
                .content { padding: 20px; padding-bottom: 60px; } /* Añadido padding abajo para no solapar footer */
                h1 { color: #333; margin: 0; font-size: 24px; }
                h2 { color: #666; font-size: 18px; margin-bottom: 10px; }
                .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                .table th { background-color: #343a40; color: #fff; padding: 10px; text-align: center; font-size: 12px; border: 1px solid #dee2e6; }
                .table td { padding: 10px; font-size: 11px; border: 1px solid #dee2e6; }
                .total-box { text-align: right; margin-top: 20px; font-size: 14px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
                
                /* ESTILO DEL PIE DE PÁGINA CORREGIDO */
                .footer { 
                    position: fixed; 
                    bottom: 0; 
                    width: 100%; 
                    text-align: center; 
                    font-size: 9px; 
                    color: #777; 
                    padding-top: 35px; /* 👈 Aumentado para dar más espacio */
                    border-top: 1px solid #eee; /* Línea divisoria tenue */
                }
            </style>
        </head>
        <body>
            <div class="header">
                <table>
                    <tr>
                        <td style="width: 30%; font-size: 10px;">
                            <strong>${empresa.nombre_empresa}</strong><br>
                            CUIT: ${empresa.cuit}<br>
                            ${empresa.correo}<br>
                            ${empresa.telefono}
                        </td>
                        <td style="text-align: center; width: 40%;">
                            <h1>REPORTE DE VENTAS</h1>
                        </td>
                        <td style="text-align: right; width: 30%;">
                            ${
                              logoBase64
                                ? `<img src="${logoBase64}" style="width: 80px;">`
                                : ""
                            }
                        </td>
                    </tr>
                </table>
            </div>

            <div class="content">
                <h2>Listado General de Ventas</h2>
                <hr style="border: 0; border-top: 1px solid #eee;">
                <table class="table">
                    <thead>
                        <tr>
                            <th width="40">Nro</th>
                            <th width="100">Fecha</th>
                            <th width="120">Comprobante</th>
                            <th>Cliente</th>
                            <th width="120">Monto Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tablaFilas}
                    </tbody>
                </table>
                
                <div class="total-box">
                    TOTAL GENERAL VENDIDO: $ ${totalGeneral.toLocaleString(
                      "es-AR",
                      { minimumFractionDigits: 2 }
                    )}
                </div>
            </div>

            <div class="footer">
                Reporte generado el ${new Date().toLocaleString(
                  "es-AR"
                )} - Sistema de Ventas
            </div>
        </body>
        </html>
        `;

    const options = {
      format: "A4",
      orientation: "portrait",
      border: { top: "10mm", right: "10mm", bottom: "15mm", left: "10mm" }, // 👈 Aumentado margen inferior
    };

    pdf.create(htmlContent, options).toBuffer((err, buffer) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error al generar el PDF");
      }
      res.setHeader("Content-Type", "application/pdf");
      res.send(buffer);
    });
  } catch (error) {
    console.error("Error en reporte ventas:", error);
    res.status(500).send("Error interno");
  }
};

const getInformeProductos = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    // Agregamos un fallback por si req.user no está (aunque aquí debería estar por el middleware)
    const empresa_id = req.user ? req.user.empresa_id : 1;

    const query = `
            SELECT 
                p.codigo, 
                p.nombre, 
                SUM(dv.cantidad) as cantidad, 
                u.nombre as unidad, 
                p.precio_compra as costo, 
                p.precio_venta as venta,
                SUM(dv.cantidad * (p.precio_venta - p.precio_compra)) as ganancia,
                SUM(dv.cantidad * p.precio_venta) as total
            FROM detalle_ventas dv
            JOIN ventas v ON dv.venta_id = v.id
            JOIN productos p ON dv.producto_id = p.id
            LEFT JOIN unidads u ON p.unidad_id = u.id
            WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?
            GROUP BY p.id
            ORDER BY total DESC
        `;

    const [rows] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
    ]);
    res.json(rows);
  } catch (error) {
    console.error("ERROR EN getInformeProductos Ventas:", error.message);
    res.status(500).json({ message: "Error al procesar el informe" });
  }
};

const generarInformeProductosPDF = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.query.empresa_id || 1; // Ajustar según manejo de sesión

    const fInicio = fecha_inicio.split("-").reverse().join("/");
    const fFin = fecha_fin.split("-").reverse().join("/");

    const query = `
            SELECT 
                p.codigo, p.nombre, SUM(dv.cantidad) as cantidad, u.nombre as unidad, 
                p.precio_compra as costo, p.precio_venta as venta,
                SUM(dv.cantidad * (p.precio_venta - p.precio_compra)) as ganancia_total,
                SUM(dv.cantidad * p.precio_venta) as total
            FROM detalle_ventas dv
            JOIN ventas v ON dv.venta_id = v.id
            JOIN productos p ON dv.producto_id = p.id
            LEFT JOIN unidads u ON p.unidad_id = u.id
            WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?
            GROUP BY p.id ORDER BY p.nombre ASC
        `;

    const [productos] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
    ]);

    let filas = "";
    let totalCant = 0;
    let totalGanancia = 0;
    let totalGral = 0;

    productos.forEach((p) => {
      totalCant += parseFloat(p.cantidad);
      totalGanancia += parseFloat(p.ganancia_total);
      totalGral += parseFloat(p.total);

      filas += `
                <tr>
                    <td style="text-align: center;">${p.codigo}</td>
                    <td style="text-align: left;">${p.nombre}</td>
                    <td style="text-align: center;">${p.cantidad}</td>
                    <td style="text-align: center;">${p.unidad || "Unidad"}</td>
                    <td style="text-align: right;">$ ${parseFloat(
                      p.costo
                    ).toLocaleString("es-AR")}</td>
                    <td style="text-align: right;">$ ${parseFloat(
                      p.venta
                    ).toLocaleString("es-AR")}</td>
                    <td style="text-align: right;">$ ${parseFloat(
                      p.ganancia_total
                    ).toLocaleString("es-AR")}</td>
                    <td style="text-align: right;">$ ${parseFloat(
                      p.total
                    ).toLocaleString("es-AR")}</td>
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
                    .table th { background-color: #1a73e8; color: white; padding: 8px; }
                    .table td { padding: 8px; border-bottom: 1px solid #eee; }
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
                              "es-AR"
                            )}</td>
                            <td style="text-align: right;">$ ${totalGral.toLocaleString(
                              "es-AR"
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
    res.status(500).send(error.message);
  }
};

const getInformeClientes = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    // Verificación de seguridad para req.user
    const empresa_id = req.user ? req.user.empresa_id : 1;

    const query = `
            SELECT 
                IFNULL(cl.nombre_cliente, 'Consumidor Final') as nombre,
                SUM(dv.cantidad * IFNULL(p.precio_compra, 0)) as costo,
                SUM(dv.cantidad * IFNULL(p.precio_venta, 0)) as total,
                (SUM(dv.cantidad * IFNULL(p.precio_venta, 0)) - SUM(dv.cantidad * IFNULL(p.precio_compra, 0))) as ganancia
            FROM detalle_ventas dv
            JOIN ventas v ON dv.venta_id = v.id
            LEFT JOIN productos p ON dv.producto_id = p.id
            LEFT JOIN clientes cl ON v.cliente_id = cl.id
            WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?
            GROUP BY v.cliente_id, cl.nombre_cliente
            ORDER BY total DESC
        `;

    const [rows] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
    ]);
    res.json(rows);
  } catch (error) {
    console.error("ERROR EN getInformeClientes:", error);
    res.status(500).json({
      message: "Error al procesar el informe",
      error: error.message,
    });
  }
};

const generarInformeClientesPDF = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    // Formateo para el título
    const fInicio = fecha_inicio.split("-").reverse().join("/");
    const fFin = fecha_fin.split("-").reverse().join("/");

    // Consulta simplificada (como en compras, sin requerir empresa_id forzosamente)
    const query = `
            SELECT 
                IFNULL(cl.nombre_cliente, 'Consumidor Final') as nombre,
                SUM(dv.cantidad * IFNULL(p.precio_compra, 0)) as costo,
                SUM(dv.cantidad * IFNULL(p.precio_venta, 0)) as total,
                (SUM(dv.cantidad * IFNULL(p.precio_venta, 0)) - SUM(dv.cantidad * IFNULL(p.precio_compra, 0))) as ganancia
            FROM detalle_ventas dv
            JOIN ventas v ON dv.venta_id = v.id
            LEFT JOIN productos p ON dv.producto_id = p.id
            LEFT JOIN clientes cl ON v.cliente_id = cl.id
            WHERE v.fecha BETWEEN ? AND ?
            GROUP BY v.cliente_id, cl.nombre_cliente
            ORDER BY nombre ASC
        `;

    const [clientes] = await db.execute(query, [fecha_inicio, fecha_fin]);

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
                    <td style="text-align: right;">$ ${costo.toLocaleString(
                      "es-AR",
                      { minimumFractionDigits: 2 }
                    )}</td>
                    <td style="text-align: right;">$ ${ganancia.toLocaleString(
                      "es-AR",
                      { minimumFractionDigits: 2 }
                    )}</td>
                    <td style="text-align: right;">$ ${total.toLocaleString(
                      "es-AR",
                      { minimumFractionDigits: 2 }
                    )}</td>
                </tr>`;
    });

    const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Helvetica', Arial, sans-serif; color: #333; margin: 0; padding: 10px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h1 { color: #1a73e8; font-size: 22px; }
                    .table { width: 100%; border-collapse: collapse; }
                    .table thead th { background-color: #1a73e8; color: white; padding: 10px; font-size: 11px; text-transform: uppercase; }
                    .table tbody td { padding: 8px; font-size: 11px; border-bottom: 1px solid #eee; }
                    .total-row td { background-color: #e8f0fe; font-weight: bold; border-top: 2px solid #1a73e8; }
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
    console.error(error);
    res.status(500).send("Error interno");
  }
};

const getInformeMetodosPago = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    // Si por algún motivo el middleware falla, evitamos el crash con un valor por defecto
    const empresa_id = req.user ? req.user.empresa_id : 1;

    const query = `
            SELECT 
                DATE_FORMAT(fecha, '%Y-%m-%d') as fecha,
                SUM(IFNULL(efectivo, 0)) as efectivo,
                SUM(IFNULL(tarjeta, 0)) as tarjeta,
                SUM(IFNULL(mercadopago, 0)) as mercadopago,
                SUM(IFNULL(transferencia, 0)) as transferencia,
                SUM(IFNULL(precio_total, 0)) as total
            FROM ventas
            WHERE empresa_id = ? AND fecha BETWEEN ? AND ?
            GROUP BY DATE_FORMAT(fecha, '%Y-%m-%d')
            ORDER BY fecha ASC
        `;

    const [rows] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
    ]);
    res.json(rows);
  } catch (error) {
    console.error("ERROR EN getInformeMetodosPago:", error);
    res.status(500).json({ message: "Error interno", error: error.message });
  }
};

const generarInformeMetodosPagoPDF = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const fInicio = fecha_inicio.split("-").reverse().join("/");
    const fFin = fecha_fin.split("-").reverse().join("/");

    const query = `
            SELECT 
                DATE_FORMAT(fecha, '%d/%m/%Y') as fecha_formateada,
                SUM(IFNULL(efectivo, 0)) as efectivo,
                SUM(IFNULL(tarjeta, 0)) as tarjeta,
                SUM(IFNULL(mercadopago, 0)) as mercadopago,
                SUM(IFNULL(transferencia, 0)) as transferencia,
                SUM(IFNULL(precio_total, 0)) as total
            FROM ventas
            WHERE fecha BETWEEN ? AND ?
            GROUP BY DATE_FORMAT(fecha, '%Y-%m-%d')
            ORDER BY fecha ASC
        `;

    const [datos] = await db.execute(query, [fecha_inicio, fecha_fin]);

    let filas = "";
    let tEfe = 0,
      tTar = 0,
      tMP = 0,
      tTra = 0,
      tGral = 0;

    datos.forEach((d) => {
      tEfe += parseFloat(d.efectivo);
      tTar += parseFloat(d.tarjeta);
      tMP += parseFloat(d.mercadopago);
      tTra += parseFloat(d.transferencia);
      tGral += parseFloat(d.total);

      filas += `
                <tr>
                    <td style="text-align: left;">${d.fecha_formateada}</td>
                    <td style="text-align: right;">$ ${parseFloat(
                      d.efectivo
                    ).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}</td>
                    <td style="text-align: right;">$ ${parseFloat(
                      d.tarjeta
                    ).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}</td>
                    <td style="text-align: right;">$ ${parseFloat(
                      d.mercadopago
                    ).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}</td>
                    <td style="text-align: right;">$ ${parseFloat(
                      d.transferencia
                    ).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}</td>
                    <td style="text-align: right;">$ ${parseFloat(
                      d.total
                    ).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}</td>
                </tr>`;
    });

    const html = `
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: sans-serif; font-size: 11px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h1 { color: #1a73e8; }
                    .table { width: 100%; border-collapse: collapse; }
                    .table th { background-color: #1a73e8; color: white; padding: 8px; }
                    .table td { padding: 8px; border-bottom: 1px solid #eee; }
                    .total-row { font-weight: bold; background-color: #f1f1f1; }
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
                            <th style="text-align: right;">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filas}
                        <tr class="total-row">
                            <td>TOTALES</td>
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
                            <td style="text-align: right;">$ ${tGral.toLocaleString(
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
      if (err) return res.status(500).send("Error");
      res.setHeader("Content-Type", "application/pdf");
      res.send(buffer);
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getInformeMovimientoStock = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    // Blindaje de empresa_id
    const empresa_id = req.user ? req.user.empresa_id : 1;

    // 1. Productos CON movimiento
    const queryCon = `
            SELECT 
                p.nombre, 
                IFNULL(u.nombre, 'Unidad') as unidad, 
                SUM(IFNULL(dv.cantidad, 0)) as cantidad_vendida, 
                COUNT(DISTINCT v.id) as num_ventas
            FROM detalle_ventas dv
            JOIN ventas v ON dv.venta_id = v.id
            JOIN productos p ON dv.producto_id = p.id
            LEFT JOIN unidads u ON p.unidad_id = u.id
            WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?
            GROUP BY p.id, p.nombre, u.nombre
            ORDER BY cantidad_vendida DESC
        `;

    // 2. Productos SIN movimiento (Subquery mejorada)
    const querySin = `
            SELECT p.nombre
            FROM productos p
            WHERE p.empresa_id = ? 
            AND p.id NOT IN (
                SELECT DISTINCT dv.producto_id 
                FROM detalle_ventas dv
                JOIN ventas v ON dv.venta_id = v.id
                WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ? 
                AND dv.producto_id IS NOT NULL
            )
            ORDER BY p.nombre ASC
        `;

    const [conMovimiento] = await db.execute(queryCon, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
    ]);
    const [sinMovimiento] = await db.execute(querySin, [
      empresa_id,
      empresa_id,
      fecha_inicio,
      fecha_fin,
    ]);

    res.json({ conMovimiento, sinMovimiento });
  } catch (error) {
    console.error("ERROR EN getInformeMovimientoStock:", error);
    res.status(500).json({ message: "Error interno", error: error.message });
  }
};

const generarInformeMovimientoStockPDF = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const fInicio = fecha_inicio.split("-").reverse().join("/");
    const fFin = fecha_fin.split("-").reverse().join("/");

    // Consultas simplificadas para el PDF (sin filtrar por empresa_id para evitar nulos en window.open)
    const [conMovimiento] = await db.execute(
      `
            SELECT p.nombre, IFNULL(u.nombre, 'Unidad') as unidad, SUM(dv.cantidad) as cantidad_vendida, COUNT(DISTINCT v.id) as num_ventas
            FROM detalle_ventas dv
            JOIN ventas v ON dv.venta_id = v.id
            JOIN productos p ON dv.producto_id = p.id
            LEFT JOIN unidads u ON p.unidad_id = u.id
            WHERE v.fecha BETWEEN ? AND ?
            GROUP BY p.id, p.nombre, u.nombre
            ORDER BY cantidad_vendida DESC
        `,
      [fecha_inicio, fecha_fin]
    );

    const [sinMovimiento] = await db.execute(
      `
            SELECT p.nombre FROM productos p
            WHERE p.id NOT IN (
                SELECT DISTINCT dv.producto_id FROM detalle_ventas dv
                JOIN ventas v ON dv.venta_id = v.id
                WHERE v.fecha BETWEEN ? AND ? AND dv.producto_id IS NOT NULL
            ) ORDER BY p.nombre ASC
        `,
      [fecha_inicio, fecha_fin]
    );

    let filasCon = conMovimiento
      .map(
        (p, i) => `
            <tr>
                <td>${i + 1}</td>
                <td style="text-align: left">${p.nombre}</td>
                <td>${p.cantidad_vendida} ${p.unidad}</td>
                <td>${p.num_ventas}</td>
            </tr>`
      )
      .join("");

    let filasSin = sinMovimiento
      .map(
        (p, i) => `
            <tr>
                <td>${i + 1}</td>
                <td style="text-align: left">${p.nombre}</td>
                <td>0</td>
            </tr>`
      )
      .join("");

    const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: sans-serif; font-size: 11px; color: #333; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h1 { color: #1a73e8; }
                    .section-title { font-size: 13px; font-weight: bold; color: #1a73e8; margin-top: 20px; padding-bottom: 5px; border-bottom: 1px solid #1a73e8; }
                    .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    .table th { background-color: #1a73e8; color: white; padding: 8px; font-size: 10px; }
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
                    <thead><tr><th width="30">#</th><th style="text-align:left">Producto</th><th width="100">Cantidad</th><th width="80">Ventas</th></tr></thead>
                    <tbody>${
                      filasCon || '<tr><td colspan="4">No hay datos</td></tr>'
                    }</tbody>
                </table>
                <div class="section-title">Sin Movimientos</div>
                <table class="table">
                    <thead><tr><th width="30">#</th><th style="text-align:left">Producto</th><th width="100">Ventas</th></tr></thead>
                    <tbody>${
                      filasSin || '<tr><td colspan="3">No hay datos</td></tr>'
                    }</tbody>
                </table>
            </body>
            </html>`;

    const options = { format: "A4", border: "10mm" };
    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) return res.status(500).send("Error al crear PDF");
      res.setHeader("Content-Type", "application/pdf");
      res.send(buffer);
    });
  } catch (error) {
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
  countVentas,
  getVentasSummary,
};
