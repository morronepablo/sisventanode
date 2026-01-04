// routes/devolucionRoutes.js
const express = require("express");
const {
  getListadoDevoluciones,
  getTmpDevoluciones,
  postTmpDevolucion,
  deleteTmpDevolucion,
  storeDevolucion,
  getDevolucionById,
  countDevoluciones,
} = require("../controllers/devolucionController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/count", countDevoluciones);

router.use(authMiddleware);

router.get("/", getListadoDevoluciones);
router.get("/tmp", getTmpDevoluciones);
router.post("/tmp", postTmpDevolucion);
router.delete("/tmp/:id", deleteTmpDevolucion);
router.post("/", storeDevolucion);
router.get("/:id", getDevolucionById);

module.exports = router;
