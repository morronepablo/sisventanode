// controllers/backupController.js
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");
const { registrarLog } = require("../utils/logger");

const createBackup = async (req, res) => {
  try {
    const dbName = process.env.DB_NAME || "sisventareact";
    const dbUser = process.env.DB_USER || "root";
    const dbPass = process.env.DB_PASS || "";

    const fileName = `backup-${dbName}-${new Date().getTime()}.sql`;
    const filePath = path.join(__dirname, "../", fileName);

    // Comando para mysqldump
    const cmd = `mysqldump -u ${dbUser} ${
      dbPass ? `-p${dbPass}` : ""
    } ${dbName} > "${filePath}"`;

    exec(cmd, async (error) => {
      if (error) {
        console.error("Error al ejecutar mysqldump:", error);
        return res
          .status(500)
          .send(
            "Error al crear backup. Asegúrese de que mysqldump esté instalado.",
          );
      }

      res.download(filePath, fileName, async (err) => {
        if (err) console.error(err);
        fs.unlinkSync(filePath); // Borrar el archivo temporal después de descargar
        await registrarLog(
          req,
          "BACKUP",
          "SISTEMA",
          "Se descargó una copia de seguridad de la base de datos.",
        );
      });
    });
  } catch (error) {
    res.status(500).send("Error interno");
  }
};

const resetSystem = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Desactivar revisión de llaves foráneas para poder vaciar todo
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    // 2. Lista de tablas que deben quedar VACÍAS (Truncate reinicia el ID a 1)
    const tablasAVaciar = [
      "ajustes",
      "arqueos",
      "auditoria_seguridad",
      "categorias",
      "combo_producto",
      "combos",
      "compras",
      "compras_cta_cte",
      "detalle_compras",
      "detalle_devoluciones",
      "detalle_ventas",
      "devoluciones",
      "gastos",
      "historial_patrimonio",
      "historial_precios",
      "logs",
      "movimientos",
      "movimientos_billetera",
      "movimiento_cajas",
      "pagos",
      "pago_compras",
      "productos",
      "promociones",
      "proveedors",
      "retiros_caja",
      "tmp_ventas",
      "tmp_devoluciones",
      "tmp_compras",
      "ventas",
    ];

    for (const tabla of tablasAVaciar) {
      await connection.query(`TRUNCATE TABLE ${tabla}`);
    }

    // 3. Resetear ROLES (Borrar todo y poner el Administrador ID 1)
    await connection.query("TRUNCATE TABLE roles");
    await connection.query(
      "INSERT INTO roles (id, name) VALUES (1, 'Administrador')",
    );

    // 4. Resetear CLIENTES (Borrar todo y poner Consumidor Final ID 1)
    await connection.query("TRUNCATE TABLE clientes");
    await connection.query(`INSERT INTO clientes 
      (id, nombre_cliente, cuil_codigo, telefono, email, empresa_id, created_at, updated_at) 
      VALUES (1, 'Consumidor Final', '00000000000', '99999999', 'consumidorfinal@gmail.com', 1, NOW(), NOW())`);

    // 5. Resetear USUARIOS (Borrar todo y poner Admin ID 1)
    await connection.query("TRUNCATE TABLE users");
    await connection.query(`INSERT INTO users 
      (id, name, email, password, empresa_id, created_at, updated_at) 
      VALUES (1, 'Admin', 'admin@admin.com', '$2y$12$kXT4glz/JrN5Lbl0S7JWbuX2nKWNNOKVx8Ch7pTLEMDGvwmlEuwEa', 1, NOW(), NOW())`);

    // 6. Resetear Relación Usuario-Rol
    await connection.query("TRUNCATE TABLE user_roles");
    await connection.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES (1, 1)",
    );

    // 7. Reactivar revisión de llaves foráneas
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    await connection.commit();

    // Registrar Log
    await registrarLog(
      req,
      "DELETE",
      "SISTEMA",
      "RESETEO TOTAL DEL SISTEMA A VALORES DE FÁBRICA.",
    );

    res.json({ success: true, message: "Sistema reseteado correctamente" });
  } catch (error) {
    await connection.rollback();
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    console.error("Error al resetear sistema:", error);
    res
      .status(500)
      .json({ message: "Error al resetear el sistema", error: error.message });
  } finally {
    connection.release();
  }
};

const restoreSystem = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No se subió ningún archivo." });
    }

    const dbName = process.env.DB_NAME || "sisventareact";
    const dbUser = process.env.DB_USER || "root";
    const dbPass = process.env.DB_PASS || "";
    const sqlFilePath = req.file.path; // Ruta temporal del archivo subido

    // Ruta al ejecutable mysql (ajustar si no usas XAMPP)
    const mysqlPath = `C:\\xampp\\mysql\\bin\\mysql.exe`;

    // Comando para restaurar: mysql -u usuario -pPassword base_de_datos < archivo.sql
    // Usamos el flag --force para que continúe si hay errores menores
    const cmd = `"${mysqlPath}" -u ${dbUser} ${
      dbPass ? `-p${dbPass}` : ""
    } ${dbName} < "${sqlFilePath}"`;

    exec(cmd, (error, stdout, stderr) => {
      // Borramos el archivo temporal subido inmediatamente
      if (fs.existsSync(sqlFilePath)) {
        fs.unlinkSync(sqlFilePath);
      }

      if (error) {
        console.error("Error al restaurar:", error);
        return res.status(500).json({
          success: false,
          message: "Error al procesar el archivo SQL.",
          error: error.message,
        });
      }

      res.json({
        success: true,
        message: "Base de datos restaurada correctamente.",
      });
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor." });
  }
};

module.exports = { createBackup, resetSystem, restoreSystem };
