// routes/auditoriaRoutes.js
const express = require("express");
const router = express.Router();
const auditoriaController = require("../controllers/auditoriaController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/anomalias", authMiddleware, auditoriaController.getAnomalias);
router.get(
  "/integridad",
  authMiddleware,
  auditoriaController.getReporteIntegridad
);
router.get(
  "/integridad/detalle/:usuario_id",
  authMiddleware,
  auditoriaController.getDetalleBorrados
);

module.exports = router;
