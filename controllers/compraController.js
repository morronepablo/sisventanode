// controllers/compraController.js
const Compra = require("../models/Compra");
const db = require("../config/db");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");
const { registrarLog } = require("../utils/logger"); // 👈 Importamos el logger

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
      [id, empresa_id]
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
  console.log("--- INICIO STORE COMPRA ---");
  try {
    const { id_proveedor, comprobante, numero, precio_total, empresa_id } =
      req.body;

    // Ejecutar el guardado en el modelo
    await Compra.store(req.body, req.body.usuario_id, req.body.empresa_id);
    console.log(
      `[COMPRAS] Compra guardada con éxito para empresa ${empresa_id}`
    );

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "CREAR",
      "COMPRAS",
      `Se registró una compra de $${precio_total}. Comprobante: ${comprobante} - ${numero}. Proveedor ID: ${id_proveedor}`
    );

    res.json({ success: true });
  } catch (error) {
    console.error("[COMPRAS ERROR] Fallo al registrar compra:", error);
    res.status(500).json({ success: false, message: error.message });
  }
  console.log("--- FIN STORE COMPRA ---");
};

const deleteCompra = async (req, res) => {
  console.log("--- INICIO DELETE COMPRA ---");
  try {
    const { id } = req.params;

    // Obtenemos info básica antes de borrar para el log
    const [compraInfo] = await db.execute(
      "SELECT precio_total, comprobante FROM compras WHERE id = ?",
      [id]
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
      }`
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

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "EDITAR",
      "PRODUCTOS_PRECIO",
      `Actualización de precio de costo desde Compras. Producto ID: ${producto_id} a $${precio_compra}`
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
      [empresa_id]
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
        { minimumFractionDigits: 2 }
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
      { minimumFractionDigits: 2 }
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
  /* lógica similar con filtros por empresa */
};
const getInformeProveedores = async (req, res) => {
  /* lógica similar con filtros por empresa */
};
const generarInformeProveedoresPDF = async (req, res) => {
  /* lógica similar con filtros por empresa */
};
const getInformeNoPagadas = async (req, res) => {
  /* lógica similar con filtros por empresa */
};
const generarInformeNoPagadasPDF = async (req, res) => {
  /* lógica similar con filtros por empresa */
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
      [cantidad, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error al actualizar cantidad temporal:", error);
    res.status(500).json({ message: "Error interno", error: error.message });
  }
};

const countCompras = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS total FROM compras WHERE empresa_id = ?",
      [req.user.empresa_id]
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
      [empresa_id]
    );
    const [yearRows] = await db.execute(
      "SELECT COUNT(*) AS totalAnio FROM compras WHERE YEAR(fecha) = ? AND empresa_id = ?",
      [year, empresa_id]
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
      [empresa_id]
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
  countCompras,
  getComprasSummary,
  getComprasMetrics,
};
