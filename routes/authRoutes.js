// routes/authRoutes.js
const express = require("express");
const authController = require("../controllers/authController"); // ← NO destructuring

const router = express.Router();

router.post("/login", authController.login); // ← Acceso directo
// router.post("/register", authController.register); // ← Comenta si no existe

module.exports = router;
