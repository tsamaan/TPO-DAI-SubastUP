// controllers/pujasController.js
// Pujas en tiempo real — Prisma + PostgreSQL

const prisma = require('../config/prisma');

const TIMER_SEGUNDOS = 60;

// Mínimo: puja actual + 1% del valor base
// Máximo: puja actual + 20% del valor base
// Estos límites NO aplican para categorías oro y platino
const MINIMO_PORCENTAJE_VALOR_BASE = 0.01;
const MAXIMO_PORCENTAJE_VALOR_BASE = 0.20;
const CATEGORIAS_SIN_LIMITE = ['oro', 'platino'];

// Orden de jerarquía de categorías (mayor índice = más alta)
const ORDEN_CATEGORIAS = ['comun', 'especial', 'plata', 'oro', 'platino'];

function categoriaAlcanza(categoriaUsuario, categoriaSubasta) {
  const idxUsuario = ORDEN_CATEGORIAS.indexOf(categoriaUsuario);
  const idxSubasta = ORDEN_CATEGORIAS.indexOf(categoriaSubasta);
  return idxUsuario >= idxSubasta;
}

// ─────────────────────────────────────────────────────────────
// GET /api/pujas/:itemId
// Devuelve la puja más alta y el tiempo restante
// Se llama cada 60 segundos desde el frontend (polling)
// ─────────────────────────────────────────────────────────────
exports.getEstadoPuja = async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);

    const item = await prisma.itemsCatalogo.findFirst({
      where: { identificador: itemId },
      include: {
        productos: {
          select: {
            nombre:             true,
            descripcionCompleta: true,
            fotos:              { take: 3 },
          },
        },
        pujos: {
          orderBy: { importe: 'desc' },
          take:    1,
          include: {
            asistentes: {
              include: {
                clientes: {
                  include: {
                    personas: { select: { nombre: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!item)
      return res.status(404).json({ ok: false, message: 'Ítem no encontrado.' });

    if (item.cerrado)
      return res.json({
        ok:          true,
        cerrado:     true,
        message:     'Esta subasta ya finalizó.',
        pujaActual:  item.pujos[0]?.importe || item.precioBase,
        moneda:      item.moneda,
      });

    // Calcular tiempo restante
    let tiempoRestante = TIMER_SEGUNDOS;
    if (item.ultimaPuja) {
      const segundosTranscurridos = Math.floor(
        (Date.now() - new Date(item.ultimaPuja).getTime()) / 1000
      );
      tiempoRestante = Math.max(0, TIMER_SEGUNDOS - segundosTranscurridos);
    }

    // Si el timer expiró y hay pujas → cerrar el ítem automáticamente
    if (tiempoRestante === 0 && item.pujos.length > 0) {
      await prisma.$transaction(async (tx) => {
        // Marcar ítem como cerrado
        await tx.itemsCatalogo.update({
          where: { identificador: itemId },
          data:  { cerrado: true, subastado: 'si' },
        });

        // Marcar la puja ganadora
        await tx.pujos.update({
          where: { identificador: item.pujos[0].identificador },
          data:  { ganador: 'si' },
        });
      });

      return res.json({
        ok:         true,
        cerrado:    true,
        message:    'Subasta finalizada.',
        pujaActual: item.pujos[0].importe,
        moneda:     item.moneda,
        ganador:    item.pujos[0].asistentes?.clientes?.personas?.nombre || null,
      });
    }

    const pujaActual = item.pujos[0]?.importe || item.precioBase;
    const categoriaSubasta = item.catalogos?.subastas?.categoria;
    const sinLimite = CATEGORIAS_SIN_LIMITE.includes(categoriaSubasta);

    const minimoSiguiente = sinLimite
      ? null
      : (parseFloat(pujaActual) + parseFloat(item.precioBase) * MINIMO_PORCENTAJE_VALOR_BASE);

    const maximoSiguiente = sinLimite
      ? null
      : (parseFloat(pujaActual) + parseFloat(item.precioBase) * MAXIMO_PORCENTAJE_VALOR_BASE);

    // Fotos en base64
    const fotos = item.productos?.fotos?.map((f) => ({
      id:   f.identificador,
      foto: Buffer.from(f.foto).toString('base64'),
    })) || [];

    return res.json({
      ok:               true,
      cerrado:          false,
      itemId:           item.identificador,
      nombre:           item.productos?.nombre,
      descripcion:      item.productos?.descripcionCompleta,
      moneda:           item.moneda,
      precioBase:       item.precioBase,
      pujaActual:       pujaActual,
      minimoSiguiente:  minimoSiguiente !== null ? minimoSiguiente.toFixed(2) : null,
      maximoSiguiente:  maximoSiguiente !== null ? maximoSiguiente.toFixed(2) : null,
      sinLimite,
      tiempoRestante,
      fotos,
    });

  } catch (err) {
    console.error('getEstadoPuja error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener el estado de la puja.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/pujas/:itemId
// Registrar una nueva puja
// Body: { importe }
//
// Usa SELECT ... FOR UPDATE dentro de una transacción para
// bloquear la fila del ítem mientras se valida y registra la
// puja, evitando que dos pujas concurrentes pasen la validación
// contra la misma "pujaActual" al mismo tiempo.
// ─────────────────────────────────────────────────────────────
exports.pujar = async (req, res) => {
  const { personaId } = req.user;
  const itemId        = parseInt(req.params.itemId);
  const { importe }   = req.body;

  if (!importe || isNaN(importe) || parseFloat(importe) <= 0)
    return res.status(400).json({ ok: false, message: 'El importe es inválido.' });

  const importeNum = parseFloat(importe);

  try {
    const resultado = await prisma.$transaction(async (tx) => {

      // Bloquea la fila del ítem hasta que termine la transacción.
      // Cualquier otra puja concurrente sobre el mismo itemId espera acá.
      await tx.$queryRaw`SELECT identificador FROM itemscatalogo WHERE identificador = ${itemId} FOR UPDATE`;

      const item = await tx.itemsCatalogo.findFirst({
        where:   { identificador: itemId },
        include: {
          pujos:     { orderBy: { importe: 'desc' }, take: 1 },
          catalogos: { include: { subastas: true } },
        },
      });

      if (!item) {
        const e = new Error('Ítem no encontrado.');
        e.status = 404;
        throw e;
      }

      if (item.cerrado) {
        const e = new Error('Esta subasta ya finalizó.');
        e.status = 400;
        throw e;
      }

      // Categoría del usuario vs categoría de la subasta
      const categoriaSubasta = item.catalogos?.subastas?.categoria;
      if (categoriaSubasta && !categoriaAlcanza(req.user.categoria, categoriaSubasta)) {
        const e = new Error(`Tu categoría (${req.user.categoria}) no te permite pujar en subastas de categoría ${categoriaSubasta}.`);
        e.status = 403;
        throw e;
      }

      // Debe tener al menos un medio de pago verificado por la empresa
      const tieneMetodoVerificado = await tx.metodosPago.findFirst({
        where: { persona: personaId, activo: true, verificado: true },
      });

      if (!tieneMetodoVerificado) {
        const e = new Error('Necesitás al menos un medio de pago verificado por la empresa para poder pujar.');
        e.status = 403;
        throw e;
      }

      // Timer expirado
      if (item.ultimaPuja) {
        const segundosTranscurridos = Math.floor(
          (Date.now() - new Date(item.ultimaPuja).getTime()) / 1000
        );
        if (segundosTranscurridos >= TIMER_SEGUNDOS) {
          const e = new Error('El tiempo de puja expiró.');
          e.status = 400;
          throw e;
        }
      }

      // Límites de monto (mínimo/máximo), tomados dentro de la transacción bloqueada
      const pujaActual = parseFloat(item.pujos[0]?.importe || item.precioBase);
      const valorBase  = parseFloat(item.precioBase);
      const sinLimite  = CATEGORIAS_SIN_LIMITE.includes(categoriaSubasta);

      if (!sinLimite) {
        const minimo = pujaActual + valorBase * MINIMO_PORCENTAJE_VALOR_BASE;
        const maximo = pujaActual + valorBase * MAXIMO_PORCENTAJE_VALOR_BASE;

        if (importeNum < minimo) {
          const e = new Error(`Tu puja debe ser al menos ${minimo.toFixed(2)} ${item.moneda} (puja actual + 1% del valor base).`);
          e.status = 400;
          e.extra  = { minimo: minimo.toFixed(2) };
          throw e;
        }

        if (importeNum > maximo) {
          const e = new Error(`Tu puja no puede superar ${maximo.toFixed(2)} ${item.moneda} (puja actual + 20% del valor base).`);
          e.status = 400;
          e.extra  = { maximo: maximo.toFixed(2) };
          throw e;
        }
      } else if (importeNum <= pujaActual) {
        const e = new Error(`Tu puja debe ser mayor a la puja actual (${pujaActual} ${item.moneda}).`);
        e.status = 400;
        throw e;
      }

      // No participar en otra subasta activa al mismo tiempo
      const otraParticipacionActiva = await tx.pujos.findFirst({
        where: {
          asistentes:    { cliente: personaId },
          item:          { not: itemId },
          itemsCatalogo: { cerrado: false },
        },
        orderBy: { identificador: 'desc' },
      });

      if (otraParticipacionActiva) {
        const e = new Error('Ya estás participando en otra subasta activa. Esperá a que finalice para pujar en otra.');
        e.status = 409;
        throw e;
      }

      // Buscar el asistente (el usuario en la subasta)
      const subastaId = item.catalogos?.subastas?.identificador;
      const asistente = await tx.asistentes.findFirst({
        where: {
          subasta:  subastaId,
          clientes: { identificador: personaId },
        },
      });

      if (!asistente) {
        const e = new Error('No estás registrado como asistente en esta subasta.');
        e.status = 403;
        throw e;
      }

      if (item.pujos[0]?.asistente === asistente.identificador) {
        const e = new Error('Ya tenés la puja más alta.');
        e.status = 400;
        throw e;
      }

      // Registrar la puja y resetear el timer (todavía dentro del bloqueo)
      await tx.pujos.create({
        data: {
          asistente: asistente.identificador,
          item:      itemId,
          importe:   importeNum,
          ganador:   'no',
        },
      });

      await tx.itemsCatalogo.update({
        where: { identificador: itemId },
        data:  { ultimaPuja: new Date() },
      });

      return { importeNum };
    });

    return res.status(201).json({
      ok:             true,
      message:        'Puja registrada correctamente.',
      importeNuevo:   resultado.importeNum,
      tiempoRestante: TIMER_SEGUNDOS,
    });

  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ ok: false, message: err.message, ...(err.extra || {}) });
    }
    console.error('pujar error:', err);
    return res.status(500).json({ ok: false, message: 'Error al registrar la puja.' });
  }
};
