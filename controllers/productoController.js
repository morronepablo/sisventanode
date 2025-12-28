// controllers/productoController.js
const Producto = require("../models/Producto");
const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const csv = require("csv-parser");

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

// Definir ruta absoluta a la carpeta de imágenes de productos
const uploadDir = path.join(process.cwd(), "src/assets/productos/");

// Asegurar que la carpeta exista
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

// Configuración para Imágenes (la que ya tienes, pero la renombramos o mantenemos)
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes"));
    }
  },
});

// NUEVA CONFIGURACIÓN PARA CSV 🚀
const uploadCsv = multer({
  storage: storage, // Puedes usar el mismo storage o uno temporal
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB es suficiente para CSV
  fileFilter: (req, file, cb) => {
    // Acepta mimetypes de CSV comunes
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
    const productos = await Producto.getAll();
    res.json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res
      .status(500)
      .json({ message: "Error al obtener productos", error: error.message });
  }
};

const getProductosBajoStock = async (req, res) => {
  try {
    const productos = await Producto.getBajoStock();
    res.json(productos);
  } catch (error) {
    console.error("Error al obtener productos con bajo stock:", error);
    res.status(500).json({
      message: "Error al obtener productos con bajo stock",
      error: error.message,
    });
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
    console.error("Error al obtener producto:", error);
    res
      .status(500)
      .json({ message: "Error al obtener producto", error: error.message });
  }
};

const createProducto = async (req, res) => {
  try {
    const {
      categoria_id,
      unidad_id,
      codigo,
      nombre,
      nombre_corto,
      stock,
      stock_minimo,
      stock_maximo,
      precio_compra,
      aplicar_porcentaje,
      valor_porcentaje,
      precio_venta,
      descripcion,
      fecha_ingreso,
    } = req.body;

    if (!codigo?.trim())
      return res.status(400).json({ message: "El código es obligatorio" });
    if (!nombre?.trim())
      return res.status(400).json({ message: "El nombre es obligatorio" });
    if (!precio_compra)
      return res
        .status(400)
        .json({ message: "El precio de compra es obligatorio" });

    if (await Producto.codigoExists(codigo)) {
      return res
        .status(400)
        .json({ message: "Ya existe un producto con ese código" });
    }

    let finalPrecioVenta = precio_venta;
    if (aplicar_porcentaje && valor_porcentaje) {
      finalPrecioVenta =
        parseFloat(precio_compra) * (1 + parseFloat(valor_porcentaje) / 100);
    }

    let imagenUrl = null;
    if (req.file) {
      imagenUrl = `/src/assets/productos/${req.file.filename}`;
    }

    const id = await Producto.create({
      categoria_id,
      unidad_id,
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      nombre_corto: nombre_corto || "",
      stock: parseFloat(stock) || 0,
      stock_minimo: parseFloat(stock_minimo) || 0,
      stock_maximo: parseFloat(stock_maximo) || 0,
      precio_compra: parseFloat(precio_compra),
      aplicar_porcentaje: !!aplicar_porcentaje,
      valor_porcentaje: parseFloat(valor_porcentaje) || 0,
      precio_venta: finalPrecioVenta,
      descripcion: descripcion || "",
      fecha_ingreso: fecha_ingreso || new Date().toISOString().split("T")[0],
      imagen: imagenUrl,
      empresa_id: 1,
    });

    res.status(201).json({ message: "Producto creado exitosamente", id });
  } catch (error) {
    console.error("Error al crear producto:", error);
    res
      .status(500)
      .json({ message: "Error al crear producto", error: error.message });
  }
};

const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    // req.body solo estará poblado si el router usa upload.single('imagen')
    const {
      categoria_id,
      unidad_id,
      codigo,
      nombre,
      nombre_corto,
      stock,
      stock_minimo,
      stock_maximo,
      precio_compra,
      aplicar_porcentaje,
      valor_porcentaje,
      precio_venta,
      descripcion,
      fecha_ingreso,
    } = req.body;

    // VALIDACIÓN: Si req.body está vacío, aquí dará el error 400.
    // Asegúrate de que en tus RUTAS tengas: router.put('/:id', upload.single('imagen'), controller.updateProducto)
    if (!codigo || !nombre || !precio_compra) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const existing = await Producto.findById(id);
    if (!existing)
      return res.status(404).json({ message: "Producto no encontrado" });

    // Manejo de imagen
    let imagenUrl = existing.imagen;
    if (req.file) {
      imagenUrl = `/src/assets/productos/${req.file.filename}`;
    }

    const updated = await Producto.updateById(id, {
      categoria_id,
      unidad_id,
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      nombre_corto: nombre_corto || "",
      stock: parseFloat(stock) || 0,
      stock_minimo: parseFloat(stock_minimo) || 0,
      stock_maximo: parseFloat(stock_maximo) || 0,
      precio_compra: parseFloat(precio_compra) || 0,
      // IMPORTANTE: FormData envía "1" o "0" como strings
      aplicar_porcentaje:
        aplicar_porcentaje === "1" || aplicar_porcentaje === "true",
      valor_porcentaje: parseFloat(valor_porcentaje) || 0,
      precio_venta: parseFloat(precio_venta) || 0,
      descripcion: descripcion || "",
      fecha_ingreso: fecha_ingreso,
      imagen: imagenUrl,
    });

    res.json({ message: "Producto actualizado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno", error: error.message });
  }
};

const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Producto.deleteById(id);
    if (!deleted)
      return res
        .status(404)
        .json({ message: "Producto no encontrado o no se puede eliminar" });

    res.json({ message: "Producto eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res
      .status(500)
      .json({ message: "Error al eliminar producto", error: error.message });
  }
};

const countProductos = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT COUNT(*) AS total FROM productos");
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error al contar productos:", error);
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

// const importarProductos = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "Archivo CSV es obligatorio" });
//     }

//     if (!req.file.originalname.endsWith(".csv")) {
//       return res.status(400).json({ message: "Solo se permiten archivos CSV" });
//     }

//     const filePath = req.file.path;
//     const results = [];
//     const stream = fs.createReadStream(filePath).pipe(csv());

//     for await (const row of stream) {
//       results.push(row);
//     }

//     // Borrar el archivo temporal
//     fs.unlinkSync(filePath);

//     let addedProducts = 0;

//     for (const record of results) {
//       try {
//         // Validar campos obligatorios
//         if (
//           !record.codigo ||
//           !record.nombre ||
//           !record.Categoria ||
//           !record.Unidad ||
//           !record.stock ||
//           !record.precio_compra
//         ) {
//           console.error("Registro incompleto:", record);
//           continue;
//         }

//         // Verificar si el producto ya existe
//         const [existing] = await db.execute(
//           "SELECT id FROM productos WHERE codigo = ? AND empresa_id = ?",
//           [record.codigo, 1]
//         );
//         if (existing.length > 0) continue;

//         // Obtener o crear categoría
//         let [categoriaRows] = await db.execute(
//           "SELECT id FROM categorias WHERE nombre = ? AND empresa_id = ?",
//           [record.Categoria, 1]
//         );
//         let categoriaId;
//         if (categoriaRows.length === 0) {
//           const [catResult] = await db.execute(
//             "INSERT INTO categorias (nombre, empresa_id) VALUES (?, ?)",
//             [record.Categoria, 1]
//           );
//           categoriaId = catResult.insertId;
//         } else {
//           categoriaId = categoriaRows[0].id;
//         }

//         // Obtener o crear unidad
//         let [unidadRows] = await db.execute(
//           "SELECT id FROM unidads WHERE nombre = ? AND empresa_id = ?",
//           [record.Unidad, 1]
//         );
//         let unidadId;
//         if (unidadRows.length === 0) {
//           const [uniResult] = await db.execute(
//             "INSERT INTO unidads (nombre, empresa_id) VALUES (?, ?)",
//             [record.Unidad, 1]
//           );
//           unidadId = uniResult.insertId;
//         } else {
//           unidadId = unidadRows[0].id;
//         }

//         // Crear producto
//         await db.execute(
//           `
//           INSERT INTO productos (
//             codigo, nombre, nombre_corto, stock, stock_minimo, stock_maximo,
//             precio_compra, precio_venta, aplicar_porcentaje, valor_porcentaje,
//             fecha_ingreso, categoria_id, unidad_id, empresa_id
//           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `,
//           [
//             record.codigo,
//             record.nombre,
//             record.nombre_corto || "",
//             parseInt(record.stock) || 0,
//             parseInt(record.stock_minimo) || 0,
//             parseInt(record.stock_maximo) || 0,
//             parseFloat(record.precio_compra) || 0,
//             parseFloat(record.precio_venta) || 0,
//             record.aplicar_porcentaje === "true" ||
//             record.aplicar_porcentaje === "1"
//               ? 1
//               : 0,
//             parseFloat(record.valor_porcentaje) || 0,
//             new Date().toISOString().split("T")[0],
//             categoriaId,
//             unidadId,
//             1,
//           ]
//         );

//         addedProducts++;
//       } catch (error) {
//         console.error("Error procesando registro:", record, error);
//       }
//     }

//     res.json({
//       message: `Se importaron ${addedProducts} productos satisfactoriamente.`,
//     });
//   } catch (error) {
//     console.error("Error en importación:", error);
//     res
//       .status(500)
//       .json({ message: "Error al importar productos", error: error.message });
//   }
// };

// const importarProductos = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "Archivo CSV es obligatorio" });
//     }

//     const filePath = req.file.path;
//     const results = [];

//     // Leemos el archivo
//     // NOTA: Si ves que en los logs los datos salen pegados, cambia csv() por csv({ separator: ';' })
//     const stream = fs.createReadStream(filePath).pipe(csv());

//     for await (const row of stream) {
//       results.push(row);
//     }

//     // Borrar el archivo temporal inmediatamente
//     fs.unlinkSync(filePath);

//     console.log("--- REVISIÓN DE IMPORTACIÓN ---");
//     console.log(`Total de filas leídas: ${results.length}`);

//     if (results.length === 0) {
//       console.error("El archivo está vacío o el separador no es correcto.");
//       return res
//         .status(400)
//         .json({ message: "El archivo está vacío o no se pudo parsear" });
//     }

//     // Ver los encabezados reales que detectó el sistema
//     console.log("Encabezados detectados:", Object.keys(results[0]));
//     console.log("Muestra primera fila raw:", results[0]);

//     let addedProducts = 0;
//     let skippedProducts = 0;
//     let errorLog = [];

//     for (const [index, record] of results.entries()) {
//       try {
//         // 1. LIMPIEZA DE DATOS: Quitamos comillas extras y espacios en blanco de las llaves y valores
//         const cleanRecord = {};
//         Object.keys(record).forEach((key) => {
//           const cleanKey = key.replace(/"/g, "").trim();
//           let cleanValue = record[key]
//             ? record[key].replace(/"/g, "").trim()
//             : "";
//           cleanRecord[cleanKey] = cleanValue;
//         });

//         // 2. MAPEO DE VARIABLES (Según los nombres de tu Excel en la imagen)
//         const {
//           codigo,
//           nombre,
//           nombre_corto,
//           stock,
//           stock_minimo,
//           stock_maximo,
//           precio_compra,
//           precio_venta,
//           aplicar_porcentaje,
//           valor_porcentaje,
//           Categoria,
//           Unidad,
//         } = cleanRecord;

//         // 3. VALIDACIÓN CRÍTICA CON LOG
//         if (!codigo || !nombre || !Categoria || !Unidad) {
//           const missing = [];
//           if (!codigo) missing.push("codigo");
//           if (!nombre) missing.push("nombre");
//           if (!Categoria) missing.push("Categoria");
//           if (!Unidad) missing.push("Unidad");

//           console.warn(
//             `Fila ${index + 1} saltada. Faltan: ${missing.join(", ")}`
//           );
//           console.log("Contenido procesado de la fila con error:", cleanRecord);
//           skippedProducts++;
//           continue;
//         }

//         // 4. VERIFICAR SI EL PRODUCTO YA EXISTE
//         const [existing] = await db.execute(
//           "SELECT id FROM productos WHERE codigo = ? AND empresa_id = ?",
//           [codigo, 1]
//         );
//         if (existing.length > 0) {
//           console.log(
//             `Fila ${index + 1}: El código ${codigo} ya existe. Saltando...`
//           );
//           skippedProducts++;
//           continue;
//         }

//         // 5. OBTENER O CREAR CATEGORÍA
//         let [categoriaRows] = await db.execute(
//           "SELECT id FROM categorias WHERE nombre = ? AND empresa_id = ?",
//           [Categoria, 1]
//         );
//         let categoriaId;
//         if (categoriaRows.length === 0) {
//           const [catResult] = await db.execute(
//             "INSERT INTO categorias (nombre, empresa_id) VALUES (?, ?)",
//             [Categoria, 1]
//           );
//           categoriaId = catResult.insertId;
//           console.log(`Nueva categoría creada: ${Categoria}`);
//         } else {
//           categoriaId = categoriaRows[0].id;
//         }

//         // 6. OBTENER O CREAR UNIDAD (Ojo: tu tabla se llama 'unidads' o 'unidades'?)
//         // Según tu reporte usas 'unidads' pero abajo dice 'unidades'. Verifica esto.
//         let [unidadRows] = await db.execute(
//           "SELECT id FROM unidads WHERE nombre = ? AND empresa_id = ?",
//           [Unidad, 1]
//         );
//         let unidadId;
//         if (unidadRows.length === 0) {
//           const [uniResult] = await db.execute(
//             "INSERT INTO unidads (nombre, empresa_id) VALUES (?, ?)",
//             [Unidad, 1]
//           );
//           unidadId = uniResult.insertId;
//           console.log(`Nueva unidad creada: ${Unidad}`);
//         } else {
//           unidadId = unidadRows[0].id;
//         }

//         // 7. INSERTAR PRODUCTO
//         await db.execute(
//           `INSERT INTO productos (
//             codigo, nombre, nombre_corto, stock, stock_minimo, stock_maximo,
//             precio_compra, precio_venta, aplicar_porcentaje, valor_porcentaje,
//             fecha_ingreso, categoria_id, unidad_id, empresa_id
//           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//           [
//             codigo,
//             nombre,
//             nombre_corto || "",
//             parseFloat(stock) || 0,
//             parseFloat(stock_minimo) || 0,
//             parseFloat(stock_maximo) || 0,
//             parseFloat(precio_compra) || 0,
//             parseFloat(precio_venta) || 0,
//             aplicar_porcentaje === "true" || aplicar_porcentaje === "1" ? 1 : 0,
//             parseFloat(valor_porcentaje) || 0,
//             new Date().toISOString().split("T")[0],
//             categoriaId,
//             unidadId,
//             1,
//           ]
//         );

//         addedProducts++;
//       } catch (error) {
//         console.error(`Error procesando fila ${index + 1}:`, error.message);
//         errorLog.push(`Fila ${index + 1}: ${error.message}`);
//       }
//     }

//     console.log("--- RESUMEN FINAL ---");
//     console.log(`Productos añadidos: ${addedProducts}`);
//     console.log(`Productos saltados/errores: ${skippedProducts}`);
//     console.log("-----------------------");

//     res.json({
//       message: `Proceso finalizado. Se importaron ${addedProducts} productos. ${skippedProducts} fueron omitidos.`,
//       errores: errorLog,
//     });
//   } catch (error) {
//     console.error("Error fatal en importación:", error);
//     res
//       .status(500)
//       .json({ message: "Error interno al importar", error: error.message });
//   }
// };

const importarProductos = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Archivo CSV es obligatorio" });
    }

    const filePath = req.file.path;
    const results = [];
    const stream = fs.createReadStream(filePath).pipe(csv());

    for await (const row of stream) {
      results.push(row);
    }
    fs.unlinkSync(filePath);

    let addedProducts = 0;
    let skippedProducts = 0;
    let errorLog = [];

    for (const [index, record] of results.entries()) {
      try {
        // 1. Limpieza extrema de datos
        const cleanRecord = {};
        Object.keys(record).forEach((key) => {
          const cleanKey = key.replace(/"/g, "").trim();
          let cleanValue = record[key]
            ? record[key].toString().replace(/"/g, "").trim()
            : "";
          cleanRecord[cleanKey] = cleanValue;
        });

        const {
          codigo,
          nombre,
          nombre_corto,
          stock,
          stock_minimo,
          stock_maximo,
          precio_compra,
          precio_venta,
          aplicar_porcentaje,
          valor_porcentaje,
          Categoria,
          Unidad,
        } = cleanRecord;

        // Saltar filas vacías (como tu fila 2)
        if (!codigo && !nombre) {
          continue;
        }

        if (!codigo || !nombre || !Categoria || !Unidad) {
          skippedProducts++;
          continue;
        }

        // 2. Verificar si el producto ya existe
        const [existing] = await db.execute(
          "SELECT id FROM productos WHERE codigo = ? AND empresa_id = ?",
          [codigo, 1]
        );
        if (existing.length > 0) {
          skippedProducts++;
          continue;
        }

        // 3. OBTENER O CREAR CATEGORÍA (Lógica mejorada)
        // Buscamos la categoría sin filtrar por empresa_id primero para evitar el error de duplicado
        let [categoriaRows] = await db.execute(
          "SELECT id FROM categorias WHERE nombre = ?",
          [Categoria]
        );

        let categoriaId;
        if (categoriaRows.length === 0) {
          try {
            const [catResult] = await db.execute(
              "INSERT INTO categorias (nombre, empresa_id) VALUES (?, ?)",
              [Categoria, 1]
            );
            categoriaId = catResult.insertId;
          } catch (err) {
            // Si falla el insert por duplicado que el SELECT no vio (race condition)
            const [retryCat] = await db.execute(
              "SELECT id FROM categorias WHERE nombre = ?",
              [Categoria]
            );
            categoriaId = retryCat[0].id;
          }
        } else {
          categoriaId = categoriaRows[0].id;
        }

        // 4. OBTENER O CREAR UNIDAD (Lógica mejorada)
        let [unidadRows] = await db.execute(
          "SELECT id FROM unidads WHERE nombre = ?",
          [Unidad]
        );

        let unidadId;
        if (unidadRows.length === 0) {
          try {
            const [uniResult] = await db.execute(
              "INSERT INTO unidads (nombre, empresa_id) VALUES (?, ?)",
              [Unidad, 1]
            );
            unidadId = uniResult.insertId;
          } catch (err) {
            const [retryUni] = await db.execute(
              "SELECT id FROM unidads WHERE nombre = ?",
              [Unidad]
            );
            unidadId = retryUni[0].id;
          }
        } else {
          unidadId = unidadRows[0].id;
        }

        // 5. INSERTAR PRODUCTO
        await db.execute(
          `INSERT INTO productos (
            codigo, nombre, nombre_corto, stock, stock_minimo, stock_maximo,
            precio_compra, precio_venta, aplicar_porcentaje, valor_porcentaje,
            fecha_ingreso, categoria_id, unidad_id, empresa_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            codigo,
            nombre,
            nombre_corto || "",
            parseFloat(stock) || 0,
            parseFloat(stock_minimo) || 0,
            parseFloat(stock_maximo) || 0,
            parseFloat(precio_compra) || 0,
            parseFloat(precio_venta) || 0,
            aplicar_porcentaje === "true" || aplicar_porcentaje === "1" ? 1 : 0,
            parseFloat(valor_porcentaje) || 0,
            new Date().toISOString().split("T")[0],
            categoriaId,
            unidadId,
            1,
          ]
        );

        addedProducts++;
      } catch (error) {
        console.error(`Error en fila ${index + 1}:`, error.message);
        errorLog.push(`Fila ${index + 1}: ${error.message}`);
      }
    }

    res.json({
      message: `Se importaron ${addedProducts} productos.`,
      detalles: `Total filas: ${results.length}, Saltados: ${skippedProducts}, Errores: ${errorLog.length}`,
    });
  } catch (error) {
    res.status(500).json({ message: "Error interno", error: error.message });
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
  importarProductos,
  upload,
  uploadCsv,
};
