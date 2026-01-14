// routes/proveedorRoutes.js
const express = require("express");
const {
  getListadoProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor, // 👈 1. Importamos la nueva función
  getGestionPagos,
  postRegistrarPago,
  getProveedoresConDeuda,
  getMovimientos,
  getInformeCuentasPorPagar,
  generarReporteCuentasPorPagarPDF,
  getRankingProveedoresBI,
  countProveedores,
  getProveedoresSummary,
} = require("../controllers/proveedorController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// APLICAR MIDDLEWARE A TODAS LAS RUTAS DEL ARCHIVO
router.use(authMiddleware);

router.get("/count", countProveedores);
router.get("/summary", getProveedoresSummary);
router.get("/informes/cuentas-por-pagar", getInformeCuentasPorPagar);
router.get("/informes/cuentas-por-pagar-pdf", generarReporteCuentasPorPagarPDF);
router.get("/ranking-bi", getRankingProveedoresBI);

router.get("/", getListadoProveedores);
router.get("/con-deuda", getProveedoresConDeuda);
router.get("/:id", getProveedorById);
router.get("/:id/pagos", getGestionPagos);
router.get("/:id/movimientos", getMovimientos);
router.post("/", createProveedor);
router.post("/:id/pagos", postRegistrarPago);
router.put("/:id", updateProveedor);

// 👈 2. AGREGAMOS LA RUTA DELETE
router.delete("/:id", deleteProveedor);

module.exports = router;
