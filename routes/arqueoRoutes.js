// routes/arqueoRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllArqueos,
  createArqueo,
  checkArqueoAbierto,
  getArqueoById,
  updateArqueo,
  storeMovimiento,
  closeArqueo,
  generarReporte,
  countArqueos,
  getArqueosSummary,
  getMonitorTiempoReal,
  postRetiroParcial,
} = require("../controllers/arqueoController");
const authMiddleware = require("../middlewares/authMiddleware");

// 👈 APLICAR MIDDLEWARE A TODAS LAS RUTAS
router.use(authMiddleware);

// Ahora todas estas rutas son seguras y alimentan al logger
router.get("/count", countArqueos);
router.get("/summary", getArqueosSummary);
router.get("/reporte", generarReporte);
router.get("/monitor-vivo", getMonitorTiempoReal);
router.post("/retiro-parcial", postRetiroParcial);
router.get("/", getAllArqueos);
router.get("/estado-abierto", checkArqueoAbierto);
router.post("/", createArqueo);
router.get("/:id", getArqueoById);
router.put("/:id", updateArqueo);
router.post("/movimientos", storeMovimiento);
router.put("/cierre/:id", closeArqueo);

module.exports = router;
