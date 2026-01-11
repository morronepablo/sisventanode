// server.js
require("dotenv").config();
const express = require("express");
const http = require("http"); // 👈 1. Importar módulo HTTP nativo
const { Server } = require("socket.io"); // 👈 2. Importar Server de socket.io
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const db = require("./config/db");
const { getQR, logoutWS } = require("./utils/whatsapp");

const app = express();
const server = http.createServer(app); // 👈 3. Crear servidor HTTP usando Express

// 4. Configurar Socket.io con CORS (muy importante)
const io = new Server(server, {
  cors: {
    origin: "*", // En producción pon la URL de Vercel
    methods: ["GET", "POST"],
  },
});

// 5. Hacer que 'io' sea accesible desde los controladores
app.set("socketio", io);

io.on("connection", (socket) => {
  console.log("👤 Usuario conectado al canal de tiempo real:", socket.id);

  // Recibe el código desde el celular y lo emite a todos (a la PC)
  socket.on("barcode-scanned", (code) => {
    console.log("Scanner dice:", code);
    io.emit("remote-scan-result", code);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

// Aumentar el límite del body-parser
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Permite cargar imágenes desde el mismo servidor
  })
);
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// HACER PÚBLICA LA CARPETA DE IMÁGENES
app.use("/assets/img", express.static(path.join(__dirname, "src/assets/img")));
// Agregamos /src para que coincida con la ruta de tu base de datos
app.use(
  "/src/assets/productos",
  express.static(path.join(__dirname, "src/assets/productos"))
);

// Rutas
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const empresaRoutes = require("./routes/empresaRoutes");
const categoriaRoutes = require("./routes/categoriaRoutes");
const unidadRoutes = require("./routes/unidadRoutes");
const productoRoutes = require("./routes/productoRoutes");
const proveedorRoutes = require("./routes/proveedorRoutes");
const compraRoutes = require("./routes/compraRoutes");
const clienteRoutes = require("./routes/clienteRoutes");
const ventaRoutes = require("./routes/ventaRoutes");
const comboRoutes = require("./routes/comboRoutes");
const arqueoRoutes = require("./routes/arqueoRoutes");
const devolucionRoutes = require("./routes/devolucionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const sessionRoutes = require("./routes/configSessionRoutes");
const ajusteRoutes = require("./routes/ajusteRoutes");
const movimientoRoutes = require("./routes/movimientoRoutes");
const gastoRoutes = require("./routes/gastoRoutes");
const logRoutes = require("./routes/logRoutes");
const backupRoutes = require("./routes/backupRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/empresas", empresaRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/unidades", unidadRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/proveedores", proveedorRoutes);
app.use("/api/compras", compraRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/ventas", ventaRoutes);
app.use("/api/combos", comboRoutes);
app.use("/api/arqueos", arqueoRoutes);
app.use("/api/devoluciones", devolucionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/config-session", sessionRoutes);
app.use("/api/ajustes", ajusteRoutes);
app.use("/api/movimientos", movimientoRoutes);
app.use("/api/gastos", gastoRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/backup", backupRoutes);

app.get("/api/whatsapp-status", (req, res) => {
  const qr = getQR();
  if (qr === "CONNECTED") return res.json({ status: "CONNECTED" });
  if (qr === "") return res.json({ status: "LOADING" });
  res.json({ status: "QR_READY", qr: qr });
});

app.post("/api/whatsapp-logout", async (req, res) => {
  const result = await logoutWS();
  if (result.success) {
    res.json({
      status: "DISCONNECTED",
      message: "Sesión cerrada correctamente",
    });
  } else {
    res.status(500).json({ message: "No se pudo cerrar la sesión" });
  }
});

app.get("/", (req, res) => {
  res.send("Backend funcionando!");
});

const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
// });

// ❌ ANTES DECÍA: app.listen(PORT, ...
// ✅ AHORA DEBE DECIR:
server.listen(PORT, () => {
  console.log(`🚀 Servidor con Real-Time en http://localhost:${PORT}`);
});
