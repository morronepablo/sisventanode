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

module.exports = router;
