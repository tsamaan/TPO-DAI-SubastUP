// routes/dev.js
// Endpoints de desarrollo/demo (protegidos por clave DEV_KEY).

const express = require('express');
const router  = express.Router();
const { reseed, verDb } = require('../controllers/devController');

// POST /api/dev/reseed?clave=subastup-demo  -> reinicia la base al seed
router.post('/reseed', reseed);

// GET  /api/dev/db?clave=subastup-demo       -> visor de la base
router.get('/db', verDb);

module.exports = router;
