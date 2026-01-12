// routes/productoRoutes.js
const express = require("express");
const {
  getAllProductos,
  getProductosBajoStock,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  getHistorialPrecios,
  getReposicionReport,
  countProductos,
  countBajoStock,
  generarReporteStock,
  updatePreciosMasivo,
  generarEtiquetas,
  importarProductos,
  upload,
  uploadCsv,
} = require("../controllers/productoController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// --- 1. RUTAS PÚBLICAS (Para que window.open funcione sin Token) ---
router.get("/reporte", generarReporteStock);
router.get("/:id/etiquetas", generarEtiquetas);

// --- 2. APLICAR MIDDLEWARE A LAS DEMÁS RUTAS ---
router.use(authMiddleware);

router.get("/count", countProductos);
router.get("/bajo-stock-count", countBajoStock);
router.get("/reporte/reposicion", getReposicionReport);
router.get("/", getAllProductos);
router.get("/bajo-stock", getProductosBajoStock);
router.post("/update-masivo", updatePreciosMasivo);
router.get("/:id", getProductoById);
router.get("/:id/historial-precios", getHistorialPrecios);

router.post("/", upload.single("imagen"), createProducto);
router.post("/importar", uploadCsv.single("csv_file"), importarProductos);
router.put("/:id", upload.single("imagen"), updateProducto);
router.delete("/:id", deleteProducto);

module.exports = router;
