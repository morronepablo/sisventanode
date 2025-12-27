// src/controllers/empresaController.js
const Empresa = require("../models/Empresa");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Definir ruta absoluta a la carpeta de imágenes
const uploadDir = path.join(process.cwd(), "src/assets/img/");

// Asegurar que la carpeta exista al arrancar el controlador
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

const getEmpresa = async (req, res) => {
  try {
    const empresa = await Empresa.findById(1);
    if (!empresa) return res.status(404).json({ message: "No encontrada" });
    res.json(empresa);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const empresaAnterior = await Empresa.findById(id);
    let logoFilename = empresaAnterior ? empresaAnterior.logo : "";

    if (req.file) {
      // Borrar logo anterior si existe
      if (empresaAnterior && empresaAnterior.logo) {
        const oldPath = path.join(uploadDir, empresaAnterior.logo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      logoFilename = req.file.filename;
    }

    const data = { ...req.body, logo: logoFilename };
    await Empresa.updateById(id, data);
    res.json({ message: "Éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getEmpresa, updateEmpresa, upload };
