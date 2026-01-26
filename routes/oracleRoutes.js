// src/routes/oracleRoutes.js
const express = require("express");
const router = express.Router();
const oracleController = require("../controllers/oracleController");

// 🛡️ REVISIÓN DE SEGURIDAD
// Importamos el middleware. Si no sabes el nombre, prueba con 'auth'
// que es el estándar de AdminLTE / Node setups.
const authMiddleware = require("../middlewares/authMiddleware");

// Verificamos si es un objeto con la función 'auth' o la función directa
const verify =
  authMiddleware.auth || authMiddleware.verifyToken || authMiddleware;

// Si 'verify' sigue siendo undefined, el servidor te avisará antes de crashear
if (!verify) {
  console.error(
    "❌ ERROR: No se pudo cargar el middleware de seguridad en oracleRoutes",
  );
}

router.get("/pulse", verify, oracleController.getPulse);

module.exports = router;
