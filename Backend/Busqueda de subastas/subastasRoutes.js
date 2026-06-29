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
} = require('../controllers/subastasController');

// Públicas (no requieren login)
router.get('/buscar',      buscarSubastas);
router.get('/calendario',  calendario);
router.get('/del-dia',     subastasDia);
router.get('/especiales',  subastasEspeciales);
router.get('/comunes',     subastasComunes);

module.exports = router;
