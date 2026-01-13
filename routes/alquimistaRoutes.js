// routes/alquimistaRoutes.js
const express = require("express");
const router = express.Router();
const alquimistaController = require("../controllers/alquimistaController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get(
  "/sugerencias",
  authMiddleware,
  alquimistaController.getSugerenciasCombos
);

module.exports = router;
