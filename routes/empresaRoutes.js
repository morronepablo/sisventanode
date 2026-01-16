// src/routes/empresaRoutes.js
const express = require("express");
const {
  getEmpresa,
  updateEmpresa,
  upload,
  getComisiones,
  updateComisiones,
  countEmpresas,
} = require("../controllers/empresaController");
const authMiddleware = require("../middlewares/authMiddleware"); // 👈 1. IMPORTAR MIDDLEWARE

const router = express.Router();

// 👈 2. APLICAR EL MIDDLEWARE A TODAS LAS RUTAS DE ESTE ARCHIVO
router.use(authMiddleware);

router.get("/count", countEmpresas);
router.get("/:id", getEmpresa);
router.get("/:id/comisiones", getComisiones);
router.put("/:id/comisiones", updateComisiones);

// El upload debe ir antes del controlador, pero después del middleware de auth
router.put("/:id", upload.single("logo"), updateEmpresa);

module.exports = router;
