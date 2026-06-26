// server.js
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const prisma  = require('./config/prisma');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',           require('./routes/auth'));
app.use('/api/users',          require('./routes/users'));
app.use('/api/auctions',       require('./routes/subastas'));
app.use('/api/products',       require('./routes/productos'));
app.use('/api/bids',           require('./routes/pujas'));
app.use('/api/chats',          require('./routes/chat'));
app.use('/api/notifications',  require('./routes/notificaciones'));
app.use('/api/settings/payment-methods', require('./routes/pagos'));
app.use('/api/settings',       require('./routes/settings'));
app.use('/api/help',           require('./routes/help'));
app.use('/api/dev',            require('./routes/dev'));

app.get('/health', (_req, res) => res.json({ ok: true, server: 'SubastaAPI', ts: new Date() }));

app.use((_req, res) => res.status(404).json({ ok: false, message: 'Ruta no encontrada.' }));

app.use((err, _req, res, _next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
});

(async () => {
  try {
    await prisma.$connect();
    console.log('✅  Conectado a PostgreSQL: subastup');
    app.listen(PORT, () => {
      console.log(`🚀  Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌  No se pudo conectar a la base de datos:', err.message);
    process.exit(1);
  }
})();
