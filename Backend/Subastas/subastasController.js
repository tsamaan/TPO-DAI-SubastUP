// controllers/subastasController.js
// Subastas — Prisma + PostgreSQL

const prisma = require('../config/prisma');

// ── Helper: armar resultado de subasta ────────────────────────
function formatearSubasta(s) {
  const item    = s.catalogos?.[0]?.itemsCatalogo?.[0];
  const foto    = item?.productos?.fotos?.[0]?.foto;
  return {
    subastaId:      s.identificador,
    fecha:          s.fecha,
    hora:           s.hora,
    ubicacion:      s.ubicacion,
    categoria:      s.categoria,
    estado:         s.estado,
    nombreArticulo: item?.productos?.nombre || null,
    moneda:         item?.moneda || 'ARS',
    portada:        foto ? Buffer.from(foto).toString('base64') : null,
  };
}

// ── Include reutilizable para obtener portada + moneda + nombre
const includePortada = {
  catalogos: {
    include: {
      itemsCatalogo: {
        take: 1,
        include: {
          productos: {
            include: { fotos: { take: 1 } },
          },
        },
      },
    },
    take: 1,
  },
};

// ─────────────────────────────────────────────────────────────
// GET /api/subastas/calendario?mes=9&anio=2025
// Devuelve los días del mes que tienen subastas
// ─────────────────────────────────────────────────────────────
exports.calendario = async (req, res) => {
  try {
    const mes  = parseInt(req.query.mes)  || new Date().getMonth() + 1;
    const anio = parseInt(req.query.anio) || new Date().getFullYear();

    const desde = new Date(anio, mes - 1, 1);
    const hasta = new Date(anio, mes, 1);

    const subastas = await prisma.subastas.findMany({
      where: { fecha: { gte: desde, lt: hasta }, estado: 'abierta' },
      select: { fecha: true },
    });

    const dias = [...new Set(subastas.map((s) => new Date(s.fecha).getDate()))];

    return res.json({ ok: true, dias });

  } catch (err) {
    console.error('calendario error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener el calendario.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/subastas/del-dia?fecha=2025-09-09
// Devuelve las subastas de un día con portada, moneda y nombre
// ─────────────────────────────────────────────────────────────
exports.subastasDia = async (req, res) => {
  try {
    const { fecha } = req.query;

    if (!fecha)
      return res.status(400).json({ ok: false, message: 'La fecha es requerida.' });

    const dia   = new Date(fecha);
    const desde = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
    const hasta = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1);

    const subastas = await prisma.subastas.findMany({
      where:   { fecha: { gte: desde, lt: hasta }, estado: 'abierta' },
      include: includePortada,
    });

    return res.json({ ok: true, subastas: subastas.map(formatearSubasta) });

  } catch (err) {
    console.error('subastasDia error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener las subastas del día.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/subastas/especiales
// Lista subastas especiales para el home
// ─────────────────────────────────────────────────────────────
exports.subastasEspeciales = async (req, res) => {
  try {
    const subastas = await prisma.subastas.findMany({
      where:   { estado: 'abierta', categoria: { in: ['especial', 'plata', 'oro', 'platino'] } },
      orderBy: { fecha: 'asc' },
      take:    10,
      include: includePortada,
    });

    return res.json({ ok: true, subastas: subastas.map(formatearSubasta) });

  } catch (err) {
    console.error('subastasEspeciales error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener subastas especiales.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/subastas/comunes
// Lista subastas comunes para el home
// ─────────────────────────────────────────────────────────────
exports.subastasComunes = async (req, res) => {
  try {
    const subastas = await prisma.subastas.findMany({
      where:   { estado: 'abierta', categoria: 'comun' },
      orderBy: { fecha: 'asc' },
      take:    10,
      include: includePortada,
    });

    return res.json({ ok: true, subastas: subastas.map(formatearSubasta) });

  } catch (err) {
    console.error('subastasComunes error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener subastas comunes.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/subastas/buscar?q=mueble
// Búsqueda de subastas por nombre del producto (auth o no)
// ─────────────────────────────────────────────────────────────
exports.buscarSubastas = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2)
      return res.status(400).json({ ok: false, message: 'Ingresá al menos 2 caracteres para buscar.' });

    const subastas = await prisma.subastas.findMany({
      where: {
        estado: { in: ['abierta'] },
        catalogos: {
          some: {
            itemsCatalogo: {
              some: {
                productos: {
                  nombre: { contains: q.trim(), mode: 'insensitive' },
                },
              },
            },
          },
        },
      },
      include: {
        catalogos: {
          include: {
            itemsCatalogo: {
              where: {
                productos: {
                  nombre: { contains: q.trim(), mode: 'insensitive' },
                },
              },
              include: {
                productos: {
                  include: { fotos: { take: 1 } },
                },
              },
            },
          },
        },
      },
      orderBy: { fecha: 'asc' },
      take:    20,
    });

    const resultado = subastas.flatMap((s) =>
      s.catalogos.flatMap((c) =>
        c.itemsCatalogo.map((item) => {
          const foto = item.productos?.fotos?.[0]?.foto;
          return {
            subastaId:      s.identificador,
            fecha:          s.fecha,
            hora:           s.hora,
            ubicacion:      s.ubicacion,
            categoria:      s.categoria,
            estado:         s.estado,
            nombreArticulo: item.productos?.nombre || null,
            moneda:         item.moneda || 'ARS',
            productoId:     item.productos?.identificador,
            portada:        foto ? Buffer.from(foto).toString('base64') : null,
          };
        })
      )
    );

    return res.json({ ok: true, resultados: resultado });

  } catch (err) {
    console.error('buscarSubastas error:', err);
    return res.status(500).json({ ok: false, message: 'Error al buscar subastas.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/subastas/:subastaId/detalle
// Info de la subasta + artículos incluidos (modal "Información")
// ─────────────────────────────────────────────────────────────
exports.detalleSubasta = async (req, res) => {
  try {
    const subastaId = parseInt(req.params.subastaId);

    const subasta = await prisma.subastas.findFirst({
      where: { identificador: subastaId },
      include: {
        catalogos: {
          include: {
            itemsCatalogo: {
              include: {
                productos: {
                  select: { identificador: true, nombre: true },
                },
              },
            },
          },
        },
      },
    });

    if (!subasta)
      return res.status(404).json({ ok: false, message: 'Subasta no encontrada.' });

    const articulos = subasta.catalogos.flatMap((c) =>
      c.itemsCatalogo.map((item) => ({
        itemId:     item.identificador,
        productoId: item.productos?.identificador,
        nombre:     item.productos?.nombre,
        precioBase: item.precioBase,
        moneda:     item.moneda,
      }))
    );

    return res.json({
      ok: true,
      subasta: {
        subastaId: subasta.identificador,
        fecha:     subasta.fecha,
        hora:      subasta.hora,
        ubicacion: subasta.ubicacion,
        categoria: subasta.categoria,
        estado:    subasta.estado,
        articulos,
      },
    });

  } catch (err) {
    console.error('detalleSubasta error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener el detalle de la subasta.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/subastas/item/:itemId/link
// Devuelve el link de stream del ítem (icono enlace)
// ─────────────────────────────────────────────────────────────
exports.linkStream = async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);

    const item = await prisma.itemsCatalogo.findFirst({
      where:  { identificador: itemId },
      select: { linkStream: true },
    });

    if (!item)
      return res.status(404).json({ ok: false, message: 'Ítem no encontrado.' });

    if (!item.linkStream)
      return res.status(404).json({ ok: false, message: 'Esta subasta todavía no tiene un link de stream asignado.' });

    return res.json({ ok: true, linkStream: item.linkStream });

  } catch (err) {
    console.error('linkStream error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener el link de stream.' });
  }
};
