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
} = require("../controllers/clienteController");
const authMiddleware = require("../middlewares/authMiddleware");

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas de conteo y resumen (Dashboard/Navbar)
router.get("/reporte", generarReporte);
router.get("/count", countClientes);
router.get("/summary", getClientesSummary);
router.get("/con-deuda", getClientesConDeuda);

// Rutas de Gestión de Pagos y Tickets
router.get("/pagos/ticket/:pagoId", getReciboPagoTicket);
router.put("/pagos/:pagoId", updatePago);

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

module.exports = router;
