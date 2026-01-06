// src/routes/logRoutes.js
const express = require("express");
const router = express.Router();
const { getListadoLogs, countLogs } = require("../controllers/logController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

router.get("/count", countLogs);
router.get("/", getListadoLogs);

module.exports = router;
