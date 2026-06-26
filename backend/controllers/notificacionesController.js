// controllers/notificacionesController.js
// @TASK: STUB PROVISORIO — este archivo no vino en ninguno de los dos ZIPs
// entregados, pero lo requieren chatController.js y routes/notificaciones.js.
// Implementa el contrato mínimo inferido de los call-sites + schema.prisma.
// PENDIENTE: revisión por Valentín antes de dar por cerrado el módulo.
//
// @RISK: crearNotificacion() recibe un campo `data` (ej. { conversacionId })
// desde chatController.js, pero el modelo Notificaciones de schema.prisma
// NO tiene columna para guardarlo. Acá se ignora (solo se loguea).
// Si el front necesita ese dato al tocar la notificación, hace falta
// agregar una columna (ej. `data Json?`) al modelo y migrar.

const prisma = require('../config/prisma');

// ─────────────────────────────────────────────────────────────
// Helper interno — NO es una ruta. La usan otros controllers
// (ej. chatController.js) para crear una notificación en DB.
// ─────────────────────────────────────────────────────────────
async function crearNotificacion({ personaId, titulo, mensaje, tipo, data }) {
  if (data) {
    console.warn('crearNotificacion: campo "data" descartado (sin columna en schema):', data);
  }
  return prisma.notificaciones.create({
    data: {
      persona: personaId,
      titulo,
      mensaje,
      tipo,
    },
  });
}
module.exports.crearNotificacion = crearNotificacion;

// ─────────────────────────────────────────────────────────────
// POST /api/notificaciones/token
// Body: { token }
// ─────────────────────────────────────────────────────────────
exports.guardarToken = async (req, res) => {
  try {
    const { personaId } = req.user;
    const { token } = req.body;

    if (!token)
      return res.status(400).json({ ok: false, message: 'token es requerido.' });

    const existente = await prisma.pushTokens.findFirst({
      where: { persona: personaId, token },
    });

    if (!existente) {
      await prisma.pushTokens.create({
        data: { persona: personaId, token, activo: true },
      });
    }

    return res.json({ ok: true, message: 'Token guardado.' });

  } catch (err) {
    console.error('guardarToken error:', err);
    return res.status(500).json({ ok: false, message: 'Error al guardar el token.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/notificaciones
// ─────────────────────────────────────────────────────────────
exports.listarNotificaciones = async (req, res) => {
  try {
    const { personaId } = req.user;

    const notificaciones = await prisma.notificaciones.findMany({
      where:   { persona: personaId },
      orderBy: { fecha: 'desc' },
      take:    50,
    });

    return res.json({ ok: true, notificaciones });

  } catch (err) {
    console.error('listarNotificaciones error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener las notificaciones.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/notificaciones/sin-leer
// ─────────────────────────────────────────────────────────────
exports.contadorSinLeer = async (req, res) => {
  try {
    const { personaId } = req.user;

    const total = await prisma.notificaciones.count({
      where: { persona: personaId, leido: false },
    });

    return res.json({ ok: true, total });

  } catch (err) {
    console.error('contadorSinLeer error:', err);
    return res.status(500).json({ ok: false, message: 'Error al contar notificaciones sin leer.' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/notificaciones/:id/leer
// ─────────────────────────────────────────────────────────────
exports.marcarLeida = async (req, res) => {
  try {
    const { personaId } = req.user;
    const id = parseInt(req.params.id);

    const notif = await prisma.notificaciones.findFirst({
      where: { identificador: id, persona: personaId },
    });

    if (!notif)
      return res.status(404).json({ ok: false, message: 'Notificación no encontrada.' });

    await prisma.notificaciones.update({
      where: { identificador: id },
      data:  { leido: true },
    });

    return res.json({ ok: true, message: 'Notificación marcada como leída.' });

  } catch (err) {
    console.error('marcarLeida error:', err);
    return res.status(500).json({ ok: false, message: 'Error al marcar la notificación.' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/notificaciones/leer-todas
// ─────────────────────────────────────────────────────────────
exports.marcarTodasLeidas = async (req, res) => {
  try {
    const { personaId } = req.user;

    await prisma.notificaciones.updateMany({
      where: { persona: personaId, leido: false },
      data:  { leido: true },
    });

    return res.json({ ok: true, message: 'Todas las notificaciones marcadas como leídas.' });

  } catch (err) {
    console.error('marcarTodasLeidas error:', err);
    return res.status(500).json({ ok: false, message: 'Error al marcar las notificaciones.' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/notificaciones/:id
// Elimina una notificación del usuario logueado.
// ─────────────────────────────────────────────────────────────
exports.eliminarNotificacion = async (req, res) => {
  try {
    const { personaId } = req.user;
    const id = parseInt(req.params.id);

    const notif = await prisma.notificaciones.findFirst({
      where: { identificador: id, persona: personaId },
    });

    if (!notif)
      return res.status(404).json({ ok: false, message: 'Notificación no encontrada.' });

    await prisma.notificaciones.delete({
      where: { identificador: id },
    });

    return res.json({ ok: true, message: 'Notificación eliminada.' });

  } catch (err) {
    console.error('eliminarNotificacion error:', err);
    return res.status(500).json({ ok: false, message: 'Error al eliminar la notificación.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/notificaciones/suscribir/:subastaId
// ─────────────────────────────────────────────────────────────
exports.suscribirSubasta = async (req, res) => {
  try {
    const { personaId } = req.user;
    const subastaId = parseInt(req.params.auctionId);
    const subasta = await prisma.subastas.findFirst({
      where: { identificador: subastaId },
      include: {
        catalogos: {
          take: 1,
          include: {
            itemsCatalogo: {
              take: 1,
              include: {
                productos: { include: { detalle: true } },
              },
            },
          },
        },
      },
    });

    if (!subasta)
      return res.status(404).json({ ok: false, message: 'Subasta no encontrada.' });

    const articulo = subasta.catalogos?.[0]?.itemsCatalogo?.[0]?.productos?.detalle?.nombre || 'la subasta';

    const existente = await prisma.suscripcionesSubasta.findFirst({
      where: { persona: personaId, subasta: subastaId },
    });

    if (existente) {
      return res.json({
        ok: true,
        message: `Ya tenías un recordatorio para ${articulo}.`,
      });
    }

    await prisma.suscripcionesSubasta.create({
      data: { persona: personaId, subasta: subastaId },
    });

    await prisma.notificaciones.create({
      data: {
        persona: personaId,
        titulo: 'Recordatorio agregado',
        mensaje: `Recordatorio de ${articulo} agregado correctamente.`,
        tipo: 'recordatorio_subasta',
      },
    });

    return res.status(201).json({
      ok: true,
      message: `Recordatorio de ${articulo} agregado correctamente.`,
    });

  } catch (err) {
    console.error('suscribirSubasta error:', err);
    return res.status(500).json({ ok: false, message: 'Error al suscribirse a la subasta.' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/notificaciones/suscribir/:subastaId
// ─────────────────────────────────────────────────────────────
exports.cancelarSuscripcion = async (req, res) => {
  try {
    const { personaId } = req.user;
    const subastaId = parseInt(req.params.auctionId);

    const existente = await prisma.suscripcionesSubasta.findFirst({
      where: { persona: personaId, subasta: subastaId },
    });

    if (!existente)
      return res.status(404).json({ ok: false, message: 'No estabas suscripto.' });

    await prisma.suscripcionesSubasta.delete({
      where: { identificador: existente.identificador },
    });

    return res.json({ ok: true, message: 'Suscripción cancelada.' });

  } catch (err) {
    console.error('cancelarSuscripcion error:', err);
    return res.status(500).json({ ok: false, message: 'Error al cancelar la suscripción.' });
  }
};
