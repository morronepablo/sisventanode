// controllers/categoriaController.js
const Categoria = require("../models/Categoria");
const db = require("../config/db");
const { registrarLog } = require("../utils/logger"); // 👈 Importamos el logger

const getAllCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.getAll();
    res.json(categorias);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res
      .status(500)
      .json({ message: "Error al obtener categorías", error: error.message });
  }
};

const getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findById(id);
    if (!categoria)
      return res.status(404).json({ message: "Categoría no encontrada" });
    res.json(categoria);
  } catch (error) {
    console.error("Error al obtener categoría:", error);
    res
      .status(500)
      .json({ message: "Error al obtener categoría", error: error.message });
  }
};

const createCategoria = async (req, res) => {
  console.log("--- INICIO CREATE CATEGORIA ---");
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre?.trim())
      return res.status(400).json({ message: "El nombre es obligatorio" });

    if (await Categoria.nombreExists(nombre)) {
      return res
        .status(400)
        .json({ message: "Ya existe una categoría con ese nombre" });
    }

    const id = await Categoria.create({
      nombre: nombre.trim(),
      descripcion: descripcion || "",
    });

    console.log(`[CATEGORIAS] Categoría creada con ID: ${id}`);

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "CREAR",
      "CATEGORIAS",
      `Se creó la categoría: ${nombre.trim()}`
    );

    res.status(201).json({ message: "Categoría creada exitosamente", id });
  } catch (error) {
    console.error("[CATEGORIAS ERROR] Fallo al crear:", error);
    res
      .status(500)
      .json({ message: "Error al crear categoría", error: error.message });
  }
  console.log("--- FIN CREATE CATEGORIA ---");
};

const updateCategoria = async (req, res) => {
  console.log("--- INICIO UPDATE CATEGORIA ---");
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    if (!nombre?.trim())
      return res.status(400).json({ message: "El nombre es obligatorio" });

    const existing = await Categoria.findById(id);
    if (!existing)
      return res.status(404).json({ message: "Categoría no encontrada" });

    if (await Categoria.nombreExists(nombre, id)) {
      return res
        .status(400)
        .json({ message: "Ya existe otra categoría con ese nombre" });
    }

    const updated = await Categoria.updateById(id, {
      nombre: nombre.trim(),
      descripcion: descripcion || "",
    });

    if (!updated)
      return res.status(404).json({ message: "Categoría no encontrada" });

    console.log(`[CATEGORIAS] Categoría ID ${id} actualizada.`);

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "EDITAR",
      "CATEGORIAS",
      `Se actualizó la categoría ID ${id}. Nuevo nombre: ${nombre.trim()}`
    );

    res.json({ message: "Categoría actualizada exitosamente" });
  } catch (error) {
    console.error("[CATEGORIAS ERROR] Fallo al actualizar:", error);
    res
      .status(500)
      .json({ message: "Error al actualizar categoría", error: error.message });
  }
  console.log("--- FIN UPDATE CATEGORIA ---");
};

const deleteCategoria = async (req, res) => {
  console.log("--- INICIO DELETE CATEGORIA ---");
  try {
    const { id } = req.params;

    // Obtenemos los datos antes de borrar para el LOG
    const categoriaABorrar = await Categoria.findById(id);
    const nombreCat = categoriaABorrar ? categoriaABorrar.nombre : "ID " + id;

    const deleted = await Categoria.deleteById(id);
    if (!deleted)
      return res.status(404).json({
        message:
          "Categoría no encontrada o no se puede eliminar (tiene productos asociados)",
      });

    console.log(`[CATEGORIAS] Categoría ${nombreCat} eliminada.`);

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "ELIMINAR",
      "CATEGORIAS",
      `Se eliminó la categoría: ${nombreCat}`
    );

    res.json({ message: "Categoría eliminada exitosamente" });
  } catch (error) {
    console.error("[CATEGORIAS ERROR] Fallo al eliminar:", error);
    res
      .status(500)
      .json({ message: "Error al eliminar categoría", error: error.message });
  }
  console.log("--- FIN DELETE CATEGORIA ---");
};

const countCategorias = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT COUNT(*) AS total FROM categorias");
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error al contar categorías:", error);
    res.status(500).json({ total: 0 });
  }
};

module.exports = {
  getAllCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  countCategorias,
};
