// routes/roleRoutes.js
const express = require("express");
const {
  getAllRoles,
  getRoleById,
  getRoleWithDetails,
  getRolePermissions,
  assignPermissionsToRole,
  createRole,
  updateRole,
  deleteRole,
} = require("../controllers/roleController");

const router = express.Router();

router.get("/", getAllRoles);
router.get("/:id", getRoleById);
router.get("/:id/detalles", getRoleWithDetails);
router.get("/:id/permisos", getRolePermissions);
router.post("/:id/permisos", assignPermissionsToRole);
router.post("/", createRole);
router.put("/:id", updateRole);
router.delete("/:id", deleteRole);

module.exports = router;
