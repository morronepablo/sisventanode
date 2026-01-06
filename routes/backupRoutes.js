// routes/backupRoutes.js
const express = require("express");
const router = express.Router();
const { createBackup } = require("../controllers/backupController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/download", authMiddleware, createBackup);

module.exports = router;
