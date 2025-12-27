// routes/unidadRoutes.js
const express = require("express");
const {
  getAllUnidades,
  getUnidadById,
  createUnidad,
  updateUnidad,
  deleteUnidad,
  countUnidades,
} = require("../controllers/unidadController");

const router = express.Router();

router.get("/count", countUnidades);
router.get("/", getAllUnidades);
router.get("/:id", getUnidadById);
router.post("/", createUnidad);
router.put("/:id", updateUnidad);
router.delete("/:id", deleteUnidad);

module.exports = router;
