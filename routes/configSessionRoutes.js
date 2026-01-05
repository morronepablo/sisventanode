// routes/configSessionRoutes.js
const express = require("express");
const router = express.Router();
const {
  getSessionConfig,
  updateSessionConfig,
} = require("../controllers/sessionController");
const authMiddleware = require("../middlewares/authMiddleware");

// Importante: GET /api/config-session
router.get("/", authMiddleware, getSessionConfig);
// Importante: PUT /api/config-session
router.put("/", authMiddleware, updateSessionConfig);

module.exports = router;
