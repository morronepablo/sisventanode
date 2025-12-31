// routes/compraRoutes.js
const express = require("express");
const {
  getListadoCompras,
  deleteCompra,
  getTmpCompras,
  postTmpCompra,
  deleteTmpCompra,
  updatePrecioCompra,
  storeCompra,
  getCompraById,
  generarReporte,
  getInformeProductos,
  generarInformeProductosPDF,
  getInformeProveedores,
  generarInformeProveedoresPDF,
  getInformeNoPagadas,
  generarInformeNoPagadasPDF,
  countCompras,
  getComprasSummary,
} = require("../controllers/compraController");

const router = express.Router();

router.get("/count", countCompras);
router.get("/summary", getComprasSummary);
router.get("/reporte", generarReporte);
router.get("/informes/productos", getInformeProductos);
router.get("/informes/productos-pdf", generarInformeProductosPDF);
router.get("/informes/proveedores", getInformeProveedores);
router.get("/informes/proveedores-pdf", generarInformeProveedoresPDF);
router.get("/informes/no-pagadas", getInformeNoPagadas);
router.get("/informes/no-pagadas-pdf", generarInformeNoPagadasPDF);

// 1. RUTAS FIJAS (Deben ir primero)
router.get("/tmp", getTmpCompras);
router.post("/tmp", postTmpCompra);
router.delete("/tmp/:id", deleteTmpCompra);
router.post("/update-precio", updatePrecioCompra);
router.post("/", storeCompra);

// 2. RUTAS DINÁMICAS (Deben ir al final)
router.get("/", getListadoCompras);
router.get("/:id", getCompraById); // <--- Ahora Express no la confundirá con /tmp
router.delete("/:id", deleteCompra);

module.exports = router;
