const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { getPerfil, editarPerfil } = require('../controllers/perfilController');
const { getHistorialPujas, getEstadisticas, getEvolucion } = require('../controllers/estadisticasController');
const { misProductos, misArticulosEnSubastas } = require('../controllers/productosController');

router.use(auth);

router.get('/me', getPerfil);
router.put('/me', editarPerfil);
router.get('/me/bids', getHistorialPujas);
router.get('/me/stats', getEstadisticas);
router.get('/me/stats/evolution', getEvolucion);
router.get('/me/auctions', misProductos);
router.get('/me/auctions/confirmed', misArticulosEnSubastas);

module.exports = router;
