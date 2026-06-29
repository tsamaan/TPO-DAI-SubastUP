// routes/estadisticas.js

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const {
  getEstadisticas,
  getEvolucion,
  getHistorialPujas,
} = require('../controllers/estadisticasController');

router.use(auth);

router.get('/',            getEstadisticas);
router.get('/evolucion',   getEvolucion);
router.get('/historial',   getHistorialPujas);

module.exports = router;
