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
    const compras = await Compra.getAll(empresa_id);

    if (!compras || compras.length === 0) return res.json([]);

    const result = [];
    for (const c of compras) {
      const detallesRaw = await Compra.getDetallesByCompraId(c.id);

      // 🚀 PROCESAR DETALLES PARA MOSTRAR CORRECTAMENTE BULTOS
      const detallesProcesados = detallesRaw.map((d) => {
        let cantidadMostrar = parseFloat(d.cantidad);
        let unidadMostrar = d.unidad_base_nombre || "UNID.";
        let esBulto = d.es_bulto == 1;
        let factor = parseFloat(d.factor_utilizado) || 1;
        let cantidadBase =
          parseFloat(d.cantidad_unidades_base) || cantidadMostrar;

        // Si es bulto, ajustamos la visualización
        if (esBulto) {
          // La cantidad real es cantidad * factor
          cantidadBase = cantidadMostrar * factor;
          unidadMostrar = d.unidad_bulto_nombre || "BULTO";

          // Si hay factor de conversión, mostramos la equivalencia
          if (factor > 1) {
            unidadMostrar = `${unidadMostrar} (equiv. a ${factor} ${d.unidad_base_nombre || "unid."})`;
          }
        }

        return {
          ...d,
          // Campos para visualización
          cantidad_mostrar: cantidadMostrar,
          cantidad_base: cantidadBase,
          unidad_mostrar: unidadMostrar,
          es_bulto: esBulto,
          factor_utilizado: factor,
          // Para cálculos
          costo_unitario: parseFloat(d.precio_compra) || 0,
          // Importe total basado en el precio unitario del detalle
          importe_total: cantidadMostrar * (parseFloat(d.precio_compra) || 0),
        };
      });

      result.push({ ...c, detalles: detallesProcesados });
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

    // 1. Obtenemos la cabecera
    const [rows] = await db.execute(
      `SELECT c.*, p.empresa as proveedor_nombre 
       FROM compras c 
       LEFT JOIN proveedors p ON c.proveedor_id = p.id 
       WHERE c.id = ? AND c.empresa_id = ?`,
      [id, empresa_id],
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Compra no encontrada" });

    // 2. Obtenemos los detalles usando el modelo refactorizado
    const detalles = await Compra.getDetallesByCompraId(id);

    // 3. Devolvemos todo al frontend
    res.json({ ...rows[0], detalles });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getTmpCompras = async (req, res) => {
  try {
    const query = `
      SELECT t.*, p.nombre, p.codigo, 
             u_base.nombre as unidad_base, 
             u_compra.nombre as unidad_bulto
      FROM tmp_compras t 
      JOIN productos p ON t.producto_id = p.id 
      LEFT JOIN unidads u_base ON p.unidad_id = u_base.id
      LEFT JOIN unidads u_compra ON p.unidad_compra_id = u_compra.id
      WHERE t.usuario_id = ?
    `;
    const [rows] = await db.execute(query, [req.query.usuario_id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleTmpBulto = async (req, res) => {
  try {
    const { id } = req.params;
    const { es_bulto } = req.body;
    await db.execute("UPDATE tmp_compras SET es_bulto = ? WHERE id = ?", [
      es_bulto,
      id,
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const postTmpCompra = async (req, res) => {
  try {
    const { producto_id, cantidad, usuario_id, proveedor_id } = req.body;

    // 1. Buscamos precio y factor de conversión del producto
    const [prod] = await db.execute(
      "SELECT precio_compra, factor_conversion FROM productos WHERE id = ?",
      [producto_id],
    );
    const p_maestro = prod[0] ? parseFloat(prod[0].precio_compra) : 0;
    const f_conversion = prod[0] ? parseFloat(prod[0].factor_conversion) : 1;

    // 2. Alerta de Traición (mantenemos tu lógica)
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
        : p_maestro;

    // 3. El Negociador (mantenemos tu lógica)
    const [bestPriceRows] = await db.execute(
      `SELECT dc.precio_compra, prov.empresa as proveedor_nombre FROM detalle_compras dc 
       JOIN compras c ON dc.compra_id = c.id JOIN proveedors prov ON c.proveedor_id = prov.id
       WHERE dc.producto_id = ? AND c.empresa_id = ? AND c.fecha >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
       ORDER BY dc.precio_compra ASC LIMIT 1`,
      [producto_id, req.user.empresa_id],
    );
    const mejor_precio =
      bestPriceRows.length > 0 ? parseFloat(bestPriceRows[0].precio_compra) : 0;
    const mejor_proveedor =
      bestPriceRows.length > 0 ? bestPriceRows[0].proveedor_nombre : null;

    // 4. 🛡️ INSERCIÓN SINCERADA: Agregamos factor_utilizado
    await db.execute(
      `INSERT INTO tmp_compras 
       (producto_id, cantidad, precio_compra, precio_anterior, mejor_precio, mejor_proveedor, factor_utilizado, es_bulto, usuario_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, NOW(), NOW())`,
      [
        producto_id,
        cantidad,
        p_maestro,
        precio_anterior,
        mejor_precio,
        mejor_proveedor,
        f_conversion, // 👈 Se guarda el factor actual del producto
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
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 🛡️ Usamos req.user.id como fuente de verdad para el usuario
    const usuario_id = req.user.id;
    const empresa_id = req.user.empresa_id;
    const { id_proveedor, comprobante, numero, precio_total } = req.body;

    // 1. Recalcular precios (Tu lógica actual se mantiene...)
    const [items] = await connection.execute(
      "SELECT * FROM tmp_compras WHERE usuario_id = ?",
      [usuario_id],
    );

    // ... (Tu bucle for de actualización de precios queda igual) ...

    // 2. Ejecutar store pasando el ID autenticado explícitamente
    await Compra.store(req.body, usuario_id, empresa_id, connection);

    await connection.commit();

    // Notificaciones y Logs
    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");
    await registrarLog(
      req,
      "CREAR",
      "COMPRAS",
      `Compra registrada $${precio_total}.`,
    );

    res.json({ success: true });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
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

    console.log("📊 Generando informe productos detallado:", {
      fecha_inicio,
      fecha_fin,
    });

    // 🚀 CONSULTA CORREGIDA CON CÁLCULO DE BULTOS
    const query = `
      SELECT 
        -- Información de la compra
        c.id as compra_id,
        DATE_FORMAT(c.fecha, '%d/%m/%Y') as fecha_compra,
        c.comprobante as numero_factura,
        prov.empresa as proveedor_nombre,
        c.precio_total as total_factura,  -- ← AGREGADO para validar
        
        -- Información del producto
        p.codigo, 
        p.nombre as producto_nombre,
        
        -- Datos del detalle
        dc.cantidad,
        dc.precio_compra,
        
        -- 🚀 CÁLCULO CORREGIDO DEL SUBTOTAL
        CASE 
          WHEN dc.es_bulto = 1 THEN 
            -- Si es bulto: cantidad * factor * (precio_compra / factor)
            -- O simplemente: cantidad * precio_compra (si precio_compra ya es por bulto)
            dc.cantidad * dc.precio_compra
          ELSE 
            -- Si es unidad: cantidad * precio_compra
            dc.cantidad * dc.precio_compra
        END as subtotal_calculado,
        
        -- 🚀 PRECIO POR UNIDAD REAL
        CASE 
          WHEN dc.es_bulto = 1 AND dc.factor_utilizado > 0 THEN 
            dc.precio_compra / dc.factor_utilizado
          ELSE 
            dc.precio_compra
        END as precio_por_unidad_real,
        
        -- Información sobre bultos
        dc.es_bulto,
        dc.factor_utilizado,
        
        -- Unidades para mostrar
        CASE 
          WHEN dc.es_bulto = 1 THEN 
            COALESCE(u_compra.nombre, 'BULTO')
          ELSE 
            COALESCE(u_base.nombre, 'UNIDAD')
        END as unidad_mostrar,
        
        u_base.nombre as unidad_base_nombre,
        u_compra.nombre as unidad_bulto_nombre,
        
        -- Total de unidades base (para referencia)
        CASE 
          WHEN dc.es_bulto = 1 THEN dc.cantidad * dc.factor_utilizado
          ELSE dc.cantidad
        END as total_unidades_base
        
      FROM detalle_compras dc
      JOIN compras c ON dc.compra_id = c.id
      JOIN productos p ON dc.producto_id = p.id
      JOIN proveedors prov ON c.proveedor_id = prov.id
      LEFT JOIN unidads u_base ON p.unidad_id = u_base.id
      LEFT JOIN unidads u_compra ON p.unidad_compra_id = u_compra.id
      
      WHERE c.empresa_id = ? 
        AND c.fecha BETWEEN ? AND ?
      
      ORDER BY 
        c.fecha DESC,
        c.comprobante ASC,
        p.nombre ASC
    `;

    const [rows] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
    ]);

    console.log(`📊 Obtenidos ${rows.length} registros de detalles`);

    // 🚀 AGRUPAR POR FACTURA CON CÁLCULO CORREGIDO
    const comprasAgrupadas = rows.reduce((acc, item) => {
      const key = `${item.compra_id}-${item.numero_factura}`;

      if (!acc[key]) {
        acc[key] = {
          compra_id: item.compra_id,
          fecha_compra: item.fecha_compra,
          numero_factura: item.numero_factura,
          proveedor_nombre: item.proveedor_nombre,
          total_factura: parseFloat(item.total_factura), // Usar el total real de la factura
          items: [],
        };
      }

      // Procesar el ítem
      const esBulto = item.es_bulto == 1;
      const factor = parseFloat(item.factor_utilizado) || 1;
      const cantidad = parseFloat(item.cantidad);

      // 🚀 PRECIO CORRECTO: precio_compra es por bulto si es_bulto=1
      const precioPorBulto = parseFloat(item.precio_compra);
      const precioPorUnidad = parseFloat(item.precio_por_unidad_real);
      const subtotal = parseFloat(item.subtotal_calculado);

      const itemProcesado = {
        codigo: item.codigo || "N/A",
        producto_nombre: item.producto_nombre,
        cantidad: cantidad,
        es_bulto: esBulto,
        factor_utilizado: factor,
        unidad_mostrar: item.unidad_mostrar,
        // 🚀 MOSTRAR EL PRECIO CORRECTO
        precio_unitario_mostrar: esBulto ? precioPorBulto : precioPorUnidad,
        precio_por_unidad: precioPorUnidad, // Para mostrar en la interfaz
        subtotal: subtotal,
        total_unidades_base: parseFloat(item.total_unidades_base) || cantidad,
        // Para debug
        debug_info: {
          es_bulto: esBulto,
          factor: factor,
          cantidad: cantidad,
          precio_compra: precioPorBulto,
          precio_por_unidad: precioPorUnidad,
          subtotal_calculado: subtotal,
          formula: esBulto
            ? `${cantidad} bultos × ${precioPorBulto.toFixed(2)}/bulto = ${subtotal.toFixed(2)}`
            : `${cantidad} unid × ${precioPorUnidad.toFixed(2)}/unid = ${subtotal.toFixed(2)}`,
        },
      };

      acc[key].items.push(itemProcesado);
      return acc;
    }, {});

    // Convertir a array
    const comprasArray = Object.values(comprasAgrupadas).sort((a, b) => {
      const dateA = a.fecha_compra.split("/").reverse().join("-");
      const dateB = b.fecha_compra.split("/").reverse().join("-");
      return new Date(dateB) - new Date(dateA);
    });

    // Validar que la suma de items coincida con el total de la factura
    comprasArray.forEach((compra) => {
      const sumaItems = compra.items.reduce(
        (sum, item) => sum + item.subtotal,
        0,
      );
      const diferencia = Math.abs(sumaItems - compra.total_factura);

      if (diferencia > 0.01) {
        console.warn(
          `⚠️ Factura ${compra.numero_factura}: suma items (${sumaItems}) ≠ total factura (${compra.total_factura})`,
        );
      }
    });

    // Calcular total del período
    const totalPeriodo = comprasArray.reduce(
      (sum, compra) => sum + compra.total_factura,
      0,
    );

    res.json({
      periodo: { fecha_inicio, fecha_fin },
      total_compras: comprasArray.length,
      total_periodo: totalPeriodo,
      compras: comprasArray,
    });
  } catch (error) {
    console.error("❌ Error en getInformeProductos:", error.message);
    res.status(500).json({
      message: "Error al obtener informe",
      error: error.message,
    });
  }
};

const generarInformeProductosPDF = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.user.empresa_id;

    // 1. Obtener datos de la empresa
    const [empresaRows] = await db.execute(
      "SELECT * FROM empresas WHERE id = ?",
      [empresa_id],
    );
    const empresa = empresaRows[0];

    // 2. USAR LA MISMA CONSULTA CORREGIDA DEL getInformeProductos
    const query = `
      SELECT 
        -- Información de la compra
        c.id as compra_id,
        DATE_FORMAT(c.fecha, '%d/%m/%Y') as fecha_compra,
        c.comprobante as numero_factura,
        prov.empresa as proveedor_nombre,
        c.precio_total as total_factura,  -- ← TOTAL REAL DE LA FACTURA
        
        -- Información del producto
        p.codigo, 
        p.nombre as producto_nombre,
        
        -- Datos del detalle
        dc.cantidad,
        dc.precio_compra,
        
        -- 🚀 CÁLCULO CORREGIDO DEL SUBTOTAL
        CASE 
          WHEN dc.es_bulto = 1 THEN 
            -- Si es bulto: cantidad * precio_compra (precio por bulto)
            dc.cantidad * dc.precio_compra
          ELSE 
            -- Si es unidad: cantidad * precio_compra
            dc.cantidad * dc.precio_compra
        END as subtotal_calculado,
        
        -- 🚀 PRECIO POR UNIDAD REAL
        CASE 
          WHEN dc.es_bulto = 1 AND dc.factor_utilizado > 0 THEN 
            dc.precio_compra / dc.factor_utilizado
          ELSE 
            dc.precio_compra
        END as precio_por_unidad_real,
        
        -- Información sobre bultos
        dc.es_bulto,
        dc.factor_utilizado,
        
        -- Unidades para mostrar
        CASE 
          WHEN dc.es_bulto = 1 THEN 
            COALESCE(u_compra.nombre, 'BULTO')
          ELSE 
            COALESCE(u_base.nombre, 'UNIDAD')
        END as unidad_mostrar,
        
        u_base.nombre as unidad_base_nombre,
        u_compra.nombre as unidad_bulto_nombre,
        
        -- Total de unidades base (para referencia)
        CASE 
          WHEN dc.es_bulto = 1 THEN dc.cantidad * dc.factor_utilizado
          ELSE dc.cantidad
        END as total_unidades_base
        
      FROM detalle_compras dc
      JOIN compras c ON dc.compra_id = c.id
      JOIN productos p ON dc.producto_id = p.id
      JOIN proveedors prov ON c.proveedor_id = prov.id
      LEFT JOIN unidads u_base ON p.unidad_id = u_base.id
      LEFT JOIN unidads u_compra ON p.unidad_compra_id = u_compra.id
      
      WHERE c.empresa_id = ? 
        AND c.fecha BETWEEN ? AND ?
      
      ORDER BY 
        c.fecha DESC,
        c.comprobante ASC,
        p.nombre ASC
    `;

    const [rows] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
    ]);

    // 3. AGRUPAR POR FACTURA CON CÁLCULO CORREGIDO
    const comprasAgrupadas = rows.reduce((acc, item) => {
      const key = `${item.compra_id}-${item.numero_factura}`;

      if (!acc[key]) {
        acc[key] = {
          compra_id: item.compra_id,
          fecha_compra: item.fecha_compra,
          numero_factura: item.numero_factura,
          proveedor_nombre: item.proveedor_nombre,
          total_factura: parseFloat(item.total_factura), // Usar el total real
          items: [],
        };
      }

      const esBulto = item.es_bulto == 1;
      const factor = parseFloat(item.factor_utilizado) || 1;
      const cantidad = parseFloat(item.cantidad);
      const precioPorBulto = parseFloat(item.precio_compra);
      const precioPorUnidad = parseFloat(item.precio_por_unidad_real);
      const subtotal = parseFloat(item.subtotal_calculado);

      acc[key].items.push({
        codigo: item.codigo || "N/A",
        producto_nombre: item.producto_nombre,
        cantidad: cantidad,
        es_bulto: esBulto,
        factor_utilizado: factor,
        unidad_mostrar: item.unidad_mostrar,
        // 🚀 MOSTRAR EL PRECIO CORRECTO
        precio_unitario_mostrar: esBulto ? precioPorBulto : precioPorUnidad,
        precio_por_unidad: precioPorUnidad,
        subtotal: subtotal,
        total_unidades_base: parseFloat(item.total_unidades_base) || cantidad,
      });

      return acc;
    }, {});

    // 4. GENERAR HTML PARA PDF
    let facturasHTML = "";
    let totalGeneral = 0;
    let facturaIndex = 1;

    Object.values(comprasAgrupadas).forEach((factura) => {
      totalGeneral += factura.total_factura;

      let itemsHTML = "";
      factura.items.forEach((item, itemIdx) => {
        const esBulto = item.es_bulto;
        const factor = item.factor_utilizado || 1;
        const precioPorUnidad = item.precio_por_unidad;

        itemsHTML += `
          <tr>
            <td style="text-align: center; vertical-align: middle; border: 1px solid #ddd; padding: 4px;">${itemIdx + 1}</td>
            <td style="vertical-align: middle; border: 1px solid #ddd; padding: 4px;">
              <div style="font-weight: bold; font-size: 9px;">${item.codigo || "N/A"}</div>
              <div style="font-size: 8px;">${item.producto_nombre}</div>
            </td>
            <td style="text-align: center; vertical-align: middle; border: 1px solid #ddd; padding: 4px;">
              <div style="font-weight: bold; font-size: 9px;">
                ${item.cantidad.toFixed(2)}
                ${esBulto && factor > 1 ? `<span style="font-size: 7px; color: #666;"><br>(×${factor})</span>` : ""}
              </div>
              ${esBulto ? `<div style="font-size: 7px; color: #28a745;">${(item.cantidad * factor).toFixed(0)} unid. total</div>` : ""}
            </td>
            <td style="text-align: center; vertical-align: middle; border: 1px solid #ddd; padding: 4px;">
              <div style="font-size: 8px; font-weight: ${esBulto ? "bold" : "normal"}">
                ${item.unidad_mostrar}
              </div>
              ${esBulto ? `<div style="font-size: 7px; color: #dc3545; font-weight: bold;">BULTO</div>` : ""}
              ${esBulto ? `<div style="font-size: 6px; color: #6c757d;">$${precioPorUnidad.toFixed(2)}/unid</div>` : ""}
            </td>
            <td style="text-align: right; vertical-align: middle; border: 1px solid #ddd; padding: 4px;">
              <div style="font-size: 9px;">
                $ ${(esBulto ? item.precio_unitario_mostrar : precioPorUnidad).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </div>
              ${esBulto ? `<div style="font-size: 7px; color: #666;">por bulto</div>` : `<div style="font-size: 7px; color: #666;">por unidad</div>`}
            </td>
            <td style="text-align: right; vertical-align: middle; font-weight: bold; font-size: 9px; background-color: #f8f9fa; border: 1px solid #ddd; padding: 4px;">
              $ ${item.subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </td>
          </tr>`;
      });

      facturasHTML += `
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <div style="background-color: #007bff; color: white; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
            <h3 style="margin: 0; font-size: 16px;">
              FACTURA ${facturaIndex} | ${factura.fecha_compra} | ${factura.numero_factura}
            </h3>
            <p style="margin: 5px 0 0 0; font-size: 12px;">
              Proveedor: ${factura.proveedor_nombre}
            </p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
              <tr style="background-color: #343a40; color: white;">
                <th style="width: 5%; text-align: center; padding: 6px; font-size: 10px;">#</th>
                <th style="width: 35%; text-align: left; padding: 6px; font-size: 10px;">PRODUCTO</th>
                <th style="width: 10%; text-align: center; padding: 6px; font-size: 10px;">CANT.</th>
                <th style="width: 12%; text-align: center; padding: 6px; font-size: 10px;">UNIDAD</th>
                <th style="width: 15%; text-align: center; padding: 6px; font-size: 10px;">COSTO UNIT.</th>
                <th style="width: 15%; text-align: center; padding: 6px; font-size: 10px;">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
            <tfoot>
              <tr style="background-color: #f8f9fa;">
                <td colspan="5" style="text-align: right; padding: 8px; font-weight: bold; font-size: 11px; border: 1px solid #ddd;">
                  TOTAL FACTURA:
                </td>
                <td style="text-align: right; padding: 8px; font-weight: bold; font-size: 12px; color: #007bff; border: 1px solid #ddd;">
                  $ ${factura.total_factura.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;

      facturaIndex++;
    });

    // 5. HTML COMPLETO DEL PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Informe de Compras por Producto</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .empresa-info { margin-bottom: 20px; }
          .periodo { background-color: #e8f4fd; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
          .resumen { background-color: #d4edda; padding: 10px; border-radius: 5px; margin-bottom: 30px; }
          .total-general { background-color: #cce5ff; padding: 15px; border-radius: 5px; margin-top: 30px; text-align: center; }
          .nota { font-size: 10px; color: #666; margin-top: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="color: #007bff; margin-bottom: 5px;">INFORME DETALLADO DE COMPRAS</h1>
          <h3 style="color: #6c757d; margin-top: 0;">Análisis por Factura y Producto</h3>
        </div>
        
        <div class="empresa-info">
          <p style="margin: 0;"><strong>Empresa:</strong> ${empresa.nombre || "N/A"}</p>
          <p style="margin: 0;"><strong>RUC/CUIT:</strong> ${empresa.ruc || "N/A"}</p>
          <p style="margin: 0;"><strong>Dirección:</strong> ${empresa.direccion || "N/A"}</p>
        </div>
        
        <div class="periodo">
          <p style="margin: 0; font-weight: bold;">
            Período: ${fecha_inicio.split("-").reverse().join("/")} — ${fecha_fin.split("-").reverse().join("/")}
          </p>
        </div>
        
        <div class="resumen">
          <p style="margin: 0;">
            <strong>${Object.keys(comprasAgrupadas).length} Facturas</strong> | 
            <strong>Total General: $ ${totalGeneral.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</strong>
          </p>
        </div>
        
        ${facturasHTML}
        
        <div class="total-general">
          <h3 style="margin: 0;">
            TOTAL GENERAL DEL PERÍODO: $ ${totalGeneral.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </h3>
        </div>
        
        <div class="nota">
          <p>* Este informe agrupa las compras por factura, mostrando cada producto comprado con su tipo (bulto o unidad)</p>
          <p>** Generado el ${new Date().toLocaleDateString("es-AR")} ${new Date().toLocaleTimeString("es-AR")}</p>
        </div>
      </body>
      </html>
    `;

    // 6. GENERAR PDF (usando puppeteer o html-pdf)
    // Aquí usarías tu librería de generación de PDF como puppeteer, html-pdf, etc.

    // Ejemplo con html-pdf:
    const pdf = require("html-pdf");
    const pdfOptions = {
      format: "A4",
      orientation: "portrait",
      border: "10mm",
      footer: {
        height: "10mm",
        contents: {
          default:
            '<div style="text-align: center; color: #666; font-size: 10px;">Página {{page}} de {{pages}}</div>',
        },
      },
    };

    pdf.create(htmlContent, pdfOptions).toStream((err, stream) => {
      if (err) {
        console.error("Error generando PDF:", err);
        return res.status(500).send("Error generando PDF");
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="informe-compras-${fecha_inicio}-${fecha_fin}.pdf"`,
      );
      stream.pipe(res);
    });
  } catch (error) {
    console.error("❌ Error al generar PDF:", error);
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

    // CAMBIO CLAVE: Comparamos dc2.id < dc.id para capturar la secuencia real
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
        -- Buscamos el registro anterior EXACTO por ID
        (SELECT dc2.precio_compra 
         FROM detalle_compras dc2 
         WHERE dc2.producto_id = p.id AND dc2.id < dc.id 
         ORDER BY dc2.id DESC LIMIT 1) as precio_anterior
      FROM detalle_compras dc
      JOIN compras c ON dc.compra_id = c.id
      JOIN productos p ON dc.producto_id = p.id
      JOIN proveedors prov ON c.proveedor_id = prov.id
      WHERE c.empresa_id = ?
      ORDER BY c.fecha DESC, dc.id DESC -- Ordenamos por carga para ver lo más reciente arriba
    `;

    const [rows] = await db.execute(query, [empresa_id]);

    const result = rows.map((r) => {
      const pPagado = parseFloat(r.precio_pagado);
      // Si no hay precio anterior, la variación es 0.
      // Si hay, calculamos la inflación real del ítem.
      const pAnterior = r.precio_anterior
        ? parseFloat(r.precio_anterior)
        : pPagado;
      const variacion =
        pAnterior === 0 ? 0 : ((pPagado - pAnterior) / pAnterior) * 100;

      const pVenta = parseFloat(r.precio_venta_actual);
      // Margen proyectado sobre costo de esta compra específica
      const margen = pVenta === 0 ? 0 : ((pVenta - pPagado) / pVenta) * 100;

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
  toggleTmpBulto,
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
