// controllers/ajusteController.js
const db = require("../config/db");

const getListadoAjustes = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const query = `
      SELECT 
        a.id, 
        a.tipo, 
        a.cantidad, 
        a.motivo, 
        a.fecha, 
        p.nombre as producto_nombre, 
        u.name as usuario_nombre
      FROM ajustes a
      INNER JOIN productos p ON a.producto_id = p.id
      INNER JOIN users u ON a.usuario_id = u.id
      WHERE a.empresa_id = ?
      ORDER BY a.fecha DESC
    `;

    const [rows] = await db.execute(query, [empresa_id]);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener ajustes:", error);
    res.status(500).json({ message: "Error al obtener el listado de ajustes" });
  }
};

const storeAjuste = async (req, res) => {
  console.log("--- INICIO CREAR AJUSTE ---");
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { producto_id, tipo, cantidad, motivo, fecha } = req.body;
    const empresa_id = req.user.empresa_id;
    const usuario_id = req.user.id;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress; // Captura la IP

    // 1. Obtener nombre del producto para el detalle del log
    const [prodRows] = await connection.execute(
      "SELECT nombre FROM productos WHERE id = ?",
      [producto_id]
    );
    const productoNombre =
      prodRows.length > 0 ? prodRows[0].nombre : "Desconocido";

    // 2. Insertar el Ajuste
    const [resAjuste] = await connection.execute(
      `INSERT INTO ajustes (producto_id, tipo, cantidad, motivo, fecha, usuario_id, empresa_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [producto_id, tipo, cantidad, motivo, fecha, usuario_id, empresa_id]
    );
    const ajuste_id = resAjuste.insertId;

    // 3. Actualizar Stock del Producto
    const operador = tipo === "entrada" ? "+" : "-";
    await connection.execute(
      `UPDATE productos SET stock = stock ${operador} ? WHERE id = ?`,
      [cantidad, producto_id]
    );

    // 4. Registrar Movimiento de Stock (Kardex)
    await connection.execute(
      `INSERT INTO movimientos (producto_id, empresa_id, tipo, origen, origen_id, cantidad, fecha, usuario_id, created_at, updated_at) 
       VALUES (?, ?, ?, 'ajuste', ?, ?, ?, ?, NOW(), NOW())`,
      [
        producto_id,
        empresa_id,
        tipo === "entrada" ? "entrada" : "salida",
        ajuste_id,
        cantidad,
        fecha,
        usuario_id,
      ]
    );

    // 5. REGISTRAR LOG DE ACTIVIDAD
    const detalleLog = `Registró un ajuste de ${tipo.toUpperCase()} de ${cantidad} unidades para el producto: ${productoNombre}. Motivo: ${motivo}`;

    await connection.execute(
      `INSERT INTO logs (usuario_id, accion, modulo, detalle, ip, empresa_id, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [usuario_id, "CREAR", "INVENTARIO", detalleLog, ip, empresa_id]
    );

    await connection.commit();
    res.json({
      success: true,
      message: "Ajuste registrado correctamente y auditado",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al registrar ajuste:", error);
    res
      .status(500)
      .json({ message: "Error al procesar el ajuste", error: error.message });
  } finally {
    connection.release();
  }
  console.log("--- FIN CREAR AJUSTE ---");
};

const getAjusteById = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    const query = `
      SELECT 
        a.*, 
        p.nombre as producto_nombre, 
        u.name as usuario_nombre
      FROM ajustes a
      INNER JOIN productos p ON a.producto_id = p.id
      INNER JOIN users u ON a.usuario_id = u.id
      WHERE a.id = ? AND a.empresa_id = ?
    `;

    const [rows] = await db.execute(query, [id, empresa_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Ajuste no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener detalle del ajuste:", error);
    res.status(500).json({ message: "Error al obtener los detalles" });
  }
};

const countAjustes = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const [rows] = await db.execute(
      "SELECT COUNT(*) AS total FROM ajustes WHERE empresa_id = ?",
      [empresa_id]
    );
    res.json({ total: rows[0].total });
  } catch (error) {
    res.status(500).json({ total: 0 });
  }
};

module.exports = {
  getListadoAjustes,
  storeAjuste,
  getAjusteById,
  countAjustes,
};
