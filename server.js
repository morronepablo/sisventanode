// server.js

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const db = require("./config/db");

const app = express();

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

app.get("/", (req, res) => {
  res.send("Backend funcionando!");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
