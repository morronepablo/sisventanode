// controllers/compraController.js
const Compra = require("../models/Compra");
const db = require("../config/db");

const getListadoCompras = async (req, res) => {
  try {
    const compras = await Compra.getAll();
    if (!compras || compras.length === 0) return res.json([]);

    const result = [];
    for (const c of compras) {
      const detalles = await Compra.getDetallesByCompraId(c.id);
      result.push({ ...c, detalles });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener listado" });
  }
};

const getCompraById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(
      `SELECT c.*, p.empresa as proveedor_nombre 
       FROM compras c 
       LEFT JOIN proveedors p ON c.proveedor_id = p.id 
       WHERE c.id = ?`,
      [id]
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
  try {
    await Compra.store(req.body, req.body.usuario_id, req.body.empresa_id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCompra = async (req, res) => {
  try {
    const { id } = req.params;
    await Compra.delete(id);
    res.json({ message: "Eliminada" });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

const updatePrecioCompra = async (req, res) => {
  try {
    await Compra.updatePrecioProducto(
      req.body.producto_id,
      req.body.precio_compra
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const countCompras = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT COUNT(*) AS total FROM compras");
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error al contar compras:", error);
    res.status(500).json({ total: 0 });
  }
};

const getComprasSummary = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const [totalRows] = await db.execute(
      "SELECT COUNT(*) AS total FROM compras"
    );
    const [yearRows] = await db.execute(
      "SELECT COUNT(*) AS totalAnio FROM compras WHERE YEAR(fecha) = ?",
      [year]
    );

    res.json({
      total: totalRows[0].total || 0,
      totalAnio: yearRows[0].totalAnio || 0,
    });
  } catch (error) {
    res.status(500).json({ total: 0, totalAnio: 0 });
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
  countCompras,
  getComprasSummary,
};
