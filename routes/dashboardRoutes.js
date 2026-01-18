// routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const {
  getFullChartData,
  getPrediccionBI,
  getTermometroCategorias,
  getPuntoEquilibrio,
  getGodModeStats,
} = require("../controllers/dashboardController");
const authMiddleware = require("../middlewares/authMiddleware");

// Aplicamos el middleware para que solo usuarios logueados vean las métricas
router.use(authMiddleware);

// Esta ruta responderá a: /api/dashboard/charts
router.get("/charts", getFullChartData);
router.get("/prediction", getPrediccionBI);
router.get("/termometro-categorias", getTermometroCategorias);
router.get("/punto-equilibrio", getPuntoEquilibrio);
router.get("/god-mode", getGodModeStats);

module.exports = router;
