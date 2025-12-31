// controllers/arqueoController.js
const Arqueo = require("../models/Arqueo");
const db = require("../config/db");

const getAllArqueos = async (req, res) => {
  try {
    const arqueos = await Arqueo.getAll();
    const result = [];

    for (const arqueo of arqueos) {
      const movimientos = await Arqueo.getMovimientos(arqueo.id);
      result.push({
        ...arqueo,
        movimientos: movimientos,
        // Cálculos que hacías en el Blade
        total_ingresos: arqueo.total_ingresos || 0,
        total_egresos: arqueo.total_egresos || 0,
      });
    }
    res.json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener arqueos", error: error.message });
  }
};

const verificarEstado = async (req, res) => {
  // Lógica para saber si el botón "Crear Nuevo" debe aparecer
  const { usuario_id } = req.params;
  const abierto = await Arqueo.checkArqueoAbierto(usuario_id);
  res.json({ tieneArqueoAbierto: !!abierto });
};

const checkArqueoAbierto = async (req, res) => {
  try {
    // Obtenemos la empresa del usuario desde el token (middleware)
    const empresa_id = req.user.empresa_id;

    // Buscamos un arqueo que NO tenga fecha de cierre
    // IMPORTANTE: Chequeamos NULL, vacío y '0000-00-00' por compatibilidad
    const query = `
      SELECT id FROM arqueos 
      WHERE empresa_id = ? 
      AND (fecha_cierre IS NULL OR fecha_cierre = '' OR fecha_cierre = '0000-00-00 00:00:00') 
      LIMIT 1`;

    const [rows] = await db.execute(query, [empresa_id]);

    console.log(
      `[DEBUG] Arqueo abierto para empresa ${empresa_id}:`,
      rows.length > 0
    );

    res.json({
      arqueoAbierto: rows.length > 0,
      id_arqueo: rows.length > 0 ? rows[0].id : null,
    });
  } catch (error) {
    console.error("Error en checkArqueoAbierto:", error);
    res.status(500).json({ arqueoAbierto: false, id_arqueo: null });
  }
};

const createArqueo = async (req, res) => {
  try {
    const { fecha_apertura, monto_inicial, descripcion } = req.body;

    // req.user viene del middleware que creamos arriba
    const usuario_id = req.user.id || req.user.userId;
    const empresa_id = req.user.empresa_id || 1;

    // Validar si ya hay uno abierto (doble chequeo de seguridad)
    const abierto = await Arqueo.checkArqueoAbierto(usuario_id);
    if (abierto) {
      return res.status(400).json({ message: "Ya tienes un arqueo abierto." });
    }

    const nuevoId = await Arqueo.create({
      empresa_id,
      usuario_id,
      fecha_apertura,
      monto_inicial,
      descripcion,
    });

    res
      .status(201)
      .json({ message: "Arqueo registrado exitosamente", id: nuevoId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al registrar arqueo" });
  }
};

const getArqueoById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Obtener el arqueo con el nombre del usuario
    const [arqueoRows] = await db.execute(
      `
      SELECT a.*, u.name as usuario_nombre 
      FROM arqueos a 
      INNER JOIN users u ON a.usuario_id = u.id 
      WHERE a.id = ?`,
      [id]
    );

    if (arqueoRows.length === 0) {
      return res.status(404).json({ message: "Arqueo no encontrado" });
    }

    const arqueo = arqueoRows[0];

    // 2. Obtener los movimientos de este arqueo
    const [movimientos] = await db.execute(
      "SELECT * FROM movimiento_cajas WHERE arqueo_id = ? ORDER BY created_at ASC",
      [id]
    );

    res.json({ arqueo, movimientos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener el detalle del arqueo" });
  }
};

const updateArqueo = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha_apertura, monto_inicial, descripcion } = req.body;

    const actualizado = await Arqueo.update(id, {
      fecha_apertura,
      monto_inicial,
      descripcion,
    });

    if (!actualizado) {
      return res.status(404).json({ message: "Arqueo no encontrado" });
    }

    res.json({ message: "Arqueo actualizado exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar el arqueo" });
  }
};

const storeMovimiento = async (req, res) => {
  try {
    const { arqueo_id, tipo, monto, descripcion } = req.body;

    if (!arqueo_id || !tipo || !monto) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const nuevoMovId = await Arqueo.addMovimiento({
      arqueo_id,
      tipo,
      monto,
      descripcion,
    });

    res
      .status(201)
      .json({ message: "Movimiento registrado exitosamente", id: nuevoMovId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al registrar el movimiento" });
  }
};

const closeArqueo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fecha_cierre,
      monto_final,
      ventas_efectivo,
      ventas_tarjeta,
      ventas_mercadopago,
    } = req.body;

    const cerrado = await Arqueo.close(id, {
      fecha_cierre,
      monto_final,
      ventas_efectivo,
      ventas_tarjeta,
      ventas_mercadopago,
    });

    if (!cerrado)
      return res.status(404).json({ message: "No se pudo cerrar el arqueo" });

    res.json({ message: "Arqueo cerrado exitosamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al cerrar arqueo" });
  }
};

const countArqueos = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT COUNT(*) AS total FROM arqueos");
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error al contar arqueos:", error);
    res.status(500).json({ total: 0 });
  }
};

module.exports = {
  getAllArqueos,
  verificarEstado,
  checkArqueoAbierto,
  createArqueo,
  getArqueoById,
  updateArqueo,
  storeMovimiento,
  closeArqueo,
  countArqueos,
};
