// routes/pagos.js

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const {
  listarMetodos,
  agregarTarjeta,
  agregarBanco,
  agregarCheque,
  agregarMetodoGenerico,
  eliminarMetodo,
  metodosPendientesVerificacion,
  verificarMetodo,
} = require('../controllers/pagosController');

router.use(auth);

// Usuario
router.get('/',                          listarMetodos);
router.post('/',                         agregarMetodoGenerico);
router.post('/card',                     agregarTarjeta);
router.post('/bank',                     agregarBanco);
router.post('/check',                    agregarCheque);
router.delete('/:id',                    eliminarMetodo);

// Revisor / Admin
router.get('/pending-verification',      metodosPendientesVerificacion);
router.put('/:id/verify',                verificarMetodo);

module.exports = router;
