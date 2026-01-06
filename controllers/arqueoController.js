// controllers/arqueoController.js
const Arqueo = require("../models/Arqueo");
const db = require("../config/db");
const { registrarLog } = require("../utils/logger"); // 👈 Importamos el logger

const getAllArqueos = async (req, res) => {
  try {
    const arqueos = await Arqueo.getAll();
    const result = [];

    for (const arqueo of arqueos) {
      const movimientos = await Arqueo.getMovimientos(arqueo.id);
      result.push({
        ...arqueo,
        movimientos: movimientos,
        total_ingresos: arqueo.total_ingresos || 0,
        total_egresos: arqueo.total_egresos || 0,
      });
    }
    res.json(result);
  } catch (error) {
    console.error("Error al obtener arqueos:", error);
    res.status(500).json({ message: "Error al obtener arqueos" });
  }
};

const verificarEstado = async (req, res) => {
  const { usuario_id } = req.params;
  const abierto = await Arqueo.checkArqueoAbierto(usuario_id);
  res.json({ tieneArqueoAbierto: !!abierto });
};

const checkArqueoAbierto = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const query = `
      SELECT id FROM arqueos 
      WHERE empresa_id = ? 
      AND (fecha_cierre IS NULL OR fecha_cierre = '' OR fecha_cierre = '0000-00-00 00:00:00') 
      LIMIT 1`;

    const [rows] = await db.execute(query, [empresa_id]);
    res.json({
      arqueoAbierto: rows.length > 0,
      id_arqueo: rows.length > 0 ? rows[0].id : null,
    });
  } catch (error) {
    res.status(500).json({ arqueoAbierto: false, id_arqueo: null });
  }
};

const createArqueo = async (req, res) => {
  console.log("--- INICIO APERTURA DE CAJA ---");
  try {
    const { fecha_apertura, monto_inicial, descripcion } = req.body;
    const usuario_id = req.user.id;
    const empresa_id = req.user.empresa_id;

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

    console.log(`[ARQUEO] Caja abierta con ID: ${nuevoId}`);

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "CREAR",
      "ARQUEO_CAJA",
      `Apertura de caja realizada. Monto inicial: $${monto_inicial}`
    );

    res
      .status(201)
      .json({ message: "Arqueo registrado exitosamente", id: nuevoId });
  } catch (error) {
    console.error("[ARQUEO ERROR] Fallo al abrir caja:", error);
    res.status(500).json({ message: "Error al registrar arqueo" });
  }
  console.log("--- FIN APERTURA DE CAJA ---");
};

const getArqueoById = async (req, res) => {
  const { id } = req.params;
  try {
    const [arqueo] = await db.execute("SELECT * FROM arqueos WHERE id = ?", [
      id,
    ]);
    if (arqueo.length === 0)
      return res.status(404).json({ message: "Arqueo no encontrado" });

    const [movimientos] = await db.execute(
      "SELECT * FROM movimiento_cajas WHERE arqueo_id = ? ORDER BY id DESC",
      [id]
    );

    const queryTotales = `
            SELECT 
                (IFNULL((SELECT SUM(tarjeta) FROM ventas WHERE arqueo_id = ?), 0) + IFNULL((SELECT SUM(monto) FROM pagos WHERE arqueo_id = ? AND metodo_pago = 'tarjeta'), 0)) as total_tarjeta_sistema,
                (IFNULL((SELECT SUM(mercadopago) FROM ventas WHERE arqueo_id = ?), 0) + IFNULL((SELECT SUM(monto) FROM pagos WHERE arqueo_id = ? AND metodo_pago = 'mercadopago'), 0)) as total_mp_sistema,
                (IFNULL((SELECT SUM(transferencia) FROM ventas WHERE arqueo_id = ?), 0) + IFNULL((SELECT SUM(monto) FROM pagos WHERE arqueo_id = ? AND metodo_pago = 'transferencia'), 0)) as total_transf_sistema
        `;
    const [totales] = await db.execute(queryTotales, [id, id, id, id, id, id]);

    res.json({
      arqueo: arqueo[0],
      movimientos: movimientos,
      totales_sistema: totales[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateArqueo = async (req, res) => {
  console.log("--- INICIO UPDATE ARQUEO ---");
  try {
    const { id } = req.params;
    const { fecha_apertura, monto_inicial, descripcion } = req.body;

    const actualizado = await Arqueo.update(id, {
      fecha_apertura,
      monto_inicial,
      descripcion,
    });
    if (!actualizado)
      return res.status(404).json({ message: "Arqueo no encontrado" });

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "EDITAR",
      "ARQUEO_CAJA",
      `Se actualizaron los datos del arqueo ID: ${id}`
    );

    res.json({ message: "Arqueo actualizado exitosamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar" });
  }
  console.log("--- FIN UPDATE ARQUEO ---");
};

const storeMovimiento = async (req, res) => {
  console.log("--- INICIO MOVIMIENTO MANUAL CAJA ---");
  try {
    const { arqueo_id, tipo, monto, descripcion } = req.body;

    const nuevoMovId = await Arqueo.addMovimiento({
      arqueo_id,
      tipo,
      monto,
      descripcion,
    });

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "CREAR",
      "ARQUEO_MOVIMIENTO",
      `Movimiento manual de ${tipo}: $${monto}. Motivo: ${descripcion}`
    );

    res
      .status(201)
      .json({ message: "Movimiento registrado exitosamente", id: nuevoMovId });
  } catch (error) {
    console.error("[ARQUEO ERROR] Fallo al registrar movimiento:", error);
    res.status(500).json({ message: "Error al registrar el movimiento" });
  }
  console.log("--- FIN MOVIMIENTO MANUAL CAJA ---");
};

const closeArqueo = async (req, res) => {
  console.log("--- INICIO CIERRE DE CAJA ---");
  try {
    const { id } = req.params;
    const { fecha_cierre, monto_final } = req.body;

    const cerrado = await Arqueo.close(id, req.body);
    if (!cerrado) return res.status(404).json({ message: "No se pudo cerrar" });

    // REGISTRO DE LOG
    await registrarLog(
      req,
      "EDITAR",
      "ARQUEO_CAJA",
      `Cierre de caja realizado. ID Arqueo: ${id}. Monto final reportado: $${monto_final}`
    );

    res.json({ message: "Arqueo cerrado exitosamente" });
  } catch (error) {
    console.error("[ARQUEO ERROR] Fallo al cerrar caja:", error);
    res.status(500).json({ message: "Error al cerrar arqueo" });
  }
  console.log("--- FIN CIERRE DE CAJA ---");
};

const countArqueos = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS total FROM arqueos WHERE empresa_id = ?",
      [empresa_id]
    );
    res.json({ total: rows[0].total });
  } catch (error) {
    res.status(500).json({ total: 0 });
  }
};

const getArqueosSummary = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const year = new Date().getFullYear();
    const [totalRows] = await db.execute(
      "SELECT COUNT(*) AS total FROM arqueos WHERE empresa_id = ?",
      [empresa_id]
    );
    const [yearRows] = await db.execute(
      "SELECT COUNT(*) AS totalAnio FROM arqueos WHERE YEAR(fecha_apertura) = ? AND empresa_id = ?",
      [year, empresa_id]
    );
    res.json({
      total: totalRows[0].total || 0,
      totalAnio: yearRows[0].totalAnio || 0,
    });
  } catch (error) {
    res.status(500).json({ total: 0, totalAnio: 0 });
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
  getArqueosSummary,
};
