// controllers/devController.js
// Endpoints de desarrollo/demo: reiniciar la base al seed y verla en vivo.
// Protegidos por una clave simple (DEV_KEY) para evitar reseteos accidentales.

const prisma = require('../config/prisma');
const { resetAndSeed } = require('../prisma/seed_demo');

const DEV_KEY = process.env.DEV_KEY || 'subastup-demo';

function claveValida(req, res) {
  const key = req.query.clave || req.headers['x-dev-key'];
  if (key !== DEV_KEY) {
    res.status(403).json({ ok: false, message: 'Clave inválida. Usá ?clave=subastup-demo' });
    return false;
  }
  return true;
}

// POST /api/dev/reseed?clave=subastup-demo
// Trunca todo y vuelve a cargar los datos de prueba.
exports.reseed = async (req, res) => {
  if (!claveValida(req, res)) return;
  try {
    const resumen = await resetAndSeed(prisma);
    return res.json({
      ok: true,
      message: 'Base reiniciada con los datos de prueba.',
      resumen,
      cuentas: {
        staff: ['admin@subastup.com / Admin1234', 'revisor@subastup.com / Revisor1234'],
        demo: 'demo1..6@subastup.com / Demo1234',
        otras: ['vendedor@subastup.com', 'sinpago@subastup.com', 'pendiente@subastup.com', 'rechazado@subastup.com', 'bloqueado@subastup.com'].map((e) => `${e} / Demo1234`),
      },
    });
  } catch (err) {
    console.error('reseed error:', err);
    return res.status(500).json({ ok: false, message: 'Error al reiniciar la base.', detalle: err.message });
  }
};

// GET /api/dev/db?clave=subastup-demo
// Visor de solo lectura: conteos + usuarios + subastas (sin volcar imágenes).
exports.verDb = async (req, res) => {
  if (!claveValida(req, res)) return;
  try {
    const usuarios = await prisma.registros.findMany({
      select: { identificador: true, email: true, estado: true, rol: true, categoria: true },
      orderBy: { identificador: 'asc' },
    });

    const subastasRaw = await prisma.subastas.findMany({
      orderBy: { identificador: 'asc' },
      include: {
        catalogos: {
          include: {
            itemsCatalogo: {
              include: {
                productos: { include: { detalle: true } },
                detalle: true,
                pujos: { orderBy: { importe: 'desc' }, take: 1 },
              },
            },
          },
        },
      },
    });
    const subastas = subastasRaw.map((s) => {
      const it = s.catalogos?.[0]?.itemsCatalogo?.[0];
      return {
        subastaId: s.identificador,
        categoria: s.categoria,
        estado: s.estado,
        itemId: it?.identificador || null,
        articulo: it?.productos?.detalle?.nombre || null,
        precioBase: it?.precioBase || null,
        moneda: it?.detalle?.moneda || 'ARS',
        pujaActual: it?.pujos?.[0]?.importe || null,
        cerrado: it?.detalle?.cerrado || false,
      };
    });

    const counts = {};
    for (const modelo of ['personas', 'clientes', 'duenios', 'registros', 'metodosPago', 'subastas', 'productos', 'itemsCatalogo', 'asistentes', 'pujos']) {
      counts[modelo] = await prisma[modelo].count();
    }

    return res.json({ ok: true, counts, usuarios, subastas });
  } catch (err) {
    console.error('verDb error:', err);
    return res.status(500).json({ ok: false, message: 'Error al leer la base.', detalle: err.message });
  }
};
