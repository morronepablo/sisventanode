// controllers/proveedorController.js
const Proveedor = require("../models/Proveedor");
const db = require("../config/db");
const { registrarLog } = require("../utils/logger"); // 👈 1. Importamos el logger

const getListadoProveedores = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    // Pasamos el empresa_id para filtrar correctamente
    const proveedores = await Proveedor.getAll(empresa_id);

    if (!proveedores || proveedores.length === 0) {
      return res.json([]);
    }

    const result = [];
    for (const p of proveedores) {
      const facturas = await Proveedor.getFacturasAdeudadas(p.id);
      const pagos = await Proveedor.getPagosRealizados(p.id);

      const deudaTotal = facturas.reduce(
        (acc, f) => acc + (f.saldo_pendiente || 0),
        0
      );

      result.push({
        ...p,
        deuda: deudaTotal,
        facturasAdeudadas: facturas,
        pagosRealizados: pagos,
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
  console.log("--- INICIO CREATE PROVEEDOR ---");
  try {
    const empresa_id = req.user.empresa_id;
    // Agregamos empresa_id a los datos antes de crear
    const datos = { ...req.body, empresa_id };

    const id = await Proveedor.create(datos);
    console.log(`[PROVEEDORES] Creado ID: ${id} para empresa: ${empresa_id}`);

    // 👈 REGISTRO DE LOG
    await registrarLog(
      req,
      "CREAR",
      "PROVEEDORES",
      `Se registró al proveedor: ${req.body.empresa} (Marca: ${
        req.body.marca || "N/A"
      })`
    );

    res.status(201).json({ message: "Proveedor registrado con éxito", id });
  } catch (error) {
    console.error("[PROVEEDORES ERROR] Create:", error.message);
    res.status(500).json({ message: "Error al registrar el proveedor" });
  }
  console.log("--- FIN CREATE PROVEEDOR ---");
};

const updateProveedor = async (req, res) => {
  console.log("--- INICIO UPDATE PROVEEDOR ---");
  try {
    const { id } = req.params;
    const actualizado = await Proveedor.updateById(id, req.body);

    if (!actualizado) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    // 👈 REGISTRO DE LOG
    await registrarLog(
      req,
      "EDITAR",
      "PROVEEDORES",
      `Se actualizaron los datos del proveedor: ${req.body.empresa} (ID: ${id})`
    );

    console.log(`[PROVEEDORES] Proveedor ID ${id} actualizado con éxito.`);
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
  countProveedores,
  getProveedoresSummary,
};
