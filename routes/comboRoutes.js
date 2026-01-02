// routes/comboRoutes.js
const express = require("express");
const router = express.Router();
const { getCombos } = require("../controllers/comboController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, getCombos);

module.exports = router;
