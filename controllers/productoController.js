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

    // 1. Buscamos el producto actual en la DB
    const productoAnterior = await Producto.findById(id);
    if (!productoAnterior)
      return res.status(404).json({ message: "No encontrado" });

    // 2. ✨ SOPORTE PARA ACTUALIZACIÓN PARCIAL ✨
    // Si nuevosDatos no trae el costo o la venta, usamos los que ya tenía
    const ventaNueva = parseFloat(
      nuevosDatos.precio_venta !== undefined
        ? nuevosDatos.precio_venta
        : productoAnterior.precio_venta
    );
    const costoNuevo = parseFloat(
      nuevosDatos.precio_compra !== undefined
        ? nuevosDatos.precio_compra
        : productoAnterior.precio_compra
    );

    const ventaAnterior = parseFloat(productoAnterior.precio_venta || 0);
    const costoAnterior = parseFloat(productoAnterior.precio_compra || 0);

    // 3. Registrar en historial solo si hubo cambios reales
    if (ventaNueva !== ventaAnterior || costoNuevo !== costoAnterior) {
      await db.execute(
        `INSERT INTO historial_precios 
         (producto_id, precio_anterior, precio_nuevo, costo_anterior, costo_nuevo, fecha_cambio) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [id, ventaAnterior, ventaNueva, costoAnterior, costoNuevo]
      );
    }

    // 4. Gestionar imagen (respetando tu lógica de Cloudinary)
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

    // 5. ✨ UNIMOS LOS DATOS ✨
    // Esto asegura que si mandamos solo el precio, el nombre y el código no se borren
    const datosFinales = {
      ...productoAnterior, // Datos viejos
      ...nuevosDatos, // Datos nuevos (pisan a los viejos)
      imagen: imagenUrl, // Imagen procesada
    };

    await Producto.updateById(id, datosFinales);

    // 6. Logs y Sockets
    const detalleCambios = calcularDiferencias(productoAnterior, datosFinales, [
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
      `Actualización de producto ID ${id}. Cambios: ${detalleCambios}`
    );

    res.json({ success: true, message: "Producto actualizado correctamente" });
  } catch (error) {
    console.error("ERROR UPDATE PRODUCTO:", error);
    res.status(500).json({
      message: "Error interno al actualizar producto",
      error: error.message,
    });
  }
};

const aplicarCorreccionGuardian = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Buscamos el costo actual y el margen de la categoría
    const [rows] = await db.execute(
      `
      SELECT p.precio_compra, p.nombre, p.precio_venta as venta_vieja, c.margen_objetivo 
      FROM productos p 
      JOIN categorias c ON p.categoria_id = c.id 
      WHERE p.id = ?`,
      [id]
    );

    const producto = rows[0];
    if (!producto) return res.status(404).json({ message: "No encontrado" });

    // 2. ORDEN DE CÁLCULO SOLICITADO:
    const costo = parseFloat(producto.precio_compra);
    const porcentaje = parseFloat(producto.margen_objetivo);

    // Al precio de compra le sumamos el porcentaje para obtener la venta
    const nuevaVenta = costo * (1 + porcentaje / 100);

    // 3. ACTUALIZACIÓN DIRECTA (Sin intermediarios)
    // Actualizamos precio_venta y valor_porcentaje al mismo tiempo
    await db.execute(
      `UPDATE productos 
       SET precio_venta = ?, 
           valor_porcentaje = ?, 
           updated_at = NOW() 
       WHERE id = ?`,
      [nuevaVenta.toFixed(2), porcentaje.toFixed(2), id]
    );

    // 4. HISTORIAL DE PRECIOS (Regla de oro: 2 decimales)
    await db.execute(
      `INSERT INTO historial_precios 
       (producto_id, precio_anterior, precio_nuevo, costo_anterior, costo_nuevo, fecha_cambio) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [id, producto.venta_vieja, nuevaVenta.toFixed(2), costo, costo]
    );

    // 5. LOGS Y SOCKETS (Manteniendo tu estructura original)
    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");
    await registrarLog(
      req,
      "EDITAR",
      "PRODUCTOS",
      `Guardian BI: Actualizó ${
        producto.nombre
      }. Margen: ${porcentaje}% | Nueva Venta: $${nuevaVenta.toFixed(2)}`
    );

    res.json({
      success: true,
      message: "Precio y porcentaje actualizados correctamente",
    });
  } catch (error) {
    console.error("ERROR CRÍTICO GUARDIÁN:", error);
    res.status(500).json({ success: false, message: "Error en el servidor" });
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

    // 🚀 Consulta que suma ventas directas + ventas por combos para cada producto
    const query = `
      SELECT 
          p.id,
          p.codigo,
          p.nombre,
          p.stock as stock_actual,
          p.stock_minimo,
          p.precio_compra,
          IFNULL(u.nombre, 'Unid') as unidad_nombre,
          (
            SELECT IFNULL(SUM(cantidad_salida), 0)
            FROM (
              -- Ventas directas
              SELECT dv.producto_id, dv.cantidad as cantidad_salida, v.fecha
              FROM detalle_ventas dv
              JOIN ventas v ON dv.venta_id = v.id
              WHERE v.empresa_id = ?
              
              UNION ALL
              
              -- Ventas a través de combos (Jamon/Queso)
              SELECT cp.producto_id, (dv.cantidad * cp.cantidad) as cantidad_salida, v.fecha
              FROM detalle_ventas dv
              JOIN ventas v ON dv.venta_id = v.id
              JOIN combo_producto cp ON dv.combo_id = cp.combo_id
              WHERE v.empresa_id = ?
            ) as todas_las_salidas
            WHERE todas_las_salidas.producto_id = p.id 
              AND todas_las_salidas.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          ) as ventas_30_dias
      FROM productos p
      LEFT JOIN unidads u ON p.unidad_id = u.id
      WHERE p.empresa_id = ?
      ORDER BY ventas_30_dias DESC
    `;

    // Pasamos empresa_id 3 veces (Subconsulta A, Subconsulta B y Lista principal)
    const [productos] = await db.execute(query, [
      empresa_id,
      empresa_id,
      empresa_id,
    ]);

    const reporte = productos.map((p) => {
      const vpd = parseFloat(p.ventas_30_dias) / 30;
      const diasAutonomia =
        vpd > 0
          ? Math.floor(p.stock_actual / vpd)
          : p.stock_actual > 0
          ? 999
          : 0;

      // Sugerencia para cubrir 30 días
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
        ventas_mes: parseFloat(p.ventas_30_dias).toFixed(2),
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

const getAuditoriaMargenes = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // Mejoramos la consulta para manejar costos en 0 y asegurar el cálculo
    const query = `
      SELECT 
        p.id, p.codigo, p.nombre, p.precio_compra, p.precio_venta,
        c.nombre as categoria_nombre,
        c.margen_objetivo,
        -- Si el costo es 0, el margen es 0 para que salte la alerta
        CASE 
          WHEN p.precio_compra <= 0 THEN 0 
          ELSE (((p.precio_venta - p.precio_compra) / p.precio_compra) * 100) 
        END as margen_actual
      FROM productos p
      JOIN categorias c ON p.categoria_id = c.id
      WHERE p.empresa_id = ? 
        AND c.margen_objetivo > 0
      HAVING margen_actual < c.margen_objetivo
      ORDER BY (c.margen_objetivo - margen_actual) DESC
    `;

    const [productos] = await db.execute(query, [empresa_id]);

    const reporte = productos.map((p) => {
      const costo = parseFloat(p.precio_compra);
      const obj = parseFloat(p.margen_objetivo);

      // Precio Sugerido = Costo * (1 + Objetivo/100)
      const precioSugerido = costo * (1 + obj / 100);

      return {
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        categoria_nombre: p.categoria_nombre,
        precio_compra: costo.toFixed(2),
        precio_venta: parseFloat(p.precio_venta).toFixed(2),
        margen_actual: parseFloat(p.margen_actual).toFixed(2),
        margen_objetivo: obj.toFixed(2),
        precio_sugerido: precioSugerido.toFixed(2),
      };
    });

    res.json(reporte);
  } catch (error) {
    console.error("ERROR GUARDIAN:", error);
    res.status(500).json({ message: "Error al auditar márgenes" });
  }
};

const getProductosMuertos = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // Esta nueva subconsulta busca la última fecha de venta
    // uniendo ventas directas y ventas donde el producto es parte de un combo.
    const query = `
      SELECT 
        p.id, p.codigo, p.nombre, p.stock, p.precio_compra, p.precio_venta,
        c.nombre as categoria_nombre,
        u.nombre as unidad_nombre,
        (
          SELECT MAX(fecha_v) FROM (
            -- Venta directa del producto
            SELECT v.fecha as fecha_v, dv.producto_id
            FROM detalle_ventas dv
            JOIN ventas v ON dv.venta_id = v.id
            WHERE v.empresa_id = ?
            
            UNION ALL
            
            -- Venta del producto como parte de un combo
            SELECT v.fecha as fecha_v, cp.producto_id
            FROM detalle_ventas dv
            JOIN ventas v ON dv.venta_id = v.id
            JOIN combo_producto cp ON dv.combo_id = cp.combo_id
            WHERE v.empresa_id = ?
          ) as todas_las_ventas
          WHERE todas_las_ventas.producto_id = p.id
        ) as fecha_ultima_venta,
        DATEDIFF(CURDATE(), p.created_at) as dias_desde_creacion
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN unidads u ON p.unidad_id = u.id
      WHERE p.empresa_id = ? 
        AND p.stock > 0
      HAVING (fecha_ultima_venta < DATE_SUB(CURDATE(), INTERVAL 60 DAY) OR fecha_ultima_venta IS NULL)
         AND dias_desde_creacion > 30
      ORDER BY (p.stock * p.precio_compra) DESC
    `;

    // Pasamos los parámetros: 2 para la subconsulta de fecha y 1 para la principal
    const [productos] = await db.execute(query, [
      empresa_id,
      empresa_id,
      empresa_id,
    ]);

    let capitalTotalInmovilizado = 0;

    const reporte = productos.map((p) => {
      const capitalInmovilizado =
        parseFloat(p.stock) * parseFloat(p.precio_compra);
      capitalTotalInmovilizado += capitalInmovilizado;

      const margenActual =
        ((parseFloat(p.precio_venta) - parseFloat(p.precio_compra)) /
          parseFloat(p.precio_compra)) *
        100;
      let sugerencia =
        margenActual >= 50 ? "Aplicar Promo 2x1" : "Descuento del 20%";

      return {
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        stock: p.stock,
        categoria_nombre: p.categoria_nombre || "Sin Categoría",
        unidad_nombre: p.unidad_nombre || "Unid.",
        capital_inmovilizado: capitalInmovilizado.toFixed(2),
        dias_estancado: p.fecha_ultima_venta
          ? Math.floor(
              (new Date() - new Date(p.fecha_ultima_venta)) /
                (1000 * 60 * 60 * 24)
            )
          : p.dias_desde_creacion,
        sugerencia: sugerencia,
      };
    });

    res.json({
      productos: reporte,
      capitalTotalInmovilizado: capitalTotalInmovilizado.toFixed(2),
    });
  } catch (error) {
    console.error("ERROR LIQUIDADOR:", error);
    res.status(500).json({ message: "Error al analizar productos muertos" });
  }
};

const getSimulacionImpacto = async (req, res) => {
  try {
    const { categoria_id, porcentaje_ajuste } = req.query;
    const empresa_id = req.user.empresa_id;
    const ajuste = parseFloat(porcentaje_ajuste) / 100;

    // 1. Analizamos ventas de los últimos 90 días para esa categoría
    const query = `
      SELECT 
        SUM(dv.cantidad * dv.precio_venta) as facturacion_total,
        SUM(dv.cantidad * dv.precio_compra) as costo_total,
        COUNT(DISTINCT v.id) as cantidad_operaciones
      FROM detalle_ventas dv
      JOIN ventas v ON dv.venta_id = v.id
      JOIN productos p ON dv.producto_id = p.id
      WHERE v.empresa_id = ? 
        AND p.categoria_id = ? 
        AND v.fecha >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
    `;

    const [stats] = await db.execute(query, [empresa_id, categoria_id]);
    const s = stats[0];

    // 2. Cálculos Promedio Mensuales Actuales
    const facturacionMensual = parseFloat(s.facturacion_total || 0) / 3;
    const costoMensual = parseFloat(s.costo_total || 0) / 3;
    const utilidadMensualActual = facturacionMensual - costoMensual;

    // 3. Simulación de Impacto
    // Proyectamos la nueva facturación con el aumento
    const nuevaFacturacionMensual = facturacionMensual * (1 + ajuste);
    const nuevaUtilidadMensual = nuevaFacturacionMensual - costoMensual;

    // 4. Factor de Elasticidad (Riesgo de pérdida de clientes)
    // Heurística retail: Por cada 1% de aumento, riesgo de pérdida de 0.8% de volumen
    const riesgoPerdidaClientes = Math.abs(parseFloat(porcentaje_ajuste) * 0.8);

    res.json({
      actual: {
        facturacion: facturacionMensual.toFixed(2),
        utilidad: utilidadMensualActual.toFixed(2),
        operaciones: Math.round(s.cantidad_operaciones / 3),
      },
      proyectado: {
        facturacion: nuevaFacturacionMensual.toFixed(2),
        utilidad: nuevaUtilidadMensual.toFixed(2),
        incremento_neto: (nuevaUtilidadMensual - utilidadMensualActual).toFixed(
          2
        ),
        riesgo_cliente: riesgoPerdidaClientes.toFixed(1),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAnaliticaPareto = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // 🚀 ALGORITMO DE AUDITORÍA TOTAL (Ventas Directas + Ventas por Combos)
    const query = `
      SELECT 
        p.id, p.codigo, p.nombre, p.stock, p.stock_minimo,
        (
          SELECT IFNULL(SUM(total_neto_producto), 0)
          FROM (
            -- A. FACTURACIÓN POR VENTAS DIRECTAS
            SELECT 
              v.fecha, dv.producto_id,
              (dv.cantidad * dv.precio_venta) * 
              (CASE WHEN (SELECT SUM(dv_t.cantidad * dv_t.precio_venta) FROM detalle_ventas dv_t WHERE dv_t.venta_id = v.id) = 0 THEN 1 
               ELSE (v.precio_total / (SELECT SUM(dv_t.cantidad * dv_t.precio_venta) FROM detalle_ventas dv_t WHERE dv_t.venta_id = v.id)) END) as total_neto_producto
            FROM detalle_ventas dv
            JOIN ventas v ON dv.venta_id = v.id
            WHERE v.empresa_id = ? AND dv.producto_id IS NOT NULL

            UNION ALL

            -- B. FACTURACIÓN PRORRATEADA POR VENTAS EN COMBOS
            SELECT 
              v.fecha, cp.producto_id,
              ((dv.cantidad * cp.cantidad) * p_inner.precio_venta) * 
              (CASE WHEN (SELECT SUM(dv_t2.cantidad * dv_t2.precio_venta) FROM detalle_ventas dv_t2 WHERE dv_t2.venta_id = v.id) = 0 THEN 1 
               ELSE (v.precio_total / (SELECT SUM(dv_t2.cantidad * dv_t2.precio_venta) FROM detalle_ventas dv_t2 WHERE dv_t2.venta_id = v.id)) END) as total_neto_producto
            FROM detalle_ventas dv
            JOIN ventas v ON dv.venta_id = v.id
            JOIN combo_producto cp ON dv.combo_id = cp.combo_id
            JOIN productos p_inner ON cp.producto_id = p_inner.id
            WHERE v.empresa_id = ? AND dv.combo_id IS NOT NULL
          ) as consolidado
          WHERE consolidado.producto_id = p.id 
            AND consolidado.fecha >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
        ) as facturacion_acumulada
      FROM productos p
      WHERE p.empresa_id = ?
      ORDER BY facturacion_acumulada DESC
    `;

    // Pasamos empresa_id 3 veces (Subconsulta A, Subconsulta B y Lista Principal)
    const [productos] = await db.execute(query, [
      empresa_id,
      empresa_id,
      empresa_id,
    ]);

    const facturacionTotalGlobal = productos.reduce(
      (acc, curr) => acc + parseFloat(curr.facturacion_acumulada),
      0
    );

    let acumulado = 0;
    const reporteFinal = productos.map((p) => {
      const facturacion = parseFloat(p.facturacion_acumulada);
      acumulado += facturacion;

      const porcentajeAcumulado =
        facturacionTotalGlobal > 0
          ? (acumulado / facturacionTotalGlobal) * 100
          : 100;

      let clase = "D";
      let color = "#6c757d";

      if (facturacion > 0) {
        if (porcentajeAcumulado <= 80) {
          clase = "A";
          color = "#FFD700";
        } else if (porcentajeAcumulado <= 95) {
          clase = "B";
          color = "#C0C0C0";
        } else {
          clase = "C";
          color = "#CD7F32";
        }
      }

      const riesgoQuiebre = clase === "A" && p.stock <= p.stock_minimo;

      return {
        ...p,
        porcentaje_aporte:
          facturacionTotalGlobal > 0
            ? ((facturacion / facturacionTotalGlobal) * 100).toFixed(2)
            : "0.00",
        clase,
        color,
        riesgoQuiebre,
      };
    });

    res.json(reporteFinal);
  } catch (error) {
    console.error("ERROR PARETO GLOBAL:", error);
    res.status(500).json({ error: error.message });
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
  aplicarCorreccionGuardian,
  deleteProducto,
  getHistorialPrecios,
  getReposicionReport,
  getPrediccionCompra,
  getAuditoriaMargenes,
  getProductosMuertos,
  getSimulacionImpacto,
  getAnaliticaPareto,
  countProductos,
  countBajoStock,
  generarReporteStock,
  generarEtiquetas,
  importarProductos,
  updatePreciosMasivo,
  upload,
  uploadCsv,
};
