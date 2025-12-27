// src/routes/empresaRoutes.js
const express = require("express");
const {
  getEmpresa,
  updateEmpresa,
  upload,
} = require("../controllers/empresaController");

const router = express.Router();

router.get("/:id", getEmpresa);
router.put("/:id", upload.single("logo"), updateEmpresa);

module.exports = router;
