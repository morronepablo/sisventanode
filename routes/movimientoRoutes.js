// src/routes/movimientoRoutes.js
const express = require("express");
const router = express.Router();
const movimientoController = require("../controllers/movimientoController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

router.get("/count", movimientoController.countMovimientos);
router.get("/productos-list", movimientoController.getProductosList); // <-- Nueva
router.get("/producto/:id", movimientoController.getMovimientosByProducto); // <-- Nueva
router.post("/rebuild", movimientoController.rebuildMovimientos);

module.exports = router;
