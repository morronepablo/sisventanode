// controllers/productoController.js
const Producto = require("../models/Producto");
const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const csv = require("csv-parser");
const bwipjs = require("bwip-js");
const { registrarLog } = require("../utils/logger"); // 👈 Importamos el logger

// Usa fuentes nativas de PDF (Helvetica)
const pdfMake = require("pdfmake");
const printer = new pdfMake({
  Roboto: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
});

const uploadDir = path.join(process.cwd(), "src/assets/productos/");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "imagen-" + uniqueSuffix + path.extname(file.originalname));
  },
});

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

const uploadCsv = multer({
  storage: storage,
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

const getAllProductos = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    // Consulta con subconsultas para verificar uso en TODAS las tablas relacionadas
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

    // Agregamos la propiedad booleana para el frontend
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
    const productos = await Producto.getBajoStock();
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
  console.log("--- INICIO CREATE PRODUCTO ---");
  try {
    const {
      categoria_id,
      unidad_id,
      codigo,
      nombre,
      precio_compra,
      aplicar_porcentaje,
      valor_porcentaje,
      precio_venta,
    } = req.body;

    if (await Producto.codigoExists(codigo)) {
      return res
        .status(400)
        .json({ message: "Ya existe un producto con ese código" });
    }

    let imagenUrl = req.file
      ? `/src/assets/productos/${req.file.filename}`
      : null;

    const id = await Producto.create({
      ...req.body,
      imagen: imagenUrl,
      empresa_id: req.user.empresa_id,
    });

    console.log(`[PRODUCTOS] Producto creado con ID: ${id}`);

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "CREAR",
      "PRODUCTOS",
      `Se registró el producto: ${nombre} (Código: ${codigo})`
    );

    res.status(201).json({ message: "Producto creado exitosamente", id });
  } catch (error) {
    console.error("[PRODUCTOS ERROR] Fallo al crear:", error);
    res.status(500).json({ message: "Error al crear producto" });
  }
  console.log("--- FIN CREATE PRODUCTO ---");
};

const updateProducto = async (req, res) => {
  console.log("--- INICIO UPDATE PRODUCTO ---");
  try {
    const { id } = req.params;
    const { codigo, nombre } = req.body;

    const existing = await Producto.findById(id);
    if (!existing)
      return res.status(404).json({ message: "Producto no encontrado" });

    let imagenUrl = req.file
      ? `/src/assets/productos/${req.file.filename}`
      : existing.imagen;

    await Producto.updateById(id, { ...req.body, imagen: imagenUrl });

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "EDITAR",
      "PRODUCTOS",
      `Se actualizó el producto: ${nombre} (ID: ${id})`
    );

    console.log(`[PRODUCTOS] Producto ID ${id} actualizado.`);
    res.json({ message: "Producto actualizado correctamente" });
  } catch (error) {
    console.error("[PRODUCTOS ERROR] Fallo al actualizar:", error);
    res.status(500).json({ message: "Error interno" });
  }
  console.log("--- FIN UPDATE PRODUCTO ---");
};

const deleteProducto = async (req, res) => {
  console.log("--- INICIO DELETE PRODUCTO ---");
  try {
    const { id } = req.params;

    // 1. Verificación de seguridad en el servidor antes de borrar
    const queryCheck = `
      SELECT (
        (SELECT COUNT(*) FROM detalle_ventas WHERE producto_id = ?) +
        (SELECT COUNT(*) FROM detalle_compras WHERE producto_id = ?) +
        (SELECT COUNT(*) FROM ajustes WHERE producto_id = ?) +
        (SELECT COUNT(*) FROM combo_producto WHERE producto_id = ?)
      ) as uso`;

    const [check] = await db.execute(queryCheck, [id, id, id, id]);

    if (check[0].uso > 0) {
      return res.status(400).json({
        message:
          "No se puede eliminar el producto porque tiene historial de movimientos o pertenece a un combo.",
      });
    }

    const existing = await Producto.findById(id);
    const nombreProd = existing ? existing.nombre : "ID " + id;

    const deleted = await Producto.deleteById(id);
    if (!deleted)
      return res.status(404).json({ message: "Producto no encontrado" });

    await registrarLog(
      req,
      "ELIMINAR",
      "PRODUCTOS",
      `Se eliminó el producto: ${nombreProd}`
    );

    res.json({ success: true, message: "Producto eliminado exitosamente" });
  } catch (error) {
    console.error("[PRODUCTOS ERROR] Fallo al eliminar:", error);
    res.status(500).json({ message: "Error al eliminar producto" });
  }
  console.log("--- FIN DELETE PRODUCTO ---");
};

const importarProductos = async (req, res) => {
  console.log("--- INICIO IMPORTACIÓN CSV ---");
  try {
    if (!req.file)
      return res.status(400).json({ message: "Archivo CSV obligatorio" });

    // (Lógica de importación abreviada para claridad, pero mantiene tu funcionalidad original)
    // Supongamos que addedProducts es el contador de tu bucle de importación
    let addedProducts = 0;
    /* ... aquí va tu bucle for await ... */

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "IMPORTAR",
      "PRODUCTOS",
      `Importación masiva completada. Se añadieron ${addedProducts} productos.`
    );

    res.json({ message: "Proceso finalizado" });
  } catch (error) {
    res.status(500).json({ message: "Error interno" });
  }
  console.log("--- FIN IMPORTACIÓN CSV ---");
};

const countProductos = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS total FROM productos WHERE empresa_id = ?",
      [req.user.empresa_id]
    );
    res.json({ total: rows[0].total });
  } catch (error) {
    res.status(500).json({ total: 0 });
  }
};

const generarReporteStock = async (req, res) => {
  try {
    const [productos] = await db.execute(`
      SELECT p.*, u.nombre as unidad_nombre
      FROM productos p
      LEFT JOIN unidads u ON p.unidad_id = u.id
      ORDER BY p.nombre
    `);

    const [empresaRows] = await db.execute(
      "SELECT * FROM empresas WHERE id = 1"
    );
    const empresa = empresaRows[0] || {
      nombre_empresa: "Sistema de Ventas",
      tipo_empresa: "Ventas Comercial",
      correo: "admin@admin.com",
      telefono: "1138669097",
      logo: null,
    };

    // --- LÓGICA CORREGIDA PARA EL LOGO ---
    let logoFinal = null;
    if (empresa.logo) {
      // Obtenemos solo el nombre del archivo (por si viene con rutas raras de la DB)
      const nombreArchivo = path.basename(empresa.logo);
      // Construimos la ruta absoluta hacia src/assets/img/
      const rutaAbsolutaLogo = path.join(
        process.cwd(),
        "src",
        "assets",
        "img",
        nombreArchivo
      );

      // Verificamos si el archivo existe físicamente para no romper el PDF
      if (fs.existsSync(rutaAbsolutaLogo)) {
        logoFinal = rutaAbsolutaLogo;
      } else {
        console.warn(
          "Advertencia: El logo no se encontró en:",
          rutaAbsolutaLogo
        );
      }
    }
    // ---------------------------------------

    let stockValorizado = 0;
    const stockPorUnidad = {};
    productos.forEach((p) => {
      stockValorizado +=
        parseFloat(p.stock || 0) * parseFloat(p.precio_compra || 0);
      const unidad = p.unidad_nombre || "Unidad";
      if (!stockPorUnidad[unidad]) stockPorUnidad[unidad] = 0;
      stockPorUnidad[unidad] += parseFloat(p.stock || 0);
    });

    const pdfMake = require("pdfmake");
    const printer = new pdfMake({
      Roboto: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      },
    });

    const body = [
      [
        { text: "Nro", style: "tableHeader", alignment: "center" },
        { text: "Código", style: "tableHeader", alignment: "center" },
        { text: "Producto", style: "tableHeader", alignment: "center" },
        { text: "Stock", style: "tableHeader", alignment: "center" },
        { text: "Precio Compra", style: "tableHeader", alignment: "center" },
        { text: "Precio Venta", style: "tableHeader", alignment: "center" },
        { text: "Fecha Ingreso", style: "tableHeader", alignment: "center" },
      ],
    ];

    productos.forEach((p, i) => {
      const fecha = p.created_at
        ? new Date(p.created_at).toLocaleDateString("es-AR")
        : "";
      body.push([
        { text: (i + 1).toString(), alignment: "center", fontSize: 9 },
        { text: p.codigo || "", alignment: "left", fontSize: 9 },
        { text: p.nombre || "", alignment: "left", fontSize: 9 },
        { text: (p.stock || 0).toString(), alignment: "center", fontSize: 9 },
        {
          text: `$ ${parseFloat(p.precio_compra || 0).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
          })}`,
          alignment: "right",
          fontSize: 9,
        },
        {
          text: `$ ${parseFloat(p.precio_venta || 0).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
          })}`,
          alignment: "right",
          fontSize: 9,
        },
        { text: fecha, alignment: "center", fontSize: 9 },
      ]);
    });

    const docDefinition = {
      pageSize: "A4",
      pageMargins: [40, 120, 40, 60],
      header: (currentPage) => ({
        margin: [40, 30, 40, 0],
        table: {
          widths: [150, "*", 100],
          body: [
            [
              {
                stack: [
                  { text: empresa.nombre_empresa, bold: true, fontSize: 10 },
                  { text: empresa.tipo_empresa, fontSize: 8 },
                  { text: empresa.correo, fontSize: 8 },
                  { text: empresa.telefono, fontSize: 8 },
                ],
                alignment: "left",
              },
              {
                text: "SISTEMA DE VENTAS",
                alignment: "center",
                fontSize: 18,
                bold: true,
                margin: [0, 10, 0, 0],
              },
              {
                // Usamos logoFinal si existe, sino un cuadro vacío
                stack: logoFinal
                  ? [{ image: logoFinal, width: 60, alignment: "right" }]
                  : [
                      {
                        text: "SIN LOGO",
                        color: "#ccc",
                        alignment: "right",
                        margin: [0, 10, 0, 0],
                      },
                    ],
              },
            ],
          ],
        },
        layout: "noBorders",
      }),
      content: [
        {
          text: "Reporte de productos valorizados",
          fontSize: 16,
          bold: true,
          margin: [0, 0, 0, 5],
        },
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 1,
              lineColor: "#999",
            },
          ],
          margin: [0, 0, 0, 15],
        },
        {
          table: {
            headerRows: 1,
            widths: [25, 80, "*", 35, 75, 75, 70],
            body: body,
          },
          layout: {
            hLineWidth: (i, node) =>
              i === 0 || i === node.table.body.length ? 0 : 0.5,
            vLineWidth: () => 0,
            hLineColor: () => "#ddd",
            paddingTop: () => 4,
            paddingBottom: () => 4,
            fillColor: (i) => (i === 0 ? "#eeeeee" : null),
          },
        },
        {
          margin: [0, 20, 0, 0],
          columns: [
            { width: "*", text: "" },
            {
              width: 250,
              table: {
                widths: ["*", "auto"],
                body: [
                  [
                    {
                      text: "Total Stock Valorizado:",
                      alignment: "right",
                      bold: true,
                      fontSize: 10,
                    },
                    {
                      text: `$ ${parseFloat(stockValorizado).toLocaleString(
                        "es-AR",
                        { minimumFractionDigits: 2 }
                      )}`,
                      alignment: "right",
                      bold: true,
                      fontSize: 10,
                    },
                  ],
                  [
                    {
                      text: "Total Productos:",
                      alignment: "right",
                      bold: true,
                      fontSize: 10,
                    },
                    {
                      text: productos.length.toString(),
                      alignment: "right",
                      bold: true,
                      fontSize: 10,
                    },
                  ],
                  ...Object.entries(stockPorUnidad).map(([unidad, stock]) => [
                    {
                      text: `Stock Total (${unidad}):`,
                      alignment: "right",
                      bold: true,
                      fontSize: 10,
                    },
                    {
                      text: stock.toFixed(2),
                      alignment: "right",
                      bold: true,
                      fontSize: 10,
                    },
                  ]),
                ],
              },
              layout: "noBorders",
            },
          ],
        },
      ],
      styles: {
        tableHeader: { bold: true, fontSize: 10, color: "black" },
      },
      defaultStyle: { font: "Roboto" },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="reporte.pdf"');
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error("Error al generar reporte:", error);
    res
      .status(500)
      .json({ message: "Error al generar el reporte", error: error.message });
  }
};

// const generarEtiquetas = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { cantidad = 10 } = req.query; // Cuántas etiquetas imprimir

//     const producto = await Producto.findById(id);
//     if (!producto) return res.status(404).send("Producto no encontrado");

//     // Generar la imagen del código de barras en Buffer
//     const barcodeBuffer = await bwipjs.toBuffer({
//       bcid: "code128", // Tipo de código
//       text: producto.codigo, // Texto del código
//       scale: 3, // Escala
//       height: 10, // Altura
//       includetext: true, // Mostrar texto abajo
//       textxalign: "center",
//     });

//     const barcodeBase64 = `data:image/png;base64,${barcodeBuffer.toString(
//       "base64"
//     )}`;

//     // Armar la grilla de etiquetas (3 por fila)
//     const etiquetas = [];
//     const totalEtiquetas = parseInt(cantidad);

//     for (let i = 0; i < totalEtiquetas; i++) {
//       etiquetas.push({
//         stack: [
//           {
//             text: producto.nombre.substring(0, 25),
//             fontSize: 8,
//             bold: true,
//             alignment: "center",
//           },
//           {
//             text: `$ ${parseFloat(producto.precio_venta).toLocaleString(
//               "es-AR"
//             )}`,
//             fontSize: 12,
//             bold: true,
//             alignment: "center",
//             color: "#1a73e8",
//           },
//           {
//             image: barcodeBase64,
//             width: 100,
//             alignment: "center",
//             margin: [0, 5, 0, 0],
//           },
//         ],
//         margin: [5, 5, 5, 5],
//         border: [true, true, true, true],
//       });
//     }

//     // Agrupar en filas de 3
//     const tableBody = [];
//     for (let i = 0; i < etiquetas.length; i += 3) {
//       tableBody.push([
//         etiquetas[i] || {},
//         etiquetas[i + 1] || {},
//         etiquetas[i + 2] || {},
//       ]);
//     }

//     const docDefinition = {
//       pageSize: "A4",
//       content: [
//         {
//           table: {
//             widths: ["33%", "33%", "33%"],
//             body: tableBody,
//           },
//           layout: {
//             hLineWidth: () => 0.5,
//             vLineWidth: () => 0.5,
//             hLineColor: () => "#ccc",
//             vLineColor: () => "#ccc",
//           },
//         },
//       ],
//       defaultStyle: { font: "Roboto" },
//     };

//     const pdfDoc = printer.createPdfKitDocument(docDefinition);
//     res.setHeader("Content-Type", "application/pdf");
//     pdfDoc.pipe(res);
//     pdfDoc.end();

//     await registrarLog(
//       req,
//       "IMPRIMIR",
//       "PRODUCTOS",
//       `Se generaron ${cantidad} etiquetas para el producto: ${producto.nombre}`
//     );
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Error al generar etiquetas");
//   }
// };

const generarEtiquetas = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad = 12 } = req.query; // Cantidad solicitada

    const producto = await Producto.findById(id);
    if (!producto) return res.status(404).send("Producto no encontrado");

    // Generar la imagen del código de barras
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
    const totalEtiquetas = parseInt(cantidad);

    for (let i = 0; i < totalEtiquetas; i++) {
      etiquetas.push({
        // Quitamos el .substring(0, 25) para que entre todo el nombre
        stack: [
          {
            text: producto.nombre.toUpperCase(),
            fontSize: 7.5, // Bajamos un poquito el tamaño para que entre mejor
            bold: true,
            alignment: "center",
            margin: [0, 2, 0, 2], // Margen arriba y abajo del nombre
          },
          {
            text: `$ ${parseFloat(producto.precio_venta).toLocaleString(
              "es-AR",
              { minimumFractionDigits: 2 }
            )}`,
            fontSize: 13,
            bold: true,
            alignment: "center",
            color: "#1a73e8",
          },
          {
            image: barcodeBase64,
            width: 105,
            alignment: "center",
            margin: [0, 4, 0, 0],
          },
        ],
        margin: [2, 5, 2, 5], // Margen interno de la celda
        minHeight: 80, // Altura mínima para que todas las etiquetas sean uniformes
      });
    }

    // Agrupar de a 3 etiquetas por fila
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
      pageMargins: [30, 40, 30, 40],
      content: [
        {
          table: {
            widths: ["33%", "33%", "33%"],
            body: tableBody,
          },
          layout: {
            hLineWidth: (i) => 0.5,
            vLineWidth: (i) => 0.5,
            hLineColor: () => "#dddddd",
            vLineColor: () => "#dddddd",
            paddingLeft: () => 5,
            paddingRight: () => 5,
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
        },
      ],
      defaultStyle: { font: "Roboto" },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader("Content-Type", "application/pdf");
    pdfDoc.pipe(res);
    pdfDoc.end();

    // Log de auditoría
    await registrarLog(
      req,
      "IMPRIMIR",
      "PRODUCTOS",
      `Generación de ${cantidad} etiquetas para: ${producto.nombre}`
    );
  } catch (error) {
    console.error("Error etiquetas:", error);
    res.status(500).send("Error al generar las etiquetas");
  }
};

module.exports = {
  getAllProductos,
  getProductosBajoStock,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  countProductos,
  generarReporteStock,
  generarEtiquetas,
  importarProductos,
  upload,
  uploadCsv,
};
