// controllers/proveedorController.js
const Proveedor = require("../models/Proveedor");
const db = require("../config/db");
const pdf = require("html-pdf");
const path = require("path");
const fs = require("fs");
const { registrarLog } = require("../utils/logger"); // 👈 1. Importamos el logger
const { calcularDiferencias } = require("../utils/differences"); // 👈 1. Importar la utilidad
const axios = require("axios");

const getListadoProveedores = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const proveedores = await Proveedor.getAll(empresa_id);

    if (!proveedores || proveedores.length === 0) return res.json([]);

    const result = [];
    for (const p of proveedores) {
      // 1. Obtener datos para el detalle expandible
      const facturas = await Proveedor.getFacturasAdeudadas(p.id);
      const pagos = await Proveedor.getPagosRealizados(p.id);

      // 2. CONTAR TODAS LAS COMPRAS (Incluso las pagadas) para decidir si se puede borrar
      const [countRows] = await db.execute(
        "SELECT COUNT(*) as total FROM compras WHERE proveedor_id = ?",
        [p.id],
      );

      const deudaTotal = facturas.reduce(
        (acc, f) => acc + (f.saldo_pendiente || 0),
        0,
      );

      result.push({
        ...p,
        deuda: deudaTotal,
        facturasAdeudadas: facturas,
        pagosRealizados: pagos,
        // Propiedad para el frontend: se puede borrar si no tiene ni una sola compra
        puede_eliminarse: countRows[0].total === 0,
      });
    }

    res.json(result);
  } catch (error) {
    console.error("[PROVEEDORES ERROR] Listado:", error.message);
    res.status(500).json({ message: "Error al obtener proveedores" });
  }
};

const getProveedorById = async (req, res) => {
  try {
    const { id } = req.params;
    const proveedor = await Proveedor.findById(id);
    if (!proveedor) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }
    res.json(proveedor);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el proveedor" });
  }
};

const createProveedor = async (req, res) => {
  console.log("--- INICIO CREATE PROVEEDOR (AUDITADO) ---");
  try {
    const empresa_id = req.user.empresa_id;
    const datos = { ...req.body, empresa_id };

    const id = await Proveedor.create(datos);

    // 👈 2. EMITIR EVENTO EN TIEMPO REAL PARA EL DASHBOARD
    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");

    // REGISTRO DE LOG CON DETALLE INICIAL
    await registrarLog(
      req,
      "CREAR",
      "PROVEEDORES",
      `Se registró al proveedor: ${req.body.empresa}. Marca: ${
        req.body.marca || "N/A"
      }. Contacto: ${req.body.contacto}`,
    );

    res.status(201).json({ message: "Proveedor registrado con éxito", id });
  } catch (error) {
    console.error("[PROVEEDORES ERROR] Create:", error.message);
    res.status(500).json({ message: "Error al registrar el proveedor" });
  }
};

const updateProveedor = async (req, res) => {
  console.log("--- INICIO UPDATE PROVEEDOR (AUDITADO) ---");
  try {
    const { id } = req.params;
    const nuevosDatos = req.body;

    // 2. OBTENER DATOS ACTUALES ANTES DE EDITAR
    const proveedorAnterior = await Proveedor.findById(id);
    if (!proveedorAnterior) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    // 3. CALCULAR QUÉ CAMPOS CAMBIARON
    // Ignoramos campos técnicos y de sistema
    const detalleCambios = calcularDiferencias(proveedorAnterior, nuevosDatos, [
      "id",
      "empresa_id",
      "created_at",
      "updated_at",
    ]);

    // 4. REALIZAR LA ACTUALIZACIÓN
    const actualizado = await Proveedor.updateById(id, nuevosDatos);
    if (!actualizado) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    // 👈 2. EMITIR EVENTO EN TIEMPO REAL PARA EL DASHBOARD
    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");

    // 5. REGISTRO DE LOG DETALLADO
    await registrarLog(
      req,
      "EDITAR",
      "PROVEEDORES",
      `Se actualizaron los datos del proveedor: ${proveedorAnterior.empresa}. Cambios: ${detalleCambios}`,
    );

    res.json({ message: "Proveedor actualizado con éxito" });
  } catch (error) {
    console.error("[PROVEEDORES ERROR] Update:", error.message);
    res.status(500).json({ message: "Error al actualizar el proveedor" });
  }
  console.log("--- FIN UPDATE PROVEEDOR ---");
};

const getGestionPagos = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Proveedor.getGestionPagos(id);
    const proveedor = await Proveedor.findById(id);

    if (!proveedor) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    res.json({ ...data, proveedor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const postRegistrarPago = async (req, res) => {
  console.log("--- INICIO PAGO A PROVEEDOR (MULTICAJA) ---");
  const MY_CAJA = Number(process.env.CAJA_ID || 1); // 👈 Identidad de la caja desde .env

  try {
    const { distribucion, metodo_pago } = req.body;
    const proveedor_id = req.params.id;
    const empresa_id = req.user.empresa_id;

    // 1. Buscar si hay arqueo abierto EN ESTA CAJA ESPECÍFICA
    const [arqueoRows] = await db.execute(
      "SELECT id FROM arqueos WHERE empresa_id = ? AND caja_id = ? AND (fecha_cierre IS NULL OR fecha_cierre = '' OR estado = 'Abierto') LIMIT 1",
      [empresa_id, MY_CAJA],
    );
    const arqueo_id = arqueoRows.length > 0 ? arqueoRows[0].id : null;

    // 2. Ejecutar la lógica de pago en el modelo
    // Enviamos el caja_id y arqueo_id para que el modelo registre pago_compras y movimiento_cajas correctamente
    await Proveedor.registrarPagoDistribuido({
      ...req.body,
      caja_id: MY_CAJA,
      arqueo_id: arqueo_id,
      empresa_id: empresa_id,
    });

    // 3. CALCULAR EL TOTAL REAL para el log
    const montoRealPagado = distribucion.reduce(
      (acc, item) => acc + parseFloat(item.monto || 0),
      0,
    );

    // EMITIR EVENTO EN TIEMPO REAL PARA EL DASHBOARD
    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");

    // 4. REGISTRO DE LOG
    await registrarLog(
      req,
      "PAGO",
      "PROVEEDORES",
      `Se registró un pago de $${montoRealPagado.toLocaleString(
        "es-AR",
      )} al proveedor ID: ${proveedor_id} vía ${metodo_pago} desde Caja ${MY_CAJA}`,
    );

    console.log(
      `[PROVEEDORES] Pago de $${montoRealPagado} registrado en Caja ${MY_CAJA} para proveedor ${proveedor_id}`,
    );

    res.json({ success: true, message: "Pagos registrados correctamente" });
  } catch (error) {
    console.error(
      "[PROVEEDORES ERROR] Fallo al registrar pago:",
      error.message,
    );
    res.status(500).json({ message: error.message });
  }
  console.log("--- FIN PAGO A PROVEEDOR ---");
};

const getProveedoresConDeuda = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const query = `
      SELECT p.id, p.empresa as nombre_completo, SUM(c.deuda) as deuda, COUNT(c.id) as compras_adeudadas
      FROM proveedors p
      JOIN compras c ON p.id = c.proveedor_id
      WHERE c.deuda > 0 AND p.empresa_id = ?
      GROUP BY p.id
    `;
    const [rows] = await db.execute(query, [empresa_id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMovimientos = async (req, res) => {
  try {
    const data = await Proveedor.getMovimientosCompletos(req.params.id);
    const prov = await Proveedor.findById(req.params.id);
    res.json({ ...data, proveedor: prov });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProveedor = async (req, res) => {
  console.log("--- INICIO DELETE PROVEEDOR ---");
  try {
    const { id } = req.params;

    // 1. Validación de seguridad en el servidor (Check de compras)
    const [check] = await db.execute(
      "SELECT COUNT(*) as total FROM compras WHERE proveedor_id = ?",
      [id],
    );

    if (check[0].total > 0) {
      return res.status(400).json({
        message:
          "No se puede eliminar el proveedor: tiene facturas o compras registradas en el sistema.",
      });
    }

    const provToDelete = await Proveedor.findById(id);
    const nombreProv = provToDelete ? provToDelete.empresa : "ID " + id;

    // 2. Ejecutar borrado (Asegúrate de tener este método en tu modelo Proveedor)
    const [result] = await db.execute("DELETE FROM proveedors WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    // 👈 2. EMITIR EVENTO EN TIEMPO REAL PARA EL DASHBOARD
    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");

    // 3. LOG DE AUDITORÍA
    await registrarLog(
      req,
      "ELIMINAR",
      "PROVEEDORES",
      `Se eliminó al proveedor: ${nombreProv}`,
    );

    console.log(`[PROVEEDORES] Proveedor ${nombreProv} eliminado.`);
    res.json({ success: true, message: "Proveedor eliminado correctamente" });
  } catch (error) {
    console.error("[PROVEEDORES ERROR] Fallo al eliminar:", error.message);
    res.status(500).json({ message: "Error al eliminar proveedor" });
  }
  console.log("--- FIN DELETE PROVEEDOR ---");
};

const getInformeCuentasPorPagar = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const query = `
      SELECT 
        p.id, p.empresa, p.marca, p.contacto, p.telefono,
        SUM(c.precio_total) as total_comprado,
        SUM(c.deuda) as saldo_pendiente,
        COUNT(c.id) as facturas_pendientes
      FROM proveedors p
      INNER JOIN compras c ON p.id = c.proveedor_id
      WHERE p.empresa_id = ? AND c.deuda > 0
      GROUP BY p.id
      ORDER BY saldo_pendiente DESC
    `;
    const [rows] = await db.execute(query, [empresa_id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error al generar el informe." });
  }
};

const generarReporteCuentasPorPagarPDF = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const [empRows] = await db.execute("SELECT * FROM empresas WHERE id = ?", [
      empresa_id,
    ]);
    const empresa = empRows[0];

    const query = `
      SELECT p.empresa, p.marca, SUM(c.deuda) as saldo
      FROM proveedors p
      INNER JOIN compras c ON p.id = c.proveedor_id
      WHERE p.empresa_id = ? AND c.deuda > 0
      GROUP BY p.id ORDER BY saldo DESC`;
    const [datos] = await db.execute(query, [empresa_id]);

    let filas = "";
    let totalDeuda = 0;
    datos.forEach((d, i) => {
      totalDeuda += parseFloat(d.saldo);
      filas += `<tr><td>${i + 1}</td><td>${d.empresa}</td><td>${
        d.marca || "-"
      }</td><td style="text-align:right; color:#d33; font-weight:bold">$ ${parseFloat(
        d.saldo,
      ).toLocaleString("es-AR")}</td></tr>`;
    });

    const html = `<html><head><style>body{font-family:Helvetica;font-size:12px}.header{border-bottom:2px solid #007bff} table{width:100%; border-collapse:collapse; margin-top:20px} th{background:#343a40; color:#fff; padding:8px} td{padding:8px; border:1px solid #eee}</style></head>
    <body><div class="header"><h1>${
      empresa.nombre_empresa
    }</h1><h3>Informe de Cuentas por Pagar (Deudas a Proveedores)</h3></div>
    <table><thead><tr><th>#</th><th>Proveedor</th><th>Marca</th><th>Saldo a Pagar</th></tr></thead><tbody>${filas}</tbody></table>
    <h2 style="text-align:right; margin-top:30px;">TOTAL COMPROMISOS: $ ${totalDeuda.toLocaleString(
      "es-AR",
    )}</h2>
    </body></html>`;

    pdf
      .create(html, { format: "A4", orientation: "portrait", border: "10mm" })
      .toBuffer((err, buffer) => {
        res.setHeader("Content-Type", "application/pdf");
        res.send(buffer);
      });
  } catch (e) {
    res.status(500).send("Error interno");
  }
};

const getRankingProveedoresBI = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // LÓGICA BASADA EN TU CAPTURA DE PANTALLA:
    // 1. Tabla: 'proveedores'
    // 2. Columna Nombre: 'empresa'
    // 3. Vínculo: A través de la tabla compras
    const query = `
      SELECT 
        pr.id,
        pr.empresa as proveedor, 
        COUNT(DISTINCT v.id) as cantidad_ventas,
        SUM(dv.cantidad * dv.precio_venta) as total_facturado,
        SUM(dv.cantidad * dv.precio_compra) as total_costo,
        SUM(dv.cantidad * (dv.precio_venta - dv.precio_compra)) as utilidad_neta
      FROM detalle_ventas dv
      JOIN ventas v ON dv.venta_id = v.id
      JOIN productos p ON dv.producto_id = p.id
      JOIN proveedors pr ON pr.id = (
          SELECT c.proveedor_id 
          FROM detalle_compras dc 
          JOIN compras c ON dc.compra_id = c.id 
          WHERE dc.producto_id = p.id 
          ORDER BY c.fecha DESC LIMIT 1
      )
      WHERE v.empresa_id = ? 
        AND v.fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY pr.id
      ORDER BY utilidad_neta DESC
    `;

    const [rows] = await db.execute(query, [empresa_id]);

    const ranking = rows.map((r) => {
      const facturado = parseFloat(r.total_facturado || 0);
      const utilidad = parseFloat(r.utilidad_neta || 0);
      const margen =
        facturado > 0 ? ((utilidad / facturado) * 100).toFixed(2) : 0;

      return {
        id: r.id,
        proveedor: r.proveedor,
        cantidad_ventas: r.cantidad_ventas,
        total_facturado: facturado.toFixed(2),
        total_costo: parseFloat(r.total_costo || 0).toFixed(2),
        utilidad_neta: utilidad.toFixed(2),
        margen_promedio: margen,
      };
    });

    res.json(ranking);
  } catch (error) {
    console.error("ERROR PROVIDER BI:", error.message);
    res
      .status(500)
      .json({ error: "Error al calcular rentabilidad de proveedores" });
  }
};

const getRadarInflacion = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // CONSULTA CORREGIDA
    // Cambiamos 'contacto_nombre' por 'contacto'
    // Aseguramos que la tabla sea 'proveedores'
    const query = `
      SELECT 
        prov.id as proveedor_id,
        prov.empresa as proveedor_nombre,
        prov.contacto, 
        COUNT(DISTINCT p.id) as productos_analizados,
        AVG(((dc_actual.precio_compra - dc_anterior.precio_compra) / dc_anterior.precio_compra) * 100) as inflacion_promedio,
        MAX(c_actual.fecha) as ultima_factura
      FROM detalle_compras dc_actual
      JOIN compras c_actual ON dc_actual.compra_id = c_actual.id
      JOIN productos p ON dc_actual.producto_id = p.id
      JOIN proveedors prov ON c_actual.proveedor_id = prov.id
      JOIN detalle_compras dc_anterior ON dc_actual.producto_id = dc_anterior.producto_id
      JOIN compras c_anterior ON dc_anterior.compra_id = c_anterior.id AND c_anterior.proveedor_id = prov.id
      WHERE c_actual.empresa_id = ? 
        AND c_actual.fecha > c_anterior.fecha 
        AND c_actual.fecha >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
      GROUP BY prov.id
      ORDER BY inflacion_promedio DESC
    `;

    const [rows] = await db.execute(query, [empresa_id]);

    const result = rows.map((r) => ({
      ...r,
      inflacion_promedio: parseFloat(r.inflacion_promedio || 0).toFixed(2),
      estado:
        r.inflacion_promedio > 15
          ? "CRÍTICO"
          : r.inflacion_promedio > 8
            ? "ALERTA"
            : "ESTABLE",
    }));

    res.json(result);
  } catch (error) {
    console.error("❌ ERROR RADAR INFLACION:", error);
    res.status(500).json({ message: error.message });
  }
};

const getSemaforoCumplimiento = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // CONSULTA BI:
    // Compara la suma de lo pedido vs lo recibido de todas las OC finalizadas
    const query = `
      SELECT 
        p.id, 
        p.empresa as proveedor_nombre,
        p.contacto,
        COUNT(oc.id) as total_pedidos,
        SUM(doc.cantidad_pedida) as total_unidades_pedidas,
        SUM(doc.cantidad_recibida) as total_unidades_recibidas,
        (SUM(doc.cantidad_recibida) / SUM(doc.cantidad_pedida) * 100) as score_cumplimiento
      FROM proveedors p
      JOIN ordenes_compra oc ON p.id = oc.proveedor_id
      JOIN detalle_ordenes_compra doc ON oc.id = doc.orden_id
      WHERE oc.empresa_id = ? AND oc.estado = 'Recibida'
      GROUP BY p.id
      ORDER BY score_cumplimiento ASC -- Los que menos cumplen primero para alertar
    `;

    const [rows] = await db.execute(query, [empresa_id]);

    const result = rows.map((r) => {
      const score = parseFloat(r.score_cumplimiento || 0);
      let estado = "";
      let color = "";
      let icono = "";

      if (score >= 95) {
        estado = "EXCELENTE";
        color = "text-success";
        icono = "fa-circle-check";
      } else if (score >= 80) {
        estado = "ACEPTABLE";
        color = "text-warning";
        icono = "fa-circle-exclamation";
      } else {
        estado = "DEFICIENTE";
        color = "text-danger";
        icono = "fa-circle-xmark";
      }

      return {
        ...r,
        score: score.toFixed(1),
        estado,
        color,
        icono,
      };
    });

    res.json(result);
  } catch (error) {
    console.error("ERROR SEMAFORO:", error);
    res.status(500).json({ message: error.message });
  }
};

const getMatrizDependencia = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // CONSULTA NIVEL DIOS:
    // 1. Calcula la utilidad (venta - costo) de cada ítem vendido en los últimos 90 días.
    // 2. Busca quién fue el último proveedor que nos vendió ese producto.
    // 3. Agrupa la utilidad total por proveedor.
    const query = `
      SELECT 
        prov.empresa as proveedor_nombre,
        SUM(dv.cantidad * (dv.precio_venta - dv.precio_compra)) as utilidad_generada,
        COUNT(DISTINCT p.id) as variedad_productos
      FROM detalle_ventas dv
      JOIN ventas v ON dv.venta_id = v.id
      JOIN productos p ON dv.producto_id = p.id
      -- Buscamos el último proveedor que nos vendió este producto
      JOIN (
        SELECT dc.producto_id, c.proveedor_id
        FROM detalle_compras dc
        JOIN compras c ON dc.compra_id = c.id
        WHERE c.empresa_id = ?
        AND (dc.producto_id, c.fecha) IN (
            SELECT producto_id, MAX(fecha) FROM detalle_compras JOIN compras ON detalle_compras.compra_id = compras.id GROUP BY producto_id
        )
      ) as ultimo_proveedor ON p.id = ultimo_proveedor.producto_id
      JOIN proveedors prov ON ultimo_proveedor.proveedor_id = prov.id
      WHERE v.empresa_id = ? AND v.fecha >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
      GROUP BY prov.id
      ORDER BY utilidad_generada DESC
    `;

    const [rows] = await db.execute(query, [empresa_id, empresa_id]);

    const utilidadTotal = rows.reduce(
      (acc, curr) => acc + parseFloat(curr.utilidad_generada),
      0,
    );

    const result = rows.map((r) => {
      const porcentaje =
        utilidadTotal > 0
          ? (parseFloat(r.utilidad_generada) / utilidadTotal) * 100
          : 0;
      let riesgo = "BAJO";
      let color = "text-success";

      if (porcentaje >= 50) {
        riesgo = "CRÍTICO";
        color = "text-danger";
      } else if (porcentaje >= 25) {
        riesgo = "MEDIO";
        color = "text-warning";
      }

      return {
        ...r,
        porcentaje: porcentaje.toFixed(1),
        riesgo,
        color,
      };
    });

    res.json({
      utilidad_total: utilidadTotal,
      proveedores: result,
    });
  } catch (error) {
    console.error("ERROR MATRIZ:", error);
    res.status(500).json({ message: error.message });
  }
};

const getAgingDeudaProveedores = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // 💵 1. Obtener Dólar con Timeout y Fallback (Sincronizado con Oracle Eye)
    let cotizacionFinal = 1476.1;
    try {
      const response = await axios.get(
        "https://dolarapi.com/v1/dolares/bolsa",
        { timeout: 3000 },
      );
      if (response.data && response.data.venta) {
        cotizacionFinal = parseFloat(response.data.venta);
      }
    } catch (e) {
      console.error("⚠️ Usando fallback de dólar en Aging");
    }

    // 🔍 2. Query Robusto: Filtramos por saldo matemático, no por banderas
    // Asegurate que la tabla 'pago_compras' existe y tiene 'compra_id' y 'monto'
    const query = `
      SELECT 
        p.id as proveedor_id,
        p.empresa as proveedor_nombre,
        p.contacto,
        c.id as factura_id,
        c.fecha as fecha_factura,
        c.precio_total as monto_original,
        -- Calculamos saldo: Total de factura menos lo pagado
        (c.precio_total - IFNULL((SELECT SUM(monto) FROM pago_compras WHERE compra_id = c.id), 0)) as saldo_pendiente,
        DATEDIFF(CURDATE(), c.fecha) as dias_deuda
      FROM compras c
      JOIN proveedors p ON c.proveedor_id = p.id
      WHERE c.empresa_id = ?
      HAVING saldo_pendiente > 1 -- Evita ruidos de centavos
      ORDER BY dias_deuda DESC
    `;

    const [rows] = await db.execute(query, [empresa_id]);

    // 📊 3. Mapeo y Clasificación BI
    const reporte = rows.map((r) => {
      let tramo = "0-7 días";
      let color = "success";

      if (r.dias_deuda > 30) {
        tramo = "+30 días";
        color = "danger";
      } else if (r.dias_deuda > 15) {
        tramo = "16-30 días";
        color = "warning";
      } else if (r.dias_deuda > 7) {
        tramo = "8-15 días";
        color = "info";
      }

      return {
        ...r,
        tramo,
        color_tramo: color,
        valor_usd_actual: (
          parseFloat(r.saldo_pendiente) / cotizacionFinal
        ).toFixed(2),
      };
    });

    res.json(reporte);
  } catch (error) {
    // 🕵️‍♂️ Esto imprimirá el error exacto en tu terminal (Node.js)
    console.error("❌ ERROR CRÍTICO EN AGING DEUDA:", error.message);
    res.status(500).json({
      message: "Error interno en el cálculo de deuda",
      error: error.message,
    });
  }
};

const countProveedores = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS total FROM proveedors WHERE empresa_id = ?",
      [empresa_id],
    );
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error al contar proveedores:", error);
    res.status(500).json({ total: 0 });
  }
};

const getProveedoresSummary = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const [rows] = await db.execute(
      `
      SELECT 
        (SELECT COUNT(*) FROM proveedors WHERE empresa_id = ?) AS total,
        IFNULL((SELECT SUM(deuda) FROM compras WHERE empresa_id = ?), 0) AS totalDeuda 
    `,
      [empresa_id, empresa_id],
    );

    res.json({
      total: rows[0].total || 0,
      totalDeuda: parseFloat(rows[0].totalDeuda) || 0,
    });
  } catch (error) {
    res.status(500).json({ total: 0, totalDeuda: 0 });
  }
};

module.exports = {
  getListadoProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  getGestionPagos,
  postRegistrarPago,
  getProveedoresConDeuda,
  getMovimientos,
  deleteProveedor,
  getInformeCuentasPorPagar,
  generarReporteCuentasPorPagarPDF,
  getRankingProveedoresBI,
  getRadarInflacion,
  getSemaforoCumplimiento,
  getMatrizDependencia,
  getAgingDeudaProveedores,
  countProveedores,
  getProveedoresSummary,
};
