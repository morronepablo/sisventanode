// controllers/proveedorController.js
const Proveedor = require("../models/Proveedor");
const db = require("../config/db");

const getListadoProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedor.getAll();

    // Si no hay proveedores, devolvemos array vacío de una vez
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
    console.error("Error detallado en el controlador:", error);
    res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
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
  try {
    const id = await Proveedor.create(req.body);
    res.status(201).json({ message: "Proveedor registrado con éxito", id });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al registrar el proveedor",
      error: error.message,
    });
  }
};

const updateProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizado = await Proveedor.updateById(id, req.body);
    if (!actualizado) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }
    res.json({ message: "Proveedor actualizado con éxito" });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar el proveedor",
      error: error.message,
    });
  }
};

const getGestionPagos = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Proveedor.getGestionPagos(id);
    const proveedor = await Proveedor.findById(id);

    if (!proveedor) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    res.json({
      ...data,
      proveedor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const postRegistrarPago = async (req, res) => {
  try {
    await Proveedor.registrarPagoDistribuido(req.body);
    res.json({ success: true, message: "Pagos registrados correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProveedoresConDeuda = async (req, res) => {
  try {
    // Buscamos proveedores que tengan deudas en la tabla compras
    const query = `
      SELECT p.id, p.empresa as nombre_completo, SUM(c.deuda) as deuda, COUNT(c.id) as compras_adeudadas
      FROM proveedors p
      JOIN compras c ON p.id = c.proveedor_id
      WHERE c.deuda > 0
      GROUP BY p.id
    `;
    const [rows] = await db.execute(query);
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
    const [rows] = await db.execute("SELECT COUNT(*) AS total FROM proveedors");
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error al contar proveedores:", error);
    res.status(500).json({ total: 0 });
  }
};

const getProveedoresSummary = async (req, res) => {
  try {
    // Obtenemos el total de proveedores y la suma de todas las deudas en compras
    const [rows] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM proveedors) AS total,
        IFNULL(SUM(deuda), 0) AS totalDeuda 
      FROM compras
    `);
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
