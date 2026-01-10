// controllers/proveedorController.js
const Proveedor = require("../models/Proveedor");
const db = require("../config/db");
const pdf = require("html-pdf");
const path = require("path");
const fs = require("fs");
const { registrarLog } = require("../utils/logger"); // 👈 1. Importamos el logger
const { calcularDiferencias } = require("../utils/differences"); // 👈 1. Importar la utilidad

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
        [p.id]
      );

      const deudaTotal = facturas.reduce(
        (acc, f) => acc + (f.saldo_pendiente || 0),
        0
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
      }. Contacto: ${req.body.contacto}`
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
      `Se actualizaron los datos del proveedor: ${proveedorAnterior.empresa}. Cambios: ${detalleCambios}`
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
  console.log("--- INICIO PAGO A PROVEEDOR ---");
  try {
    const { distribucion, metodo_pago } = req.body;
    const proveedor_id = req.params.id;

    // 1. Ejecutar la lógica de pago en el modelo
    await Proveedor.registrarPagoDistribuido(req.body);

    // 2. CALCULAR EL TOTAL REAL para el log (sumando la distribución)
    const montoRealPagado = distribucion.reduce(
      (acc, item) => acc + parseFloat(item.monto || 0),
      0
    );

    // 👈 2. EMITIR EVENTO EN TIEMPO REAL PARA EL DASHBOARD
    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");

    // 3. REGISTRO DE LOG CORREGIDO
    await registrarLog(
      req,
      "PAGO",
      "PROVEEDORES",
      `Se registró un pago al proveedor ID: ${proveedor_id} por un total de $${montoRealPagado.toLocaleString(
        "es-AR",
        { minimumFractionDigits: 2 }
      )} vía ${metodo_pago}`
    );

    console.log(
      `[PROVEEDORES] Pago de $${montoRealPagado} registrado para proveedor ${proveedor_id}`
    );
    res.json({ success: true, message: "Pagos registrados correctamente" });
  } catch (error) {
    console.error(
      "[PROVEEDORES ERROR] Fallo al registrar pago:",
      error.message
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
      [id]
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
      `Se eliminó al proveedor: ${nombreProv}`
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
        d.saldo
      ).toLocaleString("es-AR")}</td></tr>`;
    });

    const html = `<html><head><style>body{font-family:Helvetica;font-size:12px}.header{border-bottom:2px solid #007bff} table{width:100%; border-collapse:collapse; margin-top:20px} th{background:#343a40; color:#fff; padding:8px} td{padding:8px; border:1px solid #eee}</style></head>
    <body><div class="header"><h1>${
      empresa.nombre_empresa
    }</h1><h3>Informe de Cuentas por Pagar (Deudas a Proveedores)</h3></div>
    <table><thead><tr><th>#</th><th>Proveedor</th><th>Marca</th><th>Saldo a Pagar</th></tr></thead><tbody>${filas}</tbody></table>
    <h2 style="text-align:right; margin-top:30px;">TOTAL COMPROMISOS: $ ${totalDeuda.toLocaleString(
      "es-AR"
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

const countProveedores = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS total FROM proveedors WHERE empresa_id = ?",
      [empresa_id]
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
      [empresa_id, empresa_id]
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
  countProveedores,
  getProveedoresSummary,
};
