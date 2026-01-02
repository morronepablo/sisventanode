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
} = require("../controllers/ventaController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/count", countVentas);
router.get("/summary", getVentasSummary);
router.get("/reporte", generarReporte);
router.get("/informes/productos", getInformeProductos);
router.get("/informes/productos-pdf", generarInformeProductosPDF);
router.get("/informes/clientes", getInformeClientes);
router.get("/informes/clientes-pdf", generarInformeClientesPDF);
router.get("/informes/forma-pagos", getInformeMetodosPago);
router.get("/informes/forma-pagos-pdf", generarInformeMetodosPagoPDF);
router.get("/informes/movimiento-stock", getInformeMovimientoStock);
router.get("/informes/movimiento-stock-pdf", generarInformeMovimientoStockPDF);

// 1. RUTA PÚBLICA (Para poder abrir el Ticket con window.open sin problemas de token)
router.get("/ticket/:id", getVentaTicket);

// --- Todas las rutas debajo de esta línea requieren autenticación ---
router.use(authMiddleware);

// 2. RUTAS FIJAS (Carrito temporal y Deuda)
// Importante: Van arriba para que Express no confunda "/tmp" con un "/:id"
router.get("/tmp", getTmpVentas);
router.post("/tmp", postTmpVenta);
router.delete("/tmp/:id", deleteTmpVenta);
router.get("/deuda-cliente/:id", getDeudaCliente);

// 3. RUTAS DE PROCESAMIENTO
router.post("/", storeVenta);

// 4. RUTAS DINÁMICAS (Listado y Detalles)
// Deben ir al final para no interceptar las rutas fijas
router.get("/", getListadoVentas);
router.get("/:id", getVentaById);

module.exports = router;
