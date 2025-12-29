// models/Arqueo.js
const db = require("../config/db");

class Arqueo {
  static async getAll() {
    // Obtenemos arqueos con el nombre del usuario y sumatorias de movimientos
    const [rows] = await db.execute(`
      SELECT a.*, u.name as usuario_nombre,
      (SELECT SUM(monto) FROM movimiento_cajas WHERE arqueo_id = a.id AND tipo = 'Ingreso') as total_ingresos,
      (SELECT SUM(monto) FROM movimiento_cajas WHERE arqueo_id = a.id AND tipo = 'Egreso') as total_egresos
      FROM arqueos a
      INNER JOIN users u ON a.usuario_id = u.id
      ORDER BY a.fecha_apertura DESC
    `);
    return rows;
  }

  static async getMovimientos(arqueoId) {
    const [rows] = await db.execute(
      "SELECT * FROM movimiento_cajas WHERE arqueo_id = ?",
      [arqueoId]
    );
    return rows;
  }

  static async checkArqueoAbierto(usuarioId) {
    const [rows] = await db.execute(
      "SELECT * FROM arqueos WHERE usuario_id = ? AND fecha_cierre IS NULL",
      [usuarioId]
    );
    return rows[0];
  }

  static async create(data) {
    const {
      empresa_id,
      usuario_id,
      fecha_apertura,
      monto_inicial,
      descripcion,
    } = data;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const [result] = await db.execute(
      `INSERT INTO arqueos 
      (empresa_id, usuario_id, fecha_apertura, monto_inicial, descripcion, 
       ventas_efectivo, ventas_tarjeta, ventas_mercadopago, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, ?)`,
      [
        empresa_id,
        usuario_id,
        fecha_apertura,
        monto_inicial,
        descripcion,
        now,
        now,
      ]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const { fecha_apertura, monto_inicial, descripcion } = data;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const [result] = await db.execute(
      "UPDATE arqueos SET fecha_apertura = ?, monto_inicial = ?, descripcion = ?, updated_at = ? WHERE id = ?",
      [fecha_apertura, monto_inicial, descripcion, now, id]
    );
    return result.affectedRows > 0;
  }

  static async addMovimiento(data) {
    const { arqueo_id, tipo, monto, descripcion } = data;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const [result] = await db.execute(
      "INSERT INTO movimiento_cajas (arqueo_id, tipo, monto, descripcion, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [arqueo_id, tipo, monto, descripcion, now, now]
    );
    return result.insertId;
  }

  static async close(id, data) {
    const {
      fecha_cierre,
      monto_final,
      ventas_efectivo,
      ventas_tarjeta,
      ventas_mercadopago,
    } = data;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const [result] = await db.execute(
      `UPDATE arqueos SET 
      fecha_cierre = ?, 
      monto_final = ?, 
      ventas_efectivo = ?, 
      ventas_tarjeta = ?, 
      ventas_mercadopago = ?, 
      updated_at = ? 
    WHERE id = ?`,
      [
        fecha_cierre,
        monto_final,
        ventas_efectivo,
        ventas_tarjeta,
        ventas_mercadopago,
        now,
        id,
      ]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Arqueo;
