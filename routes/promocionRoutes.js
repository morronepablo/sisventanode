// routes/promocionRoutes.js
const express = require("express");
const router = express.Router();
const {
  getPromociones,
  storePromocion,
  deletePromocion,
} = require("../controllers/promocionController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);
router.get("/", getPromociones);
router.post("/", storePromocion);
router.delete("/:id", deletePromocion);

module.exports = router;
