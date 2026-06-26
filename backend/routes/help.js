const express = require('express');
const router  = express.Router();

router.get('/faq', (req, res) => {
  res.json({
    ok: true,
    faq: [
      { id: 1, question: '¿Cómo pujo?', answer: 'Ingresá a una subasta y usá el botón pujar.' },
      { id: 2, question: '¿Cómo cargo un producto?', answer: 'Dirigite a "Cargar Producto" desde el menú principal.' }
    ]
  });
});

module.exports = router;
