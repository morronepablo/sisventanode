// src/routes/gastoRoutes.js
const express = require("express");
const router = express.Router();
const {
  getCategoriasGastos,
  getListadoGastos,
  storeGasto,
  getGastoById,
  deleteGasto,
  getInformeCirujano,
  getPuntoEquilibrio,
  getGastosHormiga,
  getSaludFinanciera,
  getOraculoFinanciero,
  storeCategoriaGasto,
  getCategoriaGastoById,
  updateCategoriaGasto,
  deleteCategoriaGasto,
  countGastos,
} = require("../controllers/gastoController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

router.get("/count", countGastos);
router.get("/informes/cirujano", getInformeCirujano);
router.get("/informes/punto-equilibrio", getPuntoEquilibrio);
router.get("/informes/gastos-hormiga", getGastosHormiga);
router.get("/informes/salud-financiera", getSaludFinanciera);
router.get("/informes/oraculo-financiero", getOraculoFinanciero);
router.get("/", getListadoGastos);
router.get("/categorias", getCategoriasGastos);
router.post("/categorias", storeCategoriaGasto);
router.delete("/categorias/:id", deleteCategoriaGasto);
router.get("/categorias/:id", getCategoriaGastoById);
router.put("/categorias/:id", updateCategoriaGasto);
router.get("/:id", getGastoById);
router.post("/", storeGasto);
router.delete("/:id", deleteGasto);

module.exports = router;
