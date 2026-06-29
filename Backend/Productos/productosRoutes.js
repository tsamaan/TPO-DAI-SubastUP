// routes/productos.js

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const {
  cargarProducto,
  misProductos,
  misArticulosEnSubastas,
  detalleProducto,
  eliminarProducto,
  responderPropuesta,
  productosPendientes,
  aprobarProducto,
  rechazarProducto,
} = require('../controllers/productosController');

router.use(auth);

// Usuario
router.post('/',                          cargarProducto);
router.get('/mis-productos',              misProductos);
router.get('/mis-articulos-en-subastas',  misArticulosEnSubastas);
router.get('/:id',                        detalleProducto);
router.delete('/:id',                     eliminarProducto);
router.post('/:id/responder',             responderPropuesta);

// Revisor / Admin
router.get('/revision/pendientes',        productosPendientes);
router.put('/:id/aprobar',                aprobarProducto);
router.put('/:id/rechazar',               rechazarProducto);

module.exports = router;
