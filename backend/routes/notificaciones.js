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
  eliminarNotificacion,
  suscribirSubasta,
  cancelarSuscripcion,
} = require('../controllers/notificacionesController');

router.use(auth);

router.post('/push-token',                  guardarToken);
router.get('/',                             listarNotificaciones);
router.get('/unread-count',                 contadorSinLeer);
router.patch('/read-all',                   marcarTodasLeidas);
router.patch('/:id/read',                   marcarLeida);
router.post('/subscribe/:auctionId',        suscribirSubasta);
router.delete('/subscribe/:auctionId',      cancelarSuscripcion);
router.delete('/:id',                       eliminarNotificacion);

module.exports = router;
