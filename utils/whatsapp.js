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

// const sendWS = async (numero, mensaje) => {
//   try {
//     if (qrCodeData !== "CONNECTED") {
//       return console.log(
//         "Intento de envío fallido: WhatsApp no está vinculado."
//       );
//     }

//     // 1. Limpiamos el número (solo números)
//     let cleanNumber = numero.replace(/\D/g, "");

//     // 2. Lógica para Argentina: Asegurar formato correcto para búsqueda
//     // Si empieza con 11 (local) le ponemos el 549
//     if (cleanNumber.length === 10 && cleanNumber.startsWith("11")) {
//       cleanNumber = "549" + cleanNumber;
//     }

//     // 3. BUSCAMOS EL ID REAL DEL CONTACTO (La clave para evitar el error 'No LID')
//     // Esto resuelve si el número lleva el 9 o no automáticamente
//     const numberId = await client.getNumberId(cleanNumber);

//     if (numberId) {
//       // Si WhatsApp encontró al usuario, usamos su ID oficial (_serialized)
//       await client.sendMessage(numberId._serialized, mensaje);
//       console.log(
//         `✅ Mensaje enviado a ${cleanNumber} (ID: ${numberId._serialized})`
//       );
//     } else {
//       console.log(
//         `❌ El número ${cleanNumber} no parece tener WhatsApp o está mal formateado.`
//       );
//     }
//   } catch (error) {
//     console.error("Error al enviar mensaje de WhatsApp:", error);
//   }
// };

// const sendWS = async (numero, mensaje) => {
//   try {
//     // 1. Limpieza del número (aseguramos formato internacional)
//     let chatId = numero.includes("@c.us") ? numero : `${numero}@c.us`;

//     // 2. Verificamos si el cliente está listo
//     // (Asumo que tu objeto se llama 'client')
//     if (!client || !client.info) {
//       throw new Error("El cliente de WhatsApp no está conectado");
//     }

//     // 3. ENVÍO BLINDADO
//     // Usamos un bloque anidado para capturar el error de 'markedUnread'
//     // que es un bug interno de la librería pero el mensaje se envía igual.
//     try {
//       await client.sendMessage(chatId, mensaje);
//       console.log(`[WS SUCCESS] Mensaje enviado a: ${numero}`);
//       return { success: true };
//     } catch (innerError) {
//       // Si el error es el famoso 'markedUnread', lo ignoramos
//       if (innerError.message.includes("markedUnread")) {
//         console.log(
//           `[WS WARNING] Error de interfaz detectado, pero el mensaje debería haber salido.`
//         );
//         return { success: true };
//       }
//       throw innerError;
//     }
//   } catch (error) {
//     console.error("Error real al enviar mensaje de WhatsApp:", error);
//     // No devolvemos error 500 al sistema para que la venta no se trabe
//     return { success: false, error: error.message };
//   }
// };

const sendWS = async (numero, mensaje) => {
  try {
    if (!client || !client.info) {
      console.error("[WS ERROR] Bot no conectado.");
      return false;
    }

    // 1. Limpieza y Formateo para Argentina
    let num = numero.replace(/\D/g, "");
    if (num.startsWith("54") && num.length === 12 && num[2] !== "9") {
      num = "549" + num.substring(2);
    } else if (num.length === 10) {
      num = "549" + num;
    }

    // 2. Obtener el ID REAL de WhatsApp (Crucial para evitar el error de LID)
    const numberId = await client.getNumberId(num);
    if (!numberId) {
      console.error(`[WS ERROR] El número ${num} no existe en WA.`);
      return false;
    }

    // 3. ENVÍO "SILENCIOSO"
    // Enviamos el mensaje pero capturamos el error inmediatamente.
    // El error 'markedUnread' ocurre DESPUÉS de que el mensaje sale de tu PC.
    try {
      // Agregamos opciones para que WA Web haga lo mínimo indispensable
      await client.sendMessage(numberId._serialized, mensaje, {
        linkPreview: false,
        sendSeen: false, // Evita que intente marcar como leído, que es lo que falla
      });
      console.log(`[WS SUCCESS] Mensaje enviado a ${num}`);
      return true;
    } catch (innerError) {
      // Si el error es el de 'markedUnread' o similar, el mensaje YA SALIÓ.
      if (
        innerError.message.includes("markedUnread") ||
        innerError.message.includes("reading")
      ) {
        console.log(
          `[WS WARNING] Mensaje enviado con éxito (Error de interfaz ignorado).`
        );
        return true;
      }
      throw innerError;
    }
  } catch (error) {
    console.error(`[WS ERROR] Fallo real: ${error.message}`);
    return false;
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
