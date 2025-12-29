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
  countArqueos,
} = require("../controllers/arqueoController");

// Importamos el middleware que acabamos de crear
const authMiddleware = require("../middlewares/authMiddleware");

// Rutas protegidas
router.get("/count", countArqueos);
router.get("/", authMiddleware, getAllArqueos);
router.get("/estado-abierto", authMiddleware, checkArqueoAbierto);
router.post("/", authMiddleware, createArqueo);
router.get("/:id", authMiddleware, getArqueoById);
router.put("/:id", authMiddleware, updateArqueo);
router.post("/movimientos", authMiddleware, storeMovimiento);
router.put("/cierre/:id", authMiddleware, closeArqueo);

module.exports = router;
