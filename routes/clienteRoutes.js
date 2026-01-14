// routes/clienteRoutes.js
const express = require("express");
const router = express.Router();
const {
  getListadoClientes,
  createCliente,
  getClienteById,
  countClientes,
  getClientesSummary,
  eliminarCliente,
  getClientesConDeuda,
  getGestionPagos,
  registrarPago,
  updatePago,
  generarReporte,
  getReciboPagoTicket,
  getComprasCliente,
  getHistorialCliente,
  updateCliente,
  getInformeCobranzas,
  generarReporteCobranzasPDF,
  reclamarDeuda,
  generarEstadoCuentaPDF,
  getClientesPerdidos,
  postRecapturaWhatsApp,
  getSegmentacionClientes,
  cargarSaldoBilletera,
} = require("../controllers/clienteController");
const authMiddleware = require("../middlewares/authMiddleware");

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas de conteo y resumen (Dashboard/Navbar)
router.get("/reporte", generarReporte);
router.get("/count", countClientes);
router.get("/summary", getClientesSummary);
router.get("/con-deuda", getClientesConDeuda);
router.get("/informes/cobranzas", getInformeCobranzas);
router.get("/informes/cobranzas-pdf", generarReporteCobranzasPDF);
router.get("/recaptura", getClientesPerdidos);
router.get("/segmentacion-rfm", getSegmentacionClientes);

// Rutas de Gestión de Pagos y Tickets
router.get("/pagos/ticket/:pagoId", getReciboPagoTicket);
router.put("/pagos/:pagoId", updatePago);
router.post("/reclamar-deuda/:id", reclamarDeuda);
router.post("/enviar-recaptura/:id", postRecapturaWhatsApp);

// Rutas principales de Clientes
router.get("/", getListadoClientes);
router.post("/", createCliente);
router.get("/:id", getClienteById);
router.put("/:id", updateCliente);
router.delete("/:id", eliminarCliente);

// Rutas de Detalles Específicos por Cliente
router.get("/:id/pagos", getGestionPagos);
router.post("/:id/pagos", registrarPago);
router.get("/:id/compras", getComprasCliente); // 👈 2. RUTA DE COMPRAS (LA ANTERIOR)
router.get("/:id/historial", getHistorialCliente); // 👈 3. RUTA DE HISTORIAL (LA NUEVA)
router.get("/:id/estado-cuenta-pdf", generarEstadoCuentaPDF);
router.post("/:id/billetera/cargar", cargarSaldoBilletera);

module.exports = router;
