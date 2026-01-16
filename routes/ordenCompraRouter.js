// backend/routes/ordenCompraRouter.js
const express = require("express");
const router = express.Router();
const ordenCompraController = require("../controllers/ordenCompraController");
const authMiddleware = require("../middlewares/authMiddleware");

// Todas las rutas de ordenes de compra requieren estar logueado
router.use(authMiddleware);

// Endpoint: GET /api/ordenes-compra
router.get("/", ordenCompraController.getOrdenes);

// Endpoint: POST /api/ordenes-compra
router.post("/", ordenCompraController.storeOrden);
router.get("/:id", ordenCompraController.getOrdenById);
router.post("/:id/recibir", ordenCompraController.recibirOrden);

module.exports = router;
