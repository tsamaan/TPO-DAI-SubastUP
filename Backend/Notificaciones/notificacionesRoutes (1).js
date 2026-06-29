// routes/notificaciones.js

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const {
  guardarToken,
  listarNotificaciones,
  contadorSinLeer,
  marcarLeida,
  marcarTodasLeidas,
  suscribirSubasta,
  cancelarSuscripcion,
} = require('../controllers/notificacionesController');

router.use(auth);

router.post('/token',                       guardarToken);
router.get('/',                             listarNotificaciones);
router.get('/sin-leer',                     contadorSinLeer);
router.put('/leer-todas',                   marcarTodasLeidas);
router.put('/:id/leer',                     marcarLeida);
router.post('/suscribir/:subastaId',        suscribirSubasta);
router.delete('/suscribir/:subastaId',      cancelarSuscripcion);

module.exports = router;
