// controllers/unidadController.js
const Unidad = require("../models/Unidad");
const db = require("../config/db");

const getAllUnidades = async (req, res) => {
  try {
    const unidades = await Unidad.getAll();
    res.json(unidades);
  } catch (error) {
    console.error("Error al obtener unidades:", error);
    res
      .status(500)
      .json({ message: "Error al obtener unidades", error: error.message });
  }
};

const getUnidadById = async (req, res) => {
  try {
    const { id } = req.params;
    const unidad = await Unidad.findById(id);
    if (!unidad)
      return res.status(404).json({ message: "Unidad no encontrada" });
    res.json(unidad);
  } catch (error) {
    console.error("Error al obtener unidad:", error);
    res
      .status(500)
      .json({ message: "Error al obtener unidad", error: error.message });
  }
};

const createUnidad = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre?.trim())
      return res.status(400).json({ message: "El nombre es obligatorio" });

    if (await Unidad.nombreExists(nombre)) {
      return res
        .status(400)
        .json({ message: "Ya existe una unidad con ese nombre" });
    }

    const id = await Unidad.create({
      nombre: nombre.trim(),
      descripcion: descripcion || "",
      empresa_id: req.user?.empresa_id || 1, // Asumimos que req.user tiene empresa_id
    });

    res.status(201).json({ message: "Unidad creada exitosamente", id });
  } catch (error) {
    console.error("Error al crear unidad:", error);
    res
      .status(500)
      .json({ message: "Error al crear unidad", error: error.message });
  }
};

const updateUnidad = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    if (!nombre?.trim())
      return res.status(400).json({ message: "El nombre es obligatorio" });

    const existing = await Unidad.findById(id);
    if (!existing)
      return res.status(404).json({ message: "Unidad no encontrada" });

    if (await Unidad.nombreExists(nombre, id)) {
      return res
        .status(400)
        .json({ message: "Ya existe otra unidad con ese nombre" });
    }

    const updated = await Unidad.updateById(id, {
      nombre: nombre.trim(),
      descripcion: descripcion || "",
    });
    if (!updated)
      return res.status(404).json({ message: "Unidad no encontrada" });

    res.json({ message: "Unidad actualizada exitosamente" });
  } catch (error) {
    console.error("Error al actualizar unidad:", error);
    res
      .status(500)
      .json({ message: "Error al actualizar unidad", error: error.message });
  }
};

const deleteUnidad = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Unidad.deleteById(id);
    if (!deleted)
      return res
        .status(404)
        .json({ message: "Unidad no encontrada o no se puede eliminar" });

    res.json({ message: "Unidad eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar unidad:", error);
    res
      .status(500)
      .json({ message: "Error al eliminar unidad", error: error.message });
  }
};

const countUnidades = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT COUNT(*) AS total FROM unidads");
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error al contar unidades:", error);
    res.status(500).json({ total: 0 });
  }
};

module.exports = {
  getAllUnidades,
  getUnidadById,
  createUnidad,
  updateUnidad,
  deleteUnidad,
  countUnidades,
};
