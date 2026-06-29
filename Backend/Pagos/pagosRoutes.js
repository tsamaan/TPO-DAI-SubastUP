// routes/pagos.js

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const {
  listarMetodos,
  agregarTarjeta,
  agregarBanco,
  agregarCheque,
  eliminarMetodo,
  metodosPendientesVerificacion,
  verificarMetodo,
} = require('../controllers/pagosController');

router.use(auth);

// Usuario
router.get('/',              listarMetodos);
router.post('/tarjeta',      agregarTarjeta);
router.post('/banco',        agregarBanco);
router.post('/cheque',       agregarCheque);
router.delete('/:id',        eliminarMetodo);

// Revisor / Admin
router.get('/pendientes-verificacion',  metodosPendientesVerificacion);
router.put('/:id/verificar',            verificarMetodo);

module.exports = router;
