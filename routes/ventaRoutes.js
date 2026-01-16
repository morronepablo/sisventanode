// routes/ventaRoutes.js
const express = require("express");
const {
  getListadoVentas,
  getVentaById,
  getTmpVentas,
  postTmpVenta,
  deleteTmpVenta,
  storeVenta,
  getDeudaCliente,
  getVentaTicket,
  updateTmpVentaQuantity,
  countVentas,
  getVentasSummary,
  generarReporte,
  getInformeProductos,
  generarInformeProductosPDF,
  getInformeClientes,
  generarInformeClientesPDF,
  getInformeMetodosPago,
  generarInformeMetodosPagoPDF,
  getInformeMovimientoStock,
  generarInformeMovimientoStockPDF,
  getHeatmapVentas,
  getVentasDashboard,
  enviarTicketPorWhatsApp,
  getReporteRentabilidad,
  getEstadoResultados,
  getRentabilidadReal,
  getPodioVendedores,
} = require("../controllers/ventaController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// 1. RUTAS PÚBLICAS (Tickets y Reportes PDF para window.open)
router.get("/ticket/:id", getVentaTicket);
router.get("/informes/productos-pdf", generarInformeProductosPDF);
router.get("/informes/clientes-pdf", generarInformeClientesPDF);
router.get("/informes/forma-pagos-pdf", generarInformeMetodosPagoPDF);
router.get("/informes/movimiento-stock-pdf", generarInformeMovimientoStockPDF);

// --- Middleware de Autenticación ---
router.use(authMiddleware);

// 2. RUTAS PROTEGIDAS
router.get("/informes/heatmap", getHeatmapVentas);
router.get("/dashboard-metrics", getVentasDashboard);
router.get("/count", countVentas);
router.get("/summary", getVentasSummary);
router.get("/reporte", generarReporte);
router.get("/informes/productos", getInformeProductos);
router.get("/informes/clientes", getInformeClientes);
router.get("/informes/forma-pagos", getInformeMetodosPago);
router.get("/informes/movimiento-stock", getInformeMovimientoStock);
router.get("/reporte-rentabilidad", getReporteRentabilidad);
router.get("/estado-resultados", getEstadoResultados);
router.get("/bi/rentabilidad-neta", getRentabilidadReal);
router.get("/bi/podio-vendedores", getPodioVendedores);

router.get("/tmp", getTmpVentas);
router.post("/tmp", postTmpVenta);
router.put("/tmp/:id", updateTmpVentaQuantity);
router.delete("/tmp/:id", deleteTmpVenta);
router.get("/deuda-cliente/:id", getDeudaCliente);

router.post("/", storeVenta);
router.get("/", getListadoVentas);
router.get("/:id", getVentaById);
router.post("/:id/enviar-whatsapp", authMiddleware, enviarTicketPorWhatsApp);

module.exports = router;
