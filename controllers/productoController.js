// controllers/productoController.js
const Producto = require("../models/Producto");
const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const csv = require("csv-parser");
const bwipjs = require("bwip-js");
const { registrarLog } = require("../utils/logger");
const { calcularDiferencias } = require("../utils/differences");
const { sendWS } = require("../utils/whatsapp");
const { cloudinary, storage } = require("../config/cloudinary"); // Configuración de Cloudinary

// --- CONFIGURACIÓN DE SUBIDA (MULTER) ---

// Almacenamiento en la nube para imágenes de productos
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes"));
    }
  },
});

// Almacenamiento temporal local para procesamiento de CSV
const uploadCsv = multer({
  dest: "uploads/csv/",
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isCsv =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.endsWith(".csv");
    if (isCsv) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos CSV"));
    }
  },
});

// Configuración de PDFMake con fuentes nativas de Linux/Render
const pdfMake = require("pdfmake");
const printer = new pdfMake({
  Roboto: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
});

// --- FUNCIONES AUXILIARES ---

const getEmpresaPhone = async (empresa_id) => {
  const [rows] = await db.execute(
    "SELECT telefono FROM empresas WHERE id = ?",
    [empresa_id]
  );
  if (rows.length > 0 && rows[0].telefono) {
    let phone = rows[0].telefono.replace(/\D/g, "");
    if (!phone.startsWith("54")) {
      phone = "549" + phone;
    }
    return phone;
  }
  return null;
};

// --- CONTROLADORES ---

const getAllProductos = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const query = `
      SELECT 
        p.*, 
        c.nombre as categoria_nombre, 
        u.nombre as unidad_nombre,
        (
          (SELECT COUNT(*) FROM detalle_ventas WHERE producto_id = p.id) +
          (SELECT COUNT(*) FROM detalle_compras WHERE producto_id = p.id) +
          (SELECT COUNT(*) FROM ajustes WHERE producto_id = p.id) +
          (SELECT COUNT(*) FROM detalle_devoluciones WHERE producto_id = p.id) +
          (SELECT COUNT(*) FROM combo_producto WHERE producto_id = p.id)
        ) as total_uso
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN unidads u ON p.unidad_id = u.id
      WHERE p.empresa_id = ?
      ORDER BY p.nombre ASC
    `;
    const [productos] = await db.execute(query, [empresa_id]);

    const result = productos.map((prod) => ({
      ...prod,
      puede_eliminarse: prod.total_uso === 0,
    }));

    res.json(result);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ message: "Error al obtener productos" });
  }
};

const getProductosBajoStock = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const productos = await Producto.getBajoStock(empresa_id);
    res.json(productos);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener productos con bajo stock" });
  }
};

const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findById(id);
    if (!producto)
      return res.status(404).json({ message: "Producto no encontrado" });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener producto" });
  }
};

const createProducto = async (req, res) => {
  console.log("--- INICIO CREATE PRODUCTO (CLOUDINARY) ---");
  try {
    const { codigo, nombre, stock, stock_minimo } = req.body;
    const empresa_id = req.user.empresa_id;

    if (await Producto.codigoExists(codigo)) {
      return res
        .status(400)
        .json({ message: "Ya existe un producto con ese código" });
    }

    // Usamos req.file.path que es la URL de Cloudinary
    let imagenUrl = req.file ? req.file.path : null;

    const id = await Producto.create({
      ...req.body,
      imagen: imagenUrl,
      empresa_id: empresa_id,
    });

    // Notificación WhatsApp
    if (parseFloat(stock) <= parseFloat(stock_minimo)) {
      const telefonoDestino = await getEmpresaPhone(empresa_id);
      if (telefonoDestino) {
        const mensaje = `⚠️ *STOCK CRÍTICO* ⚠️\nSe registró: *${nombre}*\nStock inicial: ${stock} / Mínimo: ${stock_minimo}`;
        sendWS(telefonoDestino, mensaje);
      }
    }

    // 👈 2. EMITIR EVENTO EN TIEMPO REAL PARA EL DASHBOARD
    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");

    await registrarLog(
      req,
      "CREAR",
      "PRODUCTOS",
      `Se registró el producto: ${nombre} (Código: ${codigo}) con imagen en Cloudinary.`
    );
    res.status(201).json({ message: "Producto creado exitosamente", id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear producto" });
  }
};

const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const nuevosDatos = req.body;
    const productoAnterior = await Producto.findById(id);
    if (!productoAnterior)
      return res.status(404).json({ message: "No encontrado" });

    // ✨ CORRECCIÓN: HISTORIAL DE PRECIOS Y COSTOS ✨
    const ventaNueva = parseFloat(nuevosDatos.precio_venta || 0);
    const ventaAnterior = parseFloat(productoAnterior.precio_venta || 0);
    const costoNuevo = parseFloat(nuevosDatos.precio_compra || 0);
    const costoAnterior = parseFloat(productoAnterior.precio_compra || 0);

    if (ventaNueva !== ventaAnterior || costoNuevo !== costoAnterior) {
      await db.execute(
        `INSERT INTO historial_precios 
         (producto_id, precio_anterior, precio_nuevo, costo_anterior, costo_nuevo, fecha_cambio) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [id, ventaAnterior, ventaNueva, costoAnterior, costoNuevo]
      );
    }

    let imagenUrl = productoAnterior.imagen;
    if (req.file) {
      if (
        productoAnterior.imagen &&
        productoAnterior.imagen.includes("res.cloudinary.com")
      ) {
        const parts = productoAnterior.imagen.split("/");
        const publicId = `${parts[parts.length - 2]}/${
          parts[parts.length - 1].split(".")[0]
        }`;
        await cloudinary.uploader.destroy(publicId);
      }
      imagenUrl = req.file.path;
    }

    await Producto.updateById(id, { ...nuevosDatos, imagen: imagenUrl });
    const detalleCambios = calcularDiferencias(productoAnterior, nuevosDatos, [
      "updated_at",
      "created_at",
      "imagen",
      "id",
      "empresa_id",
    ]);
    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");
    await registrarLog(
      req,
      "EDITAR",
      "PRODUCTOS",
      `Editó ${productoAnterior.nombre}. Cambios: ${detalleCambios}`
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Producto.findById(id);
    const nombreProd = existing ? existing.nombre : "ID " + id;

    const [check] = await db.execute(
      `
      SELECT (
        (SELECT COUNT(*) FROM detalle_ventas WHERE producto_id = ?) +
        (SELECT COUNT(*) FROM detalle_compras WHERE producto_id = ?) +
        (SELECT COUNT(*) FROM ajustes WHERE producto_id = ?) +
        (SELECT COUNT(*) FROM combo_producto WHERE producto_id = ?)
      ) as uso`,
      [id, id, id, id]
    );

    if (check[0].uso > 0) {
      return res.status(400).json({
        message: "No se puede eliminar: tiene historial de movimientos.",
      });
    }

    await Producto.deleteById(id);

    // 👈 2. EMITIR EVENTO EN TIEMPO REAL PARA EL DASHBOARD
    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");

    await registrarLog(
      req,
      "ELIMINAR",
      "PRODUCTOS",
      `Se eliminó el producto: ${nombreProd}`
    );
    res.json({ success: true, message: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar producto" });
  }
};

const importarProductos = async (req, res) => {
  console.log("--- INICIO IMPORTACIÓN CSV ---");
  const empresa_id = req.user.empresa_id;
  const resultados = [];
  let addedCount = 0;
  let productosBajos = [];

  if (!req.file)
    return res.status(400).json({ message: "Archivo CSV obligatorio" });

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => resultados.push(data))
    .on("end", async () => {
      try {
        for (const row of resultados) {
          const exists = await Producto.codigoExists(row.codigo);
          if (!exists) {
            await Producto.create({
              ...row,
              empresa_id: empresa_id,
              imagen: null,
            });
            addedCount++;
            if (parseFloat(row.stock) <= parseFloat(row.stock_minimo)) {
              productosBajos.push(row.nombre);
            }
          }
        }

        // Aviso WhatsApp masivo
        if (productosBajos.length > 0) {
          const tel = await getEmpresaPhone(empresa_id);
          if (tel) {
            const msg = `📦 *IMPORTACIÓN COMPLETADA* 📦\nSe añadieron ${addedCount} productos. Los siguientes están bajo stock:\n- ${productosBajos
              .slice(0, 5)
              .join("\n- ")} ${
              productosBajos.length > 5 ? "\n...entre otros." : ""
            }`;
            sendWS(tel, msg);
          }
        }

        await registrarLog(
          req,
          "IMPORTAR",
          "PRODUCTOS",
          `Importación masiva: ${addedCount} productos añadidos.`
        );
        fs.unlinkSync(req.file.path); // Borrar temporal
        res.json({
          message: `Se importaron ${addedCount} productos con éxito.`,
        });
      } catch (error) {
        res.status(500).json({ message: "Error al procesar el archivo" });
      }
    });
};

const updatePreciosMasivo = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { categoria_id, porcentaje } = req.body;
    const factor = 1 + parseFloat(porcentaje) / 100;
    let query = `SELECT id, nombre, precio_compra, precio_venta, aplicar_porcentaje, valor_porcentaje FROM productos WHERE empresa_id = ?`;
    let params = [req.user.empresa_id];
    if (categoria_id) {
      query += " AND categoria_id = ?";
      params.push(categoria_id);
    }
    const [productos] = await connection.execute(query, params);

    for (const p of productos) {
      const costoAnterior = parseFloat(p.precio_compra);
      const ventaAnterior = parseFloat(p.precio_venta);
      const nuevoCosto = costoAnterior * factor;
      let nuevoPrecioVenta = p.aplicar_porcentaje
        ? nuevoCosto * (1 + parseFloat(p.valor_porcentaje) / 100)
        : ventaAnterior * factor;

      // ✨ CORRECCIÓN: GRABAR AMBOS EN HISTORIAL ✨
      await connection.execute(
        `INSERT INTO historial_precios 
         (producto_id, precio_anterior, precio_nuevo, costo_anterior, costo_nuevo, fecha_cambio) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [p.id, ventaAnterior, nuevoPrecioVenta, costoAnterior, nuevoCosto]
      );

      await connection.execute(
        "UPDATE productos SET precio_compra = ?, precio_venta = ?, updated_at = NOW() WHERE id = ?",
        [nuevoCosto, nuevoPrecioVenta, p.id]
      );
    }
    await connection.commit();
    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");
    res.json({
      success: true,
      message: `Actualizados ${productos.length} productos.`,
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: "Error" });
  } finally {
    connection.release();
  }
};

const generarReporteStock = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const [productos] = await db.execute(
      `
      SELECT p.*, u.nombre as unidad_nombre FROM productos p
      LEFT JOIN unidads u ON p.unidad_id = u.id
      WHERE p.empresa_id = ? ORDER BY p.nombre`,
      [empresa_id]
    );

    const [empresaRows] = await db.execute(
      "SELECT * FROM empresas WHERE id = ?",
      [empresa_id]
    );
    const empresa = empresaRows[0];

    const body = [
      [
        { text: "Nro", style: "tableHeader", alignment: "center" },
        { text: "Código", style: "tableHeader", alignment: "center" },
        { text: "Producto", style: "tableHeader", alignment: "center" },
        { text: "Stock", style: "tableHeader", alignment: "center" },
        { text: "P. Venta", style: "tableHeader", alignment: "center" },
      ],
    ];

    productos.forEach((p, i) => {
      body.push([
        { text: (i + 1).toString(), alignment: "center" },
        { text: p.codigo || "", alignment: "center" },
        { text: p.nombre || "" },
        { text: (p.stock || 0).toString(), alignment: "center" },
        {
          text: `$ ${parseFloat(p.precio_venta).toLocaleString("es-AR")}`,
          alignment: "right",
        },
      ]);
    });

    const docDefinition = {
      pageSize: "A4",
      content: [
        {
          text: `Reporte de Stock - ${empresa.nombre_empresa}`,
          fontSize: 16,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        {
          table: { headerRows: 1, widths: [30, 100, "*", 50, 80], body: body },
        },
      ],
      defaultStyle: { font: "Roboto", fontSize: 10 },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader("Content-Type", "application/pdf");
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    res.status(500).send("Error al generar reporte");
  }
};

const generarEtiquetas = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad = 12 } = req.query;
    const producto = await Producto.findById(id);
    if (!producto) return res.status(404).send("No encontrado");

    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: producto.codigo,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: "center",
    });
    const barcodeBase64 = `data:image/png;base64,${barcodeBuffer.toString(
      "base64"
    )}`;

    const etiquetas = [];
    for (let i = 0; i < parseInt(cantidad); i++) {
      etiquetas.push({
        stack: [
          {
            text: producto.nombre.toUpperCase(),
            fontSize: 7,
            bold: true,
            alignment: "center",
          },
          {
            text: `$ ${parseFloat(producto.precio_venta).toLocaleString(
              "es-AR"
            )}`,
            fontSize: 12,
            bold: true,
            alignment: "center",
            color: "#1a73e8",
          },
          { image: barcodeBase64, width: 100, alignment: "center" },
        ],
        margin: [5, 5, 5, 5],
      });
    }

    const tableBody = [];
    for (let i = 0; i < etiquetas.length; i += 3) {
      tableBody.push([
        etiquetas[i] || {},
        etiquetas[i + 1] || {},
        etiquetas[i + 2] || {},
      ]);
    }

    const docDefinition = {
      pageSize: "A4",
      content: [{ table: { widths: ["33%", "33%", "33%"], body: tableBody } }],
      defaultStyle: { font: "Roboto" },
    };
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader("Content-Type", "application/pdf");
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    res.status(500).send("Error");
  }
};

const getHistorialPrecios = async (req, res) => {
  try {
    const { id } = req.params;
    // ✨ CORRECCIÓN: TRAER COSTO Y PRECIO ✨
    const [rows] = await db.execute(
      `SELECT precio_nuevo as precio, costo_nuevo as costo, DATE_FORMAT(fecha_cambio, '%d/%m/%y') as fecha 
       FROM historial_precios WHERE producto_id = ? ORDER BY fecha_cambio ASC`,
      [id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReposicionReport = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // Buscamos productos donde el stock actual sea menor o igual al mínimo
    const [productos] = await db.execute(
      `SELECT p.id, p.codigo, p.nombre, p.stock, p.stock_minimo, p.stock_maximo, p.precio_compra,
              c.nombre as categoria_nombre, u.nombre as unidad_nombre
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       LEFT JOIN unidads u ON p.unidad_id = u.id
       WHERE p.empresa_id = ? AND p.stock <= p.stock_minimo
       ORDER BY (p.stock / p.stock_minimo) ASC`, // Los más urgentes primero
      [empresa_id]
    );

    // Calculamos totales de inversión necesaria
    let inversionTotal = 0;
    const listaFinal = productos.map((p) => {
      const faltante = Math.max(p.stock_maximo - p.stock, 0);
      const subtotalInversion = faltante * parseFloat(p.precio_compra);
      inversionTotal += subtotalInversion;

      return {
        ...p,
        faltante,
        inversion: subtotalInversion,
        urgencia: p.stock <= p.stock_minimo * 0.2 ? "CRITICO" : "REPOSICION",
      };
    });

    res.json({
      productos: listaFinal,
      totalArticulosFaltantes: listaFinal.length,
      inversionTotalNecesaria: inversionTotal,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPrediccionCompra = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // Eliminamos 'v.estado' ya que no existe en tu tabla ventas
    const query = `
      SELECT 
          p.id,
          p.codigo,
          p.nombre,
          p.stock as stock_actual,
          p.stock_minimo,
          p.precio_compra,
          IFNULL(u.nombre, 'Unid') as unidad_nombre,
          (SELECT IFNULL(SUM(dv.cantidad), 0) 
           FROM detalle_ventas dv 
           JOIN ventas v ON dv.venta_id = v.id 
           WHERE dv.producto_id = p.id 
             AND v.empresa_id = ? 
             AND v.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          ) as ventas_30_dias
      FROM productos p
      LEFT JOIN unidads u ON p.unidad_id = u.id
      WHERE p.empresa_id = ?
      HAVING ventas_30_dias > 0 OR stock_actual <= stock_minimo
      ORDER BY ventas_30_dias DESC
    `;

    const [productos] = await db.execute(query, [empresa_id, empresa_id]);

    const reporte = productos.map((p) => {
      const vpd = parseFloat(p.ventas_30_dias) / 30;
      const diasAutonomia =
        vpd > 0
          ? Math.floor(p.stock_actual / vpd)
          : p.stock_actual > 0
          ? 999
          : 0;

      let sugerencia = vpd * 30 - p.stock_actual;
      sugerencia = sugerencia > 0 ? Math.ceil(sugerencia) : 0;

      const inversionEstimada = sugerencia * parseFloat(p.precio_compra);

      let urgencia = "BAJA";
      if (diasAutonomia <= 7) urgencia = "CRÍTICA";
      else if (diasAutonomia <= 15) urgencia = "MEDIA";

      return {
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        unidad: p.unidad_nombre,
        stock_actual: p.stock_actual,
        ventas_mes: parseFloat(p.ventas_30_dias),
        vpd: parseFloat(vpd.toFixed(2)),
        dias_autonomia: diasAutonomia,
        sugerencia_compra: sugerencia,
        inversion_estimada: parseFloat(inversionEstimada.toFixed(2)),
        urgencia: p.ventas_30_dias > 0 ? urgencia : "STOCK ESTANCADO",
      };
    });

    res.json(reporte);
  } catch (error) {
    console.error("Error en Predicción de Compra:", error);
    res.status(500).json({ message: "Error al calcular asistente de compras" });
  }
};

const countProductos = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS total FROM productos WHERE empresa_id = ?",
      [req.user.empresa_id]
    );
    res.json({ total: rows[0].total });
  } catch (error) {
    res.json({ total: 0 });
  }
};

const countBajoStock = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS total FROM productos WHERE stock <= stock_minimo AND empresa_id = ?",
      [req.user.empresa_id]
    );
    res.json({ total: rows[0].total });
  } catch (error) {
    res.json({ total: 0 });
  }
};

module.exports = {
  getAllProductos,
  getProductosBajoStock,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  getHistorialPrecios,
  getReposicionReport,
  getPrediccionCompra,
  countProductos,
  countBajoStock,
  generarReporteStock,
  generarEtiquetas,
  importarProductos,
  updatePreciosMasivo,
  upload,
  uploadCsv,
};
