// controllers/categoriaController.js
const Categoria = require("../models/Categoria");
const db = require("../config/db");

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
    res.status(201).json({ message: "Categoría creada exitosamente", id });
  } catch (error) {
    console.error("Error al crear categoría:", error);
    res
      .status(500)
      .json({ message: "Error al crear categoría", error: error.message });
  }
};

const updateCategoria = async (req, res) => {
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

    res.json({ message: "Categoría actualizada exitosamente" });
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    res
      .status(500)
      .json({ message: "Error al actualizar categoría", error: error.message });
  }
};

const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Categoria.deleteById(id);
    if (!deleted)
      return res
        .status(404)
        .json({ message: "Categoría no encontrada o no se puede eliminar" });

    res.json({ message: "Categoría eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    res
      .status(500)
      .json({ message: "Error al eliminar categoría", error: error.message });
  }
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
