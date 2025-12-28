// routes/productoRoutes.js
const express = require("express");
const {
  getAllProductos,
  getProductosBajoStock,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  countProductos,
  generarReporteStock,
  importarProductos,
  upload,
  uploadCsv,
} = require("../controllers/productoController");

const router = express.Router();

router.get("/count", countProductos);
router.get("/", getAllProductos);
router.get("/bajo-stock", getProductosBajoStock);
router.get("/reporte", generarReporteStock);
router.get("/:id", getProductoById);

router.post("/", upload.single("imagen"), createProducto);
router.post("/importar", uploadCsv.single("csv_file"), importarProductos);

router.put("/:id", upload.single("imagen"), updateProducto);

router.delete("/:id", deleteProducto);

module.exports = router;
