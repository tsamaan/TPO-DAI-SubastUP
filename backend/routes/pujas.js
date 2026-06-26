// routes/pujas.js

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { getEstadoPuja, pujar } = require('../controllers/pujasController');

// GET público (para ver la puja sin estar logueado)
router.get('/:itemId/status', getEstadoPuja);

// POST requiere login
router.post('/', auth, pujar);

module.exports = router;
