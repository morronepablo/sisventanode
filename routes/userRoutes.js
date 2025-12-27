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

const router = express.Router();

// 🔸 Rutas estáticas PRIMERO
router.get("/count", countUsers);

// 🔸 Rutas dinámicas DESPUÉS
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
