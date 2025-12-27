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

const router = express.Router();

router.get("/count", countCategorias);
router.get("/", getAllCategorias);
router.get("/:id", getCategoriaById);
router.post("/", createCategoria);
router.put("/:id", updateCategoria);
router.delete("/:id", deleteCategoria);

module.exports = router;
