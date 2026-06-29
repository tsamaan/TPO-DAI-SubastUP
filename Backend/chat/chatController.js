// controllers/chatController.js
// Chat entre dueño del bien y empleado de la empresa — Prisma + PostgreSQL

const prisma = require('../config/prisma');
const { crearNotificacion } = require('./notificacionesController');

// ─────────────────────────────────────────────────────────────
// GET /api/chat
// Lista todas las conversaciones del usuario logueado
// ─────────────────────────────────────────────────────────────
exports.listarConversaciones = async (req, res) => {
  try {
    const { personaId } = req.user;

    const conversaciones = await prisma.conversaciones.findMany({
      where: {
        OR: [
          { duenio:   personaId },
          { empleado: personaId },
        ],
      },
      include: {
        productos: {
          select: {
            nombre: true,
            fotos:  { take: 1 },
          },
        },
        mensajes: {
          orderBy: { fecha: 'desc' },
          take:    1,
        },
      },
      orderBy: { fechaCreacion: 'desc' },
    });

    const resultado = conversaciones.map((c) => {
      const foto         = c.productos?.fotos?.[0]?.foto;
      const ultimoMensaje = c.mensajes?.[0];

      // Contar mensajes no leídos para este usuario
      return {
        conversacionId:  c.identificador,
        productoId:      c.producto,
        nombreProducto:  c.productos?.nombre,
        portada:         foto ? Buffer.from(foto).toString('base64') : null,
        estado:          c.estado,
        ultimoMensaje:   ultimoMensaje?.texto || null,
        ultimaFecha:     ultimoMensaje?.fecha  || c.fechaCreacion,
        sinLeer:         c.mensajes?.filter(
          (m) => !m.leido && m.emisor !== personaId
        ).length || 0,
      };
    });

    return res.json({ ok: true, conversaciones: resultado });

  } catch (err) {
    console.error('listarConversaciones error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener las conversaciones.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/chat/:conversacionId
// Obtiene los mensajes de una conversación
// ─────────────────────────────────────────────────────────────
exports.getMensajes = async (req, res) => {
  try {
    const { personaId }     = req.user;
    const conversacionId    = parseInt(req.params.conversacionId);

    // Verificar que el usuario pertenece a esta conversación
    const conversacion = await prisma.conversaciones.findFirst({
      where: {
        identificador: conversacionId,
        OR: [
          { duenio:   personaId },
          { empleado: personaId },
        ],
      },
      include: {
        productos: {
          select: { nombre: true },
        },
      },
    });

    if (!conversacion)
      return res.status(404).json({ ok: false, message: 'Conversación no encontrada.' });

    const mensajes = await prisma.mensajes.findMany({
      where:   { conversacion: conversacionId },
      orderBy: { fecha: 'asc' },
    });

    // Marcar como leídos los mensajes que no son del usuario
    await prisma.mensajes.updateMany({
      where: {
        conversacion: conversacionId,
        emisor:       { not: personaId },
        leido:        false,
      },
      data: { leido: true },
    });

    const resultado = mensajes.map((m) => ({
      mensajeId: m.identificador,
      texto:     m.texto,
      imagen:    m.imagen ? Buffer.from(m.imagen).toString('base64') : null,
      fecha:     m.fecha,
      esMio:     m.emisor === personaId,
      leido:     m.leido,
    }));

    return res.json({
      ok:           true,
      conversacion: {
        id:             conversacion.identificador,
        nombreProducto: conversacion.productos?.nombre,
        estado:         conversacion.estado,
      },
      mensajes: resultado,
    });

  } catch (err) {
    console.error('getMensajes error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener los mensajes.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/chat/:conversacionId/mensaje
// Envía un mensaje en una conversación
// Body: { texto?, imagenBase64? }
// ─────────────────────────────────────────────────────────────
exports.enviarMensaje = async (req, res) => {
  try {
    const { personaId }  = req.user;
    const conversacionId = parseInt(req.params.conversacionId);
    const { texto, imagenBase64 } = req.body;

    if (!texto && !imagenBase64)
      return res.status(400).json({ ok: false, message: 'Debés enviar un texto o una imagen.' });

    // Verificar que el usuario pertenece a esta conversación
    const conversacion = await prisma.conversaciones.findFirst({
      where: {
        identificador: conversacionId,
        estado:        'activo',
        OR: [
          { duenio:   personaId },
          { empleado: personaId },
        ],
      },
    });

    if (!conversacion)
      return res.status(404).json({ ok: false, message: 'Conversación no encontrada o cerrada.' });

    // Convertir imagen si viene en base64
    const imagenBuffer = imagenBase64
      ? Buffer.from(imagenBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      : null;

    const mensaje = await prisma.mensajes.create({
      data: {
        conversacion: conversacionId,
        emisor:       personaId,
        texto:        texto || null,
        imagen:       imagenBuffer,
        leido:        false,
      },
    });

    // Notificar al otro participante
    const destinatario = conversacion.duenio === personaId
      ? conversacion.empleado
      : conversacion.duenio;

    try {
      await crearNotificacion({
        personaId: destinatario,
        titulo:    'Nuevo mensaje',
        mensaje:   texto ? texto.substring(0, 80) : '📷 Imagen',
        tipo:      'mensaje_nuevo',
        data:      { conversacionId },
      });
    } catch (notifErr) {
      console.error('Error enviando notificación de mensaje:', notifErr.message);
    }

    return res.status(201).json({
      ok:        true,
      message:   'Mensaje enviado.',
      mensajeId: mensaje.identificador,
      fecha:     mensaje.fecha,
    });

  } catch (err) {
    console.error('enviarMensaje error:', err);
    return res.status(500).json({ ok: false, message: 'Error al enviar el mensaje.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/chat/crear/:productoId  (solo empleado)
// Crea una conversación con el dueño de un producto
// Body: { texto } → primer mensaje informando el importe
// ─────────────────────────────────────────────────────────────
exports.crearConversacion = async (req, res) => {
  try {
    const { personaId, rol } = req.user;
    const productoId         = parseInt(req.params.productoId);
    const { texto }          = req.body;

    if (rol !== 'revisor' && rol !== 'admin')
      return res.status(403).json({ ok: false, message: 'Solo empleados pueden iniciar conversaciones.' });

    if (!texto)
      return res.status(400).json({ ok: false, message: 'El mensaje inicial es obligatorio.' });

    // Obtener el producto y su dueño
    const producto = await prisma.productos.findFirst({
      where: { identificador: productoId },
    });

    if (!producto)
      return res.status(404).json({ ok: false, message: 'Producto no encontrado.' });

    // Verificar que no exista ya una conversación para este producto
    const existe = await prisma.conversaciones.findFirst({
      where: { producto: productoId },
    });

    if (existe)
      return res.status(409).json({
        ok:              false,
        message:         'Ya existe una conversación para este producto.',
        conversacionId:  existe.identificador,
      });

    // Crear conversación + primer mensaje en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversaciones.create({
        data: {
          producto: productoId,
          duenio:   producto.duenio,
          empleado: personaId,
          estado:   'activo',
        },
      });

      await tx.mensajes.create({
        data: {
          conversacion: conv.identificador,
          emisor:       personaId,
          texto,
          leido:        false,
        },
      });

      return conv;
    });

    // Notificar al dueño
    try {
      await crearNotificacion({
        personaId: producto.duenio,
        titulo:    'Nuevo mensaje de SubastUp',
        mensaje:   texto.substring(0, 80),
        tipo:      'mensaje_nuevo',
        data:      { conversacionId: resultado.identificador },
      });
    } catch (notifErr) {
      console.error('Error enviando notificación:', notifErr.message);
    }

    return res.status(201).json({
      ok:             true,
      message:        'Conversación creada.',
      conversacionId: resultado.identificador,
    });

  } catch (err) {
    console.error('crearConversacion error:', err);
    return res.status(500).json({ ok: false, message: 'Error al crear la conversación.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/chat/sin-leer
// Contador de mensajes no leídos para el ícono del sobre
// ─────────────────────────────────────────────────────────────
exports.contadorSinLeer = async (req, res) => {
  try {
    const { personaId } = req.user;

    const cantidad = await prisma.mensajes.count({
      where: {
        leido:  false,
        emisor: { not: personaId },
        conversaciones: {
          OR: [
            { duenio:   personaId },
            { empleado: personaId },
          ],
        },
      },
    });

    return res.json({ ok: true, cantidad });

  } catch (err) {
    console.error('contadorSinLeer error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener el contador.' });
  }
};
