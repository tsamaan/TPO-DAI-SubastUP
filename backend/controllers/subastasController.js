// controllers/subastasController.js
// Subastas — Prisma + PostgreSQL

const prisma = require('../config/prisma');
const { bufferImagenABase64 } = require('../utils/imagenes');
const { estadoEfectivoSubasta } = require('../utils/estadoSubasta');

const ESTADOS_SUBASTA_VISIBLES = ['abierta', 'activa', 'activo', 'programada', 'proximamente', 'pendiente'];

// ── Helper: armar resultado de subasta ────────────────────────
function formatearSubasta(s) {
  const item    = s.catalogos?.[0]?.itemsCatalogo?.[0];
  const foto    = item?.productos?.fotos?.[0]?.foto;
  const cerrado = Boolean(item?.detalle?.cerrado);
  return {
    subastaId:      s.identificador,
    itemId:         item?.identificador || null,
    productoId:     item?.producto || item?.productos?.identificador || null,
    fecha:          s.fecha,
    hora:           s.hora,
    ubicacion:      s.ubicacion,
    categoria:      s.categoria,
    // El cierre de SubastUP marca el ítem como cerrado pero no cambia
    // subasta.estado; derivamos 'finalizada' para que la lista muestre el tag.
    estado:         estadoEfectivoSubasta(s, cerrado),
    cerrado,
    nombreArticulo: item?.productos?.detalle?.nombre || null,
    descripcionArticulo: item?.productos?.descripcionCompleta || item?.productos?.descripcionCatalogo || null,
    moneda:         item?.detalle?.moneda || 'ARS',
    precioBase:     item?.precioBase || null,
    portada:        bufferImagenABase64(foto),
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
            include: { fotos: { take: 1 }, detalle: true },
          },
          detalle: true,
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
    const mes  = parseInt(req.query.mes || req.query.month)  || new Date().getMonth() + 1;
    const anio = parseInt(req.query.anio || req.query.year) || new Date().getFullYear();

    const desde = new Date(anio, mes - 1, 1);
    const hasta = new Date(anio, mes, 1);

    const subastas = await prisma.subastas.findMany({
      where: { fecha: { gte: desde, lt: hasta }, estado: { in: ESTADOS_SUBASTA_VISIBLES } },
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
      include: includePortada,
    });

    const dias = [...new Set(subastas.map((s) => new Date(s.fecha).getDate()))];

    return res.json({ ok: true, dias, subastas: subastas.map(formatearSubasta) });

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
      where:   { fecha: { gte: desde, lt: hasta }, estado: { in: ESTADOS_SUBASTA_VISIBLES } },
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
      where:   { estado: { in: ESTADOS_SUBASTA_VISIBLES }, categoria: { in: ['especial', 'plata', 'oro', 'platino'] } },
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
      where:   { estado: { in: ESTADOS_SUBASTA_VISIBLES }, categoria: 'comun' },
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
    const { q, category, tipo } = req.query;

    if (!q || q.trim().length < 2)
      return res.status(400).json({ ok: false, message: 'Ingresá al menos 2 caracteres para buscar.' });

    const whereSubasta = {
      estado: { in: ESTADOS_SUBASTA_VISIBLES },
      catalogos: {
        some: {
          itemsCatalogo: {
            some: {
              productos: {
                detalle: { is: { nombre: { contains: q.trim(), mode: 'insensitive' } } },
              },
            },
          },
        },
      },
    };

    if (category) {
      whereSubasta.categoria = String(category).toLowerCase();
    } else if (tipo === 'especial') {
      whereSubasta.categoria = { in: ['especial', 'plata', 'oro', 'platino'] };
    }

    const subastas = await prisma.subastas.findMany({
      where: {
        ...whereSubasta,
      },
      include: {
        catalogos: {
          include: {
            itemsCatalogo: {
              where: {
                productos: {
                  detalle: { is: { nombre: { contains: q.trim(), mode: 'insensitive' } } },
                },
              },
              include: {
                productos: {
                  include: { fotos: { take: 1 }, detalle: true },
                },
                detalle: true,
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
            estado:         estadoEfectivoSubasta(s, false),
            nombreArticulo: item.productos?.detalle?.nombre || null,
            moneda:         item.detalle?.moneda || 'ARS',
            productoId:     item.productos?.identificador,
            itemId:         item.identificador,
            precioBase:     item.precioBase || null,
            portada:        bufferImagenABase64(foto),
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
    const subastaId = parseInt(req.params.id);

    const subasta = await prisma.subastas.findFirst({
      where: { identificador: subastaId },
      include: {
        catalogos: {
          include: {
            itemsCatalogo: {
              include: {
                productos: {
                  select: { identificador: true, detalle: true },
                },
                detalle: true,
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
        nombre:     item.productos?.detalle?.nombre || 'Producto',
        precioBase: item.precioBase,
        moneda:     item.detalle?.moneda || 'ARS',
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
        estado:    estadoEfectivoSubasta(subasta, false),
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
      include: { detalle: true },
    });

    if (!item)
      return res.status(404).json({ ok: false, message: 'Ítem no encontrado.' });

    if (!item.detalle?.linkStream)
      return res.status(404).json({ ok: false, message: 'Esta subasta todavía no tiene un link de stream asignado.' });

    return res.json({ ok: true, linkStream: item.detalle.linkStream });

  } catch (err) {
    console.error('linkStream error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener el link de stream.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/auctions/search/suggestions?q=texto
// Alias compatible con la primera entrega para sugerencias de búsqueda.
// ─────────────────────────────────────────────────────────────
exports.sugerenciasBusqueda = async (req, res) => {
  try {
    const q = String(req.query.q || req.query.search || '').trim();
    if (q.length < 2) return res.json({ ok: true, suggestions: [] });

    const productos = await prisma.productosDetalle.findMany({
      where: { nombre: { contains: q, mode: 'insensitive' } },
      take: 10,
      orderBy: { nombre: 'asc' },
      select: { nombre: true, producto: true },
    });

    return res.json({
      ok: true,
      suggestions: productos.map((p) => ({
        productoId: p.producto,
        nombre: p.nombre,
      })),
    });
  } catch (err) {
    console.error('sugerenciasBusqueda error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener sugerencias.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auctions/upload-images
// Alias compatible: valida imágenes base64 sin crear tablas nuevas.
// La persistencia real de fotos ocurre al cargar producto/subasta.
// ─────────────────────────────────────────────────────────────
exports.uploadImagesCompat = async (req, res) => {
  try {
    const fotos = Array.isArray(req.body?.fotos)
      ? req.body.fotos
      : Array.isArray(req.body?.fotosBase64)
        ? req.body.fotosBase64
        : [];

    if (!fotos.length)
      return res.status(400).json({ ok: false, message: 'Debe enviar al menos una imagen.' });

    if (fotos.length > 12)
      return res.status(400).json({ ok: false, message: 'Máximo 12 imágenes.' });

    return res.json({
      ok: true,
      message: 'Imágenes recibidas. La persistencia se realiza al crear el producto.',
      cantidad: fotos.length,
    });
  } catch (err) {
    console.error('uploadImagesCompat error:', err);
    return res.status(500).json({ ok: false, message: 'Error al procesar imágenes.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/auctions
// Consolidación de buscar, especiales y comunes
// ─────────────────────────────────────────────────────────────
exports.obtenerSubastas = async (req, res) => {
  try {
    const { category, search, status, tipo, currency, page, size } = req.query;

    if (search && search.trim().length >= 2) {
      req.query.q = search;
      return exports.buscarSubastas(req, res);
    }

    const where = status ? { estado: status } : { estado: { in: ESTADOS_SUBASTA_VISIBLES } };
    if (category) {
      where.categoria = String(category).toLowerCase();
    } else if (tipo === 'especial') {
      where.categoria = { in: ['especial', 'plata', 'oro', 'platino'] };
    }

    const subastas = await prisma.subastas.findMany({
      where,
      orderBy: { fecha: 'asc' },
      take:    parseInt(size) || 20,
      include: includePortada,
    });

    return res.json({ ok: true, subastas: subastas.map(formatearSubasta) });

  } catch (err) {
    console.error('obtenerSubastas error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener subastas.' });
  }
};
