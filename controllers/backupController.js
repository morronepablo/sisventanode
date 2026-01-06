// controllers/backupController.js
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
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
            "Error al crear backup. Asegúrese de que mysqldump esté instalado."
          );
      }

      res.download(filePath, fileName, async (err) => {
        if (err) console.error(err);
        fs.unlinkSync(filePath); // Borrar el archivo temporal después de descargar
        await registrarLog(
          req,
          "BACKUP",
          "SISTEMA",
          "Se descargó una copia de seguridad de la base de datos."
        );
      });
    });
  } catch (error) {
    res.status(500).send("Error interno");
  }
};

module.exports = { createBackup };
