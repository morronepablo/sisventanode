// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // 1. Intentamos obtener el token del header (como siempre)
  const authHeader = req.headers["authorization"];
  const tokenFromHeader = authHeader && authHeader.split(" ")[1];

  // 2. Intentamos obtener el token de la URL (para los PDFs)
  const tokenFromQuery = req.query.token;

  // 3. Si viene por header lo usa, si no, usa el de la URL
  const token = tokenFromHeader || tokenFromQuery;

  if (!token) {
    return res
      .status(401)
      .json({ message: "No se proporcionó un token de acceso." });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "tu_clave_por_defecto"
    );

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token inválido o expirado." });
  }
};

module.exports = authMiddleware;
