// routes/ajusteRoutes.js
const express = require("express");
const router = express.Router();
const ajusteController = require("../controllers/ajusteController");
const authMiddleware = require("../middlewares/authMiddleware");

// Todas las rutas de ajustes requieren autenticación
router.use(authMiddleware);

// 1. Ruta para el conteo (Dashboard/Sidebar)
// URL: GET /api/ajustes/count
router.get("/count", ajusteController.countAjustes);

// 2. Ruta para el listado principal
// URL: GET /api/ajustes
router.get("/", ajusteController.getListadoAjustes);

/* 
  Las siguientes rutas las habilitaremos a medida que 
  creemos las funciones en el controlador:
*/

// 3. Ruta para obtener el detalle de un ajuste
// URL: GET /api/ajustes/:id
// router.get("/:id", ajusteController.getAjusteById);
router.get("/:id", ajusteController.getAjusteById);

// 4. Ruta para registrar un nuevo ajuste
// URL: POST /api/ajustes
// router.post("/", ajusteController.storeAjuste);
router.post("/", ajusteController.storeAjuste);

module.exports = router;
