// // routes/backupRoutes.js
// const express = require("express");
// const router = express.Router();
// const {
//   createBackup,
//   resetSystem,
// } = require("../controllers/backupController");
// const authMiddleware = require("../middlewares/authMiddleware");

// router.get("/download", authMiddleware, createBackup);
// router.post("/reset-system", authMiddleware, resetSystem);

// module.exports = router;

// routes/backupRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  createBackup,
  resetSystem,
  restoreSystem,
} = require("../controllers/backupController");
const authMiddleware = require("../middlewares/authMiddleware");

// Configuración de almacenamiento temporal para el SQL
const upload = multer({ dest: "uploads/" });

router.get("/download", authMiddleware, createBackup);
router.post("/reset-system", authMiddleware, resetSystem);

// NUEVA RUTA: Restaurar (usa el middleware 'upload' antes del controlador)
router.post("/restore", authMiddleware, upload.single("backup"), restoreSystem);

module.exports = router;
