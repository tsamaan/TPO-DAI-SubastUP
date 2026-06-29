// routes/subastas.js

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const {
  calendario,
  subastasDia,
  subastasEspeciales,
  subastasComunes,
  buscarSubastas,
  detalleSubasta,
  linkStream,
} = require('../controllers/subastasController');

// Públicas (no requieren login)
router.get('/buscar',                  buscarSubastas);
router.get('/calendario',              calendario);
router.get('/del-dia',                 subastasDia);
router.get('/especiales',              subastasEspeciales);
router.get('/comunes',                 subastasComunes);
router.get('/:subastaId/detalle',      detalleSubasta);
router.get('/item/:itemId/link',       linkStream);

module.exports = router;
