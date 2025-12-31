// routes/compraRoutes.js
const express = require("express");
const {
  getListadoCompras,
  deleteCompra,
  getTmpCompras,
  postTmpCompra,
  deleteTmpCompra,
  updatePrecioCompra,
  storeCompra,
  getCompraById,
  countCompras,
  getComprasSummary,
} = require("../controllers/compraController");

const router = express.Router();

router.get("/count", countCompras);
router.get("/summary", getComprasSummary);

// 1. RUTAS FIJAS (Deben ir primero)
router.get("/tmp", getTmpCompras);
router.post("/tmp", postTmpCompra);
router.delete("/tmp/:id", deleteTmpCompra);
router.post("/update-precio", updatePrecioCompra);
router.post("/", storeCompra);

// 2. RUTAS DINÁMICAS (Deben ir al final)
router.get("/", getListadoCompras);
router.get("/:id", getCompraById); // <--- Ahora Express no la confundirá con /tmp
router.delete("/:id", deleteCompra);

module.exports = router;
