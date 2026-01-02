// controllers/compraController.js
const Compra = require("../models/Compra");
const db = require("../config/db");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");

const getListadoCompras = async (req, res) => {
  try {
    const compras = await Compra.getAll();
    if (!compras || compras.length === 0) return res.json([]);

    const result = [];
    for (const c of compras) {
      const detalles = await Compra.getDetallesByCompraId(c.id);
      result.push({ ...c, detalles });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener listado" });
  }
};

const getCompraById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(
      `SELECT c.*, p.empresa as proveedor_nombre 
       FROM compras c 
       LEFT JOIN proveedors p ON c.proveedor_id = p.id 
       WHERE c.id = ?`,
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Compra no encontrada" });

    const detalles = await Compra.getDetallesByCompraId(id);
    res.json({ ...rows[0], detalles });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getTmpCompras = async (req, res) => {
  try {
    const { usuario_id } = req.query;
    if (!usuario_id)
      return res.status(400).json({ message: "Falta usuario_id" });
    const items = await Compra.getTmpItems(usuario_id);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const postTmpCompra = async (req, res) => {
  try {
    await Compra.addTmpItem(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTmpCompra = async (req, res) => {
  try {
    await Compra.deleteTmpItem(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const storeCompra = async (req, res) => {
  try {
    await Compra.store(req.body, req.body.usuario_id, req.body.empresa_id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCompra = async (req, res) => {
  try {
    const { id } = req.params;
    await Compra.delete(id);
    res.json({ message: "Eliminada" });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

const updatePrecioCompra = async (req, res) => {
  try {
    await Compra.updatePrecioProducto(
      req.body.producto_id,
      req.body.precio_compra
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generarReporte = async (req, res) => {
  try {
    // 1. Obtener datos de empresa y compras
    const [empresaRows] = await db.execute("SELECT * FROM empresas LIMIT 1");
    const empresa = empresaRows[0];

    // Obtenemos las compras (Asegúrate de que traiga el nombre del proveedor)
    const compras = await Compra.getAll();

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

    // 3. Construir las filas de la tabla y calcular total
    let tablaFilas = "";
    let totalGeneral = 0;

    compras.forEach((c, index) => {
      const fecha = new Date(c.fecha).toLocaleDateString("es-AR");
      const precioTotal = parseFloat(c.precio_total);
      totalGeneral += precioTotal;

      tablaFilas += `
                <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td style="text-align: center;">${fecha}</td>
                    <td style="text-align: left;">${c.comprobante}</td>
                    <td style="text-align: left;">${
                      c.proveedor_nombre || "N/A"
                    }</td>
                    <td style="text-align: right;">$ ${precioTotal.toLocaleString(
                      "es-AR",
                      { minimumFractionDigits: 2 }
                    )}</td>
                </tr>
            `;
    });

    // 4. HTML del Reporte (Estilo sincronizado con Ventas)
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Helvetica', Arial, sans-serif; color: #333; margin: 0; }
                .header { background-color: #f8f9fa; padding: 20px; border-bottom: 2px solid #007bff; }
                .header table { width: 100%; }
                .content { padding: 20px; padding-bottom: 60px; }
                h1 { color: #333; margin: 0; font-size: 24px; }
                h2 { color: #666; font-size: 18px; margin-bottom: 10px; }
                .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                .table th { background-color: #343a40; color: #fff; padding: 10px; text-align: center; font-size: 12px; border: 1px solid #dee2e6; }
                .table td { padding: 10px; font-size: 11px; border: 1px solid #dee2e6; }
                .total-box { text-align: right; margin-top: 20px; font-size: 14px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
                
                .footer { 
                    position: fixed; 
                    bottom: 0; 
                    width: 100%; 
                    text-align: center; 
                    font-size: 9px; 
                    color: #777; 
                    padding-top: 35px; 
                    border-top: 1px solid #eee;
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
                            <h1>SISTEMA DE VENTAS</h1>
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
                <h2>Reporte General de Compras</h2>
                <hr style="border: 0; border-top: 1px solid #eee;">
                <table class="table">
                    <thead>
                        <tr>
                            <th width="40">Nro</th>
                            <th width="90">Fecha</th>
                            <th width="150">Comprobante</th>
                            <th>Proveedor</th>
                            <th width="120">Monto Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tablaFilas}
                    </tbody>
                </table>
                
                <div class="total-box">
                    TOTAL GENERAL COMPRADO: $ ${totalGeneral.toLocaleString(
                      "es-AR",
                      { minimumFractionDigits: 2 }
                    )}
                </div>
            </div>

            <div class="footer">
                Reporte generado el ${new Date().toLocaleString(
                  "es-AR"
                )} - Página 1
            </div>
        </body>
        </html>
        `;

    const options = {
      format: "A4",
      orientation: "portrait",
      border: { top: "10mm", right: "10mm", bottom: "15mm", left: "10mm" },
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
    console.error("Error en reporte compras:", error);
    res.status(500).send("Error interno");
  }
};

const getInformeProductos = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    // LOG para ver qué fechas llegan al servidor
    console.log(`Generando informe desde ${fecha_inicio} hasta ${fecha_fin}`);

    const query = `
            SELECT 
                p.codigo, 
                p.nombre, 
                SUM(dc.cantidad) as cantidad, 
                u.nombre as unidad, 
                p.precio_compra as costo, 
                SUM(dc.cantidad * p.precio_compra) as total
            FROM detalle_compras dc
            JOIN compras c ON dc.compra_id = c.id
            JOIN productos p ON dc.producto_id = p.id
            LEFT JOIN unidads u ON p.unidad_id = u.id
            WHERE c.fecha BETWEEN ? AND ?
            GROUP BY p.codigo, p.nombre, u.nombre, p.precio_compra
            ORDER BY total DESC
        `;

    const [rows] = await db.execute(query, [fecha_inicio, fecha_fin]);
    res.json(rows);
  } catch (error) {
    console.error("ERROR EN getInformeProductos:", error.message);
    res.status(500).json({
      message: "Error en el servidor al procesar el informe",
      error: error.message,
    });
  }
};

const generarInformeProductosPDF = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    // Formateo de fechas para el título (de YYYY-MM-DD a DD/MM/YYYY)
    const fInicio = fecha_inicio.split("-").reverse().join("/");
    const fFin = fecha_fin.split("-").reverse().join("/");

    const query = `
            SELECT 
                p.codigo, 
                p.nombre, 
                SUM(dc.cantidad) as cantidad, 
                u.nombre as unidad, 
                p.precio_compra as costo, 
                SUM(dc.cantidad * p.precio_compra) as total
            FROM detalle_compras dc
            JOIN compras c ON dc.compra_id = c.id
            JOIN productos p ON dc.producto_id = p.id
            LEFT JOIN unidads u ON p.unidad_id = u.id
            WHERE c.fecha BETWEEN ? AND ?
            GROUP BY p.codigo, p.nombre, u.nombre, p.precio_compra
            ORDER BY p.nombre ASC
        `;

    const [productos] = await db.execute(query, [fecha_inicio, fecha_fin]);

    let filas = "";
    let totalCant = 0;
    let totalGeneral = 0;

    productos.forEach((p) => {
      const cant = parseFloat(p.cantidad);
      const costo = parseFloat(p.costo);
      const subtotal = parseFloat(p.total);

      totalCant += cant;
      totalGeneral += subtotal;

      filas += `
                <tr>
                    <td style="text-align: center; border-bottom: 1px solid #eee;">${
                      p.codigo
                    }</td>
                    <td style="text-align: left; border-bottom: 1px solid #eee;">${
                      p.nombre
                    }</td>
                    <td style="text-align: center; border-bottom: 1px solid #eee;">${
                      p.cantidad
                    }</td>
                    <td style="text-align: center; border-bottom: 1px solid #eee;">${
                      p.unidad || "Unidad"
                    }</td>
                    <td style="text-align: right; border-bottom: 1px solid #eee;">$ ${costo.toLocaleString(
                      "es-AR",
                      { minimumFractionDigits: 2 }
                    )}</td>
                    <td style="text-align: right; border-bottom: 1px solid #eee;">$ ${subtotal.toLocaleString(
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
                body { 
                    font-family: 'Helvetica', Arial, sans-serif; 
                    color: #333; 
                    margin: 0; 
                    padding: 0;
                }
                .header { text-align: center; margin-bottom: 25px; padding-top: 10px; }
                .header h1 { color: #1a73e8; font-size: 26px; margin-bottom: 5px; }
                .header p { color: #666; font-size: 14px; margin-top: 0; }
                
                .table { width: 100%; border-collapse: collapse; }
                
                /* Cabecera Azul */
                .table thead th { 
                    background-color: #1a73e8; 
                    color: white; 
                    padding: 12px 8px; 
                    font-size: 11px; 
                    text-transform: uppercase;
                    border: none;
                }

                /* Celdas */
                .table tbody td { 
                    padding: 10px 8px; 
                    font-size: 11px; 
                    color: #444;
                }

                /* Filas Cebra */
                .table tbody tr:nth-child(even) { background-color: #f9f9f9; }

                /* Fila de Totales */
                .total-row td { 
                    border-top: 2px solid #1a73e8; 
                    font-weight: bold;
                    font-size: 12px; 
                    padding: 15px 8px;
                    background-color: #ffffff;
                }

                .text-blue { color: #1a73e8; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Informe de Compras por Productos</h1>
                <p>Período: ${fInicio} - ${fFin}</p>
            </div>

            <table class="table">
                <thead>
                    <tr>
                        <th>CÓDIGO</th>
                        <th>PRODUCTO</th>
                        <th style="text-align: center;">CANTIDAD</th>
                        <th style="text-align: center;">UNIDAD</th>
                        <th style="text-align: right;">COSTO</th>
                        <th style="text-align: right;">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${filas}
                    <tr class="total-row">
                        <td colspan="2" style="text-align: center;">Total</td>
                        <td style="text-align: center;" class="text-blue">${totalCant}</td>
                        <td style="text-align: center;">-</td>
                        <td style="text-align: right;">-</td>
                        <td style="text-align: right;" class="text-blue">$ ${totalGeneral.toLocaleString(
                          "es-AR",
                          { minimumFractionDigits: 2 }
                        )}</td>
                    </tr>
                </tbody>
            </table>
        </body>
        </html>`;

    // CONFIGURACIÓN DE MÁRGENES Y ORIENTACIÓN
    const options = {
      format: "A4",
      orientation: "landscape",
      border: {
        top: "10mm", // Margen superior
        right: "10mm", // Margen derecho (1cm)
        bottom: "10mm", // Margen inferior
        left: "10mm", // Margen izquierdo (1cm)
      },
      type: "pdf",
    };

    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        console.error("Error al crear PDF:", err);
        return res.status(500).send("Error al generar el reporte");
      }
      res.setHeader("Content-Type", "application/pdf");
      res.send(buffer);
    });
  } catch (error) {
    console.error("Error General:", error);
    res.status(500).send(error.message);
  }
};

const getInformeProveedores = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const query = `
            SELECT 
                p.empresa, 
                p.marca, 
                SUM(c.precio_total) as costo, 
                SUM(c.precio_total) as total
            FROM compras c
            JOIN proveedors p ON c.proveedor_id = p.id
            WHERE c.fecha BETWEEN ? AND ?
            GROUP BY p.id
            ORDER BY total DESC
        `;
    const [rows] = await db.execute(query, [fecha_inicio, fecha_fin]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generarInformeProveedoresPDF = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const fInicio = fecha_inicio.split("-").reverse().join("/");
    const fFin = fecha_fin.split("-").reverse().join("/");

    const query = `
            SELECT p.empresa, p.marca, SUM(c.precio_total) as total
            FROM compras c
            JOIN proveedors p ON c.proveedor_id = p.id
            WHERE c.fecha BETWEEN ? AND ?
            GROUP BY p.id
            ORDER BY p.empresa ASC
        `;
    const [proveedores] = await db.execute(query, [fecha_inicio, fecha_fin]);

    let filas = "";
    let totalGeneral = 0;

    proveedores.forEach((p) => {
      const monto = parseFloat(p.total);
      totalGeneral += monto;
      filas += `
                <tr>
                    <td style="width: 40%; text-align: left;">${p.empresa}</td>
                    <td style="width: 30%; text-align: left;">${
                      p.marca || "-"
                    }</td>
                    <td style="width: 15%; text-align: right;">$ ${monto.toLocaleString(
                      "es-AR",
                      { minimumFractionDigits: 2 }
                    )}</td>
                    <td style="width: 15%; text-align: right;">$ ${monto.toLocaleString(
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
                body { font-family: 'Helvetica', Arial, sans-serif; color: #333; margin: 0; padding: 0; }
                .header { text-align: center; margin-bottom: 25px; padding-top: 10px; }
                .header h1 { color: #1a73e8; font-size: 26px; margin-bottom: 5px; }
                .header p { color: #666; font-size: 14px; }
                .table { width: 100%; border-collapse: collapse; }
                .table thead th { background-color: #1a73e8; color: white; padding: 12px 8px; font-size: 11px; text-transform: uppercase; text-align: left; }
                .table tbody td { padding: 10px 8px; font-size: 11px; border-bottom: 1px solid #eee; }
                .table tbody tr:nth-child(even) { background-color: #f9f9f9; }
                .total-row td { border-top: 2px solid #1a73e8; font-weight: bold; font-size: 12px; padding: 15px 8px; }
                .text-right { text-align: right !important; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Informe de Compras por Proveedor</h1>
                <p>Período: ${fInicio} - ${fFin}</p>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>PROVEEDOR</th>
                        <th>MARCA</th>
                        <th class="text-right">COSTO</th>
                        <th class="text-right">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${
                      filas ||
                      '<tr><td colspan="4" style="text-align:center">No hay datos</td></tr>'
                    }
                    <tr class="total-row">
                        <td colspan="2" style="text-align: center;">Total</td>
                        <td class="text-right">$ ${totalGeneral.toLocaleString(
                          "es-AR",
                          { minimumFractionDigits: 2 }
                        )}</td>
                        <td class="text-right" style="color: #1a73e8;">$ ${totalGeneral.toLocaleString(
                          "es-AR",
                          { minimumFractionDigits: 2 }
                        )}</td>
                    </tr>
                </tbody>
            </table>
        </body>
        </html>`;

    const options = {
      format: "A4",
      orientation: "landscape",
      border: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    };

    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) return res.status(500).send("Error al generar PDF");
      res.setHeader("Content-Type", "application/pdf");
      res.send(buffer);
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getInformeNoPagadas = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const query = `
            SELECT c.id, c.fecha, p.empresa as proveedor, c.comprobante, c.precio_total, c.deuda 
            FROM compras c 
            JOIN proveedors p ON c.proveedor_id = p.id 
            WHERE c.deuda > 0 AND c.fecha BETWEEN ? AND ? 
            ORDER BY c.fecha DESC`;
    const [rows] = await db.execute(query, [fecha_inicio, fecha_fin]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generarInformeNoPagadasPDF = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const fInicio = fecha_inicio.split("-").reverse().join("/");
    const fFin = fecha_fin.split("-").reverse().join("/");

    const query = `
            SELECT c.id, c.fecha, p.empresa as proveedor, c.comprobante, c.precio_total, c.deuda 
            FROM compras c 
            JOIN proveedors p ON c.proveedor_id = p.id 
            WHERE c.deuda > 0 AND c.fecha BETWEEN ? AND ? 
            ORDER BY c.fecha ASC`;
    const [compras] = await db.execute(query, [fecha_inicio, fecha_fin]);

    let filas = "";
    let totalP = 0;
    let totalD = 0;

    compras.forEach((c) => {
      totalP += parseFloat(c.precio_total);
      totalD += parseFloat(c.deuda);
      filas += `
                <tr>
                    <td style="width: 8%; text-align: center;">${c.id}</td>
                    <td style="width: 12%; text-align: center;">${new Date(
                      c.fecha
                    ).toLocaleDateString("es-AR")}</td>
                    <td style="width: 30%; text-align: left;">${
                      c.proveedor
                    }</td>
                    <td style="width: 20%; text-align: left;">${
                      c.comprobante
                    }</td>
                    <td style="width: 15%; text-align: right;">$ ${parseFloat(
                      c.precio_total
                    ).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}</td>
                    <td style="width: 15%; text-align: right; color: #dc3545; font-weight: bold;">$ ${parseFloat(
                      c.deuda
                    ).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}</td>
                </tr>`;
    });

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Helvetica', Arial, sans-serif; color: #333; margin: 0; padding: 0; }
                .header { text-align: center; margin-bottom: 25px; padding-top: 10px; }
                .header h1 { color: #1a73e8; font-size: 26px; margin-bottom: 5px; }
                .header p { color: #666; font-size: 14px; }
                .table { width: 100%; border-collapse: collapse; }
                .table thead th { background-color: #1a73e8; color: white; padding: 12px 8px; font-size: 11px; text-transform: uppercase; text-align: left; }
                .table tbody td { padding: 10px 8px; font-size: 11px; border-bottom: 1px solid #eee; }
                .table tbody tr:nth-child(even) { background-color: #f9f9f9; }
                .total-row td { border-top: 2px solid #1a73e8; font-weight: bold; font-size: 12px; padding: 15px 8px; }
                .text-right { text-align: right !important; }
                .text-center { text-align: center !important; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Informe de Compras no Pagadas</h1>
                <p>Período: ${fInicio} - ${fFin}</p>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th class="text-center">ID</th>
                        <th class="text-center">FECHA</th>
                        <th>PROVEEDOR</th>
                        <th>COMPROBANTE</th>
                        <th class="text-right">PRECIO TOTAL</th>
                        <th class="text-right">DEUDA</th>
                    </tr>
                </thead>
                <tbody>
                    ${
                      filas ||
                      '<tr><td colspan="6" style="text-align:center">No hay compras pendientes en este rango</td></tr>'
                    }
                    <tr class="total-row">
                        <td colspan="4" class="text-center">Totales</td>
                        <td class="text-right">$ ${totalP.toLocaleString(
                          "es-AR",
                          { minimumFractionDigits: 2 }
                        )}</td>
                        <td class="text-right" style="color: #dc3545;">$ ${totalD.toLocaleString(
                          "es-AR",
                          { minimumFractionDigits: 2 }
                        )}</td>
                    </tr>
                </tbody>
            </table>
        </body>
        </html>`;

    const options = {
      format: "A4",
      orientation: "landscape",
      border: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    };

    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) return res.status(500).send("Error al generar PDF");
      res.setHeader("Content-Type", "application/pdf");
      res.send(buffer);
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const countCompras = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT COUNT(*) AS total FROM compras");
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error al contar compras:", error);
    res.status(500).json({ total: 0 });
  }
};

const getComprasSummary = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const [totalRows] = await db.execute(
      "SELECT COUNT(*) AS total FROM compras"
    );
    const [yearRows] = await db.execute(
      "SELECT COUNT(*) AS totalAnio FROM compras WHERE YEAR(fecha) = ?",
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
  getListadoCompras,
  getCompraById,
  getTmpCompras,
  postTmpCompra,
  deleteTmpCompra,
  storeCompra,
  deleteCompra,
  updatePrecioCompra,
  generarReporte,
  getInformeProductos,
  generarInformeProductosPDF,
  getInformeProveedores,
  generarInformeProveedoresPDF,
  getInformeNoPagadas,
  generarInformeNoPagadasPDF,
  countCompras,
  getComprasSummary,
};
