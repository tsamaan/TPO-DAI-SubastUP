// controllers/productosController.js
// Productos — Prisma + PostgreSQL

const prisma = require('../config/prisma');
const { enviarMail } = require('../services/mailService');
const { bufferImagenABase64, fotoARespuesta, imagenBase64ABuffer } = require('../utils/imagenes');

const MENSAJE_PRODUCTO_RECIBIDO =
  'Recibimos tu producto para revisión. Un asesor de SubastUP se va a comunicar por este chat para continuar el proceso.';
const MENSAJE_PROPUESTA_ACEPTADA =
  'Confirmaste la propuesta. Tu artículo queda aceptado para avanzar al circuito de subasta.';
const MENSAJE_PROPUESTA_RECHAZADA =
  'Rechazaste la propuesta. El circuito queda cerrado y coordinaremos los próximos pasos si corresponde.';
const CATEGORIAS_SUBASTA = ['comun', 'especial', 'plata', 'oro', 'platino'];

function normalizarCategoriaSubasta(...valores) {
  const elegida = valores.find((valor) => valor !== undefined && valor !== null && String(valor).trim() !== '');
  const normalizada = String(elegida || '').trim().toLowerCase();
  return CATEGORIAS_SUBASTA.includes(normalizada) ? normalizada : null;
}

function horaTextoADate(hora = '15:00') {
  const [hh = '15', mm = '00'] = String(hora).split(':');
  const fecha = new Date('1970-01-01T00:00:00.000Z');
  fecha.setUTCHours(parseInt(hh, 10) || 0, parseInt(mm, 10) || 0, 0, 0);
  return fecha;
}

// ─────────────────────────────────────────────────────────────
// POST /api/productos
// Usuario carga un producto nuevo
// Body: { nombre, descripcionCompleta, fotosBase64[] }
// ─────────────────────────────────────────────────────────────
exports.cargarProducto = async (req, res) => {
  try {
    const { personaId } = req.user;
    const { nombre, descripcionCompleta, fotosBase64, fotos } = req.body;
    const fotosPayload = Array.isArray(fotos) && fotos.length > 0 ? fotos : fotosBase64;

    if (!nombre || !descripcionCompleta)
      return res.status(400).json({ ok: false, message: 'Nombre y descripción son obligatorios.' });

    if (!Array.isArray(fotosPayload) || fotosPayload.length === 0)
      return res.status(400).json({ ok: false, message: 'Debe subir al menos una foto.' });

    if (fotosPayload.length > 12)
      return res.status(400).json({ ok: false, message: 'Máximo 12 fotos por producto.' });

    const fotosProcesadas = fotosPayload.map((foto) =>
      imagenBase64ABuffer(typeof foto === 'string' ? foto : foto?.base64)
    );

    if (fotosProcesadas.some((foto) => !foto?.buffer))
      return res.status(400).json({ ok: false, message: 'Todas las fotos deben enviarse en base64 válido.' });

    // Verificar que la persona sea dueño
    const duenio = await prisma.duenios.findFirst({
      where: { identificador: personaId },
    });

    if (!duenio)
      return res.status(403).json({ ok: false, message: 'Solo los dueños pueden cargar productos.' });

    // @TASK: La tabla base exige revisor; se asigna un empleado técnico hasta la revisión real.
    const revisorTecnico = await prisma.empleados.findFirst({
      where: { cargo: 'Revisor técnico del sistema' },
    });

    if (!revisorTecnico)
      return res.status(503).json({ ok: false, message: 'No hay un revisor técnico configurado.' });

    // Crear producto + fotos en transacción
    const resultadoCreacion = await prisma.$transaction(async (tx) => {
      const p = await tx.productos.create({
        data: {
          descripcionCompleta,
          duenio:    personaId,
          revisor:   revisorTecnico.identificador,
          fecha:     new Date(),
          disponible: 'no',
        },
      });

      // @TASK: Los datos operativos viven en la extensión y no en productos base.
      await tx.productosDetalle.create({
        data: { producto: p.identificador, nombre, estado: 'pendiente' },
      });

      for (const foto of fotosProcesadas) {
        await tx.fotos.create({
          data: { producto: p.identificador, foto: foto.buffer },
        });
      }

      const conversacion = await tx.conversaciones.create({
        data: {
          producto: p.identificador,
          duenio:   personaId,
          empleado: revisorTecnico.identificador,
          estado:   'activo',
        },
      });

      await tx.mensajes.create({
        data: {
          conversacion: conversacion.identificador,
          emisor:       revisorTecnico.identificador,
          texto:        MENSAJE_PRODUCTO_RECIBIDO,
          leido:        false,
        },
      });

      await tx.notificaciones.create({
        data: {
          persona: personaId,
          titulo:  'Producto enviado',
          mensaje: `Recibimos ${nombre}. Revisá el chat para seguir el proceso.`,
          tipo:    'producto_enviado',
        },
      });

      return { producto: p, conversacionId: conversacion.identificador };
    });
    const producto = resultadoCreacion.producto;

    // Notificar por mail a todos los revisores
    try {
      const revisores = await prisma.registros.findMany({
        where:   { rol: 'revisor', estado: 'aprobado' },
        include: { personas: true },
      });

      for (const revisor of revisores) {
        await enviarMail(
          revisor.email,
          'Nuevo producto pendiente de revisión',
          `
            <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px;">
              <h2 style="color:#8b0000;">Nuevo producto cargado</h2>
              <p>Hola ${revisor.personas.nombre}, hay un nuevo producto pendiente de revisión.</p>
              <p><strong>Producto:</strong> ${nombre}</p>
              <p><strong>ID:</strong> ${producto.identificador}</p>
              <p>Ingresá a la app para revisarlo.</p>
            </div>
          `
        );
      }
    } catch (mailErr) {
      console.error('Error enviando mail a revisores:', mailErr.message);
    }

    return res.status(201).json({
      ok:         true,
      message:    'Producto cargado correctamente. Un revisor lo evaluará pronto.',
      productoId: producto.identificador,
      conversacionId: resultadoCreacion.conversacionId,
    });

  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ ok: false, message: err.message });
    }
    console.error('cargarProducto error:', err);
    return res.status(500).json({ ok: false, message: 'Error al cargar el producto.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/productos/mis-productos
// Lista los productos del usuario logueado
// ─────────────────────────────────────────────────────────────
exports.misProductos = async (req, res) => {
  try {
    const { personaId } = req.user;

    const productos = await prisma.productos.findMany({
      where:   { duenio: personaId },
      orderBy: { fecha: 'desc' },
      include: {
        detalle: true,
        fotos: { take: 1 },
        itemsCatalogo: {
          select: {
            identificador: true,
            precioBase: true,
            comision:   true,
            subastado:  true,
            detalle:    true,
            catalogos: {
              select: {
                subasta: true,
                subastas: {
                  select: { estado: true, categoria: true, fecha: true, hora: true, ubicacion: true },
                },
              },
            },
          },
        },
      },
    });

    return res.json({
      ok: true,
      productos: productos.map((p) => {
        const foto = p.fotos?.[0]?.foto;
        const propuesta = p.itemsCatalogo?.[0] || null;
        return {
          identificador: p.identificador,
          productoId: p.identificador,
          nombre: p.detalle?.nombre || 'Producto',
          estado: p.detalle?.estado || 'pendiente',
          fecha: p.fecha,
          descripcionCompleta: p.descripcionCompleta,
          motivoRechazo: p.detalle?.motivoRechazo || null,
          direccionEnvio: p.detalle?.direccionEnvio || null,
          descripcionCatalogo: p.descripcionCatalogo,
          portada: bufferImagenABase64(foto),
          propuesta: propuesta ? {
            itemId: propuesta.identificador,
            subastaId: propuesta.catalogos?.subasta || null,
            estadoSubasta: propuesta.catalogos?.subastas?.estado || null,
            categoriaSubasta: propuesta.detalle?.categoriaSubasta || propuesta.catalogos?.subastas?.categoria || null,
            precioBase: propuesta.precioBase,
            comision: propuesta.comision,
            moneda: propuesta.detalle?.moneda || 'ARS',
            fechaSubasta: propuesta.detalle?.fechaSubasta || null,
            horaSubasta: propuesta.detalle?.horaSubasta || null,
            lugarSubasta: propuesta.detalle?.lugarSubasta || null,
            aceptadoPorDuenio: propuesta.detalle?.aceptadoPorDuenio ?? null,
          } : null,
        };
      }),
    });

  } catch (err) {
    console.error('misProductos error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener los productos.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/productos/:id
// Detalle de un producto del usuario logueado
// ─────────────────────────────────────────────────────────────
exports.detalleProducto = async (req, res) => {
  try {
    const { personaId } = req.user;
    const id = parseInt(req.params.id);

    const producto = await prisma.productos.findFirst({
      where: { identificador: id, duenio: personaId },
      include: {
        detalle:       true,
        fotos:         true,
        itemsCatalogo: {
          select: {
            identificador: true,
            precioBase:    true,
            comision:      true,
            subastado:     true,
            detalle:       true,
            catalogos: {
              select: {
                subasta: true,
                subastas: {
                  select: { estado: true, categoria: true, fecha: true, hora: true, ubicacion: true },
                },
              },
            },
          },
        },
      },
    });

    if (!producto)
      return res.status(404).json({ ok: false, message: 'Producto no encontrado.' });

    const fotosBase64 = producto.fotos.map(fotoARespuesta).filter(Boolean);

    const itemPropuesta = producto.itemsCatalogo?.[0] || null;
    const propuesta = itemPropuesta ? {
      itemId: itemPropuesta.identificador,
      subastaId: itemPropuesta.catalogos?.subasta || null,
      estadoSubasta: itemPropuesta.catalogos?.subastas?.estado || null,
      categoriaSubasta: itemPropuesta.detalle?.categoriaSubasta || itemPropuesta.catalogos?.subastas?.categoria || null,
      precioBase: itemPropuesta.precioBase,
      comision: itemPropuesta.comision,
      subastado: itemPropuesta.subastado,
      moneda: itemPropuesta.detalle?.moneda || 'ARS',
      fechaSubasta: itemPropuesta.detalle?.fechaSubasta || null,
      horaSubasta: itemPropuesta.detalle?.horaSubasta || null,
      lugarSubasta: itemPropuesta.detalle?.lugarSubasta || null,
      aceptadoPorDuenio: itemPropuesta.detalle?.aceptadoPorDuenio ?? null,
    } : null;

    const textoEstado = {
      pendiente:          'Tu producto está siendo revisado por nuestro equipo.',
      en_inspeccion:      'Tu producto fue recibido y está siendo inspeccionado físicamente.',
      aprobado:           'Tu producto fue aceptado por la empresa.',
      esperando_usuario:  'La empresa hizo una propuesta. Revisá los detalles y decidí si aceptás.',
      confirmado:         'Tu producto fue confirmado y será incluido en una subasta próximamente.',
      rechazado:          `Tu producto no fue aceptado. Motivo: ${producto.detalle?.motivoRechazo || 'Sin motivo especificado'}`,
      devuelto:           'Tu producto está siendo devuelto. Se aplicarán los cargos correspondientes.',
    };

    return res.json({
      ok: true,
      producto: {
        identificador:       producto.identificador,
        nombre:              producto.detalle?.nombre || 'Producto',
        estado:              producto.detalle?.estado || 'pendiente',
        textoEstado:         textoEstado[producto.detalle?.estado] || '',
        fecha:               producto.fecha,
        descripcionCompleta: producto.descripcionCompleta,
        descripcionCatalogo: producto.descripcionCatalogo,
        motivoRechazo:       producto.detalle?.motivoRechazo || null,
        direccionEnvio:      producto.detalle?.direccionEnvio || null,
        fotos:               fotosBase64,
        propuesta,
      },
    });

  } catch (err) {
    console.error('detalleProducto error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener el producto.' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/productos/:id
// Solo se puede eliminar si el estado es 'pendiente'
// ─────────────────────────────────────────────────────────────
exports.eliminarProducto = async (req, res) => {
  try {
    const { personaId } = req.user;
    const id = parseInt(req.params.id);

    const producto = await prisma.productos.findFirst({
      where: { identificador: id, duenio: personaId },
      include: { detalle: true },
    });

    if (!producto)
      return res.status(404).json({ ok: false, message: 'Producto no encontrado.' });

    if (producto.detalle?.estado !== 'pendiente')
      return res.status(400).json({ ok: false, message: 'Solo podés eliminar productos en estado pendiente.' });

    await prisma.$transaction(async (tx) => {
      await tx.fotos.deleteMany({ where: { producto: id } });
      await tx.productos.delete({ where: { identificador: id } });
    });

    return res.json({ ok: true, message: 'Producto eliminado correctamente.' });

  } catch (err) {
    console.error('eliminarProducto error:', err);
    return res.status(500).json({ ok: false, message: 'Error al eliminar el producto.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/productos/:id/responder
// Usuario acepta o rechaza la propuesta del revisor
// Body: { acepta: true/false }
// ─────────────────────────────────────────────────────────────
exports.responderPropuesta = async (req, res) => {
  try {
    const { personaId } = req.user;
    const id = parseInt(req.params.id);
    const { action, reason, categoriaSubasta, categoria, categoriaBien } = req.body;

    if (action !== 'ACCEPT' && action !== 'REJECT')
      return res.status(400).json({ ok: false, message: 'La acción debe ser ACCEPT o REJECT.' });

    const acepta = action === 'ACCEPT';

    const producto = await prisma.productos.findFirst({
      where:   { identificador: id, duenio: personaId, detalle: { estado: 'esperando_usuario' } },
      include: {
        itemsCatalogo: {
          include: {
            catalogos: true,
            detalle: true,
          },
        },
        detalle: true,
      },
    });

    if (!producto || producto.itemsCatalogo.length === 0)
      return res.status(404).json({ ok: false, message: 'Producto no encontrado o sin propuesta pendiente.' });

    const itemPropuesta = producto.itemsCatalogo[0];
    const itemId     = itemPropuesta.identificador;
    const nuevoEstado = acepta ? 'confirmado' : 'devuelto';
    const categoriaConfirmada = normalizarCategoriaSubasta(
      categoriaSubasta,
      categoria,
      categoriaBien,
      itemPropuesta.detalle?.categoriaSubasta,
      itemPropuesta.catalogos?.subastas?.categoria,
      'comun',
    );

    await prisma.$transaction(async (tx) => {
      await tx.productosDetalle.update({
        where: { producto: id },
        data:  { estado: nuevoEstado },
      });

      await tx.itemsCatalogoDetalle.update({
        where: { item: itemId },
        data:  {
          aceptadoPorDuenio: acepta,
          ...(acepta && categoriaConfirmada ? { categoriaSubasta: categoriaConfirmada } : {}),
        },
      });

      if (acepta && categoriaConfirmada) {
        const subastaId = itemPropuesta.catalogos?.subasta;
        if (subastaId) {
          await tx.subastas.update({
            where: { identificador: subastaId },
            data:  { categoria: categoriaConfirmada },
          });
        }
      }

      let conversacion = await tx.conversaciones.findFirst({ where: { producto: id } });
      if (!conversacion) {
        conversacion = await tx.conversaciones.create({
          data: {
            producto: id,
            duenio:   personaId,
            empleado: producto.revisor,
            estado:   'activo',
          },
        });
      }

      if (conversacion) {
        await tx.mensajes.create({
          data: {
            conversacion: conversacion.identificador,
            emisor:       producto.revisor,
            texto:        acepta ? MENSAJE_PROPUESTA_ACEPTADA : MENSAJE_PROPUESTA_RECHAZADA,
            leido:        false,
          },
        });
      }

      await tx.notificaciones.create({
        data: {
          persona: personaId,
          titulo:  acepta ? 'Propuesta aceptada' : 'Propuesta rechazada',
          mensaje: acepta ? 'Tu artículo fue confirmado para subasta.' : 'Rechazaste la propuesta del artículo.',
          tipo:    acepta ? 'producto_confirmado' : 'producto_rechazado',
        },
      });
    });

    const mensaje = acepta
      ? 'Propuesta aceptada. Tu producto será incluido en la subasta.'
      : 'Propuesta rechazada. Tu producto será devuelto con los gastos correspondientes.';

    return res.json({ ok: true, message: mensaje });

  } catch (err) {
    console.error('responderPropuesta error:', err);
    return res.status(500).json({ ok: false, message: 'Error al responder la propuesta.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/productos/revision/pendientes  (revisor/admin)
// Lista productos pendientes de revisión (alias del endpoint general filtrado)
// ─────────────────────────────────────────────────────────────
exports.productosPendientes = async (req, res) => {
  req.query.estado = 'pendiente';
  return exports.todosLosProductos(req, res);
};

// ─────────────────────────────────────────────────────────────
// GET /api/products?estado=...  (revisor/admin)
// Lista todos los productos con filtro opcional por estado
// ─────────────────────────────────────────────────────────────
exports.todosLosProductos = async (req, res) => {
  try {
    if (req.user.rol !== 'revisor' && req.user.rol !== 'admin')
      return res.status(403).json({ ok: false, message: 'Acceso denegado.' });

    const { estado } = req.query;

    const productos = await prisma.productos.findMany({
      where:   estado ? { detalle: { estado } } : undefined,
      orderBy: { fecha: 'desc' },
      include: {
        detalle: true,
        duenios: {
          include: {
            personas: {
              include: {
                registros: { select: { email: true }, take: 1 },
              },
            },
          },
        },
        _count: { select: { fotos: true } },
        itemsCatalogo: {
          take: 1,
          select: {
            identificador: true,
            precioBase:    true,
            comision:      true,
            detalle:       true,
            catalogos: {
              select: {
                subasta: true,
                subastas: { select: { categoria: true } },
              },
            },
          },
        },
      },
    });

    const resultado = productos.map((p) => {
      const item = p.itemsCatalogo?.[0] || null;
      return {
        productoId:          p.identificador,
        nombre:              p.detalle?.nombre || 'Producto',
        descripcionCompleta: p.descripcionCompleta,
        estado:              p.detalle?.estado || 'pendiente',
        motivoRechazo:       p.detalle?.motivoRechazo || null,
        fecha:               p.fecha,
        nombreDuenio:        p.duenios?.personas?.nombre || '—',
        emailDuenio:         p.duenios?.personas?.registros?.[0]?.email || null,
        cantidadFotos:       p._count.fotos,
        propuesta:           item ? {
          itemId:            item.identificador,
          precioBase:        item.precioBase,
          comision:          item.comision,
          categoriaSubasta:  item.detalle?.categoriaSubasta || item.catalogos?.subastas?.categoria || null,
          moneda:            item.detalle?.moneda || 'ARS',
          fechaSubasta:      item.detalle?.fechaSubasta || null,
          horaSubasta:       item.detalle?.horaSubasta  || null,
          lugarSubasta:      item.detalle?.lugarSubasta || null,
          aceptadoPorDuenio: item.detalle?.aceptadoPorDuenio ?? null,
        } : null,
      };
    });

    return res.json({ ok: true, productos: resultado });

  } catch (err) {
    console.error('todosLosProductos error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener productos.' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/products/:id/status  (revisor/admin)
// Cambia el estado intermedio del producto (ej: en_inspeccion)
// Body: { estado }
// ─────────────────────────────────────────────────────────────
exports.cambiarEstado = async (req, res) => {
  try {
    if (req.user.rol !== 'revisor' && req.user.rol !== 'admin')
      return res.status(403).json({ ok: false, message: 'Acceso denegado.' });

    const { personaId } = req.user;
    const id = parseInt(req.params.id);
    const { estado } = req.body;

    const ESTADOS_PERMITIDOS = ['pendiente', 'en_inspeccion'];
    if (!ESTADOS_PERMITIDOS.includes(estado))
      return res.status(400).json({ ok: false, message: `Estado inválido. Permitidos: ${ESTADOS_PERMITIDOS.join(', ')}.` });

    const producto = await prisma.productos.findFirst({
      where:   { identificador: id },
      include: { detalle: true },
    });
    if (!producto)
      return res.status(404).json({ ok: false, message: 'Producto no encontrado.' });

    const MENSAJES = {
      en_inspeccion: 'Tu artículo fue recibido y está siendo inspeccionado físicamente por nuestro equipo.',
      pendiente:     'Tu artículo volvió a la cola de revisión inicial.',
    };

    await prisma.$transaction(async (tx) => {
      await tx.productosDetalle.update({
        where: { producto: id },
        data:  { estado },
      });

      let conversacion = await tx.conversaciones.findFirst({ where: { producto: id } });
      if (!conversacion) {
        conversacion = await tx.conversaciones.create({
          data: {
            producto: id,
            duenio:   productoActual.duenio,
            empleado: personaId,
            estado:   'activo',
          },
        });
      }

      if (conversacion) {
        await tx.mensajes.create({
          data: {
            conversacion: conversacion.identificador,
            emisor:       personaId,
            texto:        MENSAJES[estado] || `Estado actualizado a: ${estado}.`,
            leido:        false,
          },
        });
      }

      await tx.notificaciones.create({
        data: {
          persona: producto.duenio,
          titulo:  'Estado de tu artículo actualizado',
          mensaje: `${producto.detalle?.nombre || 'Tu artículo'}: ${MENSAJES[estado] || 'el estado fue actualizado.'}`,
          tipo:    'producto_estado',
        },
      });
    });

    return res.json({ ok: true, message: 'Estado actualizado correctamente.' });

  } catch (err) {
    console.error('cambiarEstado error:', err);
    return res.status(500).json({ ok: false, message: 'Error al cambiar el estado.' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/products/:id/approve  (revisor/admin)
// Aprueba el producto, crea la subasta automáticamente y envía
// propuesta al usuario (estado → esperando_usuario).
// Body: { precioBase, comision?, moneda?, categoriaSubasta, fechaSubasta,
//         horaSubasta, lugarSubasta, direccionEnvio? }
// ─────────────────────────────────────────────────────────────
exports.aprobarProducto = async (req, res) => {
  try {
    if (req.user.rol !== 'revisor' && req.user.rol !== 'admin')
      return res.status(403).json({ ok: false, message: 'Acceso denegado.' });

    const { personaId } = req.user;
    const id = parseInt(req.params.id);
    const {
      precioBase,
      comision    = 10,
      moneda      = 'ARS',
      categoriaSubasta,
      fechaSubasta,
      horaSubasta,
      lugarSubasta,
      direccionEnvio,
    } = req.body;

    if (!precioBase || !fechaSubasta || !horaSubasta || !lugarSubasta)
      return res.status(400).json({ ok: false, message: 'Faltan datos: precioBase, fechaSubasta, horaSubasta, lugarSubasta.' });

    const categoriaNormalizada = normalizarCategoriaSubasta(categoriaSubasta, req.body.categoria, req.body.categoriaBien);
    if (!categoriaNormalizada)
      return res.status(400).json({ ok: false, message: `Elegí una categoría válida para el bien. Permitidas: ${CATEGORIAS_SUBASTA.join(', ')}.` });

    const empleado = await prisma.empleados.findFirst({ where: { identificador: personaId } });
    if (!empleado)
      return res.status(403).json({ ok: false, message: 'Solo empleados pueden aprobar productos.' });

    const productoActual = await prisma.productos.findFirst({
      where:   { identificador: id },
      include: { detalle: true, itemsCatalogo: { take: 1 } },
    });
    if (!productoActual)
      return res.status(404).json({ ok: false, message: 'Producto no encontrado.' });

    await prisma.$transaction(async (tx) => {
      await tx.productosDetalle.update({
        where: { producto: id },
        data: {
          estado:         'esperando_usuario',
          revisor:        personaId,
          direccionEnvio: direccionEnvio || null,
        },
      });

      const subastador = await tx.subastadores.findFirst();

      let itemExistente = productoActual.itemsCatalogo?.[0] || null;
      let itemId;

      if (itemExistente) {
        // Re-envío de propuesta: actualizar precio y detalle existentes
        await tx.itemsCatalogo.update({
          where: { identificador: itemExistente.identificador },
          data:  { precioBase: parseFloat(precioBase), comision: parseFloat(comision), subastado: 'no' },
        });
        await tx.itemsCatalogoDetalle.upsert({
          where:  { item: itemExistente.identificador },
          create: { item: itemExistente.identificador, moneda, categoriaSubasta: categoriaNormalizada, fechaSubasta: new Date(fechaSubasta), horaSubasta, lugarSubasta },
          update: { moneda, categoriaSubasta: categoriaNormalizada, fechaSubasta: new Date(fechaSubasta), horaSubasta, lugarSubasta, cerrado: false, ultimaPuja: null, aceptadoPorDuenio: null },
        });
        const catalogoExistente = await tx.catalogos.findUnique({
          where: { identificador: itemExistente.catalogo },
        });
        if (catalogoExistente?.subasta) {
          await tx.subastas.update({
            where: { identificador: catalogoExistente.subasta },
            data:  { categoria: categoriaNormalizada },
          });
        }
        itemId = itemExistente.identificador;
      } else {
        // Primera propuesta: crear subasta → catálogo → ítem → detalle
        const nuevaSubasta = await tx.subastas.create({
          data: {
            fecha:               new Date(fechaSubasta),
            hora:                horaTextoADate(horaSubasta),
            estado:              'programada',
            subastador:          subastador?.identificador || null,
            ubicacion:           lugarSubasta,
            capacidadAsistentes: 100,
            tieneDeposito:       'si',
            seguridadPropia:     'si',
            categoria:           categoriaNormalizada,
          },
        });

        const nuevoCatalogo = await tx.catalogos.create({
          data: {
            descripcion: `Subasta artículo #${id}`,
            subasta:     nuevaSubasta.identificador,
            responsable: empleado.identificador,
          },
        });

        const nuevoItem = await tx.itemsCatalogo.create({
          data: {
            catalogo:   nuevoCatalogo.identificador,
            producto:   id,
            precioBase: parseFloat(precioBase),
            comision:   parseFloat(comision),
            subastado:  'no',
          },
        });

        await tx.itemsCatalogoDetalle.create({
          data: {
            item:         nuevoItem.identificador,
            moneda,
            categoriaSubasta: categoriaNormalizada,
            fechaSubasta: new Date(fechaSubasta),
            horaSubasta,
            lugarSubasta,
          },
        });

        itemId = nuevoItem.identificador;
      }

      let conversacion = await tx.conversaciones.findFirst({ where: { producto: id } });
      if (!conversacion) {
        conversacion = await tx.conversaciones.create({
          data: {
            producto: id,
            duenio:   productoActual.duenio,
            empleado: personaId,
            estado:   'activo',
          },
        });
      }

      if (conversacion) {
        await tx.mensajes.create({
          data: {
            conversacion: conversacion.identificador,
            emisor:       personaId,
            texto:        `Tu artículo fue aprobado. Te enviamos una propuesta con precio base ${moneda} ${precioBase}. Revisá el detalle del artículo para aceptar o rechazar.`,
            leido:        false,
          },
        });
      }

      await tx.notificaciones.create({
        data: {
          persona: productoActual.duenio,
          titulo:  'Propuesta disponible',
          mensaje: `${productoActual.detalle?.nombre || 'Tu artículo'} fue aprobado. Revisá la propuesta en tus artículos.`,
          tipo:    'producto_propuesta',
        },
      });
    });

    return res.json({ ok: true, message: 'Propuesta enviada al usuario.' });

  } catch (err) {
    console.error('aprobarProducto error:', err);
    return res.status(500).json({ ok: false, message: 'Error al aprobar el producto.' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/productos/:id/rechazar  (revisor/admin)
// Rechaza el producto e informa al usuario
// Body: { motivo, cargo? }
// ─────────────────────────────────────────────────────────────
exports.rechazarProducto = async (req, res) => {
  try {
    if (req.user.rol !== 'revisor' && req.user.rol !== 'admin')
      return res.status(403).json({ ok: false, message: 'Acceso denegado.' });

    const { personaId } = req.user;
    const id = parseInt(req.params.id);
    const { motivo, cargo } = req.body;

    if (!motivo)
      return res.status(400).json({ ok: false, message: 'El motivo de rechazo es obligatorio.' });

    const productoActual = await prisma.productos.findFirst({
      where: { identificador: id },
      include: { detalle: true },
    });

    if (!productoActual)
      return res.status(404).json({ ok: false, message: 'Producto no encontrado.' });

    await prisma.$transaction(async (tx) => {
      await tx.productosDetalle.update({
        where: { producto: id },
        data: {
          estado:        'rechazado',
          revisor:       personaId,
          motivoRechazo: motivo,
        },
      });

      await tx.devoluciones.create({
        data: {
          producto: id,
          motivo,
          cargo:    parseFloat(cargo || 0),
        },
      });

      const conversacion = await tx.conversaciones.findFirst({ where: { producto: id } });
      if (conversacion) {
        await tx.mensajes.create({
          data: {
            conversacion: conversacion.identificador,
            emisor:       personaId,
            texto:        `El tasador rechazó el artículo. Motivo: ${motivo}`,
            leido:        false,
          },
        });
      }

      await tx.notificaciones.create({
        data: {
          persona: productoActual.duenio,
          titulo:  'Artículo rechazado',
          mensaje: `${productoActual.detalle?.nombre || 'Tu artículo'} fue rechazado. Revisá el chat para más detalle.`,
          tipo:    'producto_rechazado',
        },
      });
    });

    return res.json({ ok: true, message: 'Producto rechazado. Se notificó al usuario.' });

  } catch (err) {
    console.error('rechazarProducto error:', err);
    return res.status(500).json({ ok: false, message: 'Error al rechazar el producto.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/productos/mis-articulos-en-subastas
// Lista solo los productos en estado 'confirmado' (ya en subasta)
// ─────────────────────────────────────────────────────────────
exports.misArticulosEnSubastas = async (req, res) => {
  try {
    const { personaId } = req.user;

    const productos = await prisma.productos.findMany({
      where:   { duenio: personaId, detalle: { estado: 'confirmado' } },
      orderBy: { fecha: 'desc' },
      include: {
        fotos: { take: 1 },
        detalle: true,
        itemsCatalogo: {
          select: {
            identificador: true,
            precioBase:   true,
            comision:     true,
            subastado:    true,
            detalle:       true,
            catalogos: {
              select: {
                subasta: true,
                subastas: {
                  select: { estado: true, categoria: true, fecha: true, hora: true, ubicacion: true },
                },
              },
            },
          },
        },
      },
    });

    const resultado = productos.map((p) => {
      const foto      = p.fotos?.[0]?.foto;
      const propuesta = p.itemsCatalogo?.[0] || null;

      return {
        productoId:          p.identificador,
        itemId:              propuesta?.identificador || null,
        subastaId:           propuesta?.catalogos?.subasta || null,
        estadoSubasta:       propuesta?.catalogos?.subastas?.estado || null,
        categoriaSubasta:    propuesta?.detalle?.categoriaSubasta || propuesta?.catalogos?.subastas?.categoria || null,
        nombre:              p.detalle?.nombre || 'Producto',
        descripcionCompleta: p.descripcionCompleta,
        portada:             bufferImagenABase64(foto),
        precioBase:          propuesta?.precioBase   || null,
        comision:            propuesta?.comision     || null,
        moneda:              propuesta?.detalle?.moneda       || 'ARS',
        fechaSubasta:        propuesta?.detalle?.fechaSubasta || null,
        horaSubasta:         propuesta?.detalle?.horaSubasta  || null,
        lugarSubasta:        propuesta?.detalle?.lugarSubasta || null,
        subastado:           propuesta?.subastado    || 'no',
      };
    });

    return res.json({ ok: true, articulos: resultado });

  } catch (err) {
    console.error('misArticulosEnSubastas error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener tus artículos en subastas.' });
  }
};
