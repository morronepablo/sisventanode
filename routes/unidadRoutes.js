// routes/unidadRoutes.js
const express = require("express");
const {
  getAllUnidades,
  getUnidadById,
  createUnidad,
  updateUnidad,
  deleteUnidad,
  countUnidades,
} = require("../controllers/unidadController");
const authMiddleware = require("../middlewares/authMiddleware"); // 👈 1. IMPORTAR

const router = express.Router();

// 👈 2. APLICAR EL MIDDLEWARE A TODAS LAS RUTAS
router.use(authMiddleware);

router.get("/count", countUnidades);
router.get("/", getAllUnidades);
router.get("/:id", getUnidadById);
router.post("/", createUnidad);
router.put("/:id", updateUnidad);
router.delete("/:id", deleteUnidad);

module.exports = router;
