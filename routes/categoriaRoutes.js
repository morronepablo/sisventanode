// routes/categoriaRoutes.js
const express = require("express");
const {
  getAllCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  countCategorias,
} = require("../controllers/categoriaController");
const authMiddleware = require("../middlewares/authMiddleware"); // 👈 1. IMPORTAR

const router = express.Router();

// 👈 2. APLICAR EL MIDDLEWARE A TODAS LAS RUTAS
// Esto llenará el objeto req.user con los datos del token
router.use(authMiddleware);

router.get("/count", countCategorias);
router.get("/", getAllCategorias);
router.get("/:id", getCategoriaById);
router.post("/", createCategoria);
router.put("/:id", updateCategoria);
router.delete("/:id", deleteCategoria);

module.exports = router;
