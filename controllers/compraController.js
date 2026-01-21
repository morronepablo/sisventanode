// controllers/compraController.js
const Compra = require("../models/Compra");
const db = require("../config/db");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");
const { registrarLog } = require("../utils/logger"); // 👈 Importamos el logger
const { sendWS } = require("../utils/whatsapp");

const getListadoCompras = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    // Asumimos que Compra.getAll() ahora acepta empresa_id para filtrar
    const compras = await Compra.getAll(empresa_id);

    if (!compras || compras.length === 0) return res.json([]);

    const result = [];
    for (const c of compras) {
      const detalles = await Compra.getDetallesByCompraId(c.id);
      result.push({ ...c, detalles });
    }
    res.json(result);
  } catch (error) {
    console.error("Error en listado compras:", error);
    res.status(500).json({ message: "Error al obtener listado" });
  }
};

const getCompraById = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    const [rows] = await db.execute(
      `SELECT c.*, p.empresa as proveedor_nombre 
       FROM compras c 
       LEFT JOIN proveedors p ON c.proveedor_id = p.id 
       WHERE c.id = ? AND c.empresa_id = ?`,
      [id, empresa_id],
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
    const query = `
      SELECT t.*, p.nombre, p.codigo 
      FROM tmp_compras t 
      JOIN productos p ON t.producto_id = p.id 
      WHERE t.usuario_id = ?
    `;
    const [rows] = await db.execute(query, [req.query.usuario_id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const postTmpCompra = async (req, res) => {
  try {
    const { producto_id, cantidad, usuario_id, proveedor_id } = req.body;

    // 1. Obtener precio del maestro
    const [prod] = await db.execute(
      "SELECT precio_compra FROM productos WHERE id = ?",
      [producto_id],
    );
    const precio_maestro = prod[0] ? parseFloat(prod[0].precio_compra) : 0;

    // 2. 🚩 ALERTA DE TRAICIÓN: Último precio con ESTE proveedor
    const [priceSpecific] = await db.execute(
      `SELECT dc.precio_compra FROM detalle_compras dc 
       JOIN compras c ON dc.compra_id = c.id 
       WHERE dc.producto_id = ? AND c.proveedor_id = ? 
       ORDER BY c.fecha DESC, c.id DESC LIMIT 1`,
      [producto_id, proveedor_id],
    );
    const precio_anterior =
      priceSpecific.length > 0
        ? parseFloat(priceSpecific[0].precio_compra)
        : precio_maestro;

    // 3. 🤝 EL NEGOCIADOR: Buscar el MEJOR PRECIO (mínimo) de los últimos 90 días entre TODOS los proveedores
    const [bestPriceRows] = await db.execute(
      `SELECT dc.precio_compra, prov.empresa as proveedor_nombre
       FROM detalle_compras dc 
       JOIN compras c ON dc.compra_id = c.id 
       JOIN proveedors prov ON c.proveedor_id = prov.id
       WHERE dc.producto_id = ? AND c.empresa_id = ? 
         AND c.fecha >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
       ORDER BY dc.precio_compra ASC LIMIT 1`,
      [producto_id, req.user.empresa_id],
    );

    const mejor_precio =
      bestPriceRows.length > 0 ? parseFloat(bestPriceRows[0].precio_compra) : 0;
    const mejor_proveedor =
      bestPriceRows.length > 0 ? bestPriceRows[0].proveedor_nombre : null;

    // Insertamos incluyendo los datos para el Negociador
    await db.execute(
      `INSERT INTO tmp_compras 
       (producto_id, cantidad, precio_compra, precio_anterior, mejor_precio, mejor_proveedor, usuario_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        producto_id,
        cantidad,
        precio_maestro,
        precio_anterior,
        mejor_precio,
        mejor_proveedor,
        usuario_id,
      ],
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error en postTmpCompra:", error);
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
  const connection = await db.getConnection(); // Obtenemos la conexión única
  try {
    await connection.beginTransaction(); // Iniciamos la transacción aquí

    const {
      id_proveedor,
      comprobante,
      numero,
      precio_total,
      empresa_id,
      usuario_id,
    } = req.body;

    // 1. Obtener items del carrito para comparar precios
    // Usamos 'connection' para asegurar que estamos dentro de la transacción
    const [items] = await connection.execute(
      "SELECT * FROM tmp_compras WHERE usuario_id = ?",
      [usuario_id],
    );

    for (const item of items) {
      const [prod] = await connection.execute(
        "SELECT precio_compra, valor_porcentaje, nombre FROM productos WHERE id = ?",
        [item.producto_id],
      );

      const costoNuevo = parseFloat(item.precio_compra);
      const costoAnterior = parseFloat(prod[0].precio_compra);
      const margen = parseFloat(prod[0].valor_porcentaje || 0);

      // 2. Si el costo es diferente, actualizamos Producto y grabamos Historial
      if (costoNuevo !== costoAnterior) {
        // Cálculo del nuevo precio de venta (Costo + Margen original)
        const nuevoPrecioVenta = costoNuevo * (1 + margen / 100);

        await connection.execute(
          "UPDATE productos SET precio_compra = ?, precio_venta = ?, updated_at = NOW() WHERE id = ?",
          [costoNuevo, nuevoPrecioVenta.toFixed(2), item.producto_id],
        );

        // Guardamos el cambio en el historial para los gráficos de inflación
        await connection.execute(
          "INSERT INTO historial_precios (producto_id, precio_anterior, precio_nuevo, costo_anterior, costo_nuevo, fecha_cambio) VALUES (?, ?, ?, ?, ?, NOW())",
          [
            item.producto_id,
            (costoAnterior * (1 + margen / 100)).toFixed(2), // Precio de venta anterior
            nuevoPrecioVenta.toFixed(2), // Precio de venta nuevo
            costoAnterior, // Costo anterior
            costoNuevo, // Costo nuevo
          ],
        );
      }
    }

    // 3. 🚀 CLAVE: Pasar la 'connection' como cuarto parámetro al modelo 🚀
    // Esto evita el Lock Timeout porque el modelo usará la transacción abierta aquí
    await Compra.store(req.body, usuario_id, empresa_id, connection);

    await connection.commit(); // Si todo salió bien, guardamos los cambios

    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");

    await registrarLog(
      req,
      "CREAR",
      "COMPRAS",
      `Compra registrada $${precio_total}. Recalculo de precios ejecutado.`,
    );

    res.json({ success: true });
  } catch (error) {
    // Si algo falla, el rollback deshace los cambios en productos, historial y compra
    if (connection) await connection.rollback();
    console.error("ERROR EN STORE COMPRA:", error.message);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    // IMPORTANTÍSIMO: Liberar la conexión para que otros puedan usarla
    if (connection) connection.release();
  }
};

const deleteCompra = async (req, res) => {
  console.log("--- INICIO DELETE COMPRA ---");
  try {
    const { id } = req.params;

    // Obtenemos info básica antes de borrar para el log
    const [compraInfo] = await db.execute(
      "SELECT precio_total, comprobante FROM compras WHERE id = ?",
      [id],
    );

    await Compra.delete(id);
    console.log(`[COMPRAS] Compra ID ${id} eliminada.`);

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "ELIMINAR",
      "COMPRAS",
      `Se eliminó la compra ID: ${id}. Monto: $${
        compraInfo[0]?.precio_total || "?"
      }`,
    );

    res.json({ message: "Eliminada" });
  } catch (error) {
    console.error("[COMPRAS ERROR] Error al eliminar compra:", error);
    res.status(500).json({ message: "Error" });
  }
  console.log("--- FIN DELETE COMPRA ---");
};

const updatePrecioCompra = async (req, res) => {
  console.log("--- INICIO UPDATE PRECIO COMPRA ---");
  try {
    const { producto_id, precio_compra } = req.body;
    await Compra.updatePrecioProducto(producto_id, precio_compra);

    // 👈 2. EMITIR EVENTO EN TIEMPO REAL PARA EL DASHBOARD
    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "EDITAR",
      "PRODUCTOS_PRECIO",
      `Actualización de precio de costo desde Compras. Producto ID: ${producto_id} a $${precio_compra}`,
    );

    res.json({ success: true });
  } catch (error) {
    console.error("[COMPRAS ERROR] Fallo al actualizar precio:", error);
    res.status(500).json({ message: error.message });
  }
  console.log("--- FIN UPDATE PRECIO COMPRA ---");
};

const generarReporte = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const [empresaRows] = await db.execute(
      "SELECT * FROM empresas WHERE id = ?",
      [empresa_id],
    );
    const empresa = empresaRows[0];
    const compras = await Compra.getAll(empresa_id);

    if (!empresa) return res.status(404).send("Empresa no encontrada");

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

    let tablaFilas = "";
    let totalGeneral = 0;
    compras.forEach((c, index) => {
      const fecha = new Date(c.fecha).toLocaleDateString("es-AR");
      const precioTotal = parseFloat(c.precio_total);
      totalGeneral += precioTotal;
      tablaFilas += `<tr><td style="text-align: center;">${
        index + 1
      }</td><td style="text-align: center;">${fecha}</td><td>${
        c.comprobante
      }</td><td>${
        c.proveedor_nombre || "N/A"
      }</td><td style="text-align: right;">$ ${precioTotal.toLocaleString(
        "es-AR",
        { minimumFractionDigits: 2 },
      )}</td></tr>`;
    });

    const htmlContent = `<html><head><meta charset="UTF-8"><style>body { font-family: Helvetica; color: #333; } .header { background-color: #f8f9fa; padding: 20px; border-bottom: 2px solid #007bff; } .table { width: 100%; border-collapse: collapse; margin-top: 20px; } .table th { background-color: #343a40; color: #fff; padding: 10px; font-size: 12px; } .table td { padding: 10px; font-size: 11px; border: 1px solid #dee2e6; } .total-box { text-align: right; margin-top: 20px; font-weight: bold; }</style></head><body><div class="header"><table><tr><td style="width: 30%; font-size: 10px;"><strong>${
      empresa.nombre_empresa
    }</strong><br>CUIT: ${
      empresa.cuit
    }</td><td style="text-align: center;"><h1>REPORTE COMPRAS</h1></td><td style="text-align: right;">${
      logoBase64 ? `<img src="${logoBase64}" style="width: 80px;">` : ""
    }</td></tr></table></div><div class="content"><table class="table"><thead><tr><th>Nro</th><th>Fecha</th><th>Comprobante</th><th>Proveedor</th><th>Total</th></tr></thead><tbody>${tablaFilas}</tbody></table><div class="total-box">TOTAL COMPRADO: $ ${totalGeneral.toLocaleString(
      "es-AR",
      { minimumFractionDigits: 2 },
    )}</div></div></body></html>`;

    const options = { format: "A4", orientation: "portrait", border: "10mm" };
    pdf.create(htmlContent, options).toBuffer((err, buffer) => {
      if (err) return res.status(500).send("Error PDF");
      res.setHeader("Content-Type", "application/pdf");
      res.send(buffer);
    });
  } catch (error) {
    res.status(500).send("Error interno");
  }
};

const getInformeProductos = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.user.empresa_id;
    const query = `
            SELECT p.codigo, p.nombre, SUM(dc.cantidad) as cantidad, u.nombre as unidad, p.precio_compra as costo, SUM(dc.cantidad * p.precio_compra) as total
            FROM detalle_compras dc
            JOIN compras c ON dc.compra_id = c.id
            JOIN productos p ON dc.producto_id = p.id
            LEFT JOIN unidads u ON p.unidad_id = u.id
            WHERE c.empresa_id = ? AND c.fecha BETWEEN ? AND ?
            GROUP BY p.id, p.codigo, p.nombre, u.nombre, p.precio_compra
            ORDER BY total DESC
        `;
    const [rows] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
    ]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generarInformeProductosPDF = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.user.empresa_id;

    const fInicio = fecha_inicio.split("-").reverse().join("/");
    const fFin = fecha_fin.split("-").reverse().join("/");

    // 1. Obtener datos de la empresa para el encabezado
    const [empresaRows] = await db.execute(
      "SELECT * FROM empresas WHERE id = ?",
      [empresa_id],
    );
    const empresa = empresaRows[0];

    // 2. Obtener los datos del informe (Misma query que el listado)
    const query = `
        SELECT p.codigo, p.nombre, SUM(dc.cantidad) as cantidad, u.nombre as unidad, 
               p.precio_compra as costo, SUM(dc.cantidad * p.precio_compra) as total
        FROM detalle_compras dc
        JOIN compras c ON dc.compra_id = c.id
        JOIN productos p ON dc.producto_id = p.id
        LEFT JOIN unidads u ON p.unidad_id = u.id
        WHERE c.empresa_id = ? AND c.fecha BETWEEN ? AND ?
        GROUP BY p.id, p.codigo, p.nombre, u.nombre, p.precio_compra
        ORDER BY total DESC
    `;
    const [productos] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
    ]);

    // 3. Preparar el Logo en Base64
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

    // 4. Construir filas de la tabla
    let filas = "";
    let totalGral = 0;
    productos.forEach((p) => {
      totalGral += parseFloat(p.total);
      filas += `
        <tr>
            <td style="text-align: center;">${p.codigo || "N/A"}</td>
            <td>${p.nombre}</td>
            <td style="text-align: center;">${p.cantidad}</td>
            <td style="text-align: center;">${p.unidad || "Unid."}</td>
            <td style="text-align: right;">$ ${parseFloat(
              p.costo,
            ).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
            <td style="text-align: right;">$ ${parseFloat(
              p.total,
            ).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
        </tr>`;
    });

    // 5. HTML completo del reporte
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Helvetica', sans-serif; color: #333; font-size: 11px; }
            .header { border-bottom: 2px solid #007bff; padding: 10px; margin-bottom: 20px; }
            .table { width: 100%; border-collapse: collapse; }
            .table th { background-color: #343a40; color: #fff; padding: 8px; border: 1px solid #dee2e6; }
            .table td { padding: 8px; border: 1px solid #dee2e6; }
            .total-box { text-align: right; margin-top: 20px; font-size: 14px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
            #pageFooter { position: fixed; bottom: -15px; left: 0; right: 0; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
    </head>
    <body>
        <div class="header">
            <table style="width:100%">
                <tr>
                    <td style="width:70%">
                        <h1 style="margin:0">${empresa.nombre_empresa}</h1>
                        <p style="margin:5px 0">CUIT: ${
                          empresa.cuit
                        } | Reporte de Compras por Productos</p>
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

        <h2 style="text-align:center">Informe del ${fInicio} al ${fFin}</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Unidad</th>
                    <th>Costo Unit.</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${filas}
            </tbody>
        </table>

        <div class="total-box">
            TOTAL INVERTIDO: $ ${totalGral.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
            })}
        </div>

        <div id="pageFooter">
            Reporte generado el ${new Date().toLocaleString(
              "es-AR",
            )} - Sistema de Ventas
        </div>
    </body>
    </html>`;

    // 6. Generar el PDF
    const options = {
      format: "A4",
      border: { top: "10mm", right: "10mm", bottom: "25mm", left: "10mm" },
    };

    pdf.create(htmlContent, options).toBuffer((err, buffer) => {
      if (err) return res.status(500).send("Error al generar PDF");
      res.setHeader("Content-Type", "application/pdf");
      res.send(buffer);
    });
  } catch (error) {
    console.error("Error reporte productos PDF:", error);
    res.status(500).send("Error interno del servidor");
  }
};

const getInformeProveedores = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.user.empresa_id;

    // Ajustamos los nombres: 'proveedor' para la empresa y 'total' para el monto
    const query = `
      SELECT 
        p.empresa as proveedor, 
        p.marca, 
        COUNT(c.id) as cant_compras, 
        SUM(c.precio_total) as total
      FROM compras c
      JOIN proveedors p ON c.proveedor_id = p.id
      WHERE c.empresa_id = ? AND c.fecha BETWEEN ? AND ?
      GROUP BY p.id, p.empresa, p.marca
      ORDER BY total DESC`;

    const [rows] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
    ]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener informe" });
  }
};

const generarInformeProveedoresPDF = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.user.empresa_id;

    const [empresaRows] = await db.execute(
      "SELECT * FROM empresas WHERE id = ?",
      [empresa_id],
    );
    const empresa = empresaRows[0];

    const [datos] = await db.execute(
      `
      SELECT p.empresa as proveedor, p.marca, COUNT(c.id) as cant_compras, SUM(c.precio_total) as total
      FROM compras c 
      JOIN proveedors p ON c.proveedor_id = p.id
      WHERE c.empresa_id = ? AND c.fecha BETWEEN ? AND ? 
      GROUP BY p.id, p.empresa, p.marca 
      ORDER BY total DESC`,
      [empresa_id, fecha_inicio, fecha_fin],
    );

    let filas = "";
    let totalGral = 0;
    datos.forEach((d) => {
      totalGral += parseFloat(d.total);
      filas += `
        <tr>
          <td>${d.proveedor}</td>
          <td>${d.marca || "N/A"}</td>
          <td style="text-align:center">${d.cant_compras}</td>
          <td style="text-align:right">$ ${parseFloat(d.total).toLocaleString(
            "es-AR",
            { minimumFractionDigits: 2 },
          )}</td>
        </tr>`;
    });

    const html = `
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Helvetica; font-size: 11px; }
          .header { border-bottom: 2px solid #28a745; padding: 10px; margin-bottom: 20px; }
          .table { width: 100%; border-collapse: collapse; }
          .table th { background-color: #343a40; color: #fff; padding: 8px; }
          .table td { padding: 8px; border: 1px solid #eee; }
          .total { text-align: right; font-weight: bold; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${empresa.nombre_empresa}</h1>
          <p>Informe de Compras por Proveedor</p>
          <p>Período: ${fecha_inicio} al ${fecha_fin}</p>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Marca</th>
              <th>Cant. Facturas</th>
              <th>Total Invertido</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
        <div class="total">TOTAL GENERAL: $ ${totalGral.toLocaleString(
          "es-AR",
          { minimumFractionDigits: 2 },
        )}</div>
      </body>
      </html>`;

    pdf
      .create(html, { format: "A4", border: "10mm" })
      .toBuffer((err, buffer) => {
        if (err) return res.status(500).send("Error");
        res.setHeader("Content-Type", "application/pdf");
        res.send(buffer);
      });
  } catch (e) {
    res.status(500).send(e.message);
  }
};

const getInformeNoPagadas = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    // Alineamos los nombres de las columnas con lo que espera el Frontend
    const query = `
      SELECT 
        c.id,
        c.fecha, 
        c.comprobante, 
        p.empresa as proveedor, 
        c.precio_total, 
        c.deuda
      FROM compras c
      JOIN proveedors p ON c.proveedor_id = p.id
      WHERE c.empresa_id = ? AND c.deuda > 0
      ORDER BY c.fecha DESC`;

    const [rows] = await db.execute(query, [empresa_id]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener deudas" });
  }
};

const generarInformeNoPagadasPDF = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const [empresaRows] = await db.execute(
      "SELECT * FROM empresas WHERE id = ?",
      [empresa_id],
    );
    const empresa = empresaRows[0];

    const [datos] = await db.execute(
      `
      SELECT c.fecha, c.comprobante, p.empresa as proveedor, c.precio_total, c.deuda
      FROM compras c 
      JOIN proveedors p ON c.proveedor_id = p.id
      WHERE c.empresa_id = ? AND c.deuda > 0 
      ORDER BY c.fecha DESC`,
      [empresa_id],
    );

    let filas = "";
    let totalDeudaGral = 0;

    datos.forEach((d) => {
      totalDeudaGral += parseFloat(d.deuda);
      filas += `
        <tr>
          <td>${new Date(d.fecha).toLocaleDateString("es-AR")}</td>
          <td>${d.comprobante}</td>
          <td>${d.proveedor}</td>
          <td style="text-align:right">$ ${parseFloat(
            d.precio_total,
          ).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
          <td style="text-align:right; color:red; font-weight:bold">$ ${parseFloat(
            d.deuda,
          ).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
        </tr>`;
    });

    const html = `
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Helvetica; font-size: 11px; }
          .header { border-bottom: 2px solid #dc3545; padding: 10px; margin-bottom: 20px; }
          .table { width: 100%; border-collapse: collapse; }
          .table th { background-color: #343a40; color: #fff; padding: 8px; }
          .table td { padding: 8px; border: 1px solid #eee; }
          .total { text-align: right; font-weight: bold; font-size: 14px; margin-top: 20px; color: #dc3545; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${empresa.nombre_empresa}</h1>
          <p>Reporte de Cuentas por Pagar (Deudas con Proveedores)</p>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Comprobante</th>
              <th>Proveedor</th>
              <th>Monto Factura</th>
              <th>Saldo Pendiente</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
        <div class="total">DEUDA TOTAL PENDIENTE: $ ${totalDeudaGral.toLocaleString(
          "es-AR",
          { minimumFractionDigits: 2 },
        )}</div>
      </body>
      </html>`;

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

const updateTmpQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    if (parseFloat(cantidad) < 1) {
      return res
        .status(400)
        .json({ message: "La cantidad no puede ser menor a 1" });
    }

    await db.execute(
      "UPDATE tmp_compras SET cantidad = ?, updated_at = NOW() WHERE id = ?",
      [cantidad, id],
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error al actualizar cantidad temporal:", error);
    res.status(500).json({ message: "Error interno", error: error.message });
  }
};

const updateTmpPrice = async (req, res) => {
  try {
    const { id } = req.params; // ID de la tabla tmp_compras
    const { precio_compra } = req.body;

    await db.execute(
      "UPDATE tmp_compras SET precio_compra = ?, updated_at = NOW() WHERE id = ?",
      [precio_compra, id],
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error al actualizar precio:", error);
    res.status(500).json({ message: "Error interno" });
  }
};

const getAuditoriaTraicion = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // 1. Calculamos la Inflación Promedio del Local (últimos 30 días)
    const [inflacionLocal] = await db.execute(
      `
      SELECT IFNULL(AVG((costo_nuevo - costo_anterior) / costo_anterior * 100), 0) as promedio
      FROM historial_precios hp
      JOIN productos p ON hp.producto_id = p.id
      WHERE p.empresa_id = ? AND hp.fecha_cambio >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      AND hp.costo_anterior > 0
    `,
      [empresa_id],
    );

    const avgInflation = parseFloat(inflacionLocal[0].promedio || 0);

    // 2. Query de Auditoría Real: Compara factura vs factura anterior
    const query = `
      SELECT * FROM (
        SELECT 
          p.nombre,
          pr.empresa as proveedor,
          dc.precio_compra as costo_nuevo,
          -- Buscamos el precio de la compra anterior del MISMO producto
          LAG(dc.precio_compra) OVER (PARTITION BY dc.producto_id ORDER BY c.fecha ASC, dc.id ASC) as costo_anterior,
          c.fecha as fecha_cambio,
          c.comprobante
        FROM detalle_compras dc
        JOIN compras c ON dc.compra_id = c.id
        JOIN productos p ON dc.producto_id = p.id
        JOIN proveedors pr ON c.proveedor_id = pr.id
        WHERE p.empresa_id = ?
      ) as historial_real
      WHERE costo_anterior IS NOT NULL 
        AND fecha_cambio >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        -- Calculamos el aumento de esta compra específica
        AND ((costo_nuevo - costo_anterior) / costo_anterior * 100) > (? + 5)
      ORDER BY fecha_cambio DESC
    `;

    const [anomalias] = await db.execute(query, [empresa_id, avgInflation]);

    const reporte = anomalias.map((a) => {
      const aumento =
        ((a.costo_nuevo - a.costo_anterior) / a.costo_anterior) * 100;
      return {
        nombre: a.nombre,
        proveedor: a.proveedor,
        costo_anterior: parseFloat(a.costo_anterior).toFixed(2),
        costo_nuevo: parseFloat(a.costo_nuevo).toFixed(2),
        aumento_producto: aumento.toFixed(2),
        brecha: (aumento - avgInflation).toFixed(2),
        fecha: a.fecha_cambio,
        comprobante: a.comprobante,
      };
    });

    res.json({
      promedio_tienda: avgInflation.toFixed(2),
      anomalias: reporte,
    });
  } catch (error) {
    console.error("ERROR TRAICION:", error.message);
    res.status(500).json({ error: "Error al auditar aumentos reales" });
  }
};

const getSugerenciasCompra = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const DIAS_A_CUBRIR = 15;

    // CONSULTA NIVEL OLIMPO (Suma Ventas Directas + Ventas en Combos)
    const query = `
      SELECT 
        p.id, p.nombre, p.stock, p.stock_minimo,
        prov.id as proveedor_id, prov.empresa as proveedor_nombre, prov.telefono as proveedor_tel,
        COALESCE(v_stat.velocidad_diaria, 0) as velocidad_diaria
      FROM productos p
      -- 1. Buscamos el ULTIMO proveedor real (por ID de detalle compras)
      INNER JOIN (
          SELECT dc1.producto_id, c1.proveedor_id
          FROM detalle_compras dc1
          JOIN compras c1 ON dc1.compra_id = c1.id
          WHERE dc1.id IN (
              SELECT MAX(dc2.id) 
              FROM detalle_compras dc2
              JOIN compras c2 ON dc2.compra_id = c2.id
              WHERE c2.empresa_id = ?
              GROUP BY dc2.producto_id
          )
      ) as ultima_compra ON p.id = ultima_compra.producto_id
      JOIN proveedors prov ON ultima_compra.proveedor_id = prov.id
      -- 2. CALCULO DE VELOCIDAD REAL (DIRECTA + COMBOS)
      LEFT JOIN (
          SELECT producto_id, SUM(cantidad_total) / 30 as velocidad_diaria
          FROM (
              -- Ventas como producto individual
              SELECT dv.producto_id, SUM(dv.cantidad) as cantidad_total
              FROM detalle_ventas dv
              JOIN ventas v ON dv.venta_id = v.id
              WHERE v.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
                AND v.empresa_id = ? AND dv.producto_id IS NOT NULL
              GROUP BY dv.producto_id

              UNION ALL

              -- Ventas dentro de combos (Cantidad combo * Cantidad prod en combo)
              SELECT cp.producto_id, SUM(dv.cantidad * cp.cantidad) as cantidad_total
              FROM detalle_ventas dv
              JOIN ventas v ON dv.venta_id = v.id
              JOIN combo_producto cp ON dv.combo_id = cp.combo_id
              WHERE v.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
                AND v.empresa_id = ?
              GROUP BY cp.producto_id
          ) as ventas_combinadas
          GROUP BY producto_id
      ) as v_stat ON p.id = v_stat.producto_id
      WHERE p.empresa_id = ?
      GROUP BY p.id
      HAVING p.stock <= p.stock_minimo OR (p.stock / NULLIF(velocidad_diaria, 0)) <= 7
      ORDER BY proveedor_nombre ASC
    `;

    // Ahora pasamos empresa_id 4 veces para las subconsultas
    const [rows] = await db.execute(query, [
      empresa_id,
      empresa_id,
      empresa_id,
      empresa_id,
    ]);

    const reporte = rows.map((p) => {
      const vDiaria = parseFloat(p.velocidad_diaria);
      const stockActual = parseFloat(p.stock);
      const min = parseFloat(p.stock_minimo);

      let sugerido = vDiaria * DIAS_A_CUBRIR - stockActual + min;

      return {
        ...p,
        cantidad_sugerida: Math.ceil(Math.max(sugerido, 0)),
      };
    });

    res.json(reporte);
  } catch (error) {
    console.error("❌ ERROR ASISTENTE COMPRA:", error);
    res.status(500).json({ message: error.message });
  }
};

const postPedidoWhatsApp = async (req, res) => {
  try {
    const { proveedor_nombre, proveedor_tel, items } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ message: "No hay productos en el pedido" });

    // Armamos el cuerpo del mensaje con formato profesional
    let cuerpoPedido = `*📦 NUEVO PEDIDO DE MERCADERÍA*\n`;
    cuerpoPedido += `*Proveedor:* ${proveedor_nombre}\n`;
    cuerpoPedido += `-------------------------------------------\n`;

    items.forEach((it, index) => {
      cuerpoPedido += `${index + 1}. ${it.nombre} -> *Cant: ${it.cantidad}*\n`;
    });

    cuerpoPedido += `-------------------------------------------\n`;
    cuerpoPedido += `🙏 _Por favor confirmar recepción y fecha estimada de entrega._\n`;
    cuerpoPedido += `_Enviado automáticamente desde Enterprise Retail BI_`;

    // 🚀 ENVÍO DIRECTO USANDO TU FUNCIÓN sendWS 🚀
    const enviado = await sendWS(proveedor_tel, cuerpoPedido);

    if (enviado) {
      await registrarLog(
        req,
        "WHATSAPP",
        "COMPRAS",
        `Pedido automático enviado a ${proveedor_nombre}`,
      );
      return res.json({
        success: true,
        message: "Pedido enviado al proveedor.",
      });
    } else {
      return res
        .status(500)
        .json({ success: false, message: "Error en el Bot de WhatsApp." });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAuditoriaProductos = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // CONSULTA NIVEL DIOS: Trae el detalle, el proveedor y compara con el precio anterior del mismo item
    const query = `
      SELECT 
        dc.id,
        p.nombre as producto_nombre,
        p.codigo as producto_codigo,
        prov.empresa as proveedor_nombre,
        dc.cantidad,
        dc.precio_compra as precio_pagado,
        (dc.cantidad * dc.precio_compra) as inversion_total,
        c.fecha as fecha_compra,
        p.precio_venta as precio_venta_actual,
        -- Buscamos el precio de la compra anterior para calcular la inflación del ítem
        (SELECT dc2.precio_compra FROM detalle_compras dc2 
         JOIN compras c2 ON dc2.compra_id = c2.id 
         WHERE dc2.producto_id = p.id AND c2.fecha < c.fecha 
         ORDER BY c2.fecha DESC LIMIT 1) as precio_anterior
      FROM detalle_compras dc
      JOIN compras c ON dc.compra_id = c.id
      JOIN productos p ON dc.producto_id = p.id
      JOIN proveedors prov ON c.proveedor_id = prov.id
      WHERE c.empresa_id = ?
      ORDER BY c.fecha DESC
    `;

    const [rows] = await db.execute(query, [empresa_id]);

    const result = rows.map((r) => {
      const pPagado = parseFloat(r.precio_pagado);
      const pAnterior = parseFloat(r.precio_anterior || pPagado);
      const variacion = ((pPagado - pAnterior) / pAnterior) * 100;

      const pVenta = parseFloat(r.precio_venta_actual);
      const margen = ((pVenta - pPagado) / pVenta) * 100;

      return {
        ...r,
        variacion_pct: variacion.toFixed(1),
        margen_proyectado: margen.toFixed(1),
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMatrizArbitraje = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // QUERY MAESTRA: Obtiene el último precio de compra de cada producto por cada proveedor
    const query = `
      WITH UltimasCompras AS (
        SELECT 
          dc.producto_id,
          c.proveedor_id,
          prov.empresa as proveedor_nombre,
          dc.precio_compra,
          c.fecha,
          ROW_NUMBER() OVER (PARTITION BY dc.producto_id, c.proveedor_id ORDER BY c.fecha DESC) as rn
        FROM detalle_compras dc
        JOIN compras c ON dc.compra_id = c.id
        JOIN proveedors prov ON c.proveedor_id = prov.id
        WHERE c.empresa_id = ?
      )
      SELECT 
        p.id as producto_id,
        p.nombre as producto_nombre,
        p.stock as stock_actual,
        uc.proveedor_nombre,
        uc.precio_compra as costo_proveedor,
        uc.fecha as fecha_ultima_compra
      FROM UltimasCompras uc
      JOIN productos p ON uc.producto_id = p.id
      WHERE uc.rn = 1
      ORDER BY p.nombre ASC, uc.precio_compra ASC
    `;

    const [rows] = await db.execute(query, [empresa_id]);

    // Agrupamos por producto en el servidor para facilitar el renderizado
    const matriz = rows.reduce((acc, row) => {
      if (!acc[row.producto_id]) {
        acc[row.producto_id] = {
          nombre: row.producto_nombre,
          stock: row.stock_actual,
          comparativa: [],
        };
      }
      acc[row.producto_id].comparativa.push({
        proveedor: row.proveedor_nombre,
        costo: parseFloat(row.costo_proveedor),
        fecha: row.fecha_ultima_compra,
      });
      return acc;
    }, {});

    // Calculamos el ahorro potencial (Arbitraje)
    const resultadoFinal = Object.values(matriz).map((p) => {
      const costos = p.comparativa.map((c) => c.costo);
      const minCosto = Math.min(...costos);
      const maxCosto = Math.max(...costos);
      const brecha = ((maxCosto - minCosto) / minCosto) * 100;

      // Ahorro potencial: Si comprara todo el stock al precio más bajo vs el más alto
      const ahorroStock = (maxCosto - minCosto) * p.stock;

      return {
        ...p,
        minCosto,
        maxCosto,
        brecha: brecha.toFixed(1),
        ahorro_potencial: ahorroStock.toFixed(2),
      };
    });

    res.json(resultadoFinal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const countCompras = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS total FROM compras WHERE empresa_id = ?",
      [req.user.empresa_id],
    );
    res.json({ total: rows[0].total });
  } catch (error) {
    res.status(500).json({ total: 0 });
  }
};

const getComprasSummary = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const year = new Date().getFullYear();
    const [totalRows] = await db.execute(
      "SELECT COUNT(*) AS total FROM compras WHERE empresa_id = ?",
      [empresa_id],
    );
    const [yearRows] = await db.execute(
      "SELECT COUNT(*) AS totalAnio FROM compras WHERE YEAR(fecha) = ? AND empresa_id = ?",
      [year, empresa_id],
    );
    res.json({
      total: totalRows[0].total || 0,
      totalAnio: yearRows[0].totalAnio || 0,
    });
  } catch (error) {
    res.status(500).json({ total: 0, totalAnio: 0 });
  }
};

const getComprasMetrics = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
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

    const query = `
      SELECT 
        SUM(CASE WHEN DATE(fecha) = ? THEN precio_total ELSE 0 END) as dia,
        SUM(CASE WHEN MONTH(fecha) = ? AND YEAR(fecha) = ? THEN precio_total ELSE 0 END) as mes,
        SUM(CASE WHEN YEAR(fecha) = ? THEN precio_total ELSE 0 END) as anio
      FROM compras 
      WHERE empresa_id = ?
    `;

    const [c] = await db.execute(query, [
      todayStr,
      currentMonth,
      currentYear,
      currentYear,
      empresa_id,
    ]);
    const [inv] = await db.execute(
      `SELECT SUM(IFNULL(stock, 0) * IFNULL(precio_compra, 0)) as total_valorizado FROM productos WHERE empresa_id = ?`,
      [empresa_id],
    );

    res.json({
      compras_dia: parseFloat(c[0].dia || 0),
      compras_mes: parseFloat(c[0].mes || 0),
      compras_anio: parseFloat(c[0].anio || 0),
      total_inventario: parseFloat(inv[0].total_valorizado || 0),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
  updateTmpQuantity,
  updateTmpPrice,
  getAuditoriaTraicion,
  getSugerenciasCompra,
  postPedidoWhatsApp,
  getAuditoriaProductos,
  getMatrizArbitraje,
  countCompras,
  getComprasSummary,
  getComprasMetrics,
};
