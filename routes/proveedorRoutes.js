// routes/proveedorRoutes.js
const express = require("express");
const {
  getListadoProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
} = require("../controllers/proveedorController");
const router = express.Router();

router.get("/", getListadoProveedores);
router.get("/:id", getProveedorById);
router.post("/", createProveedor);
router.put("/:id", updateProveedor);

module.exports = router;
