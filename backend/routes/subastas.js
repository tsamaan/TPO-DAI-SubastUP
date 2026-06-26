// routes/subastas.js

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const {
  calendario,
  subastasDia,
  detalleSubasta,
  linkStream,
  obtenerSubastas,
  sugerenciasBusqueda,
  uploadImagesCompat,
} = require('../controllers/subastasController');
const { cargarProducto, responderPropuesta } = require('../controllers/productosController');

// Públicas (no requieren login)
router.get('/',                        obtenerSubastas);
router.get('/calendar',                calendario);
router.get('/today',                   subastasDia);
router.get('/search/suggestions',      sugerenciasBusqueda);
router.post('/upload-images', auth,    uploadImagesCompat);
router.get('/:id',                     detalleSubasta);
router.get('/:id/share-link',          linkStream);

// Privadas
router.post('/', auth, cargarProducto);
router.patch('/:id/status', auth, responderPropuesta);

module.exports = router;
