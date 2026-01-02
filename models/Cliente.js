// models/Cliente.js
const db = require("../config/db");

const Cliente = {
  getAll: async (empresa_id) => {
    try {
      const query = `
        SELECT 
          c.*,
          IFNULL((SELECT SUM(importe) FROM compras_cta_cte WHERE cliente_id = c.id AND tipo = 'deuda'), 0) as deuda,
          IFNULL((SELECT SUM(importe) FROM compras_cta_cte WHERE cliente_id = c.id AND tipo = 'pago'), 0) as pagos,
          (SELECT COUNT(*) FROM ventas WHERE cliente_id = c.id) as cantidad_compras,
          IFNULL((SELECT SUM(precio_total) FROM ventas WHERE cliente_id = c.id), 0) as monto_compras
        FROM clientes c
        WHERE c.empresa_id = ?
        ORDER BY c.id DESC
      `;
      const [rows] = await db.execute(query, [empresa_id]);
      return rows.map((cliente) => ({
        ...cliente,
        saldo: parseFloat(cliente.deuda) - parseFloat(cliente.pagos),
      }));
    } catch (error) {
      throw error;
    }
  },

  findById: async (id) => {
    const [rows] = await db.execute("SELECT * FROM clientes WHERE id = ?", [
      id,
    ]);
    return rows[0];
  },

  create: async (datos) => {
    const { nombre_cliente, cuil_codigo, telefono, email, empresa_id } = datos;
    const query = `
      INSERT INTO clientes 
      (nombre_cliente, cuil_codigo, telefono, email, empresa_id, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await db.execute(query, [
      nombre_cliente,
      cuil_codigo,
      telefono,
      email,
      empresa_id,
    ]);
    return result.insertId;
  },

  delete: async (id) => {
    const [result] = await db.execute("DELETE FROM clientes WHERE id = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  },

  getGestionPagos: async (clienteId, empresaId) => {
    try {
      // 1. Obtener movimientos (Deudas y Pagos)
      const [movimientos] = await db.execute(
        `SELECT * FROM compras_cta_cte 
         WHERE cliente_id = ? AND empresa_id = ? 
         ORDER BY fecha DESC, id DESC`,
        [clienteId, empresaId]
      );

      // 2. Calcular Totales
      const [totales] = await db.execute(
        `SELECT 
          SUM(CASE WHEN tipo = 'deuda' THEN importe ELSE 0 END) as deuda_total,
          SUM(CASE WHEN tipo = 'pago' THEN importe ELSE 0 END) as pagos_realizados
         FROM compras_cta_cte WHERE cliente_id = ? AND empresa_id = ?`,
        [clienteId, empresaId]
      );

      const deuda = parseFloat(totales[0].deuda_total) || 0;
      const pagos = parseFloat(totales[0].pagos_realizados) || 0;
      const saldo = deuda - pagos;

      // 3. Calcular Días de Mora (basado en la deuda más antigua)
      let diasMora = 0;
      if (saldo > 0) {
        const [antigua] = await db.execute(
          `SELECT fecha FROM compras_cta_cte 
           WHERE cliente_id = ? AND tipo = 'deuda' 
           ORDER BY fecha ASC LIMIT 1`,
          [clienteId]
        );
        if (antigua.length > 0) {
          const fechaDeuda = new Date(antigua[0].fecha);
          const hoy = new Date();
          diasMora = Math.floor((hoy - fechaDeuda) / (1000 * 60 * 60 * 24));
        }
      }

      return {
        movimientos,
        resumen: { deuda, pagos, saldo, diasMora },
      };
    } catch (error) {
      throw error;
    }
  },
};

module.exports = Cliente;
