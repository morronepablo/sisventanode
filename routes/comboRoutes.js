// routes/comboRoutes.js
const express = require("express");
const router = express.Router();
const comboController = require("../controllers/comboController");
const authMiddleware = require("../middlewares/authMiddleware");

// 1. Aplicar autenticación PRIMERO
router.use(authMiddleware);

// 2. Ahora todas las rutas pueden usar req.user.empresa_id
router.get("/count", comboController.countCombos);
router.get("/bi/analitica", comboController.getAnaliticaCombos);
router.get("/", comboController.getCombos);
router.get("/:id", comboController.getComboById);
router.post("/", comboController.storeCombo);
router.put("/:id", comboController.updateCombo);
router.delete("/:id", comboController.deleteCombo);

module.exports = router;
