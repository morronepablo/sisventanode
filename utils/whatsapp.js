// backend/utils/whatsapp.js
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");

const client = new Client({
  authStrategy: new LocalAuth(),
  // Forzamos una versión estable de WhatsApp Web
  webVersionCache: {
    type: "remote",
    remotePath:
      "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
  },
  puppeteer: {
    // CAMBIO CLAVE: Usa tu Chrome real para evitar errores de DLLs faltantes
    executablePath:
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-extensions",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--no-first-run",
    ],
  },
});

let qrCodeData = "";

client.on("qr", (qr) => {
  // Convertimos el texto del QR en una imagen Base64 para el Frontend
  qrcode.toDataURL(qr, (err, url) => {
    qrCodeData = url;
    console.log("-------------------------------------------------------");
    console.log("NUEVO QR DE WHATSAPP GENERADO. Míralo en el sistema.");
    console.log("-------------------------------------------------------");
  });
});

client.on("ready", () => {
  qrCodeData = "CONNECTED";
  console.log("-------------------------------------------------------");
  console.log("¡WHATSAPP CONECTADO Y LISTO!");
  console.log("-------------------------------------------------------");
});

const sendWS = async (numero, mensaje) => {
  try {
    if (qrCodeData !== "CONNECTED") {
      return console.log(
        "Intento de envío fallido: WhatsApp no está vinculado."
      );
    }

    // 1. Limpiamos el número (solo números)
    let cleanNumber = numero.replace(/\D/g, "");

    // 2. Lógica para Argentina: Asegurar formato correcto para búsqueda
    // Si empieza con 11 (local) le ponemos el 549
    if (cleanNumber.length === 10 && cleanNumber.startsWith("11")) {
      cleanNumber = "549" + cleanNumber;
    }

    // 3. BUSCAMOS EL ID REAL DEL CONTACTO (La clave para evitar el error 'No LID')
    // Esto resuelve si el número lleva el 9 o no automáticamente
    const numberId = await client.getNumberId(cleanNumber);

    if (numberId) {
      // Si WhatsApp encontró al usuario, usamos su ID oficial (_serialized)
      await client.sendMessage(numberId._serialized, mensaje);
      console.log(
        `✅ Mensaje enviado a ${cleanNumber} (ID: ${numberId._serialized})`
      );
    } else {
      console.log(
        `❌ El número ${cleanNumber} no parece tener WhatsApp o está mal formateado.`
      );
    }
  } catch (error) {
    console.error("Error al enviar mensaje de WhatsApp:", error);
  }
};

const logoutWS = async () => {
  try {
    qrCodeData = ""; // 1. Ponemos el estado en "LOADING" inmediatamente

    if (client) {
      console.log("Cerrando sesión y destruyendo cliente actual...");

      // Intenta cerrar sesión (esto borra la carpeta .wwebjs_auth)
      try {
        await client.logout();
      } catch (e) {
        console.log("No había sesión activa para cerrar o falló el logout.");
      }

      // 2. IMPORTANTE: Reiniciamos el cliente para que genere un nuevo QR
      console.log("Reiniciando motor de WhatsApp para nuevo login...");
      await client.initialize();

      return { success: true };
    }
  } catch (error) {
    console.error("Error al reiniciar WhatsApp:", error);
    return { success: false, error: error.message };
  }
};

client
  .initialize()
  .catch((err) => console.error("Error al iniciar WhatsApp:", err));

module.exports = { sendWS, getQR: () => qrCodeData, logoutWS };
