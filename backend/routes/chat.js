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

router.get('/unread-count',                 contadorSinLeer);
router.get('/',                             listarConversaciones);
router.get('/:chatId/messages',             getMensajes);
router.post('/:chatId/messages',            enviarMensaje);
router.post('/create/:productId',           crearConversacion);

module.exports = router;
