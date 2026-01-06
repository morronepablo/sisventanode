// src/routes/gastoRoutes.js
const express = require("express");
const router = express.Router();
const {
  getCategoriasGastos,
  getListadoGastos,
  storeGasto,
  deleteGasto,
  countGastos,
} = require("../controllers/gastoController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

router.get("/count", countGastos);
router.get("/", getListadoGastos);
router.get("/categorias", getCategoriasGastos);
router.post("/", storeGasto);
router.delete("/:id", deleteGasto);

module.exports = router;
