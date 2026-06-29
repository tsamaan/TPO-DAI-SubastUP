// controllers/pujasController.js
// Pujas en tiempo real — Prisma + PostgreSQL

const prisma = require('../config/prisma');
const { fotoARespuesta } = require('../utils/imagenes');
const { asegurarRolesDominio } = require('../utils/provision');
const { estadoEfectivoSubasta, esSubastaAbiertaParaPujar } = require('../utils/estadoSubasta');

const TIMER_SEGUNDOS = 60;

// Mínimo: puja actual + 1% del valor base
// Máximo: puja actual + 20% del valor base
// Estos límites NO aplican para categorías oro y platino
const MINIMO_PORCENTAJE_VALOR_BASE = 0.01;
const MAXIMO_PORCENTAJE_VALOR_BASE = 0.20;
const CATEGORIAS_SIN_LIMITE = ['oro', 'platino'];

// Orden de jerarquía de categorías (mayor índice = más alta)
const ORDEN_CATEGORIAS = ['comun', 'especial', 'plata', 'oro', 'platino'];
const MENSAJE_INICIAL_GANADOR =
  '¡Felicitaciones! Ganaste esta subasta. En breve nos comunicaremos para coordinar el pago y la entrega del artículo.';

function categoriaAlcanza(categoriaUsuario, categoriaSubasta) {
  const idxUsuario = ORDEN_CATEGORIAS.indexOf(String(categoriaUsuario || 'comun').toLowerCase());
  const idxSubasta = ORDEN_CATEGORIAS.indexOf(String(categoriaSubasta || 'comun').toLowerCase());
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
            identificador:        true,
            revisor:              true,
            duenio:               true,
            descripcionCompleta: true,
            fotos:              { take: 3 },
            detalle:            true,
          },
        },
        catalogos: {
          include: {
            subastas: true,
          },
        },
        detalle: true,
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

    let ultimaPujaAt = item.detalle?.ultimaPuja || null;
    if (!ultimaPujaAt && item.pujos.length > 0 && esSubastaAbiertaParaPujar(item.catalogos?.subastas, item.detalle?.cerrado) && !item.detalle?.cerrado) {
      ultimaPujaAt = new Date();
      await prisma.itemsCatalogoDetalle.update({
        where: { item: itemId },
        data:  { ultimaPuja: ultimaPujaAt },
      });
    }

    if (item.detalle?.cerrado)
        return res.json({
          ok:          true,
          cerrado:     true,
          message:     'Esta subasta ya finalizó.',
          pujaActual:  item.pujos[0]?.importe || item.precioBase,
          moneda:      item.detalle?.moneda || 'ARS',
          estado:      estadoEfectivoSubasta(item.catalogos?.subastas, true),
          ganadorId:   item.pujos[0]?.asistentes?.cliente || null,
          categoria:   item.catalogos?.subastas?.categoria || null,
          ultimaPujaAt,
        });

    // Calcular tiempo restante
    let tiempoRestante = TIMER_SEGUNDOS;
    if (ultimaPujaAt) {
      const segundosTranscurridos = Math.floor(
        (Date.now() - new Date(ultimaPujaAt).getTime()) / 1000
      );
      tiempoRestante = Math.max(0, TIMER_SEGUNDOS - segundosTranscurridos);
    }

    // Si el timer expiró y hay pujas → cerrar el ítem automáticamente
    if (tiempoRestante === 0 && item.pujos.length > 0) {
      const cierre = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT identificador FROM itemscatalogo WHERE identificador = ${itemId} FOR UPDATE`;

        const itemCierre = await tx.itemsCatalogo.findFirst({
          where: { identificador: itemId },
          include: {
            productos: {
              select: {
                identificador: true,
                revisor: true,
                detalle: true,
              },
            },
            detalle: true,
            pujos: {
              orderBy: { importe: 'desc' },
              take: 1,
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

        if (!itemCierre || itemCierre.pujos.length === 0) {
          const e = new Error('Ítem sin pujas para cerrar.');
          e.status = 400;
          throw e;
        }

        const ganadorId = itemCierre.pujos[0].asistentes.cliente;
        const productoId = itemCierre.productos.identificador;
        let conversacion = await tx.conversaciones.findFirst({
          where: { producto: productoId },
        });

        if (itemCierre.detalle?.cerrado) {
          return {
            yaCerrado: true,
            ganadorId,
            conversacionId: conversacion?.identificador || null,
            pujaActual: itemCierre.pujos[0].importe,
            ganador: itemCierre.pujos[0].asistentes?.clientes?.personas?.nombre || null,
          };
        }

        // Marcar ítem como cerrado
        await tx.itemsCatalogo.update({
          where: { identificador: itemId },
          data:  { subastado: 'si' },
        });
        await tx.itemsCatalogoDetalle.update({ where: { item: itemId }, data: { cerrado: true } });

        // Marcar la puja ganadora
        await tx.pujos.update({
          where: { identificador: itemCierre.pujos[0].identificador },
          data:  { ganador: 'si' },
        });

        // La tabla base admite una conversación por producto. Para una subasta
        // sin conversación previa, se crea el canal persistente del ganador.
        // Si ya existía por el flujo de revisión del artículo, se reasigna al
        // ganador para que el chat aparezca en su pantalla de mensajes.
        if (!conversacion) {
          conversacion = await tx.conversaciones.create({
            data: {
              producto: productoId,
              duenio:   ganadorId,
              empleado: itemCierre.productos.revisor,
              estado:   'activo',
            },
          });
        } else if (conversacion.duenio !== ganadorId || conversacion.estado !== 'activo') {
          conversacion = await tx.conversaciones.update({
            where: { identificador: conversacion.identificador },
            data:  {
              duenio:   ganadorId,
              empleado: itemCierre.productos.revisor,
              estado:   'activo',
            },
          });
        }

        const mensajeExistente = await tx.mensajes.findFirst({
          where: {
            conversacion: conversacion.identificador,
            emisor: itemCierre.productos.revisor,
            texto: MENSAJE_INICIAL_GANADOR,
          },
        });
        if (!mensajeExistente) {
          await tx.mensajes.create({
            data: {
              conversacion: conversacion.identificador,
              emisor:       itemCierre.productos.revisor,
              texto:        MENSAJE_INICIAL_GANADOR,
              leido:        false,
            },
          });
        }

        const mensajeNotificacion = `Ganaste ${itemCierre.productos.detalle?.nombre || 'el artículo'}. Abrí Mensajes para continuar.`;
        const notificacionExistente = await tx.notificaciones.findFirst({
          where: {
            persona: ganadorId,
            tipo: 'subasta_ganada',
            mensaje: mensajeNotificacion,
          },
        });
        if (!notificacionExistente) {
          await tx.notificaciones.create({
            data: {
              persona: ganadorId,
              titulo:  '¡Ganaste la subasta!',
              mensaje: mensajeNotificacion,
              tipo:    'subasta_ganada',
            },
          });
        }

        return {
          yaCerrado: false,
          ganadorId,
          conversacionId: conversacion.identificador,
          pujaActual: itemCierre.pujos[0].importe,
          ganador: itemCierre.pujos[0].asistentes?.clientes?.personas?.nombre || null,
        };
      });

      return res.json({
        ok:         true,
        cerrado:    true,
        message:    cierre.yaCerrado ? 'Esta subasta ya finalizó.' : 'Subasta finalizada.',
        pujaActual: cierre.pujaActual,
        moneda:     item.detalle?.moneda || 'ARS',
        ganador:    cierre.ganador,
        ganadorId:  cierre.ganadorId,
        conversacionId: cierre.conversacionId,
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
    const fotos = item.productos?.fotos?.map(fotoARespuesta).filter(Boolean) || [];

    return res.json({
      ok:               true,
      cerrado:          false,
      itemId:           item.identificador,
      nombre:           item.productos?.detalle?.nombre || 'Producto',
      descripcion:      item.productos?.descripcionCompleta,
      duenioId:         item.productos?.duenio || null,
      moneda:           item.detalle?.moneda || 'ARS',
      estado:           estadoEfectivoSubasta(item.catalogos?.subastas, item.detalle?.cerrado),
      categoria:        categoriaSubasta || null,
      precioBase:       item.precioBase,
      pujaActual:       pujaActual,
      minimoSiguiente:  minimoSiguiente !== null ? minimoSiguiente.toFixed(2) : null,
      maximoSiguiente:  maximoSiguiente !== null ? maximoSiguiente.toFixed(2) : null,
      sinLimite,
      tiempoRestante,
      ultimaPujaAt,
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
  const itemId        = parseInt(req.body.auctionId);
  const importe       = req.body.amount;

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
          detalle:   true,
        },
      });

      if (!item) {
        const e = new Error('Ítem no encontrado.');
        e.status = 404;
        throw e;
      }

      if (item.detalle?.cerrado) {
        const e = new Error('Esta subasta ya finalizó.');
        e.status = 400;
        throw e;
      }

      if (!esSubastaAbiertaParaPujar(item.catalogos?.subastas, item.detalle?.cerrado)) {
        const e = new Error('Esta subasta todavía no está activa.');
        e.status = 400;
        e.codigo = 'SUBASTA_NO_ACTIVA';
        throw e;
      }

      const producto = await tx.productos.findFirst({
        where: { identificador: item.producto },
        select: { duenio: true },
      });

      if (producto?.duenio === personaId) {
        const e = new Error('No podés pujar por este artículo porque vos lo publicaste.');
        e.status = 403;
        e.codigo = 'DUENIO_NO_PUEDE_PUJAR';
        throw e;
      }

      // Categoría del usuario vs categoría de la subasta
      const categoriaSubasta = item.catalogos?.subastas?.categoria;
      if (categoriaSubasta && !categoriaAlcanza(req.user.categoria, categoriaSubasta)) {
        const e = new Error(`Tu categoría (${req.user.categoria}) no te permite pujar en subastas de categoría ${categoriaSubasta}.`);
        e.status = 403;
        e.codigo = 'CATEGORIA_INSUFICIENTE';
        throw e;
      }

      // Debe tener al menos un medio de pago verificado por la empresa
      const metodosVerificados = await tx.metodosPago.findMany({
        where: { persona: personaId, activo: true, verificado: true },
        include: { cheques: true },
      });

      if (metodosVerificados.length === 0) {
        const e = new Error('Necesitás al menos un medio de pago verificado por la empresa para poder pujar.');
        e.status = 403;
        e.codigo = 'METODO_PAGO_REQUERIDO';
        throw e;
      }

      const tieneMetodoSinTopeDeCheque = metodosVerificados.some((metodo) => metodo.tipo !== 'cheque');
      if (!tieneMetodoSinTopeDeCheque) {
        const maximoCheque = Math.max(...metodosVerificados.map((metodo) => Number(metodo.cheques?.monto || 0)));
        if (importeNum > maximoCheque) {
          const e = new Error(`Tu puja supera el monto máximo habilitado por tu cheque verificado (${maximoCheque.toFixed(2)} ${item.detalle?.moneda || 'ARS'}).`);
          e.status = 403;
          e.codigo = 'CHEQUE_MONTO_INSUFICIENTE';
          e.extra = { maximoCheque: maximoCheque.toFixed(2) };
          throw e;
        }
      }

      // Timer expirado
      if (item.detalle?.ultimaPuja) {
        const segundosTranscurridos = Math.floor(
          (Date.now() - new Date(item.detalle.ultimaPuja).getTime()) / 1000
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
          const e = new Error(`Tu puja debe ser al menos ${minimo.toFixed(2)} ${item.detalle?.moneda || 'ARS'} (puja actual + 1% del valor base).`);
          e.status = 400;
          e.extra  = { minimo: minimo.toFixed(2) };
          throw e;
        }

        if (importeNum > maximo) {
          const e = new Error(`Tu puja no puede superar ${maximo.toFixed(2)} ${item.detalle?.moneda || 'ARS'} (puja actual + 20% del valor base).`);
          e.status = 400;
          e.extra  = { maximo: maximo.toFixed(2) };
          throw e;
        }
      } else if (importeNum <= pujaActual) {
        const e = new Error(`Tu puja debe ser mayor a la puja actual (${pujaActual} ${item.detalle?.moneda || 'ARS'}).`);
        e.status = 400;
        throw e;
      }

      // No participar en otra subasta GENUINAMENTE activa al mismo tiempo. Solo
      // cuenta si en otro ítem el usuario tiene una puja cuyo timer sigue
      // corriendo (última puja dentro de TIMER_SEGUNDOS) y no está cerrado. Así no
      // bloquean pujas viejas/inactivas (p. ej. del seed, con ultimaPuja null).
      const limiteActivo = new Date(Date.now() - TIMER_SEGUNDOS * 1000);
      const otraParticipacionActiva = await tx.pujos.findFirst({
        where: {
          asistentes:    { cliente: personaId },
          item:          { not: itemId },
          itemsCatalogo: { detalle: { is: { cerrado: false, ultimaPuja: { gte: limiteActivo } } } },
        },
        orderBy: { identificador: 'desc' },
      });

      if (otraParticipacionActiva) {
        const e = new Error('Ya estás participando en otra subasta activa. Esperá a que finalice para pujar en otra.');
        e.status = 409;
        throw e;
      }

      // Garantiza la fila en `clientes` antes de crear el asistente (FK
      // asistentes.cliente -> clientes). Red de seguridad para usuarios aprobados
      // antes de este fix; lo normal es que validateUser ya la haya creado.
      const clienteExiste = await tx.clientes.findUnique({ where: { identificador: personaId } });
      if (!clienteExiste) await asegurarRolesDominio(tx, personaId, req.user.categoria);

      // Buscar el asistente (el usuario en la subasta)
      const subastaId = item.catalogos?.subastas?.identificador;
      let asistente = await tx.asistentes.findFirst({
        where: {
          subasta:  subastaId,
          clientes: { identificador: personaId },
        },
      });

      if (!asistente) {
        const ultimoAsistente = await tx.asistentes.findFirst({
          where: { subasta: subastaId },
          orderBy: { numeroPostor: 'desc' },
        });
        asistente = await tx.asistentes.create({
          data: {
            subasta: subastaId,
            cliente: personaId,
            numeroPostor: (ultimoAsistente?.numeroPostor || 0) + 1,
          },
        });
      }

      if (item.pujos[0]?.asistente === asistente.identificador) {
        const e = new Error('Ya tenés la puja más alta.');
        e.status = 400;
        throw e;
      }

      // Registrar la puja y resetear el timer (todavía dentro del bloqueo)
      const puja = await tx.pujos.create({
        data: {
          asistente: asistente.identificador,
          item:      itemId,
          importe:   importeNum,
          ganador:   'no',
        },
      });

      await tx.pujosDetalle.create({ data: { puja: puja.identificador } });

      const ultimaPujaAt = new Date();
      await tx.itemsCatalogoDetalle.update({
        where: { item: itemId },
        data:  { ultimaPuja: ultimaPujaAt },
      });

      return { importeNum, ultimaPujaAt };
    });

    return res.status(201).json({
      ok:             true,
      message:        'Puja registrada correctamente.',
      importeNuevo:   resultado.importeNum,
      tiempoRestante: TIMER_SEGUNDOS,
      ultimaPujaAt:   resultado.ultimaPujaAt,
    });

  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ ok: false, message: err.message, codigo: err.codigo, ...(err.extra || {}) });
    }
    console.error('pujar error:', err);
    return res.status(500).json({ ok: false, message: 'Error al registrar la puja.' });
  }
};
