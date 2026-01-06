// controllers/unidadController.js
const Unidad = require("../models/Unidad");
const db = require("../config/db");
const { registrarLog } = require("../utils/logger"); // 👈 Importamos el logger

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
    res.status(500).json({ message: "Error al obtener unidad" });
  }
};

const createUnidad = async (req, res) => {
  console.log("--- INICIO CREATE UNIDAD ---");
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
      empresa_id: req.user.empresa_id, // 👈 Usamos el de req.user
    });

    console.log(`[UNIDADES] Unidad creada con ID: ${id}`);

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "CREAR",
      "UNIDADES",
      `Se creó la unidad de medida: ${nombre.trim()}`
    );

    res.status(201).json({ message: "Unidad creada exitosamente", id });
  } catch (error) {
    console.error("[UNIDADES ERROR] Fallo al crear:", error);
    res.status(500).json({ message: "Error al crear unidad" });
  }
  console.log("--- FIN CREATE UNIDAD ---");
};

const updateUnidad = async (req, res) => {
  console.log("--- INICIO UPDATE UNIDAD ---");
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

    console.log(`[UNIDADES] Unidad ID ${id} actualizada.`);

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "EDITAR",
      "UNIDADES",
      `Se actualizó la unidad ID ${id}. Nuevo nombre: ${nombre.trim()}`
    );

    res.json({ message: "Unidad actualizada exitosamente" });
  } catch (error) {
    console.error("[UNIDADES ERROR] Fallo al actualizar:", error);
    res.status(500).json({ message: "Error al actualizar unidad" });
  }
  console.log("--- FIN UPDATE UNIDAD ---");
};

const deleteUnidad = async (req, res) => {
  console.log("--- INICIO DELETE UNIDAD ---");
  try {
    const { id } = req.params;

    // Buscamos antes de borrar para el LOG
    const unidadABorrar = await Unidad.findById(id);
    const nombreUnidad = unidadABorrar ? unidadABorrar.nombre : "ID " + id;

    const deleted = await Unidad.deleteById(id);
    if (!deleted)
      return res
        .status(404)
        .json({ message: "Unidad no encontrada o tiene productos asociados" });

    console.log(`[UNIDADES] Unidad ${nombreUnidad} eliminada.`);

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "ELIMINAR",
      "UNIDADES",
      `Se eliminó la unidad: ${nombreUnidad}`
    );

    res.json({ message: "Unidad eliminada exitosamente" });
  } catch (error) {
    console.error("[UNIDADES ERROR] Fallo al eliminar:", error);
    res.status(500).json({ message: "Error al eliminar unidad" });
  }
  console.log("--- FIN DELETE UNIDAD ---");
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
