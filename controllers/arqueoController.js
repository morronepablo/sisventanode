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

// const getArqueoById = async (req, res) => {
//   try {
//     const { id } = req.params; // ID del Arqueo

//     const [arqueoRows] = await db.execute(
//       `SELECT a.*, u.name as usuario_nombre FROM arqueos a
//        INNER JOIN users u ON a.usuario_id = u.id WHERE a.id = ?`,
//       [id]
//     );

//     if (arqueoRows.length === 0)
//       return res.status(404).json({ message: "Arqueo no encontrado" });
//     const arqueo = arqueoRows[0];

//     // SUMAR VENTAS VINCULADAS A ESTE ARQUEO_ID (Infallible)
//     const [ventasTotals] = await db.execute(
//       `
//       SELECT
//         IFNULL(SUM(tarjeta), 0) as total_tarjeta_sistema,
//         IFNULL(SUM(mercadopago), 0) as total_mp_sistema,
//         IFNULL(SUM(efectivo), 0) as total_efectivo_sistema
//       FROM ventas
//       WHERE arqueo_id = ?`,
//       [id]
//     );

//     const [movimientos] = await db.execute(
//       "SELECT * FROM movimiento_cajas WHERE arqueo_id = ? ORDER BY created_at ASC",
//       [id]
//     );

//     res.json({
//       arqueo,
//       movimientos,
//       totales_sistema: ventasTotals[0],
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Error al obtener arqueo" });
//   }
// };

// const getArqueoById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [arqueoRows] = await db.execute(
//       `SELECT a.*, u.name as usuario_nombre FROM arqueos a
//        INNER JOIN users u ON a.usuario_id = u.id WHERE a.id = ?`,
//       [id]
//     );

//     if (arqueoRows.length === 0)
//       return res.status(404).json({ message: "Arqueo no encontrado" });
//     const arqueo = arqueoRows[0];

//     // SUMAR VENTAS VINCULADAS (Incluyendo Transferencia)
//     const [ventasTotals] = await db.execute(
//       `
//       SELECT
//         IFNULL(SUM(efectivo), 0) as total_efectivo_sistema,
//         IFNULL(SUM(tarjeta), 0) as total_tarjeta_sistema,
//         IFNULL(SUM(mercadopago), 0) as total_mp_sistema,
//         IFNULL(SUM(transferencia), 0) as total_transf_sistema
//       FROM ventas
//       WHERE arqueo_id = ?`,
//       [id]
//     );

//     const [movimientos] = await db.execute(
//       "SELECT * FROM movimiento_cajas WHERE arqueo_id = ? ORDER BY created_at ASC",
//       [id]
//     );

//     res.json({
//       arqueo,
//       movimientos,
//       totales_sistema: ventasTotals[0],
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Error al obtener arqueo" });
//   }
// };

// const getArqueoById = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const [arqueo] = await db.execute("SELECT * FROM arqueos WHERE id = ?", [
//       id,
//     ]);

//     // CONSULTA DE TOTALES (Ventas + Pagos Cta Cte)
//     const queryTotales = `
//             SELECT
//                 /* Suma de Ventas */
//                 IFNULL((SELECT SUM(precio_total) FROM ventas WHERE arqueo_id = ? AND metodo_pago = 'tarjeta'), 0) +
//                 IFNULL((SELECT SUM(monto) FROM pagos WHERE arqueo_id = ? AND metodo_pago = 'tarjeta'), 0) as total_tarjeta_sistema,

//                 IFNULL((SELECT SUM(precio_total) FROM ventas WHERE arqueo_id = ? AND metodo_pago = 'mercadopago'), 0) +
//                 IFNULL((SELECT SUM(monto) FROM pagos WHERE arqueo_id = ? AND metodo_pago = 'mercadopago'), 0) as total_mp_sistema,

//                 IFNULL((SELECT SUM(precio_total) FROM ventas WHERE arqueo_id = ? AND metodo_pago = 'transferencia'), 0) +
//                 IFNULL((SELECT SUM(monto) FROM pagos WHERE arqueo_id = ? AND metodo_pago = 'transferencia'), 0) as total_transf_sistema
//         `;

//     const [totales] = await db.execute(queryTotales, [id, id, id, id, id, id]);

//     res.json({
//       arqueo: arqueo[0],
//       totales_sistema: totales[0],
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// const getArqueoById = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const [arqueo] = await db.execute("SELECT * FROM arqueos WHERE id = ?", [
//       id,
//     ]);

//     if (arqueo.length === 0) {
//       return res.status(404).json({ message: "Arqueo no encontrado" });
//     }

//     // Esta consulta suma Ventas + Pagos de clientes para cada método
//     const queryTotales = `
//             SELECT
//                 (IFNULL((SELECT SUM(precio_total) FROM ventas WHERE arqueo_id = ? AND metodo_pago = 'tarjeta'), 0) +
//                  IFNULL((SELECT SUM(monto) FROM pagos WHERE arqueo_id = ? AND metodo_pago = 'tarjeta'), 0)) as total_tarjeta_sistema,

//                 (IFNULL((SELECT SUM(precio_total) FROM ventas WHERE arqueo_id = ? AND metodo_pago = 'mercadopago'), 0) +
//                  IFNULL((SELECT SUM(monto) FROM pagos WHERE arqueo_id = ? AND metodo_pago = 'mercadopago'), 0)) as total_mp_sistema,

//                 (IFNULL((SELECT SUM(precio_total) FROM ventas WHERE arqueo_id = ? AND metodo_pago = 'transferencia'), 0) +
//                  IFNULL((SELECT SUM(monto) FROM pagos WHERE arqueo_id = ? AND metodo_pago = 'transferencia'), 0)) as total_transf_sistema
//         `;

//     // Pasamos el ID 6 veces porque hay 6 signos de interrogación (?) en la consulta
//     const [totales] = await db.execute(queryTotales, [id, id, id, id, id, id]);

//     res.json({
//       arqueo: arqueo[0],
//       totales_sistema: totales[0],
//     });
//   } catch (error) {
//     console.error("Error en getArqueoById:", error); // Esto saldrá en tu consola de Node (terminal)
//     res.status(500).json({ message: error.message });
//   }
// };

// const getArqueoById = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const [arqueo] = await db.execute("SELECT * FROM arqueos WHERE id = ?", [
//       id,
//     ]);

//     if (arqueo.length === 0) {
//       return res.status(404).json({ message: "Arqueo no encontrado" });
//     }

//     // CONSULTA CORREGIDA:
//     // Para 'ventas' sumamos directamente la columna (tarjeta, mercadopago, etc.)
//     // Para 'pagos' sumamos la columna 'monto' filtrando por el texto en 'metodo_pago'
//     const queryTotales = `
//             SELECT
//                 (
//                     IFNULL((SELECT SUM(tarjeta) FROM ventas WHERE arqueo_id = ?), 0) +
//                     IFNULL((SELECT SUM(monto) FROM pagos WHERE arqueo_id = ? AND metodo_pago = 'tarjeta'), 0)
//                 ) as total_tarjeta_sistema,

//                 (
//                     IFNULL((SELECT SUM(mercadopago) FROM ventas WHERE arqueo_id = ?), 0) +
//                     IFNULL((SELECT SUM(monto) FROM pagos WHERE arqueo_id = ? AND metodo_pago = 'mercadopago'), 0)
//                 ) as total_mp_sistema,

//                 (
//                     IFNULL((SELECT SUM(transferencia) FROM ventas WHERE arqueo_id = ?), 0) +
//                     IFNULL((SELECT SUM(monto) FROM pagos WHERE arqueo_id = ? AND metodo_pago = 'transferencia'), 0)
//                 ) as total_transf_sistema
//         `;

//     // Pasamos el ID 6 veces para completar los signos de interrogación (?)
//     const [totales] = await db.execute(queryTotales, [id, id, id, id, id, id]);

//     res.json({
//       arqueo: arqueo[0],
//       totales_sistema: totales[0],
//     });
//   } catch (error) {
//     console.error("Error en getArqueoById:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

const getArqueoById = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Obtener datos básicos del arqueo
    const [arqueo] = await db.execute("SELECT * FROM arqueos WHERE id = ?", [
      id,
    ]);

    if (arqueo.length === 0) {
      return res.status(404).json({ message: "Arqueo no encontrado" });
    }

    // 2. OBTENER LOS MOVIMIENTOS (Esto es lo que faltaba y causaba el error .filter)
    const [movimientos] = await db.execute(
      "SELECT * FROM movimiento_cajas WHERE arqueo_id = ? ORDER BY id DESC",
      [id]
    );

    // 3. Obtener Totales del Sistema (Ventas + Pagos de Deuda)
    const queryTotales = `
            SELECT 
                (
                    IFNULL((SELECT SUM(tarjeta) FROM ventas WHERE arqueo_id = ?), 0) + 
                    IFNULL((SELECT SUM(monto) FROM pagos WHERE arqueo_id = ? AND metodo_pago = 'tarjeta'), 0)
                ) as total_tarjeta_sistema,
                
                (
                    IFNULL((SELECT SUM(mercadopago) FROM ventas WHERE arqueo_id = ?), 0) + 
                    IFNULL((SELECT SUM(monto) FROM pagos WHERE arqueo_id = ? AND metodo_pago = 'mercadopago'), 0)
                ) as total_mp_sistema,
                
                (
                    IFNULL((SELECT SUM(transferencia) FROM ventas WHERE arqueo_id = ?), 0) + 
                    IFNULL((SELECT SUM(monto) FROM pagos WHERE arqueo_id = ? AND metodo_pago = 'transferencia'), 0)
                ) as total_transf_sistema
        `;

    const [totales] = await db.execute(queryTotales, [id, id, id, id, id, id]);

    // 4. Enviar la respuesta completa al frontend
    res.json({
      arqueo: arqueo[0],
      movimientos: movimientos, // <--- Ahora el frontend podrá hacer el .filter()
      totales_sistema: totales[0],
    });
  } catch (error) {
    console.error("Error en getArqueoById:", error);
    res.status(500).json({ message: error.message });
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

// const closeArqueo = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {
//       fecha_cierre,
//       monto_final,
//       ventas_efectivo,
//       ventas_tarjeta,
//       ventas_mercadopago,
//     } = req.body;

//     const cerrado = await Arqueo.close(id, {
//       fecha_cierre,
//       monto_final,
//       ventas_efectivo,
//       ventas_tarjeta,
//       ventas_mercadopago,
//     });

//     if (!cerrado)
//       return res.status(404).json({ message: "No se pudo cerrar el arqueo" });

//     res.json({ message: "Arqueo cerrado exitosamente" });
//   } catch (error) {
//     res.status(500).json({ message: "Error al cerrar arqueo" });
//   }
// };

const closeArqueo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fecha_cierre,
      monto_final,
      ventas_efectivo,
      ventas_tarjeta,
      ventas_mercadopago,
      ventas_transferencia, // 👈 Recibimos transferencia
    } = req.body;

    const cerrado = await Arqueo.close(id, {
      fecha_cierre,
      monto_final,
      ventas_efectivo,
      ventas_tarjeta,
      ventas_mercadopago,
      ventas_transferencia, // 👈 Lo pasamos al modelo
    });

    if (!cerrado) return res.status(404).json({ message: "No se pudo cerrar" });

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
