// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const {
  login,
  register,
  logoutLog,
  logExpiration,
} = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

// Rutas públicas
router.post("/login", login);
router.post("/register", register);
router.post("/log-expiration", logExpiration);

// Ruta para registrar el cierre de sesión (Requiere token antes de borrarlo)
router.post("/logout-log", authMiddleware, logoutLog);

module.exports = router;
