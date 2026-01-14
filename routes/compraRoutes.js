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
  updateTmpQuantity,
  updateTmpPrice,
  getAuditoriaTraicion,
  countCompras,
  getComprasSummary,
  getComprasMetrics,
} = require("../controllers/compraController");

// 1. IMPORTAR EL MIDDLEWARE DE AUTENTICACIÓN
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// 2. APLICAR EL MIDDLEWARE (Esto permite que req.user esté disponible para los Logs)
router.use(authMiddleware);

// --- RUTAS DE MÉTRICAS Y CONTEO ---
router.get("/dashboard-metrics", getComprasMetrics);
router.get("/count", countCompras);
router.get("/summary", getComprasSummary);

// --- RUTAS DE REPORTES E INFORMES ---
router.get("/reporte", generarReporte);
router.get("/informes/productos", getInformeProductos);
router.get("/informes/productos-pdf", generarInformeProductosPDF);
router.get("/informes/proveedores", getInformeProveedores);
router.get("/informes/proveedores-pdf", generarInformeProveedoresPDF);
router.get("/informes/no-pagadas", getInformeNoPagadas);
router.get("/informes/no-pagadas-pdf", generarInformeNoPagadasPDF);
router.get("/auditoria-traicion", getAuditoriaTraicion);

// --- RUTAS DEL CARRITO TEMPORAL (Rutas Fijas) ---
router.get("/tmp", getTmpCompras);
router.post("/tmp", postTmpCompra);
router.put("/tmp/:id", updateTmpQuantity);
router.put("/tmp/price/:id", updateTmpPrice);
router.delete("/tmp/:id", deleteTmpCompra);
router.post("/update-precio", updatePrecioCompra);

// --- RUTA PARA REGISTRAR LA COMPRA ---
router.post("/", storeCompra);

// --- RUTAS DINÁMICAS (Deben ir al final) ---
router.get("/", getListadoCompras);
router.get("/:id", getCompraById);
router.delete("/:id", deleteCompra);

module.exports = router;
