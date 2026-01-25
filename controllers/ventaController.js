// controllers/ventaController.js
const Venta = require("../models/Venta");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const { registrarLog } = require("../utils/logger");
const { sendWS } = require("../utils/whatsapp"); // 👈 1. Importar WhatsApp

// 🚀 REGLA DE ORO: Definir MY_CAJA como constante para todo el archivo
const MY_CAJA = Number(process.env.CAJA_ID || 1);

const getEmpresaPhone = async (empresa_id) => {
  const [rows] = await db.execute(
    "SELECT telefono FROM empresas WHERE id = ?",
    [empresa_id],
  );
  if (rows.length > 0 && rows[0].telefono) {
    let phone = rows[0].telefono.replace(/\D/g, "");
    if (!phone.startsWith("54")) phone = "549" + phone;
    return phone;
  }
  return null;
};

const getListadoVentas = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const ventas = await Venta.getAll(empresa_id);
    const result = [];

    for (const v of ventas) {
      const detallesRaw = await Venta.getDetallesByVentaId(v.id);

      // 🚀 PROCESAMOS CADA DETALLE CONSIDERANDO ESCALA Y BULTOS 🚀
      const detallesProcesados = detallesRaw.map((d) => {
        let precioUnitario = 0;
        let cantidadMostrar = parseFloat(d.cantidad);
        let equivalencia_unidades = 1;
        let escala_nombre = "UNIDAD";

        // Si es producto (no combo)
        if (d.producto_id) {
          // 🚀 SISTEMA DE BULTOS EXISTENTE (es_bulto y factor_utilizado)
          if (d.es_bulto == 1) {
            const factor = parseFloat(d.factor_utilizado) || 1;

            if (d.aplicar_porcentaje == 1) {
              const precioBase = parseFloat(d.precio_compra) * factor;
              precioUnitario =
                precioBase * (1 + (parseFloat(d.valor_porcentaje) || 0) / 100);
            } else {
              // Si hay precio_venta_bulto específico, usarlo
              if (d.precio_venta_bulto) {
                precioUnitario = parseFloat(d.precio_venta_bulto);
              } else {
                precioUnitario = parseFloat(d.precio_venta) * factor;
              }
            }
            escala_nombre = d.unidad_bulto_nombre || "BULTO";
            equivalencia_unidades = factor;
          }
          // 🚀 UNIDAD INDIVIDUAL
          else {
            if (d.aplicar_porcentaje == 1) {
              precioUnitario =
                parseFloat(d.precio_compra) *
                (1 + (parseFloat(d.valor_porcentaje) || 0) / 100);
            } else {
              precioUnitario = parseFloat(d.precio_venta) || 0;
            }
            escala_nombre = d.unidad_base_nombre || "UNIDAD";
            equivalencia_unidades = 1;
          }
        }
        // Si es combo
        else if (d.combo_id) {
          precioUnitario = parseFloat(d.combo_precio) || 0;
          escala_nombre = "COMBO";
        }

        return {
          ...d,
          precio_unitario: precioUnitario,
          importe_neto: cantidadMostrar * precioUnitario,
          // Campos adicionales para mostrar correctamente
          escala_nombre: escala_nombre,
          equivalencia_unidades: equivalencia_unidades,
          cantidad_mostrar: cantidadMostrar,
        };
      });

      result.push({ ...v, detalles: detallesProcesados });
    }
    res.json(result);
  } catch (error) {
    console.error("[VENTAS ERROR] Listado:", error.message);
    res.status(500).json({ message: "Error al obtener listado" });
  }
};

const getTmpVentas = async (req, res) => {
  try {
    const items = await Venta.getTmpItems(req.user.id);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleTmpBultoVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { es_bulto } = req.body;
    await db.execute("UPDATE tmp_ventas SET es_bulto = ? WHERE id = ?", [
      es_bulto,
      id,
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const postTmpVenta = async (req, res) => {
  try {
    console.log("Datos recibidos:", req.body);
    console.log("Usuario:", req.user);

    const {
      codigo,
      cantidad = 1,
      producto_id,
      combo_id,
      es_bulto = 0,
    } = req.body;

    // Validar autenticación
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const usuario_id = req.user.id;
    const empresa_id = req.user.empresa_id;

    // Validar datos mínimos
    if (!codigo && !producto_id && !combo_id) {
      return res.status(400).json({
        success: false,
        message: "Debe proporcionar código, producto_id o combo_id",
      });
    }

    // Buscar el producto/combo
    let query = "";
    let params = [];
    let item = null;

    if (producto_id) {
      query = `
        SELECT p.*, u.nombre as unidad_nombre, 
               u2.nombre as unidad_bulto_nombre
        FROM productos p
        LEFT JOIN unidads u ON p.unidad_id = u.id
        LEFT JOIN unidads u2 ON p.unidad_compra_id = u2.id
        WHERE p.id = ? AND p.empresa_id = ?`;
      params = [producto_id, empresa_id];
    } else if (combo_id) {
      query = "SELECT * FROM combos WHERE id = ? AND empresa_id = ?";
      params = [combo_id, empresa_id];
    } else if (codigo) {
      query = `
        SELECT p.*, u.nombre as unidad_nombre, 
               u2.nombre as unidad_bulto_nombre
        FROM productos p
        LEFT JOIN unidads u ON p.unidad_id = u.id
        LEFT JOIN unidads u2 ON p.unidad_compra_id = u2.id
        WHERE (p.codigo = ? OR p.nombre LIKE ?) AND p.empresa_id = ?
        LIMIT 1`;
      params = [codigo, `%${codigo}%`, empresa_id];
    }

    const [results] = await db.execute(query, params);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Producto/combo no encontrado",
      });
    }

    item = results[0];

    // Validar stock (solo productos)
    if (producto_id || codigo) {
      const stockActual = parseFloat(item.stock) || 0;
      const cantidadSolicitada = parseFloat(cantidad) || 1;

      if (stockActual < cantidadSolicitada) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente. Disponible: ${stockActual}`,
        });
      }
    }

    // Insertar en tmp_ventas
    const esBultoNum = es_bulto ? 1 : 0;
    const factor = parseFloat(item.factor_conversion) || 1;

    const insertQuery = `
      INSERT INTO tmp_ventas 
      (cantidad, producto_id, combo_id, session_id, factor_utilizado, es_bulto, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`;

    const insertParams = [
      parseFloat(cantidad) || 1,
      producto_id || codigo ? item.id : null,
      combo_id ? item.id : null,
      usuario_id,
      factor,
      esBultoNum,
    ];

    console.log("Insertando en tmp_ventas:", insertParams);

    const [result] = await db.execute(insertQuery, insertParams);

    res.json({
      success: true,
      message: "Producto agregado correctamente",
      data: {
        id: result.insertId,
        nombre: item.nombre,
        cantidad: parseFloat(cantidad) || 1,
        precio: parseFloat(item.precio_venta) || 0,
        es_bulto: esBultoNum,
        factor: factor,
        unidad: item.unidad_nombre || "Unidad",
        codigo: item.codigo || "",
      },
    });
  } catch (error) {
    console.error("Error en postTmpVenta:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

const deleteTmpVenta = async (req, res) => {
  try {
    const { id } = req.params; // ID de la fila en tmp_ventas

    // 1. Buscamos qué se está borrando trayendo precios de ambas tablas (productos y combos)
    const [rows] = await db.execute(
      `
      SELECT t.cantidad, 
             p.nombre as prod_nombre, p.precio_venta as prod_precio,
             c.nombre as combo_nombre, c.precio_venta as combo_precio
      FROM tmp_ventas t
      LEFT JOIN productos p ON t.producto_id = p.id
      LEFT JOIN combos c ON t.combo_id = c.id
      WHERE t.id = ?`,
      [id],
    );

    if (rows.length > 0) {
      const item = rows[0];

      // Identificamos el nombre (prioriza producto, luego combo)
      const nombre =
        item.prod_nombre || item.combo_nombre || "Ítem desconocido";

      // 🚀 CORRECCIÓN CLAVE: Buscamos el precio en prod_precio O en combo_precio
      const precio = parseFloat(item.prod_precio || item.combo_precio || 0);
      const cantidad = parseFloat(item.cantidad || 0);
      const montoTotalBorrados = precio * cantidad;

      // 2. REGISTRO PARA EL AUDITOR DE TICKETS
      const cajaId = req.user.caja_id || Number(process.env.CAJA_ID || 1);

      await db.execute(
        "INSERT INTO auditoria_seguridad (usuario_id, caja_id, tipo_evento, detalle, monto_afectado, created_at) VALUES (?, ?, 'ITEM_BORRADO', ?, ?, NOW())",
        [
          req.user.id,
          cajaId,
          `Borro ${cantidad} unid. de ${nombre}`,
          montoTotalBorrados,
        ],
      );
    }

    // 3. EJECUTAMOS EL BORRADO FÍSICO
    await Venta.deleteTmpItem(id);

    res.json({ success: true });
  } catch (error) {
    console.error("ERROR CRÍTICO AL BORRAR ITEM:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Error al eliminar el ítem" });
  }
};

const storeVenta = async (req, res) => {
  console.log(
    "--- INICIO REGISTRO DE VENTA CON BILLETERA VIRTUAL Y MÉTRICAS DE TIEMPO ---",
  );
  try {
    // 1. Extraemos los datos básicos
    const {
      precio_total,
      cliente_id,
      items,
      cargar_vuelto_billetera,
      vuelto_monto,
      pagos,
    } = req.body;

    // 👇 AGREGA ESTE LOG PARA VER LOS VALORES REALES
    console.log("🔍 Datos recibidos:", {
      cliente_id,
      cargar_vuelto_billetera,
      vuelto_monto: parseFloat(vuelto_monto),
      pagos,
    });

    const montoBilleteraUsado = parseFloat(pagos?.pago_billetera || 0);
    const empresa_id = req.user.empresa_id;
    const usuario_id = req.user.id;

    // 🚀 1.1 LÓGICA BI: CAPTURAR TIEMPO DE INICIO (Antes de que se borre el temporal)
    const [inicioRes] = await db.execute(
      "SELECT MIN(created_at) as inicio FROM tmp_ventas WHERE session_id = ?",
      [usuario_id],
    );

    let duracionSegundos = 0;
    if (inicioRes[0].inicio) {
      const tiempoInicio = new Date(inicioRes[0].inicio);
      const tiempoFin = new Date();
      duracionSegundos = Math.floor((tiempoFin - tiempoInicio) / 1000);
    }

    // 🚀 INICIALIZAMOS LA VARIABLE PARA EL MONITOR
    let nombreClienteParaWS = "Consumidor Final";

    // 2. Guardar la venta (Maneja Multicaja, Stock y Puntos en la DB)
    const venta_id = await Venta.store(req.body, usuario_id, empresa_id);

    // 🚀 2.1 LÓGICA BI: GUARDAR DURACIÓN EN LA VENTA REAL
    if (duracionSegundos > 0) {
      await db.execute("UPDATE ventas SET duracion_segundos = ? WHERE id = ?", [
        duracionSegundos,
        venta_id,
      ]);
      console.log(
        `[BI] Venta T-${venta_id} procesada en ${duracionSegundos} segundos.`,
      );
    }

    // --- OBTENEMOS EL CANAL DE SOCKETS ---
    const io = req.app.get("socketio");
    if (io) io.emit("update-dashboard");

    // 3. LÓGICA DE CONSUMO DE BILLETERA
    if (montoBilleteraUsado > 0 && Number(cliente_id) !== 1) {
      const [cliente] = await db.execute(
        "SELECT saldo_billetera FROM clientes WHERE id = ?",
        [cliente_id],
      );

      if (cliente[0].saldo_billetera < montoBilleteraUsado) {
        console.error("Saldo insuficiente en Billetera para la transacción.");
      } else {
        await db.execute(
          "UPDATE clientes SET saldo_billetera = saldo_billetera - ? WHERE id = ?",
          [montoBilleteraUsado, cliente_id],
        );

        await db.execute(
          "INSERT INTO movimientos_billetera (cliente_id, monto, tipo, descripcion, caja_id, usuario_id) VALUES (?, ?, 'consumo', ?, ?, ?)",
          [
            cliente_id,
            montoBilleteraUsado,
            `Pago de Venta T-${venta_id}`,
            req.user.caja_id,
            req.user.id,
          ],
        );
      }
    }

    // 4. LÓGICA DE CARGA DE VUELTO A BILLETERA
    if (
      cargar_vuelto_billetera &&
      vuelto_monto > 0 &&
      Number(cliente_id) !== 1
    ) {
      console.log(
        `✅ Cargando $${vuelto_monto} a billetera del cliente ${cliente_id}`,
      );
      await db.execute(
        "UPDATE clientes SET saldo_billetera = saldo_billetera + ? WHERE id = ?",
        [vuelto_monto, cliente_id],
      );

      await db.execute(
        "INSERT INTO movimientos_billetera (cliente_id, monto, tipo, descripcion, caja_id, usuario_id) VALUES (?, ?, 'carga', ?, ?, ?)",
        [
          cliente_id,
          vuelto_monto,
          `Vuelto de Venta T-${venta_id}`,
          req.user.caja_id,
          req.user.id,
        ],
      );
    }

    // 5. LÓGICA DE WHATSAPP AUTOMÁTICO
    if (cliente_id && Number(cliente_id) !== 1) {
      const [clienteRows] = await db.execute(
        "SELECT nombre_cliente, telefono, puntos FROM clientes WHERE id = ?",
        [cliente_id],
      );

      if (clienteRows.length > 0) {
        const cliente = clienteRows[0];
        nombreClienteParaWS = cliente.nombre_cliente;

        if (cliente.telefono) {
          const token = req.headers.authorization?.split(" ")[1];
          const baseUrl =
            process.env.NODE_ENV === "production"
              ? "https://sistema-ventas-backend-3nn3.onrender.com"
              : "http://localhost:3001";
          const linkTicket = `${baseUrl}/api/ventas/ticket/${venta_id}?token=${token}`;

          const mensajeTicket = `¡Hola *${cliente.nombre_cliente}*! 👋\n\nGracias por tu compra. Link ticket: ${linkTicket}`;
          await sendWS(cliente.telefono, mensajeTicket).catch((e) =>
            console.error("Error WS:", e),
          );
        }
      }
    }

    // 6. Alerta de Stock al Dueño
    const telefonoEmpresa = await getEmpresaPhone(empresa_id);
    if (telefonoEmpresa && items) {
      for (const item of items) {
        if (item.producto_id) {
          const [prod] = await db.execute(
            "SELECT nombre, stock, stock_minimo FROM productos WHERE id = ?",
            [item.producto_id],
          );
          if (
            prod.length > 0 &&
            parseFloat(prod[0].stock) <= parseFloat(prod[0].stock_minimo)
          ) {
            const mensajeStock = `🚨 *ALERTA DE REPOSICIÓN* 🚨\n\nProducto: *${prod[0].nombre}*\nStock actual: ${prod[0].stock}\n\n_Caja: ${req.user.caja_id}_`;
            sendWS(telefonoEmpresa, mensajeStock).catch((e) =>
              console.error("Error WS Stock:", e),
            );
          }
        }
      }
    }

    // 7. REGISTRO DE LOG
    await registrarLog(
      req,
      "CREAR",
      "VENTAS",
      `Venta registrada. Ticket: ${venta_id}. Tiempo: ${duracionSegundos}s`,
    );

    // 8. EMISIÓN PARA MODO WALL STREET
    if (io) {
      io.emit("wall-street-new-sale", {
        monto: precio_total,
        cliente: nombreClienteParaWS,
        hora: new Date().toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        esVentaOro: parseFloat(precio_total) > 20000,
      });
    }

    res.json({ success: true, venta_id });
  } catch (error) {
    console.error("[VENTAS ERROR] Fallo:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const generarReporte = async (req, res) => {
  try {
    const empresa_id = req.user?.empresa_id || 1;

    const [empresaRows] = await db.execute(
      "SELECT * FROM empresas WHERE id = ?",
      [empresa_id],
    );
    const empresa = empresaRows[0];

    if (!empresa)
      return res.status(404).send("Configuración de empresa no encontrada");

    const ventas = await Venta.getAll(empresa_id);

    const [devoluciones] = await db.execute(
      `SELECT d.*, cl.nombre_cliente 
       FROM devoluciones d 
       LEFT JOIN clientes cl ON d.cliente_id = cl.id 
       WHERE d.empresa_id = ?`,
      [empresa_id],
    );

    let logoBase64 = "";
    try {
      const logoPath = path.join(__dirname, "../src/assets/img", empresa.logo);
      if (fs.existsSync(logoPath)) {
        const bitmap = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${bitmap.toString("base64")}`;
      }
    } catch (e) {
      console.error("Error logo:", e);
    }

    let tablaVentas = "";
    let totalVentas = 0;
    ventas.forEach((v, index) => {
      totalVentas += parseFloat(v.precio_total);
      tablaVentas += `
        <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td style="text-align: center;">${new Date(
              v.fecha,
            ).toLocaleDateString("es-AR")}</td>
            <td style="text-align: center;">Venta T-${String(v.id).padStart(
              8,
              "0",
            )}</td>
            <td>${v.cliente_nombre || "Consumidor Final"}</td>
            <td style="text-align: right;">$ ${parseFloat(
              v.precio_total,
            ).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
        </tr>`;
    });

    let tablaDevoluciones = "";
    let totalDevoluciones = 0;
    devoluciones.forEach((d, index) => {
      totalDevoluciones += parseFloat(d.precio_total);
      tablaDevoluciones += `
        <tr style="color: #d33;">
            <td style="text-align: center;">${index + 1}</td>
            <td style="text-align: center;">${new Date(
              d.fecha,
            ).toLocaleDateString("es-AR")}</td>
            <td style="text-align: center;">Devol. D-${String(d.id).padStart(
              8,
              "0",
            )}</td>
            <td>${d.nombre_cliente || "Consumidor Final"}</td>
            <td style="text-align: right;">- $ ${parseFloat(
              d.precio_total,
            ).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
        </tr>`;
    });

    const totalNeto = totalVentas - totalDevoluciones;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Helvetica', sans-serif; color: #333; font-size: 11px; margin: 0; padding: 0; }
                .header { border-bottom: 2px solid #28a745; padding: 10px; margin-bottom: 20px; }
                .table { width: 100%; border-collapse: collapse; }
                .table th { background-color: #343a40; color: #fff; padding: 8px; border: 1px solid #dee2e6; }
                .table td { padding: 8px; border: 1px solid #dee2e6; }
                .summary-box { margin-top: 20px; width: 280px; margin-left: auto; border: 1px solid #ccc; padding: 10px; background-color: #f9f9f9; }
                .summary-line { display: block; width: 100%; margin-bottom: 5px; font-size: 12px; }
                .neto { border-top: 2px solid #333; padding-top: 5px; font-weight: bold; color: #007bff; font-size: 14px; margin-top: 5px; }
                
                /* PIE DE PÁGINA CORREGIDO */
                #pageFooter {
                    position: fixed;
                    bottom: -15px; /* Empujamos el pie de página bien abajo */
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: 9px;
                    color: #999;
                    border-top: 1px solid #eee;
                    padding-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <table style="width:100%">
                    <tr>
                        <td style="width:70%">
                            <h1 style="margin:0">${empresa.nombre_empresa}</h1>
                            <p style="margin:5px 0">CUIT: ${empresa.cuit} | ${
                              empresa.correo
                            }</p>
                        </td>
                        <td style="text-align:right">
                            ${
                              logoBase64
                                ? `<img src="${logoBase64}" style="width:70px">`
                                : ""
                            }
                        </td>
                    </tr>
                </table>
            </div>

            <h2 style="font-size: 14px;">Listado de Movimientos (Ventas y Devoluciones)</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Fecha</th>
                        <th>Comprobante</th>
                        <th>Cliente</th>
                        <th>Importe</th>
                    </tr>
                </thead>
                <tbody>
                    ${tablaVentas}
                    ${tablaDevoluciones}
                </tbody>
            </table>

            <div class="summary-box">
                <div class="summary-line">Total Ventas (Bruto): <span style="float:right">$ ${totalVentas.toLocaleString(
                  "es-AR",
                  { minimumFractionDigits: 2 },
                )}</span></div>
                <div style="clear:both"></div>
                <div class="summary-line" style="color:red">Total Devoluciones: <span style="float:right">- $ ${totalDevoluciones.toLocaleString(
                  "es-AR",
                  { minimumFractionDigits: 2 },
                )}</span></div>
                <div style="clear:both"></div>
                <div class="summary-line neto">TOTAL NETO: <span style="float:right">$ ${totalNeto.toLocaleString(
                  "es-AR",
                  { minimumFractionDigits: 2 },
                )}</span></div>
                <div style="clear:both"></div>
            </div>

            <div id="pageFooter">
                Reporte generado el ${new Date().toLocaleString(
                  "es-AR",
                )} - Sistema de Ventas
            </div>
        </body>
        </html>
    `;

    // CONFIGURACIÓN DE MÁRGENES CORREGIDA
    const options = {
      format: "A4",
      border: {
        top: "5mm",
        right: "10mm",
        bottom: "5mm", // Aumentamos el margen inferior del contenido para que el footer no choque
        left: "10mm",
      },
    };

    pdf.create(htmlContent, options).toBuffer((err, buffer) => {
      if (err) return res.status(500).send("Error");
      res.setHeader("Content-Type", "application/pdf");
      res.send(buffer);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error interno");
  }
};

const getInformeProductos = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.user.empresa_id;

    const query = `
      SELECT 
          DATE_FORMAT(fecha, '%d/%m/%Y') as fecha_fmt,
          ticket_id,
          codigo, nombre, 
          es_bulto, factor_utilizado, unidad_medida,
          SUM(cantidad_op) as cantidad,
          costo_base as costo,
          SUM(total_neto) / SUM(NULLIF(cantidad_op, 0)) as venta,
          SUM(total_neto - (cantidad_base * costo_base)) as ganancia,
          SUM(total_neto) as total
      FROM (
          -- 1. VENTAS
          SELECT 
              v.fecha, v.id as ticket_id,
              p.codigo, p.nombre, dv.es_bulto, dv.factor_utilizado,
              IF(dv.es_bulto = 1, u2.nombre, u1.nombre) as unidad_medida,
              dv.cantidad as cantidad_op,
              dv.cantidad_unidades_base as cantidad_base,
              dv.precio_compra as costo_base,
              (dv.cantidad_unidades_base * dv.precio_venta) * 
              IFNULL((v.precio_total / NULLIF((SELECT SUM(dv2.cantidad_unidades_base * dv2.precio_venta) FROM detalle_ventas dv2 WHERE dv2.venta_id = v.id), 0)), 1) as total_neto
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN productos p ON dv.producto_id = p.id
          LEFT JOIN unidads u1 ON p.unidad_id = u1.id
          LEFT JOIN unidads u2 ON p.unidad_compra_id = u2.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ? AND dv.producto_id IS NOT NULL

          UNION ALL

          -- 2. COMBOS (Abre el combo para auditar stock)
          SELECT 
              v.fecha, v.id as ticket_id,
              p.codigo, p.nombre, 0 as es_bulto, 1.00 as factor_utilizado,
              u1.nombre as unidad_medida,
              (dv.cantidad * cp.cantidad) as cantidad_op,
              (dv.cantidad * cp.cantidad) as cantidad_base,
              p.precio_compra as costo_base,
              ((dv.cantidad * cp.cantidad) * p.precio_venta) * 
              IFNULL((v.precio_total / NULLIF((SELECT SUM(dv3.cantidad_unidades_base * dv3.precio_venta) FROM detalle_ventas dv3 WHERE dv3.venta_id = v.id), 0)), 1) as total_neto
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN combo_producto cp ON dv.combo_id = cp.combo_id
          JOIN productos p ON cp.producto_id = p.id
          LEFT JOIN unidads u1 ON p.unidad_id = u1.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?

          UNION ALL

          -- 3. DEVOLUCIONES
          SELECT 
              dev.fecha, dev.id as ticket_id,
              p.codigo, p.nombre, dd.es_bulto, dd.factor_utilizado,
              IF(dd.es_bulto = 1, u2.nombre, u1.nombre) as unidad_medida,
              (dd.cantidad * -1) as cantidad_op,
              (dd.cantidad_unidades_base * -1) as cantidad_base,
              p.precio_compra as costo_base,
              (dd.cantidad_unidades_base * p.precio_venta) * -1 as total_neto
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id
          JOIN productos p ON dd.producto_id = p.id
          LEFT JOIN unidads u1 ON p.unidad_id = u1.id
          LEFT JOIN unidads u2 ON p.unidad_compra_id = u2.id
          WHERE dev.empresa_id = ? AND dev.fecha BETWEEN ? AND ?
      ) as t
      GROUP BY fecha, ticket_id, codigo, nombre, es_bulto, factor_utilizado, unidad_medida
      ORDER BY fecha DESC, ticket_id DESC
    `;

    const [rows] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
      empresa_id,
      fecha_inicio,
      fecha_fin,
      empresa_id,
      fecha_inicio,
      fecha_fin,
    ]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generarInformeProductosPDF = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.user?.empresa_id || req.query.empresa_id || 1;
    const fInicio = fecha_inicio.split("-").reverse().join("/");
    const fFin = fecha_fin.split("-").reverse().join("/");

    // Query optimizada (mantener la misma que ya funciona)
    const query = `
      SELECT 
          DATE_FORMAT(fecha, '%d/%m/%Y') as fecha_fmt,
          ticket_id,
          codigo, nombre, 
          es_bulto, factor_utilizado, unidad_medida,
          SUM(cantidad_op) as cantidad,
          costo_base as costo,
          SUM(total_neto) / SUM(NULLIF(cantidad_op, 0)) as venta,
          SUM(total_neto - (cantidad_base * costo_base)) as ganancia,
          SUM(total_neto) as total
      FROM (
          -- 1. VENTAS
          SELECT 
              v.fecha, v.id as ticket_id,
              p.codigo, p.nombre, dv.es_bulto, dv.factor_utilizado,
              IF(dv.es_bulto = 1, u2.nombre, u1.nombre) as unidad_medida,
              dv.cantidad as cantidad_op,
              dv.cantidad_unidades_base as cantidad_base,
              dv.precio_compra as costo_base,
              (dv.cantidad_unidades_base * dv.precio_venta) * 
              IFNULL((v.precio_total / NULLIF((SELECT SUM(dv2.cantidad_unidades_base * dv2.precio_venta) FROM detalle_ventas dv2 WHERE dv2.venta_id = v.id), 0)), 1) as total_neto
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN productos p ON dv.producto_id = p.id
          LEFT JOIN unidads u1 ON p.unidad_id = u1.id
          LEFT JOIN unidads u2 ON p.unidad_compra_id = u2.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ? AND dv.producto_id IS NOT NULL

          UNION ALL

          -- 2. COMBOS
          SELECT 
              v.fecha, v.id as ticket_id,
              p.codigo, p.nombre, 0 as es_bulto, 1.00 as factor_utilizado,
              u1.nombre as unidad_medida,
              (dv.cantidad * cp.cantidad) as cantidad_op,
              (dv.cantidad * cp.cantidad) as cantidad_base,
              p.precio_compra as costo_base,
              ((dv.cantidad * cp.cantidad) * p.precio_venta) * 
              IFNULL((v.precio_total / NULLIF((SELECT SUM(dv3.cantidad_unidades_base * dv3.precio_venta) FROM detalle_ventas dv3 WHERE dv3.venta_id = v.id), 0)), 1) as total_neto
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN combo_producto cp ON dv.combo_id = cp.combo_id
          JOIN productos p ON cp.producto_id = p.id
          LEFT JOIN unidads u1 ON p.unidad_id = u1.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?

          UNION ALL

          -- 3. DEVOLUCIONES
          SELECT 
              dev.fecha, dev.id as ticket_id,
              p.codigo, p.nombre, dd.es_bulto, dd.factor_utilizado,
              IF(dd.es_bulto = 1, u2.nombre, u1.nombre) as unidad_medida,
              (dd.cantidad * -1) as cantidad_op,
              (dd.cantidad_unidades_base * -1) as cantidad_base,
              p.precio_compra as costo_base,
              (dd.cantidad_unidades_base * p.precio_venta) * -1 as total_neto
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id
          JOIN productos p ON dd.producto_id = p.id
          LEFT JOIN unidads u1 ON p.unidad_id = u1.id
          LEFT JOIN unidads u2 ON p.unidad_compra_id = u2.id
          WHERE dev.empresa_id = ? AND dev.fecha BETWEEN ? AND ?
      ) as t
      GROUP BY fecha, ticket_id, codigo, nombre, es_bulto, factor_utilizado, unidad_medida
      ORDER BY fecha DESC, ticket_id DESC`;

    const [rows] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
      empresa_id,
      fecha_inicio,
      fecha_fin,
      empresa_id,
      fecha_inicio,
      fecha_fin,
    ]);

    // Funciones de formato
    const fmt = (val) =>
      parseFloat(val || 0).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const fmtNumero = (val) =>
      parseFloat(val || 0).toLocaleString("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

    // Calcular totales
    let totalGanancia = 0;
    let totalFacturacion = 0;
    let totalProductos = 0;

    rows.forEach((item) => {
      totalGanancia += parseFloat(item.ganancia) || 0;
      totalFacturacion += parseFloat(item.total) || 0;
      totalProductos++;
    });

    // Margen promedio
    const margenPromedio =
      totalFacturacion > 0
        ? ((totalGanancia / totalFacturacion) * 100).toFixed(1)
        : "0.0";

    // Dividir en páginas - 15 filas por página como sugieres
    const filasPorPagina = 14;
    const totalPaginas = Math.ceil(rows.length / filasPorPagina);
    const paginas = [];

    for (let i = 0; i < rows.length; i += filasPorPagina) {
      paginas.push(rows.slice(i, i + filasPorPagina));
    }

    // FUNCIÓN para generar filas con altura fija
    const generarFila = (item, esPar) => {
      const ganancia = parseFloat(item.ganancia) || 0;
      const total = parseFloat(item.total) || 0;
      const esBulto = item.es_bulto === 1;
      const alturaFila = "24px"; // Altura fija para todas las filas

      return `
        <tr style="height: ${alturaFila}; ${esPar ? "background-color: #f8f9fa;" : "background-color: white;"} border-bottom: 1px solid #e0e0e0;">
          <!-- FECHA -->
          <td style="padding: 2px 3px; font-size: 8px; text-align: center; font-weight: 600; color: #333; vertical-align: middle; width: 7%;">
            ${item.fecha_fmt}
          </td>
          
          <!-- TICKET -->
          <td style="padding: 2px 3px; font-size: 8px; text-align: center; vertical-align: middle; width: 9%;">
            <div style="background: #2c3e50; color: white; padding: 1px 3px; border-radius: 2px; font-weight: 600; font-size: 7px; white-space: nowrap; display: inline-block; min-width: 60px;">
              T-${String(item.ticket_id).padStart(6, "0")}
            </div>
          </td>
          
          <!-- PRODUCTO -->
          <td style="padding: 2px 4px; font-size: 8px; vertical-align: middle; width: 35%;">
            <div style="font-weight: 600; color: #333; line-height: 1.1; overflow: hidden; height: 16px;">
              ${item.nombre}
            </div>
            <div style="font-size: 7px; color: #666; line-height: 1; margin-top: 1px;">
              <span style="background: #f5f5f5; padding: 1px 3px; border-radius: 1px; margin-right: 3px; font-family: 'Courier New', monospace; border: 1px solid #ddd; font-size: 6.5px; display: inline-block;">
                ${item.codigo}
              </span>
              ${esBulto ? `<span style="color: #0d6efd; font-weight: 600; background: #e7f1ff; padding: 1px 3px; border-radius: 1px; border: 1px solid #b6d4fe; font-size: 6.5px; display: inline-block;">Bulto x${item.factor_utilizado}</span>` : ""}
            </div>
          </td>
          
          <!-- CANTIDAD -->
          <td style="padding: 2px 3px; font-size: 9px; text-align: center; font-weight: 700; font-family: 'Courier New', monospace; vertical-align: middle; width: 5%;">
            ${fmtNumero(Math.abs(item.cantidad))}
          </td>
          
          <!-- ESCALA -->
          <td style="padding: 2px 3px; text-align: center; vertical-align: middle; width: 7%;">
            <span style="background: ${esBulto ? "#e7f1ff" : "#f8f9fa"}; 
                    color: ${esBulto ? "#0d6efd" : "#6c757d"}; 
                    padding: 1px 4px; border-radius: 6px; 
                    font-size: 7px; font-weight: 700; 
                    border: 1px solid ${esBulto ? "#b6d4fe" : "#dee2e6"};
                    display: inline-block;
                    white-space: nowrap;">
              ${(item.unidad_medida || "Unid").toUpperCase()}
            </span>
          </td>
          
          <!-- COSTO -->
          <td style="padding: 2px 3px; font-size: 8px; text-align: right; color: #6c757d; font-family: 'Courier New', monospace; font-weight: 600; vertical-align: middle; width: 8%;">
            $ ${fmt(item.costo)}
          </td>
          
          <!-- VENTA -->
          <td style="padding: 2px 3px; font-size: 8px; text-align: right; font-weight: 700; font-family: 'Courier New', monospace; color: #2c3e50; vertical-align: middle; width: 9%;">
            $ ${fmt(item.venta)}
          </td>
          
          <!-- GANANCIA -->
          <td style="padding: 2px 3px; font-size: 8px; text-align: right; font-weight: 700; color: ${ganancia >= 0 ? "#28a745" : "#dc3545"}; font-family: 'Courier New', monospace; vertical-align: middle; width: 10%;">
            $ ${fmt(ganancia)}
          </td>
          
          <!-- TOTAL -->
          <td style="padding: 2px 3px; font-size: 8px; text-align: right; font-weight: 800; color: #333; background: #f8f9fa; font-family: 'Courier New', monospace; vertical-align: middle; width: 10%;">
            $ ${fmt(total)}
          </td>
        </tr>
      `;
    };

    // Generar cada página
    const paginasHTML = paginas.map((pagina, paginaIndex) => {
      // Calcular subtotales de la página
      let subtotalGanancia = 0;
      let subtotalFacturacion = 0;

      pagina.forEach((item) => {
        subtotalGanancia += parseFloat(item.ganancia) || 0;
        subtotalFacturacion += parseFloat(item.total) || 0;
      });

      // Generar filas de la tabla
      let filasHTML = "";
      pagina.forEach((item, index) => {
        filasHTML += generarFila(item, index % 2 === 0);
      });

      return `
        <div style="page-break-after: ${paginaIndex < paginas.length - 1 ? "always" : "avoid"};">
          <!-- Header IDENTICO en cada página -->
          <div style="border-bottom: 2px solid #28a745; padding-bottom: 5px; margin-bottom: 5px;">
            <div style="text-align: center;">
              <h1 style="color: #2c3e50; font-size: 14px; font-weight: 800; margin: 0 0 2px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                📊 AUDITORÍA DETALLADA DE VENTAS
              </h1>
              <div style="font-size: 8px; color: #666; margin-bottom: 2px;">
                <strong>Período:</strong> ${fInicio} al ${fFin} | 
                <strong>Página:</strong> ${paginaIndex + 1} de ${paginas.length} | 
                <strong>Registros:</strong> ${pagina.length}
              </div>
            </div>
          </div>

          <!-- Resumen ejecutivo solo en primera página -->
          ${
            paginaIndex === 0
              ? `
            <div style="background: #f8f9fa; border-radius: 4px; border: 1px solid #dee2e6; padding: 8px; margin-bottom: 8px;">
              <div style="font-size: 9px; font-weight: 800; color: #28a745; text-transform: uppercase; margin-bottom: 6px; text-align: center;">
                RESUMEN EJECUTIVO
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 8px;">
                <tr>
                  <td style="width: 25%; text-align: center; padding: 6px; background: white; border: 1px solid #dee2e6; border-radius: 3px;">
                    <div style="color: #6c757d; text-transform: uppercase; margin-bottom: 2px; font-weight: 600;">
                      TRANSACCIONES
                    </div>
                    <div style="font-size: 14px; font-weight: 800; color: #0d6efd;">
                      ${totalProductos}
                    </div>
                  </td>
                  <td style="width: 25%; text-align: center; padding: 6px; background: white; border: 1px solid #dee2e6; border-radius: 3px;">
                    <div style="color: #6c757d; text-transform: uppercase; margin-bottom: 2px; font-weight: 600;">
                      FACTURACIÓN
                    </div>
                    <div style="font-size: 14px; font-weight: 800; color: #333;">
                      $ ${fmt(totalFacturacion)}
                    </div>
                  </td>
                  <td style="width: 25%; text-align: center; padding: 6px; background: white; border: 1px solid #dee2e6; border-radius: 3px;">
                    <div style="color: #6c757d; text-transform: uppercase; margin-bottom: 2px; font-weight: 600;">
                      GANANCIA
                    </div>
                    <div style="font-size: 14px; font-weight: 800; color: #28a745;">
                      $ ${fmt(totalGanancia)}
                    </div>
                  </td>
                  <td style="width: 25%; text-align: center; padding: 6px; background: white; border: 1px solid #dee2e6; border-radius: 3px;">
                    <div style="color: #6c757d; text-transform: uppercase; margin-bottom: 2px; font-weight: 600;">
                      MARGEN
                    </div>
                    <div style="font-size: 14px; font-weight: 800; color: ${margenPromedio > 30 ? "#28a745" : margenPromedio > 15 ? "#ffc107" : "#dc3545"};">
                      ${margenPromedio}%
                    </div>
                  </td>
                </tr>
              </table>
            </div>
          `
              : ""
          }

          <!-- Encabezado de tabla IDENTICO en cada página -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 2px; background: #2c3e50; table-layout: fixed; font-size: 8px;">
            <thead>
              <tr>
                <th style="padding: 5px 3px; text-align: center; font-weight: 700; color: white; text-transform: uppercase; border: 1px solid #1a252f; width: 7%;">
                  FECHA
                </th>
                <th style="padding: 5px 3px; text-align: center; font-weight: 700; color: white; text-transform: uppercase; border: 1px solid #1a252f; width: 9%;">
                  TICKET
                </th>
                <th style="padding: 5px 3px; text-align: center; font-weight: 700; color: white; text-transform: uppercase; border: 1px solid #1a252f; width: 35%;">
                  PRODUCTO
                </th>
                <th style="padding: 5px 3px; text-align: center; font-weight: 700; color: white; text-transform: uppercase; border: 1px solid #1a252f; width: 5%;">
                  CANT.
                </th>
                <th style="padding: 5px 3px; text-align: center; font-weight: 700; color: white; text-transform: uppercase; border: 1px solid #1a252f; width: 7%;">
                  ESCALA
                </th>
                <th style="padding: 5px 3px; text-align: center; font-weight: 700; color: white; text-transform: uppercase; border: 1px solid #1a252f; width: 8%;">
                  COSTO
                </th>
                <th style="padding: 5px 3px; text-align: center; font-weight: 700; color: white; text-transform: uppercase; border: 1px solid #1a252f; width: 9%;">
                  VENTA
                </th>
                <th style="padding: 5px 3px; text-align: center; font-weight: 700; color: white; text-transform: uppercase; border: 1px solid #1a252f; width: 10%;">
                  GANANCIA
                </th>
                <th style="padding: 5px 3px; text-align: center; font-weight: 700; color: white; text-transform: uppercase; border: 1px solid #1a252f; width: 10%;">
                  TOTAL
                </th>
              </tr>
            </thead>
          </table>

          <!-- Tabla de datos -->
          <table style="width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 8px;">
            <tbody>
              ${filasHTML}
            </tbody>
          </table>

          <!-- Subtotales de página -->
          <div style="margin-top: 6px; padding: 5px; background: #f8f9fa; border-radius: 3px; border: 1px solid #dee2e6;">
            <table style="width: 100%;">
              <tr>
                <td style="width: 67%; text-align: right; padding: 3px 6px; font-size: 8px; font-weight: 700; color: #6c757d; text-transform: uppercase;">
                  SUBTOTAL PÁGINA ${paginaIndex + 1}
                </td>
                <td style="width: 16.5%; text-align: right; padding: 3px 6px; font-size: 9px; font-weight: 800; color: ${subtotalGanancia >= 0 ? "#28a745" : "#dc3545"}; font-family: 'Courier New', monospace;">
                  $ ${fmt(subtotalGanancia)}
                </td>
                <td style="width: 16.5%; text-align: right; padding: 3px 6px; font-size: 9px; font-weight: 800; color: #333; font-family: 'Courier New', monospace;">
                  $ ${fmt(subtotalFacturacion)}
                </td>
              </tr>
            </table>
          </div>

          <!-- Totales finales solo en última página -->
          ${
            paginaIndex === paginas.length - 1
              ? `
            <div style="margin-top: 8px; padding: 7px; background: #2c3e50; border-radius: 4px;">
              <table style="width: 100%;">
                <tr>
                  <td style="width: 67%; text-align: right; padding: 6px 10px; font-size: 9px; font-weight: 800; color: white; text-transform: uppercase;">
                    TOTALES FINALES DEL PERÍODO
                  </td>
                  <td style="width: 16.5%; text-align: right; padding: 6px 10px; font-size: 10px; font-weight: 800; color: #28a745; font-family: 'Courier New', monospace; background: rgba(255,255,255,0.1); border-radius: 2px;">
                    $ ${fmt(totalGanancia)}
                  </td>
                  <td style="width: 16.5%; text-align: right; padding: 6px 10px; font-size: 10px; font-weight: 800; color: white; font-family: 'Courier New', monospace; background: rgba(255,255,255,0.1); border-radius: 2px;">
                    $ ${fmt(totalFacturacion)}
                  </td>
                </tr>
              </table>
            </div>
          `
              : ""
          }

          <!-- Footer con información de generación -->
          <div style="margin-top: 10px; padding-top: 5px; border-top: 1px solid #eee; font-size: 7px; color: #888; text-align: center;">
            Generado: ${new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })} ${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} | Sistema de Ventas © ${new Date().getFullYear()}
          </div>
        </div>
      `;
    });

    // HTML completo
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Auditoría de Ventas - ${fInicio} al ${fFin}</title>
        <style>
          @page {
            margin: 12mm 8mm 15mm 8mm;
            size: A4 landscape;
          }
          
          body {
            font-family: 'Segoe UI', 'Roboto', sans-serif;
            color: #333;
            margin: 0;
            padding: 0;
            font-size: 8px;
            line-height: 1;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          table {
            border-collapse: collapse;
          }
          
          th, td {
            vertical-align: middle;
            overflow: hidden;
          }
          
          /* Forzar alturas consistentes */
          tr {
            height: 24px !important;
            min-height: 24px !important;
            max-height: 24px !important;
          }
        </style>
      </head>
      <body>
        ${paginasHTML.join("")}
      </body>
      </html>
    `;

    // Configuración del PDF
    const options = {
      format: "A4",
      orientation: "landscape",
      border: {
        top: "12mm",
        bottom: "15mm",
        left: "8mm",
        right: "8mm",
      },
      displayHeaderFooter: false,
    };

    // Generar PDF
    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        console.error("Error generando PDF:", err);
        return res.status(500).json({
          success: false,
          message: "Error al generar el documento PDF",
        });
      }

      const fecha = new Date().toISOString().split("T")[0];
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="auditoria_ventas_${fInicio}_al_${fFin}.pdf"`,
      );
      res.send(buffer);
    });
  } catch (error) {
    console.error("ERROR en generarInformeProductosPDF:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al generar el informe",
      error: error.message,
    });
  }
};

const getInformeClientes = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.user ? req.user.empresa_id : 1;

    const query = `
      SELECT 
          nombre,
          SUM(costo_total) as costo,
          SUM(total_neto) as total,
          (SUM(total_neto) - SUM(costo_total)) as ganancia
      FROM (
          -- A. VENTAS REALES (Toda la Empresa)
          SELECT 
              IFNULL(cl.nombre_cliente, 'Consumidor Final') as nombre,
              v.precio_total as total_neto,
              (SELECT IFNULL(SUM(dv.cantidad * dv.precio_compra), 0) FROM detalle_ventas dv WHERE dv.venta_id = v.id) as costo_total
          FROM ventas v
          LEFT JOIN clientes cl ON v.cliente_id = cl.id
          WHERE v.empresa_id = ? AND DATE(v.fecha) BETWEEN ? AND ?

          UNION ALL

          -- B. DEVOLUCIONES (Toda la Empresa - Restan al total)
          SELECT 
              IFNULL(cl.nombre_cliente, 'Consumidor Final') as nombre,
              dev.precio_total * -1 as total_neto,
              (SELECT IFNULL(SUM(dd.cantidad * p.precio_compra), 0) 
               FROM detalle_devoluciones dd 
               JOIN productos p ON dd.producto_id = p.id 
               WHERE dd.devolucion_id = dev.id) * -1 as costo_total
          FROM devoluciones dev
          LEFT JOIN clientes cl ON dev.cliente_id = cl.id
          WHERE dev.empresa_id = ? AND DATE(dev.fecha) BETWEEN ? AND ?
      ) as t
      GROUP BY nombre
      ORDER BY total DESC
    `;

    const [rows] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin, // Parámetros Ventas
      empresa_id,
      fecha_inicio,
      fecha_fin, // Parámetros Devoluciones
    ]);

    res.json(rows);
  } catch (error) {
    console.error("ERROR INFORME CLIENTES:", error);
    res.status(500).json({ message: "Error al procesar el informe" });
  }
};

const generarInformeClientesPDF = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.query.empresa_id || 1;
    const fInicio = fecha_inicio.split("-").reverse().join("/");
    const fFin = fecha_fin.split("-").reverse().join("/");

    const query = `
      SELECT nombre, SUM(costo_total) as costo, SUM(total_neto) as total, (SUM(total_neto) - SUM(costo_total)) as ganancia
      FROM (
          SELECT IFNULL(cl.nombre_cliente, 'Consumidor Final') as nombre, v.precio_total as total_neto, (SELECT IFNULL(SUM(dv.cantidad * dv.precio_compra), 0) FROM detalle_ventas dv WHERE dv.venta_id = v.id) as costo_total
          FROM ventas v LEFT JOIN clientes cl ON v.cliente_id = cl.id WHERE v.empresa_id = ? AND DATE(v.fecha) BETWEEN ? AND ?
          UNION ALL
          SELECT IFNULL(cl.nombre_cliente, 'Consumidor Final') as nombre, dev.precio_total * -1 as total_neto, (SELECT IFNULL(SUM(dd.cantidad * p.precio_compra), 0) FROM detalle_devoluciones dd JOIN productos p ON dd.producto_id = p.id WHERE dd.devolucion_id = dev.id) * -1 as costo_total
          FROM devoluciones dev LEFT JOIN clientes cl ON dev.cliente_id = cl.id WHERE dev.empresa_id = ? AND DATE(dev.fecha) BETWEEN ? AND ?
      ) as t GROUP BY nombre ORDER BY total DESC`;

    const [clientes] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
      empresa_id,
      fecha_inicio,
      fecha_fin,
    ]);

    const fmt = (val) =>
      parseFloat(val).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    let filas = "";
    let totalCosto = 0;
    let totalGanancia = 0;
    let totalGral = 0;

    clientes.forEach((c) => {
      const costo = parseFloat(c.costo);
      const ganancia = parseFloat(c.ganancia);
      const total = parseFloat(c.total);
      totalCosto += costo;
      totalGanancia += ganancia;
      totalGral += total;

      filas += `
        <tr>
            <td style="text-align: left;">${c.nombre}</td>
            <td style="text-align: right;">$ ${fmt(costo)}</td>
            <td style="text-align: right;">$ ${fmt(ganancia)}</td>
            <td style="text-align: right;">$ ${fmt(total)}</td>
        </tr>`;
    });

    const html = `
      <html>
      <head>
          <meta charset="UTF-8">
          <style>
              body { font-family: sans-serif; font-size: 12px; padding: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; }
              .header h1 { color: #1a73e8; margin-bottom: 5px; }
              .table { width: 100%; border-collapse: collapse; }
              .table th { background-color: #1a73e8; color: white; padding: 10px; text-align: center; }
              .table td { padding: 10px; border-bottom: 1px solid #ddd; }
              .total-row { font-weight: bold; background-color: #e8f0fe; color: #1a73e8; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Informe General de Ventas por Cliente</h1>
              <p>Período: ${fInicio} - ${fFin}</p>
          </div>
          <table class="table">
              <thead>
                  <tr>
                      <th style="text-align: left;">CLIENTE</th>
                      <th style="text-align: right;">COSTO</th>
                      <th style="text-align: right;">GANANCIA</th>
                      <th style="text-align: right;">TOTAL</th>
                  </tr>
              </thead>
              <tbody>
                  ${filas}
                  <tr class="total-row">
                      <td>TOTAL GENERAL</td>
                      <td style="text-align: right;">$ ${fmt(totalCosto)}</td>
                      <td style="text-align: right;">$ ${fmt(
                        totalGanancia,
                      )}</td>
                      <td style="text-align: right;">$ ${fmt(totalGral)}</td>
                  </tr>
              </tbody>
          </table>
      </body>
      </html>`;

    pdf
      .create(html, { format: "A4", orientation: "portrait", border: "10mm" })
      .toBuffer((err, buffer) => {
        if (err) return res.status(500).send("Error");
        res.setHeader("Content-Type", "application/pdf");
        res.send(buffer);
      });
  } catch (error) {
    res.status(500).send("Error interno");
  }
};

const getInformeMetodosPago = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.user ? req.user.empresa_id : 1;

    const query = `
            SELECT 
                fecha,
                SUM(efectivo) as efectivo,
                SUM(tarjeta) as tarjeta,
                SUM(mercadopago) as mercadopago,
                SUM(transferencia) as transferencia,
                SUM(total) as total
            FROM (
                -- 1. VENTAS POR DÍA (Toda la Empresa)
                SELECT 
                    DATE(fecha) as fecha,
                    IFNULL(efectivo, 0) as efectivo,
                    IFNULL(tarjeta, 0) as tarjeta,
                    IFNULL(mercadopago, 0) as mercadopago,
                    IFNULL(transferencia, 0) as transferencia,
                    IFNULL(precio_total, 0) as total
                FROM ventas
                WHERE empresa_id = ? AND DATE(fecha) BETWEEN ? AND ?

                UNION ALL

                -- 2. DEVOLUCIONES (Toda la Empresa - Restan del efectivo por defecto)
                SELECT 
                    DATE(fecha) as fecha,
                    (IFNULL(precio_total, 0) * -1) as efectivo,
                    0 as tarjeta,
                    0 as mercadopago,
                    0 as transferencia,
                    (IFNULL(precio_total, 0) * -1) as total
                FROM devoluciones
                WHERE empresa_id = ? AND DATE(fecha) BETWEEN ? AND ?
            ) as consolidado
            GROUP BY fecha
            ORDER BY fecha ASC
        `;

    const [rows] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin, // Parámetros para Ventas
      empresa_id,
      fecha_inicio,
      fecha_fin, // Parámetros para Devoluciones
    ]);

    res.json(rows);
  } catch (error) {
    console.error("ERROR EN getInformeMetodosPago:", error);
    res.status(500).json({ message: "Error al procesar el informe" });
  }
};

const generarInformeMetodosPagoPDF = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.query.empresa_id || 1;
    const fInicio = fecha_inicio.split("-").reverse().join("/");
    const fFin = fecha_fin.split("-").reverse().join("/");

    const query = `
      SELECT 
          DATE_FORMAT(fecha, '%d/%m/%Y') as fecha_formateada,
          SUM(efectivo) as efectivo,
          SUM(tarjeta) as tarjeta,
          SUM(mercadopago) as mercadopago,
          SUM(transferencia) as transferencia,
          SUM(total) as total
      FROM (
          SELECT DATE(fecha) as fecha, IFNULL(efectivo, 0) as efectivo, IFNULL(tarjeta, 0) as tarjeta, IFNULL(mercadopago, 0) as mercadopago, IFNULL(transferencia, 0) as transferencia, IFNULL(precio_total, 0) as total
          FROM ventas 
          WHERE empresa_id = ? AND DATE(fecha) BETWEEN ? AND ?
          UNION ALL
          SELECT DATE(fecha) as fecha, (IFNULL(precio_total, 0) * -1) as efectivo, 0 as tarjeta, 0 as mercadopago, 0 as transferencia, (IFNULL(precio_total, 0) * -1) as total
          FROM devoluciones 
          WHERE empresa_id = ? AND DATE(fecha) BETWEEN ? AND ?
      ) as consolidado
      GROUP BY fecha
      ORDER BY fecha ASC`;

    const [datos] = await db.execute(query, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
      empresa_id,
      fecha_inicio,
      fecha_fin,
    ]);

    const fmt = (val) =>
      parseFloat(val).toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    let filas = "";
    let tEfe = 0,
      tTar = 0,
      tMP = 0,
      tTra = 0,
      tGral = 0;

    datos.forEach((d) => {
      const efe = parseFloat(d.efectivo);
      const tar = parseFloat(d.tarjeta);
      const mp = parseFloat(d.mercadopago);
      const tra = parseFloat(d.transferencia);
      const tot = parseFloat(d.total);
      tEfe += efe;
      tTar += tar;
      tMP += mp;
      tTra += tra;
      tGral += tot;

      filas += `
        <tr>
            <td style="text-align: left;">${d.fecha_formateada}</td>
            <td style="text-align: right;">$ ${fmt(efe)}</td>
            <td style="text-align: right;">$ ${fmt(tar)}</td>
            <td style="text-align: right;">$ ${fmt(mp)}</td>
            <td style="text-align: right;">$ ${fmt(tra)}</td>
            <td style="text-align: right; font-weight: bold;">$ ${fmt(tot)}</td>
        </tr>`;
    });

    const html = `
      <html>
      <head>
          <meta charset="UTF-8">
          <style>
              body { font-family: sans-serif; font-size: 11px; color: #333; }
              .header { text-align: center; margin-bottom: 20px; }
              .header h1 { color: #1a73e8; margin-bottom: 5px; }
              .table { width: 100%; border-collapse: collapse; }
              .table th { background-color: #1a73e8; color: white; padding: 8px; font-size: 10px; }
              .table td { padding: 8px; border-bottom: 1px solid #eee; }
              .total-row { font-weight: bold; background-color: #f1f1f1; border-top: 2px solid #1a73e8; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Informe General de Ventas por Forma de Pago</h1>
              <p>Período: ${fInicio} - ${fFin}</p>
          </div>
          <table class="table">
              <thead>
                  <tr>
                      <th style="text-align: left;">FECHA</th>
                      <th style="text-align: right;">EFECTIVO</th>
                      <th style="text-align: right;">TARJETA</th>
                      <th style="text-align: right;">M. PAGO</th>
                      <th style="text-align: right;">TRANSF.</th>
                      <th style="text-align: right;">TOTAL NETO</th>
                  </tr>
              </thead>
              <tbody>
                  ${
                    filas ||
                    '<tr><td colspan="6" style="text-align:center;">Sin movimientos</td></tr>'
                  }
                  <tr class="total-row">
                      <td style="text-align: left;">TOTALES</td>
                      <td style="text-align: right;">$ ${fmt(tEfe)}</td>
                      <td style="text-align: right;">$ ${fmt(tTar)}</td>
                      <td style="text-align: right;">$ ${fmt(tMP)}</td>
                      <td style="text-align: right;">$ ${fmt(tTra)}</td>
                      <td style="text-align: right; color: #1a73e8;">$ ${fmt(
                        tGral,
                      )}</td>
                  </tr>
              </tbody>
          </table>
      </body>
      </html>`;

    pdf
      .create(html, { format: "A4", orientation: "landscape", border: "10mm" })
      .toBuffer((err, buffer) => {
        if (err) return res.status(500).send("Error");
        res.setHeader("Content-Type", "application/pdf");
        res.send(buffer);
      });
  } catch (error) {
    res.status(500).send("Error interno");
  }
};

const getInformeMovimientoStock = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.user ? req.user.empresa_id : 1;

    // 1. OBTENER PRODUCTOS CON MOVIMIENTO (Ventas - Devoluciones, incluyendo combos)
    const queryCon = `
      SELECT 
          nombre, 
          unidad, 
          SUM(cantidad_neta) as cantidad_vendida, 
          SUM(num_ventas_netas) as num_ventas
      FROM (
          -- PRODUCTOS VENDIDOS DIRECTAMENTE
          SELECT p.id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad, 
                 SUM(dv.cantidad) as cantidad_neta, 
                 COUNT(DISTINCT v.id) as num_ventas_netas
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN productos p ON dv.producto_id = p.id
          LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?
          GROUP BY p.id

          UNION ALL

          -- PRODUCTOS VENDIDOS DENTRO DE COMBOS
          SELECT p.id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad, 
                 SUM(dv.cantidad * cp.cantidad) as cantidad_neta, 
                 COUNT(DISTINCT v.id) as num_ventas_netas
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN combo_producto cp ON dv.combo_id = cp.combo_id
          JOIN productos p ON cp.producto_id = p.id
          LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ?
          GROUP BY p.id

          UNION ALL

          -- PRODUCTOS DEVUELTOS DIRECTAMENTE (RESTAN)
          SELECT p.id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad, 
                 SUM(dd.cantidad * -1) as cantidad_neta, 
                 SUM(0) as num_ventas_netas
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id
          JOIN productos p ON dd.producto_id = p.id
          LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE dev.empresa_id = ? AND dev.fecha BETWEEN ? AND ?
          GROUP BY p.id

          UNION ALL

          -- PRODUCTOS DEVUELTOS DENTRO DE COMBOS (RESTAN)
          SELECT p.id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad, 
                 SUM(dd.cantidad * cp.cantidad * -1) as cantidad_neta, 
                 SUM(0) as num_ventas_netas
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id
          JOIN combo_producto cp ON dd.combo_id = cp.combo_id
          JOIN productos p ON cp.producto_id = p.id
          LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE dev.empresa_id = ? AND dev.fecha BETWEEN ? AND ?
          GROUP BY p.id
      ) as consolidado
      GROUP BY id, nombre, unidad
      HAVING cantidad_vendida > 0
      ORDER BY cantidad_vendida DESC
    `;

    // 2. PRODUCTOS SIN MOVIMIENTO
    const querySin = `
      SELECT p.nombre
      FROM productos p
      WHERE p.empresa_id = ? 
      AND p.id NOT IN (
          SELECT DISTINCT dv.producto_id FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id WHERE v.fecha BETWEEN ? AND ? AND dv.producto_id IS NOT NULL
          UNION
          SELECT DISTINCT cp.producto_id FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id JOIN combo_producto cp ON dv.combo_id = cp.combo_id WHERE v.fecha BETWEEN ? AND ?
      )
      ORDER BY p.nombre ASC
    `;

    const [conMovimiento] = await db.execute(queryCon, [
      empresa_id,
      fecha_inicio,
      fecha_fin, // Bloque 1
      empresa_id,
      fecha_inicio,
      fecha_fin, // Bloque 2
      empresa_id,
      fecha_inicio,
      fecha_fin, // Bloque 3
      empresa_id,
      fecha_inicio,
      fecha_fin, // Bloque 4
    ]);

    const [sinMovimiento] = await db.execute(querySin, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
      fecha_inicio,
      fecha_fin,
    ]);

    res.json({ conMovimiento, sinMovimiento });
  } catch (error) {
    console.error("ERROR MOV STOCK:", error);
    res.status(500).json({ message: "Error al procesar el informe" });
  }
};

const generarInformeMovimientoStockPDF = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const empresa_id = req.query.empresa_id || 1;

    const fInicio = fecha_inicio.split("-").reverse().join("/");
    const fFin = fecha_fin.split("-").reverse().join("/");

    // 1. QUERY PRODUCTOS CON MOVIMIENTO (Suma ventas y combos, resta devoluciones)
    const queryCon = `
      SELECT 
          nombre, unidad, 
          SUM(cantidad_neta) as cantidad_vendida, 
          SUM(num_ventas_netas) as num_ventas
      FROM (
          SELECT p.id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad, SUM(dv.cantidad) as cantidad_neta, COUNT(DISTINCT v.id) as num_ventas_netas
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id JOIN productos p ON dv.producto_id = p.id LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ? GROUP BY p.id
          UNION ALL
          SELECT p.id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad, SUM(dv.cantidad * cp.cantidad) as cantidad_neta, COUNT(DISTINCT v.id) as num_ventas_netas
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id JOIN combo_producto cp ON dv.combo_id = cp.combo_id JOIN productos p ON cp.producto_id = p.id LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? AND v.fecha BETWEEN ? AND ? GROUP BY p.id
          UNION ALL
          SELECT p.id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad, SUM(dd.cantidad * -1) as cantidad_neta, 0 as num_ventas_netas
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id JOIN productos p ON dd.producto_id = p.id LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE dev.empresa_id = ? AND dev.fecha BETWEEN ? AND ? GROUP BY p.id
          UNION ALL
          SELECT p.id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad, SUM(dd.cantidad * cp.cantidad * -1) as cantidad_neta, 0 as num_ventas_netas
          FROM detalle_devoluciones dd
          JOIN devoluciones dev ON dd.devolucion_id = dev.id JOIN combo_producto cp ON dd.combo_id = cp.combo_id JOIN productos p ON cp.producto_id = p.id LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE dev.empresa_id = ? AND dev.fecha BETWEEN ? AND ? GROUP BY p.id
      ) as consolidado
      GROUP BY id, nombre, unidad
      HAVING cantidad_vendida > 0
      ORDER BY cantidad_vendida DESC
    `;

    // 2. QUERY PRODUCTOS SIN MOVIMIENTO
    const querySin = `
      SELECT p.nombre
      FROM productos p
      WHERE p.empresa_id = ? 
      AND p.id NOT IN (
          SELECT DISTINCT dv.producto_id FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id WHERE v.fecha BETWEEN ? AND ? AND dv.producto_id IS NOT NULL
          UNION
          SELECT DISTINCT cp.producto_id FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id JOIN combo_producto cp ON dv.combo_id = cp.combo_id WHERE v.fecha BETWEEN ? AND ?
      )
      ORDER BY p.nombre ASC
    `;

    const [conMovimiento] = await db.execute(queryCon, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
      empresa_id,
      fecha_inicio,
      fecha_fin,
      empresa_id,
      fecha_inicio,
      fecha_fin,
      empresa_id,
      fecha_inicio,
      fecha_fin,
    ]);

    const [sinMovimiento] = await db.execute(querySin, [
      empresa_id,
      fecha_inicio,
      fecha_fin,
      fecha_inicio,
      fecha_fin,
    ]);

    let filasCon = conMovimiento
      .map(
        (p, i) => `
      <tr>
          <td style="width: 40px;">${i + 1}</td>
          <td style="text-align: left;">${p.nombre}</td>
          <td style="width: 120px;">${p.cantidad_vendida} ${p.unidad}</td>
          <td style="width: 80px;">${p.num_ventas}</td>
      </tr>`,
      )
      .join("");

    let filasSin = sinMovimiento
      .map(
        (p, i) => `
      <tr>
          <td style="width: 40px;">${i + 1}</td>
          <td style="text-align: left;">${p.nombre}</td>
          <td style="width: 80px;">0</td>
      </tr>`,
      )
      .join("");

    const html = `
      <html>
      <head>
          <meta charset="UTF-8">
          <style>
              body { font-family: sans-serif; font-size: 11px; color: #333; padding: 10px; }
              .header { text-align: center; margin-bottom: 20px; }
              .header h1 { color: #1a73e8; margin-bottom: 5px; }
              .section-title { font-size: 13px; font-weight: bold; color: #1a73e8; margin-top: 20px; padding-bottom: 5px; border-bottom: 1px solid #1a73e8; }
              .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              .table th { background-color: #1a73e8; color: white; padding: 8px; font-size: 10px; text-transform: uppercase; }
              .table td { padding: 6px; border-bottom: 1px solid #eee; text-align: center; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Informe de Movimiento de Stock</h1>
              <p>Período: ${fInicio} - ${fFin}</p>
          </div>

          <div class="section-title">Movimientos Rápidos</div>
          <table class="table">
              <thead>
                  <tr>
                      <th>#</th>
                      <th style="text-align: left;">Producto</th>
                      <th>Cantidad Vendida</th>
                      <th>Ventas</th>
                  </tr>
              </thead>
              <tbody>${
                filasCon || '<tr><td colspan="4">No hay datos</td></tr>'
              }</tbody>
          </table>

          <div class="section-title">Sin Movimientos</div>
          <table class="table">
              <thead>
                  <tr>
                      <th>#</th>
                      <th style="text-align: left;">Producto</th>
                      <th>Ventas</th>
                  </tr>
              </thead>
              <tbody>${
                filasSin || '<tr><td colspan="3">No hay datos</td></tr>'
              }</tbody>
          </table>
      </body>
      </html>`;

    const options = { format: "A4", border: "10mm" };
    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) return res.status(500).send("Error");
      res.setHeader("Content-Type", "application/pdf");
      res.send(buffer);
    });
  } catch (error) {
    console.error("ERROR PDF STOCK:", error);
    res.status(500).send(error.message);
  }
};

const getDeudaCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    // 1. Calcular Deuda Total (Suma de deudas - Suma de pagos)
    const [totales] = await db.execute(
      `
      SELECT 
        (SELECT IFNULL(SUM(importe), 0) FROM compras_cta_cte WHERE cliente_id = ? AND empresa_id = ? AND tipo = 'deuda') as total_deuda,
        (SELECT IFNULL(SUM(importe), 0) FROM compras_cta_cte WHERE cliente_id = ? AND empresa_id = ? AND tipo = 'pago') as total_pagos
    `,
      [id, empresa_id, id, empresa_id],
    );

    const deuda_total =
      parseFloat(totales[0].total_deuda) - parseFloat(totales[0].total_pagos);

    // 2. Calcular Días de Mora (Si tiene deuda, buscar la fecha de la deuda más antigua)
    let dias_mora = 0;
    if (deuda_total > 0) {
      const [oldestDebt] = await db.execute(
        `
        SELECT fecha FROM compras_cta_cte 
        WHERE cliente_id = ? AND empresa_id = ? AND tipo = 'deuda' 
        ORDER BY fecha ASC LIMIT 1
      `,
        [id, empresa_id],
      );

      if (oldestDebt.length > 0) {
        const fechaDeuda = new Date(oldestDebt[0].fecha);
        const hoy = new Date();
        const diferencia = hoy.getTime() - fechaDeuda.getTime();
        dias_mora = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      }
    }

    res.json({
      success: true,
      deuda_total: Math.max(deuda_total, 0), // Evitar negativos
      dias_mora: dias_mora,
    });
  } catch (error) {
    console.error("Error en getDeudaCliente:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getVentaById = async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.user.empresa_id;

    // 1. Obtener la cabecera de la venta
    const [ventaRows] = await db.execute(
      `
      SELECT v.*, cl.nombre_cliente, cl.cuil_codigo 
      FROM ventas v 
      LEFT JOIN clientes cl ON v.cliente_id = cl.id 
      WHERE v.id = ? AND v.empresa_id = ?`,
      [id, empresa_id],
    );

    if (ventaRows.length === 0)
      return res.status(404).json({ message: "Venta no encontrada" });
    const venta = ventaRows[0];

    // 2. Obtener los detalles (El modelo ya debe traer es_bulto y factor_utilizado)
    const detalles = await Venta.getDetallesByVentaId(id);

    // 3. Procesar precios, componentes y ESCALAS LOGÍSTICAS
    const detallesProcesados = await Promise.all(
      detalles.map(async (d) => {
        let componentes = [];
        if (d.combo_id) {
          const [compRows] = await db.execute(
            `
          SELECT p.nombre, cp.cantidad, u.nombre as unidad 
          FROM combo_producto cp 
          JOIN productos p ON cp.producto_id = p.id 
          LEFT JOIN unidads u ON p.unidad_id = u.id 
          WHERE cp.combo_id = ?`,
            [d.combo_id],
          );
          componentes = compRows;
        }

        // --- LÓGICA DE PRECIO UNITARIO BASE ---
        let precioUnitarioBase = 0;
        if (d.producto_id) {
          if (d.aplicar_porcentaje == 1) {
            precioUnitarioBase =
              parseFloat(d.precio_compra) *
              (1 + (parseFloat(d.valor_porcentaje) || 0) / 100);
          } else {
            precioUnitarioBase = parseFloat(d.precio_venta) || 0;
          }
        } else if (d.combo_id) {
          precioUnitarioBase = parseFloat(d.combo_precio) || 0;
        }

        // --- 🚀 SINCERAMIENTO DE ESCALA (FACTOR DE BULTO) 🚀 ---
        // Si es bulto, el subtotal debe contemplar el factor de conversión
        const factor = parseFloat(d.factor_utilizado || 1);
        const multiplicador = d.es_bulto === 1 ? factor : 1;

        const subtotalSincerado =
          parseFloat(d.cantidad) * precioUnitarioBase * multiplicador;

        return {
          ...d,
          precio_unitario: precioUnitarioBase,
          subtotal: subtotalSincerado, // 👈 Ahora reflejará el total real de la escala
          componentes,
        };
      }),
    );

    res.json({ ...venta, detalles: detallesProcesados });
  } catch (error) {
    console.error("Error detalle venta:", error);
    res.status(500).json({ message: "Error al obtener detalle" });
  }
};

const getVentaTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const formatMoney = (val) =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
      }).format(val || 0);

    // 1. Obtener datos de la venta y saldo de billetera
    const [ventaRows] = await db.execute(
      `
        SELECT v.*, cl.id as cliente_id, cl.nombre_cliente, cl.puntos as puntos_actuales, cl.saldo_billetera as saldo_actual_billetera
        FROM ventas v
        INNER JOIN clientes cl ON v.cliente_id = cl.id
        WHERE v.id = ?`,
      [id],
    );

    if (ventaRows.length === 0)
      return res.status(404).send("Venta no encontrada");
    const venta = ventaRows[0];

    // 🚀 LÓGICA BILLETERA: Buscar cuánto se pagó con Billetera
    const [pagoBilleteraRows] = await db.execute(
      "SELECT monto FROM movimientos_billetera WHERE cliente_id = ? AND tipo = 'consumo' AND descripcion LIKE ?",
      [venta.cliente_id, `%T-${venta.id}%`],
    );
    const montoBilleteraUsado =
      pagoBilleteraRows.length > 0 ? parseFloat(pagoBilleteraRows[0].monto) : 0;

    const [empresaRows] = await db.execute("SELECT * FROM empresas LIMIT 1");
    const empresa = empresaRows[0];

    // 2. Deuda en Cta Cte
    const [ctaCteRows] = await db.execute(
      `SELECT SUM(CASE WHEN tipo = 'deuda' THEN importe ELSE 0 END) -
              SUM(CASE WHEN tipo = 'pago' THEN importe ELSE 0 END) as saldo_total
       FROM compras_cta_cte WHERE cliente_id = ?`,
      [venta.cliente_id],
    );
    const deudaAcumulada = parseFloat(ctaCteRows[0].saldo_total) || 0;

    // 🛡️ OBTENER DETALLES (Asegurando que traiga la info de bultos)
    const detalles = await Venta.getDetallesByVentaId(id);

    // 3. LISTADO DE PRODUCTOS SINCERADO CON BULTOS
    let subtotalSinDescuentos = 0;
    const itemsHtml = detalles
      .map((d) => {
        const factor = parseFloat(d.factor_utilizado || 1);
        const esBulto = d.es_bulto === 1;

        // --- CÁLCULO DE PRECIO UNITARIO SEGÚN MAESTRO ---
        let precioUnitarioBase = d.producto_id
          ? d.aplicar_porcentaje == 1
            ? parseFloat(d.precio_compra) *
              (1 + (parseFloat(d.valor_porcentaje) || 0) / 100)
            : parseFloat(d.precio_venta) || 0
          : parseFloat(d.combo_precio) || 0;

        // Subtotal de la línea considerando escala
        const subtotalItem = esBulto
          ? d.cantidad * factor * precioUnitarioBase
          : d.cantidad * precioUnitarioBase;

        subtotalSinDescuentos += subtotalItem;

        const nombre = (d.producto_nombre || d.combo_nombre || "N/A")
          .toUpperCase()
          .substring(0, 27);
        const unidadNombre = esBulto
          ? (d.unidad_bulto_nombre || "PACK").toUpperCase()
          : (d.unidad_base_nombre || "UNID").toUpperCase();

        // 🚀 LÍNEA DE ESCALA: Ejem: "1 X PACK (8 UNID)"
        const lineaEscala = esBulto
          ? `<div style="text-align:left;">${d.cantidad} X ${unidadNombre} (${factor} ${d.unidad_base_nombre || "unid"})</div>`
          : d.cantidad > 1
            ? `<div style="text-align:left;">${d.cantidad} X ${formatMoney(precioUnitarioBase)}</div>`
            : "";

        return `
            ${lineaEscala}
            <table style="width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 2px;">
                <tr>
                    <td style="width: 75%; text-align: left;">${nombre}</td>
                    <td style="width: 25%; text-align: right;">${subtotalItem.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                </tr>
            </table>`;
      })
      .join("");

    // 4. Bloque de fidelidad
    const puntosGanados = Math.floor(parseFloat(venta.precio_total) / 100);
    const esConsumidorFinal = Number(venta.cliente_id) === 1;

    const infoFidelizacionHtml = !esConsumidorFinal
      ? `
        <div class="line"></div>
        <div style="text-align:left; font-size: 9px; margin-top: 5px;">
            <div>PUNTOS GANADOS: ${puntosGanados}</div>
            <div>TOTAL PUNTOS: ${venta.puntos_actuales}</div>
            <div style="font-weight:bold">SALDO BILLETERA: ${formatMoney(venta.saldo_actual_billetera)}</div>
        </div>`
      : "";

    const hora24 = new Date(venta.created_at).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    // 5. HTML FINAL (HEADER Y FOOTER ORIGINALES RESTAURADOS)
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', Courier, monospace; font-size: 10px; line-height: 1.2; width: 60mm; color: #000; }
            .wrapper { padding: 4px; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .line { border-top: 1px dashed #000; margin: 4px 0; }
            .total-section { border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="text-center">
                <div style="font-weight:bold; font-size:11px;">${empresa.nombre_empresa}</div>
                <div>CUIT Nro.: ${empresa.cuit}</div>
                <div>Ing. Brutos: ${empresa.ingresos_brutos || "1276868-05"}</div>
                <div>Dirección: ${empresa.direccion || "Juan Agustín García 6 A"}</div>
                <div>CABA - CP 1416</div>
                <div>IVA RESPONSABLE INSCRIPTO</div>
                <div>A CONSUMIDOR FINAL</div>
            </div>
            <div class="line"></div>
            <div class="text-center">
                <div>Cód. 083 - TIQUE</div>
                <div>P.V. Nro. 00001 - Nro. T. ${String(venta.id).padStart(8, "0")}</div>
                <div>Fecha ${new Date(venta.fecha).toLocaleDateString("es-AR")} - Hora ${hora24}</div>
            </div>
            <div class="line"></div>
            ${itemsHtml}
            <div class="total-section">
                <div class="text-right">SUBTOTAL: ${subtotalSinDescuentos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
                <div class="text-right" style="font-size: 11px;">TOTAL: ${parseFloat(venta.precio_total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
            </div>

            <div style="text-align:left; margin-top:8px;">
                <div>RECIBI(MOS)</div>
                <div style="font-weight:bold">FORMA DE PAGO:</div>

                ${parseFloat(venta.efectivo) > 0 ? `<div>Efectivo: ${parseFloat(venta.efectivo).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>` : ""}
                ${montoBilleteraUsado > 0 ? `<div>Billetera: ${parseFloat(montoBilleteraUsado).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>` : ""}
                ${parseFloat(venta.tarjeta) > 0 ? `<div>Tarjeta: ${parseFloat(venta.tarjeta).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>` : ""}
                ${parseFloat(venta.mercadopago) > 0 ? `<div>Mercado Pago: ${parseFloat(venta.mercadopago).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>` : ""}
                ${parseFloat(venta.transferencia) > 0 ? `<div>Transferencia: ${parseFloat(venta.transferencia).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>` : ""}
            </div>

            ${infoFidelizacionHtml}

            <div class="line"></div>
            ${deudaAcumulada > 0 ? `<div>DEUDA CTA. CTE.: ${formatMoney(deudaAcumulada)}</div>` : ""}
            <div>Cliente: ${venta.nombre_cliente}</div>

            <div class="line"></div>
            <div class="text-center" style="margin-top:5px; font-size:8px;">
                <div>1138669097</div>
                <div>GRATUITO C.A.B.A. ÁREA DE DEFENSA Y PROTECCIÓN AL CONSUMIDOR</div>
            </div>
            <div class="text-center" style="font-size: 8px; margin-top: 4px;">
                <div>SESHIA00000013450 | V: 1.03</div>
            </div>
        </div>
    </body>
    </html>`;

    const options = {
      width: "60mm",
      height: "220mm",
      border: "0",
      type: "pdf",
    };
    pdf.create(html, options).toStream((err, stream) => {
      if (err) return res.status(500).send(err);
      res.setHeader("Content-Type", "application/pdf");
      stream.pipe(res);
    });
  } catch (error) {
    console.error("ERROR TICKET:", error.message);
    res.status(500).send("Error al generar el ticket");
  }
};

const updateTmpVentaQuantity = async (req, res) => {
  try {
    const { id } = req.params; // ID de la tabla tmp_ventas
    const { cantidad } = req.body;

    // 1. Buscamos el stock real y la configuración del producto
    const [rows] = await db.execute(
      `
      SELECT p.stock, p.nombre, t.es_bulto, t.factor_utilizado 
      FROM tmp_ventas t
      JOIN productos p ON t.producto_id = p.id
      WHERE t.id = ?
    `,
      [id],
    );

    if (rows.length > 0) {
      const stockDisponible = parseFloat(rows[0].stock);
      const nombreProducto = rows[0].nombre;
      const esBulto = rows[0].es_bulto;
      const factorUtilizado = parseFloat(rows[0].factor_utilizado || 1);

      // 2. Calcular unidades necesarias según la escala
      let unidadesNecesarias;
      if (esBulto === 1) {
        unidadesNecesarias = cantidad * factorUtilizado;
      } else {
        unidadesNecesarias = cantidad;
      }

      // 3. Si la cantidad pedida es mayor al stock, bloqueamos
      if (unidadesNecesarias > stockDisponible) {
        return res.json({
          success: false,
          message: `Stock insuficiente para ${nombreProducto}. Máximo disponible: ${stockDisponible} unidades${
            esBulto === 1
              ? ` (${Math.floor(stockDisponible / factorUtilizado)} bultos)`
              : ""
          }`,
        });
      }
    }

    // 4. Si pasó la validación, actualizamos
    await db.execute(
      "UPDATE tmp_ventas SET cantidad = ?, updated_at = NOW() WHERE id = ?",
      [cantidad, id],
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error en updateTmpVentaQuantity:", error);
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

const enviarTicketPorWhatsApp = async (req, res) => {
  try {
    const { id } = req.params; // ID de la venta
    const empresa_id = req.user.empresa_id;

    // 1. Obtener datos de la venta y del cliente
    const [rows] = await db.execute(
      `SELECT v.id, v.precio_total, c.nombre_cliente, c.telefono 
       FROM ventas v 
       INNER JOIN clientes c ON v.cliente_id = c.id 
       WHERE v.id = ? AND v.empresa_id = ?`,
      [id, empresa_id],
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Venta no encontrada" });
    const venta = rows[0];

    // 2. Validar si es Consumidor Final o no tiene teléfono
    if (venta.telefono === "99999999" || !venta.telefono) {
      return res.status(400).json({
        message:
          "El cliente es Consumidor Final o no tiene un teléfono válido.",
      });
    }

    // 3. Preparar la URL del ticket (Usando el token para que el cliente pueda verlo)
    const token = req.query.token || req.headers.authorization?.split(" ")[1];
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? "https://sistema-ventas-backend-3nn3.onrender.com"
        : "http://localhost:3001";

    const linkTicket = `${baseUrl}/api/ventas/ticket/${venta.id}?token=${token}`;

    // 4. Construir el mensaje
    const mensaje =
      `¡Hola *${venta.nombre_cliente}*! 👋\n\n` +
      `Gracias por tu compra. Te adjuntamos el link para que puedas descargar tu comprobante electrónico:\n\n` +
      `📄 *Ticket:* T-${venta.id.toString().padStart(8, "0")}\n` +
      `💰 *Monto:* $${parseFloat(venta.precio_total).toLocaleString(
        "es-AR",
      )}\n\n` +
      `🔗 *Link:* ${linkTicket}\n\n` +
      `¡Esperamos verte pronto!`;

    // 5. Enviar mensaje
    await sendWS(venta.telefono, mensaje);

    res.json({
      success: true,
      message: "Ticket enviado por WhatsApp con éxito.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al enviar el ticket." });
  }
};

const getReporteRentabilidad = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const empresa_id = req.user.empresa_id;

    // 1. VENTAS NETAS (Sincronizado con Dashboard Global: Venta - Devolución)
    const [vRows] = await db.execute(
      `SELECT IFNULL(SUM(precio_total), 0) as total FROM ventas 
       WHERE empresa_id = ? AND DATE(fecha) BETWEEN ? AND ?`,
      [empresa_id, desde, hasta],
    );
    const [dRows] = await db.execute(
      `SELECT IFNULL(SUM(precio_total), 0) as total FROM devoluciones 
       WHERE empresa_id = ? AND DATE(fecha) BETWEEN ? AND ?`,
      [empresa_id, desde, hasta],
    );

    // 2. CMV NETO (Costo Mercadería Vendida - Costo de lo que se devolvió)
    const [cRows] = await db.execute(
      `SELECT IFNULL(SUM(dv.cantidad * dv.precio_compra), 0) as total 
       FROM detalle_ventas dv 
       JOIN ventas v ON dv.venta_id = v.id 
       WHERE v.empresa_id = ? AND DATE(v.fecha) BETWEEN ? AND ?`,
      [empresa_id, desde, hasta],
    );
    const [cdRows] = await db.execute(
      `SELECT IFNULL(SUM(dd.cantidad * p.precio_compra), 0) as total 
       FROM detalle_devoluciones dd 
       JOIN productos p ON dd.producto_id = p.id
       JOIN devoluciones d ON dd.devolucion_id = d.id
       WHERE d.empresa_id = ? AND DATE(d.fecha) BETWEEN ? AND ?`,
      [empresa_id, desde, hasta],
    );

    // 3. GASTOS TOTALES
    const [gRows] = await db.execute(
      `SELECT IFNULL(SUM(monto), 0) as total FROM gastos 
       WHERE empresa_id = ? AND DATE(fecha) BETWEEN ? AND ?`,
      [empresa_id, desde, hasta],
    );

    const totalVentasNetas =
      parseFloat(vRows[0].total) - parseFloat(dRows[0].total);
    const totalCostoNeto =
      parseFloat(cRows[0].total) - parseFloat(cdRows[0].total);
    const totalGastos = parseFloat(gRows[0].total);

    const gananciaBruta = totalVentasNetas - totalCostoNeto;
    const gananciaNetaReal = gananciaBruta - totalGastos;

    // 4. RANKING DE PRODUCTOS GLOBAL (Incluyendo combos + prorrateo de descuentos de venta)
    const [ranking] = await db.execute(
      `SELECT 
        t.producto_id, t.nombre, t.unidad,
        SUM(t.cantidad_total) as cantidad_vendida,
        SUM(t.ganancia_real) as ganancia_periodo,
        SUM(t.venta_real) as total_venta_periodo
      FROM (
          -- A. VENTAS DIRECTAS (Prorrateadas con el descuento del ticket)
          SELECT 
            p.id as producto_id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad,
            SUM(dv.cantidad) as cantidad_total,
            SUM((dv.cantidad * dv.precio_venta) * (v.precio_total / (SELECT SUM(dv2.cantidad * dv2.precio_venta) FROM detalle_ventas dv2 WHERE dv2.venta_id = v.id))) as venta_real,
            SUM(((dv.cantidad * dv.precio_venta) * (v.precio_total / (SELECT SUM(dv2.cantidad * dv2.precio_venta) FROM detalle_ventas dv2 WHERE dv2.venta_id = v.id))) - (dv.cantidad * dv.precio_compra)) as ganancia_real
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN productos p ON dv.producto_id = p.id
          LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? AND DATE(v.fecha) BETWEEN ? AND ?
          GROUP BY p.id, p.nombre, u.nombre

          UNION ALL

          -- B. VENTAS POR COMBOS (Prorrateadas con el descuento del ticket)
          SELECT 
            p.id as producto_id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad,
            SUM(dv.cantidad * cp.cantidad) as cantidad_total,
            SUM((dv.cantidad * cp.cantidad * p.precio_venta) * (v.precio_total / (SELECT SUM(dv3.cantidad * dv3.precio_venta) FROM detalle_ventas dv3 WHERE dv3.venta_id = v.id))) as venta_real,
            SUM(((dv.cantidad * cp.cantidad * p.precio_venta) * (v.precio_total / (SELECT SUM(dv3.cantidad * dv3.precio_venta) FROM detalle_ventas dv3 WHERE dv3.venta_id = v.id))) - (dv.cantidad * cp.cantidad * p.precio_compra)) as ganancia_real
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN combo_producto cp ON dv.combo_id = cp.combo_id
          JOIN productos p ON cp.producto_id = p.id
          LEFT JOIN unidads u ON p.unidad_id = u.id
          WHERE v.empresa_id = ? AND DATE(v.fecha) BETWEEN ? AND ?
          GROUP BY p.id, p.nombre, u.nombre
      ) t
      GROUP BY t.producto_id, t.nombre, t.unidad`,
      [empresa_id, desde, hasta, empresa_id, desde, hasta],
    );

    // 5. Traer todos los productos para que figuren aunque tengan 0 ventas
    const [todosLosProductos] = await db.execute(
      `SELECT p.id, p.nombre, IFNULL(u.nombre, 'Unid.') as unidad 
       FROM productos p LEFT JOIN unidads u ON p.unidad_id = u.id 
       WHERE p.empresa_id = ?`,
      [empresa_id],
    );

    const rankingCompleto = todosLosProductos.map((p) => {
      const vData = ranking.find((r) => r.producto_id === p.id);
      const cantidad = vData ? parseFloat(vData.cantidad_vendida) : 0;
      const ganancia = vData ? parseFloat(vData.ganancia_periodo) : 0;
      const total_venta = vData ? parseFloat(vData.total_venta_periodo) : 0;

      let margen = total_venta > 0 ? (ganancia / total_venta) * 100 : 0;
      let participacion =
        gananciaBruta > 0 && ganancia > 0
          ? (ganancia / gananciaBruta) * 100
          : 0;

      return {
        nombre: p.nombre,
        unidad: p.unidad,
        cantidad,
        ganancia,
        total_venta,
        margen,
        participacion,
      };
    });

    res.json({
      totalVentas: totalVentasNetas, // Coincide con Dashboard Global
      totalCosto: totalCostoNeto, // CMV Real (Ventas - Devoluciones)
      totalGastos,
      gananciaBruta,
      gananciaNetaReal,
      rankingProductos: rankingCompleto.sort((a, b) => b.ganancia - a.ganancia),
    });
  } catch (error) {
    console.error("ERROR RENTABILIDAD:", error);
    res.status(500).json({ message: "Error interno" });
  }
};

const getEstadoResultados = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const empresa_id = req.user.empresa_id;

    // 1. INGRESOS NETOS (Ventas - Devoluciones)
    const [vRows] = await db.execute(
      `SELECT IFNULL(SUM(precio_total),0) as total, IFNULL(SUM(tarjeta),0) as t, IFNULL(SUM(mercadopago),0) as mp FROM ventas WHERE empresa_id = ? AND DATE(fecha) BETWEEN ? AND ?`,
      [empresa_id, desde, hasta],
    );
    const [dRows] = await db.execute(
      `SELECT IFNULL(SUM(precio_total),0) as total FROM devoluciones WHERE empresa_id = ? AND DATE(fecha) BETWEEN ? AND ?`,
      [empresa_id, desde, hasta],
    );

    const ingresosBrutos = parseFloat(vRows[0].total);
    const devoluciones = parseFloat(dRows[0].total);
    const ventasNetas = ingresosBrutos - devoluciones;

    // 2. COSTO DE MERCADERÍA VENDIDA (CMV)
    const [cRows] = await db.execute(
      `SELECT IFNULL(SUM(dv.cantidad * dv.precio_compra), 0) as total FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id WHERE v.empresa_id = ? AND DATE(v.fecha) BETWEEN ? AND ?`,
      [empresa_id, desde, hasta],
    );
    const [cdRows] = await db.execute(
      `SELECT IFNULL(SUM(dd.cantidad * p.precio_compra), 0) as total FROM detalle_devoluciones dd JOIN productos p ON dd.producto_id = p.id JOIN devoluciones d ON dd.devolucion_id = d.id WHERE d.empresa_id = ? AND DATE(d.fecha) BETWEEN ? AND ?`,
      [empresa_id, desde, hasta],
    );

    const cmv = parseFloat(cRows[0].total) - parseFloat(cdRows[0].total);
    const utilidadBruta = ventasNetas - cmv;

    // 3. GASTOS OPERATIVOS (Gastos registrados)
    const [gRows] = await db.execute(
      `SELECT IFNULL(SUM(monto), 0) as total FROM gastos WHERE empresa_id = ? AND DATE(fecha) BETWEEN ? AND ?`,
      [empresa_id, desde, hasta],
    );
    const gastosOperativos = parseFloat(gRows[0].total);

    // 4. COMISIONES BANCARIAS (El gasto invisible: Tarjeta 3%, MP 4% est.)
    const comisionesMP = parseFloat(vRows[0].mp) * 0.04;
    const comisionesTarj = parseFloat(vRows[0].t) * 0.03;
    const totalComisiones = comisionesMP + comisionesTarj;

    // 5. EBITDA (Utilidad antes de intereses, impuestos, depreciaciones y amortizaciones)
    const ebitda = utilidadBruta - gastosOperativos - totalComisiones;

    res.json({
      periodo: { desde, hasta },
      ingresos: { brutos: ingresosBrutos, devoluciones, netos: ventasNetas },
      costos: { cmv, utilidadBruta },
      gastos: {
        operativos: gastosOperativos,
        comisiones: totalComisiones,
        total: gastosOperativos + totalComisiones,
      },
      ebitda: ebitda,
      margenEbitda:
        ventasNetas > 0 ? ((ebitda / ventasNetas) * 100).toFixed(2) : 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getHeatmapVentas = async (req, res) => {
  try {
    // Validación de seguridad BI
    if (!req.user || !req.user.empresa_id) {
      return res
        .status(401)
        .json({ message: "Usuario no autenticado o empresa no encontrada" });
    }

    const empresa_id = req.user.empresa_id;

    // Usamos COALESCE y aseguramos que los nombres de columna existan
    // fecha y created_at son los nombres estándar que vi en tus capturas
    const query = `
      SELECT 
        DAYOFWEEK(fecha) as dia_numero,
        HOUR(created_at) as hora,
        SUM(precio_total) as total_facturado
      FROM ventas
      WHERE empresa_id = ? 
        AND fecha >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
      GROUP BY dia_numero, hora
    `;

    const [rows] = await db.execute(query, [empresa_id]);

    // Si no hay datos, enviamos una estructura vacía pero coherente
    if (rows.length === 0) {
      return res.json({
        matrix: [],
        conclusiones: {
          pico_maximo: "No hay ventas suficientes para analizar aún.",
          sugerencia:
            "Realizá ventas para que el Oráculo pueda detectar patrones.",
        },
      });
    }

    // Buscamos la hora pico de forma segura
    let maxVal = 0;
    let horaPico = { hora: 0, diaNum: 1 };
    const diasNombre = [
      "",
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];

    rows.forEach((r) => {
      const val = parseFloat(r.total_facturado);
      if (val > maxVal) {
        maxVal = val;
        horaPico = { hora: r.hora, diaNum: r.dia_numero };
      }
    });

    res.json({
      matrix: rows,
      conclusiones: {
        pico_maximo: `Tu pico histórico es a las ${
          horaPico.hora
        }:00hs los días ${diasNombre[horaPico.diaNum]}.`,
        sugerencia:
          "Optimizá el personal en los horarios de color intenso (Rojo) y ahorrá energía en los claros.",
      },
    });
  } catch (error) {
    console.error("❌ ERROR HEATMAP:", error);
    res.status(500).json({ message: error.message });
  }
};

const getRentabilidadReal = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // 1. Obtener comisiones bancarias
    const [comisiones] = await db.execute(
      "SELECT metodo, comision_porcentaje FROM config_comisiones_pagos WHERE empresa_id = ?",
      [empresa_id],
    );
    const dCom = {};
    comisiones.forEach(
      (c) => (dCom[c.metodo] = parseFloat(c.comision_porcentaje) / 100),
    );

    // 2. Obtener VENTAS y su COSTO
    const [ventas] = await db.execute(
      `SELECT 
        v.id, v.precio_total, v.tarjeta, v.mercadopago, v.transferencia,
        (SELECT IFNULL(SUM(dv.cantidad * p.precio_compra), 0) FROM detalle_ventas dv JOIN productos p ON dv.producto_id = p.id WHERE dv.venta_id = v.id) as costo_vta
      FROM ventas v
      WHERE v.empresa_id = ? AND MONTH(v.fecha) = ? AND YEAR(v.fecha) = ?`,
      [empresa_id, currentMonth, currentYear],
    );

    // 3. 🚀 Obtener DEVOLUCIONES y su COSTO (Clave para la sincronía) 🚀
    const [devoluciones] = await db.execute(
      `SELECT 
        IFNULL(SUM(d.precio_total), 0) as total_dev,
        IFNULL(SUM((SELECT SUM(dd.cantidad * p.precio_compra) FROM detalle_devoluciones dd JOIN productos p ON dd.producto_id = p.id WHERE dd.devolucion_id = d.id)), 0) as costo_dev
      FROM devoluciones d
      WHERE d.empresa_id = ? AND MONTH(d.fecha) = ? AND YEAR(d.fecha) = ?`,
      [empresa_id, currentMonth, currentYear],
    );

    // 4. Gastos
    const [gastos] = await db.execute(
      `SELECT IFNULL(SUM(monto), 0) as total_gas FROM gastos WHERE empresa_id = ? AND MONTH(fecha) = ? AND YEAR(fecha) = ?`,
      [empresa_id, currentMonth, currentYear],
    );

    const totalDevolucionesMonto = parseFloat(devoluciones[0].total_dev || 0);
    const totalDevolucionesCosto = parseFloat(devoluciones[0].costo_dev || 0);
    const totalGastosMes = parseFloat(gastos[0].total_gas || 0);

    let brutoVentas = 0;
    let costoMercaderiaVentas = 0;
    let comisionesTotales = 0;

    ventas.forEach((v) => {
      brutoVentas += parseFloat(v.precio_total);
      costoMercaderiaVentas += parseFloat(v.costo_vta);

      const mordidaTarjeta = parseFloat(v.tarjeta || 0) * (dCom.tarjeta || 0);
      const mordidaMP =
        parseFloat(v.mercadopago || 0) * (dCom.mercadopago || 0);
      const mordidaTransf =
        parseFloat(v.transferencia || 0) * (dCom.transferencia || 0);
      comisionesTotales += mordidaTarjeta + mordidaMP + mordidaTransf;
    });

    // --- 🚀 LA FÓRMULA DE LA VERDAD (Sincronizada con Dashboard) 🚀 ---

    // Facturación Neta = Total Ventas - Total Devoluciones
    const facturacionLimpia = brutoVentas - totalDevolucionesMonto;

    // Costo Mercadería Real = Costo de lo vendido - Costo de lo devuelto
    const CMV_Real = costoMercaderiaVentas - totalDevolucionesCosto;

    // Ganancia Bruta = Lo que cobré neto - Lo que me costó lo que realmente se llevaron
    const gananciaBruta = facturacionLimpia - CMV_Real;

    // Ganancia Neta Final
    const gananciaNetaReal = gananciaBruta - comisionesTotales - totalGastosMes;

    res.json({
      success: true,
      metricas: {
        ventas_brutas: facturacionLimpia,
        costo_mercaderia: CMV_Real,
        comisiones_bancarias: comisionesTotales,
        gastos_operativos: totalGastosMes,
        ganancia_neta_real: gananciaNetaReal,
        margen_limpio_porcentaje:
          facturacionLimpia > 0
            ? ((gananciaNetaReal / facturacionLimpia) * 100).toFixed(2)
            : 0,
      },
    });
  } catch (error) {
    console.error("ERROR RENTABILIDAD BI:", error);
    res.status(500).json({ message: error.message });
  }
};

const getPodioVendedores = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const query = `
      SELECT 
        u.name as usuario_nombre,
        COUNT(v.id) as cantidad_ventas,
        SUM(v.precio_total) as total_monto,
        AVG(v.precio_total) as ticket_promedio,
        -- Calculamos el promedio de ítems por ticket
        (
          SELECT AVG(items_por_venta) FROM (
            SELECT venta_id, SUM(cantidad) as items_por_venta 
            FROM detalle_ventas 
            GROUP BY venta_id
          ) as sub WHERE venta_id IN (SELECT id FROM ventas WHERE usuario_id = u.id)
        ) as items_promedio
      FROM ventas v
      JOIN users u ON v.usuario_id = u.id
      WHERE v.empresa_id = ? 
        AND MONTH(v.fecha) = ? 
        AND YEAR(v.fecha) = ?
      GROUP BY u.id
      ORDER BY total_monto DESC
    `;

    const [rows] = await db.execute(query, [
      empresa_id,
      currentMonth,
      currentYear,
    ]);

    res.json(rows);
  } catch (error) {
    console.error("ERROR PODIO:", error);
    res.status(500).json({ message: error.message });
  }
};

const getVelocidadCaja = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;

    const query = `
      SELECT 
        u.name as usuario_nombre,
        COUNT(v.id) as total_tickets,
        AVG(v.duracion_segundos) as promedio_segundos,
        MIN(v.duracion_segundos) as ticket_record,
        MAX(v.duracion_segundos) as ticket_lento
      FROM ventas v
      JOIN users u ON v.usuario_id = u.id
      WHERE v.empresa_id = ? AND v.duracion_segundos > 0
        AND v.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY u.id
      ORDER BY promedio_segundos ASC
    `;

    const [rows] = await db.execute(query, [empresa_id]);

    const result = rows.map((r) => {
      const prom = parseFloat(r.promedio_segundos);
      let estado = "RÁPIDO";
      let color = "text-success";
      let semaforo = "bg-success";

      if (prom > 90) {
        // Más de 1:30 min es lento
        estado = "LENTO";
        color = "text-danger";
        semaforo = "bg-danger";
      } else if (prom > 45) {
        // Entre 45s y 90s es aceptable
        estado = "INTERMEDIO";
        color = "text-warning";
        semaforo = "bg-warning";
      }

      return {
        ...r,
        promedio: prom.toFixed(0),
        estado,
        color,
        semaforo,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const countVentas = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT COUNT(*) AS total FROM ventas");
    res.json({ total: rows[0].total });
  } catch (error) {
    console.error("Error al contar ventas:", error);
    res.status(500).json({ total: 0 });
  }
};

const getVentasSummary = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const [totalRows] = await db.execute(
      "SELECT COUNT(*) AS total FROM ventas",
    );
    const [yearRows] = await db.execute(
      "SELECT COUNT(*) AS totalAnio FROM ventas WHERE YEAR(fecha) = ?",
      [year],
    );

    res.json({
      total: totalRows[0].total || 0,
      totalAnio: yearRows[0].totalAnio || 0,
    });
  } catch (error) {
    res.status(500).json({ total: 0, totalAnio: 0 });
  }
};

const getVentasDashboard = async (req, res) => {
  try {
    const empresa_id = req.user.empresa_id;
    // 🛡️ LOCALIZACIÓN FORZADA (Buenos Aires, Argentina)
    const optionsArg = {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    const formatter = new Intl.DateTimeFormat("en-CA", optionsArg); // en-CA devuelve YYYY-MM-DD
    const todayStr = formatter.format(new Date());

    const parts = todayStr.split("-");
    const currentYear = parseInt(parts[0]);
    const currentMonth = parseInt(parts[1]);

    // 1. VENTAS BRUTAS (Total Facturado - Total Devuelto)
    const [v] = await db.execute(
      `SELECT 
        IFNULL(SUM(CASE WHEN DATE(fecha) = ? THEN precio_total ELSE 0 END), 0) as dia,
        IFNULL(SUM(CASE WHEN MONTH(fecha) = ? AND YEAR(fecha) = ? THEN precio_total ELSE 0 END), 0) as mes,
        IFNULL(SUM(CASE WHEN YEAR(fecha) = ? THEN precio_total ELSE 0 END), 0) as anio
      FROM ventas WHERE empresa_id = ?`,
      [todayStr, currentMonth, currentYear, currentYear, empresa_id],
    );

    const [d] = await db.execute(
      `SELECT 
        IFNULL(SUM(CASE WHEN DATE(fecha) = ? THEN precio_total ELSE 0 END), 0) as dia,
        IFNULL(SUM(CASE WHEN MONTH(fecha) = ? AND YEAR(fecha) = ? THEN precio_total ELSE 0 END), 0) as mes,
        IFNULL(SUM(CASE WHEN YEAR(fecha) = ? THEN precio_total ELSE 0 END), 0) as anio
      FROM devoluciones WHERE empresa_id = ?`,
      [todayStr, currentMonth, currentYear, currentYear, empresa_id],
    );

    // 2. UTILIDAD REAL (Sincronizada con el Gráfico y Combos)
    const queryUtilidad = `
      SELECT 
        IFNULL(SUM(CASE WHEN DATE(fecha) = ? THEN utilidad ELSE 0 END), 0) as dia,
        IFNULL(SUM(CASE WHEN MONTH(fecha) = ? AND YEAR(fecha) = ? THEN utilidad ELSE 0 END), 0) as mes,
        IFNULL(SUM(CASE WHEN YEAR(fecha) = ? THEN utilidad ELSE 0 END), 0) as anio
      FROM (
        SELECT v.fecha, v.empresa_id,
          (v.precio_total - (
            SELECT IFNULL(SUM(dv.cantidad * IFNULL(p.precio_compra, (SELECT SUM(cp.cantidad * p2.precio_compra) FROM combo_producto cp JOIN productos p2 ON cp.producto_id = p2.id WHERE cp.combo_id = dv.combo_id))), 0)
            FROM detalle_ventas dv LEFT JOIN productos p ON dv.producto_id = p.id WHERE dv.venta_id = v.id
          )) as utilidad
        FROM ventas v WHERE v.empresa_id = ?
      ) t`;

    const [uVentas] = await db.execute(queryUtilidad, [
      todayStr,
      currentMonth,
      currentYear,
      currentYear,
      empresa_id,
    ]);

    const queryUtilidadDev = `
      SELECT 
        IFNULL(SUM(CASE WHEN DATE(fecha) = ? THEN utilidad ELSE 0 END), 0) as dia,
        IFNULL(SUM(CASE WHEN MONTH(fecha) = ? AND YEAR(fecha) = ? THEN utilidad ELSE 0 END), 0) as mes,
        IFNULL(SUM(CASE WHEN YEAR(fecha) = ? THEN utilidad ELSE 0 END), 0) as anio
      FROM (
        SELECT d.fecha, d.empresa_id,
          (d.precio_total - (
            SELECT IFNULL(SUM(dd.cantidad * IFNULL(p.precio_compra, (SELECT SUM(cp.cantidad * p2.precio_compra) FROM combo_producto cp JOIN productos p2 ON cp.producto_id = p2.id WHERE cp.combo_id = dd.combo_id))), 0)
            FROM detalle_devoluciones dd LEFT JOIN productos p ON dd.producto_id = p.id WHERE dd.devolucion_id = d.id
          )) as utilidad
        FROM devoluciones d WHERE d.empresa_id = ?
      ) t`;

    const [uDev] = await db.execute(queryUtilidadDev, [
      todayStr,
      currentMonth,
      currentYear,
      currentYear,
      empresa_id,
    ]);

    // 3. CONTEOS ADICIONALES
    const [counts] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM productos WHERE empresa_id = ${empresa_id} AND stock <= stock_minimo) as bajoStock,
        (SELECT IFNULL(SUM(CASE WHEN tipo = 'deuda' THEN importe ELSE -importe END), 0) FROM compras_cta_cte WHERE empresa_id = ${empresa_id}) as deuda_gral
    `);

    const [top] = await db.execute(
      `SELECT p.nombre, SUM(dv.cantidad) as veces_vendido 
       FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id JOIN productos p ON dv.producto_id = p.id 
       WHERE v.empresa_id = ? GROUP BY p.id ORDER BY veces_vendido DESC LIMIT 10`,
      [empresa_id],
    );

    res.json({
      productosBajoStock: counts[0].bajoStock,
      ventas_dia: Math.max(parseFloat(v[0].dia) - parseFloat(d[0].dia), 0),
      ventas_mes: Math.max(parseFloat(v[0].mes) - parseFloat(d[0].mes), 0),
      ventas_anio: Math.max(parseFloat(v[0].anio) - parseFloat(d[0].anio), 0),
      devoluciones_dia: parseFloat(d[0].dia),
      devoluciones_mes: parseFloat(d[0].mes),
      devoluciones_anio: parseFloat(d[0].anio),
      ganancia_dia: parseFloat(uVentas[0].dia) - parseFloat(uDev[0].dia),
      ganancia_mes: parseFloat(uVentas[0].mes) - parseFloat(uDev[0].mes), // <--- DARÁ $26.550
      ganancia_anio: parseFloat(uVentas[0].anio) - parseFloat(uDev[0].anio),
      deuda_general: parseFloat(counts[0].deuda_gral),
      topProductos: top,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getListadoVentas,
  getTmpVentas,
  toggleTmpBultoVenta,
  postTmpVenta,
  deleteTmpVenta,
  storeVenta,
  generarReporte,
  getInformeProductos,
  generarInformeProductosPDF,
  getInformeClientes,
  generarInformeClientesPDF,
  getInformeMetodosPago,
  generarInformeMetodosPagoPDF,
  getInformeMovimientoStock,
  generarInformeMovimientoStockPDF,
  getDeudaCliente,
  getVentaById,
  getVentaTicket,
  updateTmpVentaQuantity,
  enviarTicketPorWhatsApp,
  getReporteRentabilidad,
  getEstadoResultados,
  getHeatmapVentas,
  getRentabilidadReal,
  getPodioVendedores,
  getVelocidadCaja,
  countVentas,
  getVentasSummary,
  getVentasDashboard,
};
