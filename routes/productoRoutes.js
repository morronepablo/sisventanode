// routes/productoRoutes.js
const express = require("express");
const {
  getAllProductos,
  getProductosBajoStock,
  getProductoById,
  createProducto,
  aplicarCorreccionGuardian,
  updateProducto,
  deleteProducto,
  getHistorialPrecios,
  getReposicionReport,
  getPrediccionCompra,
  getAuditoriaMargenes,
  getProductosMuertos,
  getSimulacionImpacto,
  aplicarAumentoMasivo,
  getAnaliticaPareto,
  getOraculoStock,
  getCementerioStock,
  getLucroCesante,
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
router.get("/asistente-compra", getPrediccionCompra);
router.get("/auditoria-margenes", getAuditoriaMargenes);
router.get("/liquidador-inteligente", getProductosMuertos);
router.get("/simulador-precios", getSimulacionImpacto);
router.post("/aplicar-aumento-masivo", aplicarAumentoMasivo);
router.get("/radar-pareto", getAnaliticaPareto);
router.get("/bi/oraculo-stock", getOraculoStock);
router.get("/bi/cementerio", getCementerioStock);
router.get("/bi/lucro-cesante", getLucroCesante);

router.get("/", getAllProductos);
router.get("/bajo-stock", getProductosBajoStock);
router.post("/update-masivo", updatePreciosMasivo);
router.get("/:id", getProductoById);
router.get("/:id/historial-precios", getHistorialPrecios);

router.post("/", upload.single("imagen"), createProducto);
router.post("/importar", uploadCsv.single("csv_file"), importarProductos);
router.put("/:id", upload.single("imagen"), updateProducto);
router.put("/guardian-fix/:id", aplicarCorreccionGuardian);
router.delete("/:id", deleteProducto);

module.exports = router;
