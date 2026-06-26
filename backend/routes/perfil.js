// routes/perfil.js

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { getPerfil, editarPerfil } = require('../controllers/perfilController');

router.use(auth);

router.get('/',  getPerfil);
router.put('/',  editarPerfil);

module.exports = router;
