// routes/userRoutes.js
const express = require("express");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  countUsers,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware"); // 👈 1. IMPORTAR

const router = express.Router();

// 👈 2. APLICAR EL MIDDLEWARE A TODAS LAS RUTAS
// Esto garantiza que req.user esté lleno en todas las funciones del controlador
router.use(authMiddleware);

router.get("/count", countUsers);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
