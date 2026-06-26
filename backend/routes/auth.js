// routes/auth.js
// Rutas de autenticación

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const {
  login,
  register,
  forgotPassword,
  verifyCode,
  resetPassword,
  validateUser,
  asignarCategoria,
  pendientes,
  logout,
} = require('../controllers/authController');

// ── Públicas ──────────────────────────────────────────────────
router.post('/login',           login);
router.post('/register',        register);
router.post('/forgot-password', forgotPassword);
router.post('/verify-code',     verifyCode);
router.post('/reset-password',  resetPassword);

// ── Protegida (solo admin/revisor) ────────────────────────────
// validateUser y asignarCategoria verifican el rol internamente.
router.post('/validate-user',    auth, validateUser);
router.put('/asignar-categoria', auth, asignarCategoria);
router.get('/pendientes',        auth, pendientes);

// ── Protegida (usuario general) ───────────────────────────────
router.post('/logout', auth, logout);

module.exports = router;
