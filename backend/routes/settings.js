const express = require('express');
const router  = express.Router();

router.get('/', (req, res) => {
  res.json({ ok: true, settings: { theme: 'LIGHT', preferredCurrency: 'ARS', notificationsEnabled: true } });
});

router.put('/', (req, res) => {
  res.json({ ok: true, message: 'Settings saved' });
});

module.exports = router;
