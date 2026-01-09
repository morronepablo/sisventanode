// backend/utils/whatsapp.js
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");

// const client = new Client({
//   authStrategy: new LocalAuth(),
//   // IMPORTANTE: Este bloque ayuda a que WhatsApp no detecte que el navegador es "viejo"
//   webVersionCache: {
//     type: "remote",
//     remotePath:
//       "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
//   },
//   puppeteer: {
//     headless: true, // Cambia a false si quieres ver la ventana del navegador abrirse para depurar
//     args: [
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//       "--disable-dev-shm-usage",
//       "--disable-accelerated-2d-canvas",
//       "--no-first-run",
//       "--no-zygote",
//       "--single-process",
//       "--disable-gpu",
//     ],
//     // Si tienes Google Chrome instalado, descomenta la línea de abajo para mayor estabilidad:
//     // executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
//   },
// });

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

// Función universal para enviar mensajes
const sendWS = async (numero, mensaje) => {
  try {
    if (qrCodeData !== "CONNECTED") {
      return console.log(
        "Intento de envío fallido: WhatsApp no está vinculado."
      );
    }
    // Limpiamos el número por si viene con espacios o símbolos
    const cleanNumber = numero.replace(/\D/g, "");
    const chatId = `${cleanNumber}@c.us`;
    await client.sendMessage(chatId, mensaje);
    console.log(`Mensaje enviado a ${numero}`);
  } catch (error) {
    console.error("Error al enviar mensaje de WhatsApp:", error);
  }
};

client
  .initialize()
  .catch((err) => console.error("Error al iniciar WhatsApp:", err));

module.exports = { sendWS, getQR: () => qrCodeData };
