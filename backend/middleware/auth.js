// middleware/auth.js
// Middleware para verificar el token JWT en rutas protegidas

const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { registroId, personaId, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Token inválido o expirado.' });
  }
};
