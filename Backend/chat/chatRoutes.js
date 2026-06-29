// routes/chat.js

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const {
  listarConversaciones,
  getMensajes,
  enviarMensaje,
  crearConversacion,
  contadorSinLeer,
} = require('../controllers/chatController');

router.use(auth);

router.get('/sin-leer',                     contadorSinLeer);
router.get('/',                             listarConversaciones);
router.get('/:conversacionId',              getMensajes);
router.post('/:conversacionId/mensaje',     enviarMensaje);
router.post('/crear/:productoId',           crearConversacion);

module.exports = router;
