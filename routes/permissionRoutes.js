// routes/permissionRoutes.js
const express = require("express");
const {
  getAllPermissions,
  getPermissionById,
  getPermissionWithDetails,
  createPermission,
  updatePermission,
  deletePermission,
  countPermissions,
} = require("../controllers/permissionController");

const router = express.Router();

router.get("/count", countPermissions);
router.get("/", getAllPermissions);
router.get("/:id", getPermissionById);
router.get("/:id/detalles", getPermissionWithDetails);
router.post("/", createPermission);
router.put("/:id", updatePermission);
router.delete("/:id", deletePermission);

module.exports = router;
