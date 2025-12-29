// routes/proveedorRoutes.js
const express = require("express");
const {
  getListadoProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  countProveedores,
} = require("../controllers/proveedorController");
const router = express.Router();

router.get("/count", countProveedores);
router.get("/", getListadoProveedores);
router.get("/:id", getProveedorById);
router.post("/", createProveedor);
router.put("/:id", updateProveedor);

module.exports = router;
