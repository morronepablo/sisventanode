// routes/roleRoutes.js
const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const authMiddleware = require("../middlewares/authMiddleware");

// 👈 APLICAR MIDDLEWARE A TODAS LAS RUTAS
router.use(authMiddleware);

router.get("/count", roleController.countRoles);
router.get("/", roleController.getAllRoles);
router.get("/:id", roleController.getRoleById);
router.get("/:id/detalles", roleController.getRoleWithDetails);
router.get("/:id/permisos", roleController.getRolePermissions);
router.post("/:id/permisos", roleController.assignPermissionsToRole);
router.post("/", roleController.createRole);
router.put("/:id", roleController.updateRole);
router.delete("/:id", roleController.deleteRole);

module.exports = router;
