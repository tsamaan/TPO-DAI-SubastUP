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
  todosLosProductos,
  aprobarProducto,
  rechazarProducto,
  cambiarEstado,
} = require('../controllers/productosController');

router.use(auth);

// Usuario
router.post('/',                          cargarProducto);
router.get('/mine',                       misProductos);
router.get('/mine/confirmed',             misArticulosEnSubastas);
router.get('/pending-review',             productosPendientes);
router.put('/:id/respond',                responderPropuesta);

// Revisor / Admin
router.get('/',                           todosLosProductos);
router.put('/:id/approve',                aprobarProducto);
router.put('/:id/reject',                 rechazarProducto);
router.put('/:id/status',                 cambiarEstado);

router.get('/:id',                        detalleProducto);
router.delete('/:id',                     eliminarProducto);

module.exports = router;
