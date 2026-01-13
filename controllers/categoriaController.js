// controllers/categoriaController.js
const Categoria = require("../models/Categoria");
const db = require("../config/db");
const { registrarLog } = require("../utils/logger");
const { calcularDiferencias } = require("../utils/differences");

const getAllCategorias = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.*, 
        (SELECT COUNT(*) FROM productos WHERE categoria_id = c.id) as productos_count 
      FROM categorias c 
      ORDER BY c.nombre ASC
    `;
    const [categorias] = await db.execute(query);
    res.json(categorias);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res.status(500).json({ message: "Error al obtener categorías" });
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
  console.log("--- INICIO CREATE CATEGORIA (CON MARGEN) ---");
  try {
    // 1. Extraemos margen_objetivo del body respetando tu lógica
    const { nombre, descripcion, margen_objetivo } = req.body;
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
      margen_objetivo: margen_objetivo || 0, // 👈 AGREGADO PARA EL MODELO
    });

    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");

    await registrarLog(
      req,
      "CREAR",
      "CATEGORIAS",
      `Se creó la categoría: "${nombre.trim()}". Descripción: "${
        descripcion || "Sin descripción"
      }"`
    );

    res.status(201).json({ message: "Categoría creada exitosamente", id });
  } catch (error) {
    console.error("[CATEGORIAS ERROR] Fallo al crear:", error);
    res.status(500).json({ message: "Error al crear categoría" });
  }
};

const updateCategoria = async (req, res) => {
  console.log("--- INICIO UPDATE CATEGORIA (CON MARGEN) ---");
  try {
    const { id } = req.params;
    const { nombre, descripcion, margen_objetivo } = req.body; // 👈 Capturamos margen_objetivo

    if (!nombre?.trim())
      return res.status(400).json({ message: "El nombre es obligatorio" });

    const categoriaAnterior = await Categoria.findById(id);
    if (!categoriaAnterior)
      return res.status(404).json({ message: "Categoría no encontrada" });

    if (await Categoria.nombreExists(nombre, id)) {
      return res
        .status(400)
        .json({ message: "Ya existe otra categoría con ese nombre" });
    }

    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");

    const detalleCambios = calcularDiferencias(categoriaAnterior, req.body, [
      "id",
      "updated_at",
      "created_at",
    ]);

    const updated = await Categoria.updateById(id, {
      nombre: nombre.trim(),
      descripcion: descripcion || "",
      margen_objetivo: margen_objetivo || 0, // 👈 AGREGADO PARA EL MODELO
    });

    if (!updated)
      return res.status(404).json({ message: "Categoría no encontrada" });

    await registrarLog(
      req,
      "EDITAR",
      "CATEGORIAS",
      `Se actualizó la categoría: ${categoriaAnterior.nombre}. Cambios: ${detalleCambios}`
    );

    res.json({ message: "Categoría actualizada exitosamente" });
  } catch (error) {
    console.error("[CATEGORIAS ERROR] Fallo al actualizar:", error);
    res.status(500).json({ message: "Error al actualizar categoría" });
  }
};

const deleteCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const [check] = await db.execute(
      "SELECT COUNT(*) as count FROM productos WHERE categoria_id = ?",
      [id]
    );

    if (check[0].count > 0) {
      return res.status(400).json({
        message:
          "No se puede eliminar: existen productos vinculados a esta categoría.",
      });
    }

    const categoriaABorrar = await Categoria.findById(id);
    const nombreCat = categoriaABorrar ? categoriaABorrar.nombre : "ID " + id;

    await Categoria.deleteById(id);

    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");

    await registrarLog(
      req,
      "ELIMINAR",
      "CATEGORIAS",
      `Se eliminó la categoría: ${nombreCat}`
    );
    res.json({ message: "Categoría eliminada exitosamente" });
  } catch (error) {
    console.error("[CATEGORIAS ERROR] Fallo al eliminar:", error);
    res.status(500).json({ message: "Error al eliminar la categoría" });
  }
};

const countCategorias = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT COUNT(*) AS total FROM categorias");
    res.json({ total: rows[0].total });
  } catch (error) {
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
