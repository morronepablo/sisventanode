// controllers/arqueoController.js
const Arqueo = require("../models/Arqueo");
const path = require("path");
const fs = require("fs");
const pdf = require("html-pdf");
const db = require("../config/db");
const { registrarLog } = require("../utils/logger"); // 👈 Importamos el logger

const MY_CAJA = () => Number(process.env.CAJA_ID || 1);

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
      WHERE empresa_id = ? AND caja_id = ? 
      AND (fecha_cierre IS NULL OR fecha_cierre = '' OR estado = 'Abierto') 
      LIMIT 1`;

    const [rows] = await db.execute(query, [empresa_id, MY_CAJA()]);
    res.json({
      arqueoAbierto: rows.length > 0,
      id_arqueo: rows.length > 0 ? rows[0].id : null,
    });
  } catch (error) {
    res.status(500).json({ arqueoAbierto: false, id_arqueo: null });
  }
};

// const createArqueo = async (req, res) => {
//   console.log("--- INICIO APERTURA DE CAJA ---");
//   try {
//     const { fecha_apertura, monto_inicial, descripcion } = req.body;
//     const usuario_id = req.user.id;
//     const empresa_id = req.user.empresa_id;

//     const abierto = await Arqueo.checkArqueoAbierto(usuario_id);
//     if (abierto) {
//       return res.status(400).json({ message: "Ya tienes un arqueo abierto." });
//     }

//     const nuevoId = await Arqueo.create({
//       empresa_id,
//       usuario_id,
//       fecha_apertura,
//       monto_inicial,
//       descripcion,
//     });

//     console.log(`[ARQUEO] Caja abierta con ID: ${nuevoId}`);

//     // REGISTRO DE LOG
//     await registrarLog(
//       req,
//       "CREAR",
//       "ARQUEO_CAJA",
//       `Apertura de caja realizada. Monto inicial: $${monto_inicial}`
//     );

//     res
//       .status(201)
//       .json({ message: "Arqueo registrado exitosamente", id: nuevoId });
//   } catch (error) {
//     console.error("[ARQUEO ERROR] Fallo al abrir caja:", error);
//     res.status(500).json({ message: "Error al registrar arqueo" });
//   }
//   console.log("--- FIN APERTURA DE CAJA ---");
// };

const createArqueo = async (req, res) => {
  console.log("--- INICIO APERTURA DE CAJA MULTICAJA ---");
  try {
    const { fecha_apertura, monto_inicial, descripcion } = req.body;
    const usuario_id = req.user.id;
    const empresa_id = req.user.empresa_id;
    const caja_id = MY_CAJA(); // 👈 CAPTURAMOS LA CAJA ACTUAL

    // Verificamos si YA hay una abierta en esta caja
    const [existente] = await db.execute(
      "SELECT id FROM arqueos WHERE empresa_id = ? AND caja_id = ? AND estado = 'Abierto'",
      [empresa_id, caja_id]
    );

    if (existente.length > 0) {
      return res
        .status(400)
        .json({ message: `La Caja N° ${caja_id} ya tiene un arqueo abierto.` });
    }

    // MANDAMOS EL caja_id AL MODELO
    const nuevoId = await Arqueo.create({
      empresa_id,
      usuario_id,
      caja_id, // 👈 PASAMOS LA CAJA AL MODELO
      fecha_apertura,
      monto_inicial,
      descripcion,
    });

    console.log(
      `[ARQUEO] Caja ${caja_id} abierta por usuario ${usuario_id}. ID Arqueo: ${nuevoId}`
    );

    await registrarLog(
      req,
      "CREAR",
      "ARQUEO_CAJA",
      `Apertura de Caja N° ${caja_id}. Monto inicial: $${monto_inicial}`
    );

    res
      .status(201)
      .json({ message: "Arqueo registrado exitosamente", id: nuevoId });
  } catch (error) {
    console.error("[ARQUEO ERROR]", error);
    res.status(500).json({ message: "Error al registrar arqueo" });
  }
};

const getArqueoById = async (req, res) => {
  const { id } = req.params;
  try {
    const [arqueoRows] = await db.execute(
      "SELECT * FROM arqueos WHERE id = ?",
      [id]
    );
    if (arqueoRows.length === 0)
      return res.status(404).json({ message: "No encontrado" });

    const arqueo = arqueoRows[0];
    const cid = arqueo.caja_id; // Usamos el ID de caja del arqueo guardado

    // Sumamos ventas + cobros de cuotas de clientes filtrando por arqueo y caja
    const queryTotales = `
      SELECT 
        (
          (SELECT IFNULL(SUM(tarjeta), 0) FROM ventas WHERE arqueo_id = ? AND caja_id = ?) + 
          (SELECT IFNULL(SUM(monto), 0) FROM pagos WHERE arqueo_id = ? AND caja_id = ? AND metodo_pago = 'tarjeta')
        ) as total_tarjeta_sistema,
        (
          (SELECT IFNULL(SUM(mercadopago), 0) FROM ventas WHERE arqueo_id = ? AND caja_id = ?) + 
          (SELECT IFNULL(SUM(monto), 0) FROM pagos WHERE arqueo_id = ? AND caja_id = ? AND metodo_pago = 'mercadopago')
        ) as total_mp_sistema,
        (
          (SELECT IFNULL(SUM(transferencia), 0) FROM ventas WHERE arqueo_id = ? AND caja_id = ?) + 
          (SELECT IFNULL(SUM(monto), 0) FROM pagos WHERE arqueo_id = ? AND caja_id = ? AND metodo_pago = 'transferencia')
        ) as total_transf_sistema
    `;
    const [totales] = await db.execute(queryTotales, [
      id,
      cid,
      id,
      cid,
      id,
      cid,
      id,
      cid,
      id,
      cid,
      id,
      cid,
    ]);

    res.json({
      arqueo: arqueo,
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
  console.log("--- INICIO CIERRE DE CAJA CIEGO ---");
  const { id } = req.params;
  const {
    fecha_cierre,
    monto_final, // Este es el total que el cajero contó (Real)
    ventas_efectivo,
    ventas_tarjeta,
    ventas_mercadopago,
    ventas_transferencia,
  } = req.body;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Obtener Monto Inicial
    const [arq] = await connection.execute(
      "SELECT monto_inicial FROM arqueos WHERE id = ?",
      [id]
    );
    const inicial = parseFloat(arq[0].monto_inicial || 0);

    // 2. Calcular Ingresos y Egresos registrados en el sistema para este arqueo
    const [movs] = await connection.execute(
      "SELECT SUM(CASE WHEN tipo = 'Ingreso' THEN monto ELSE -monto END) as neto FROM movimiento_cajas WHERE arqueo_id = ?",
      [id]
    );
    const netoMovimientos = parseFloat(movs[0].neto || 0);

    // 3. Monto Esperado = Inicial + (Ventas + Entradas - Salidas)
    const monto_esperado = inicial + netoMovimientos;

    // 4. Diferencia = Lo que el cajero contó - Lo que el sistema esperaba
    const diferencia = monto_final - monto_esperado;

    // 5. Actualizar Arqueo
    await connection.execute(
      `UPDATE arqueos SET 
        monto_final = ?, 
        monto_esperado = ?, 
        diferencia = ?, 
        ventas_efectivo = ?, 
        ventas_tarjeta = ?, 
        ventas_mercadopago = ?, 
        ventas_transferencia = ?, 
        fecha_cierre = ?,
        estado = 'Cerrado'
       WHERE id = ?`,
      [
        monto_final,
        monto_esperado,
        diferencia,
        ventas_efectivo,
        ventas_tarjeta,
        ventas_mercadopago,
        ventas_transferencia,
        fecha_cierre,
        id,
      ]
    );

    await connection.commit();
    console.log(
      `[ARQUEO] Cerrado. Esperado: ${monto_esperado}, Real: ${monto_final}, Dif: ${diferencia}`
    );

    res.json({
      success: true,
      message: "Arqueo cerrado exitosamente",
      diferencia: diferencia,
    });
  } catch (error) {
    await connection.rollback();
    console.error("[ARQUEO ERROR]", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
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

const generarReporte = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    // 1. Obtener datos de la empresa
    const [empresaRows] = await db.execute(
      "SELECT * FROM empresas WHERE id = ?",
      [empresa_id]
    );
    const empresa = empresaRows[0];
    if (!empresa) return res.status(404).send("Empresa no encontrada");

    // 2. SQL CORREGIDO: Sumamos solo de movimiento_cajas para evitar duplicados
    const query = `
      SELECT a.*, u.name as usuario_nombre,
        (SELECT IFNULL(SUM(monto), 0) FROM movimiento_cajas WHERE arqueo_id = a.id AND tipo = 'Ingreso') as ingresos_totales,
        (SELECT IFNULL(SUM(monto), 0) FROM movimiento_cajas WHERE arqueo_id = a.id AND tipo = 'Egreso') as egresos_totales
      FROM arqueos a 
      INNER JOIN users u ON a.usuario_id = u.id 
      WHERE a.empresa_id = ? 
      ORDER BY a.fecha_apertura DESC`;

    const [arqueos] = await db.execute(query, [empresa_id]);

    let logoBase64 = "";
    try {
      const logoPath = path.join(__dirname, "../src/assets/img", empresa.logo);
      if (fs.existsSync(logoPath)) {
        const bitmap = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${bitmap.toString("base64")}`;
      }
    } catch (e) {}

    const fmt = (val) =>
      parseFloat(val || 0).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
      });
    const fmtFecha = (date) =>
      date
        ? new Date(date)
            .toLocaleString("es-AR", { hour12: false })
            .substring(0, 16)
        : "-";

    // 3. Construir Filas
    let filas = "";
    arqueos.forEach((arq, i) => {
      const inicial = parseFloat(arq.monto_inicial || 0);
      const ing = parseFloat(arq.ingresos_totales || 0);
      const egr = parseFloat(arq.egresos_totales || 0);
      const final = parseFloat(arq.monto_final || 0);

      const teorico = inicial + ing - egr;
      const diferencia = arq.fecha_cierre ? teorico - final : teorico;

      filas += `
        <tr>
          <td style="text-align:center">${i + 1}</td>
          <td style="text-align:center">${fmtFecha(arq.fecha_apertura)}</td>
          <td style="text-align:right">$ ${fmt(inicial)}</td>
          <td style="text-align:center">${
            arq.fecha_cierre ? fmtFecha(arq.fecha_cierre) : "–"
          }</td>
          <td style="text-align:right">${
            arq.fecha_cierre ? "$ " + fmt(final) : "–"
          }</td>
          <td style="text-align:right">$ ${fmt(arq.ventas_efectivo)}</td>
          <td style="text-align:right">$ ${fmt(arq.ventas_tarjeta)}</td>
          <td style="text-align:right">$ ${fmt(arq.ventas_mercadopago)}</td>
          <td style="font-size: 7.5px; color: #666;">${
            arq.description || arq.descripcion || ""
          }</td>
          
          <!-- COLUMNA MOVIMIENTOS ESTILO WEB -->
          <td style="padding: 0;">
             <table style="width: 100%; border: none; border-collapse: collapse; margin: 0; padding: 0;">
                <tr style="font-size: 7px; font-weight: bold; text-align: center;">
                    <td style="border:none; color: #28a745; padding-bottom: 2px;">Ingresos</td>
                    <td style="border:none; color: #dc3545; padding-bottom: 2px;">Egresos</td>
                    <td style="border:none; color: #fd7e14; padding-bottom: 2px;">Dif.</td>
                </tr>
                <tr style="font-size: 7.5px; text-align: center;">
                    <td style="border:none; color: #28a745;">$ ${fmt(ing)}</td>
                    <td style="border:none; color: #dc3545;">$ ${fmt(egr)}</td>
                    <td style="border:none; color: #fd7e14; font-weight: bold;">$ ${fmt(
                      diferencia
                    )}</td>
                </tr>
             </table>
          </td>

          <td style="text-align:center">${arq.usuario_nombre}</td>
        </tr>`;
    });

    const htmlContent = `
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Helvetica', Arial, sans-serif; font-size: 9px; color: #333; margin: 0; padding: 0; }
          .header { border-bottom: 2px solid #007bff; padding: 10px; margin-bottom: 10px; }
          .table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          .table th { background-color: #343a40; color: #fff; padding: 6px 2px; font-size: 8px; border: 1px solid #333; text-transform: uppercase; }
          .table td { padding: 4px 2px; border: 1px solid #ccc; vertical-align: middle; font-size: 9px; word-wrap: break-word; }
          #pageFooter { position: fixed; bottom: -15px; left: 0; right: 0; text-align: center; font-size: 8px; color: #999; }
        </style>
      </head>
      <body>
        <div class="header">
          <table style="width:100%">
            <tr>
              <td style="width:70%">
                <h1 style="margin:0; font-size: 16px;">${
                  empresa.nombre_empresa
                }</h1>
                <p style="margin:2px 0; font-size: 10px;">Reporte de Arqueos - Histórico de Caja</p>
              </td>
              <td style="text-align:right">
                ${
                  logoBase64
                    ? `<img src="${logoBase64}" style="width:55px">`
                    : ""
                }
              </td>
            </tr>
          </table>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th style="width:18px">#</th>
              <th style="width:75px">Apertura</th>
              <th style="width:65px">M. Inicial</th>
              <th style="width:75px">Cierre</th>
              <th style="width:65px">M. Final</th>
              <th style="width:50px">Efect.</th>
              <th style="width:50px">Tarj.</th>
              <th style="width:50px">M.Pago</th>
              <th style="width:70px">Descripción</th>
              <th style="width:160px">Movimientos</th>
              <th style="width:45px">Usuario</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
        <div id="pageFooter">Generado el ${new Date().toLocaleString()} - Sistema de Ventas</div>
      </body>
      </html>`;

    const options = {
      format: "A4",
      orientation: "landscape",
      border: { top: "10mm", right: "5mm", bottom: "12mm", left: "5mm" },
    };

    const pdf = require("html-pdf");
    pdf.create(htmlContent, options).toBuffer((err, buffer) => {
      if (err) return res.status(500).send("Error");
      res.setHeader("Content-Type", "application/pdf");
      res.send(buffer);
    });
  } catch (e) {
    res.status(500).send("Error interno");
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
  generarReporte,
  countArqueos,
  getArqueosSummary,
};
