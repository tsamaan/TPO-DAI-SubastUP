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
            categoriaSubasta: propuesta.catalogos?.subastas?.categoria || null,
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
      categoriaSubasta: itemPropuesta.catalogos?.subastas?.categoria || null,
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
    const { action, reason } = req.body;

    if (action !== 'ACCEPT' && action !== 'REJECT')
      return res.status(400).json({ ok: false, message: 'La acción debe ser ACCEPT o REJECT.' });

    const acepta = action === 'ACCEPT';

    const producto = await prisma.productos.findFirst({
      where:   { identificador: id, duenio: personaId, detalle: { estado: 'esperando_usuario' } },
      include: { itemsCatalogo: true, detalle: true },
    });

    if (!producto || producto.itemsCatalogo.length === 0)
      return res.status(404).json({ ok: false, message: 'Producto no encontrado o sin propuesta pendiente.' });

    const itemId     = producto.itemsCatalogo[0].identificador;
    const nuevoEstado = acepta ? 'confirmado' : 'devuelto';

    await prisma.$transaction(async (tx) => {
      await tx.productosDetalle.update({
        where: { producto: id },
        data:  { estado: nuevoEstado },
      });

      await tx.itemsCatalogoDetalle.update({
        where: { item: itemId },
        data:  { aceptadoPorDuenio: acepta },
      });

      const conversacion = await tx.conversaciones.findFirst({ where: { producto: id } });
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
// Lista productos pendientes de revisión
// ─────────────────────────────────────────────────────────────
exports.productosPendientes = async (req, res) => {
  try {
    if (req.user.rol !== 'revisor' && req.user.rol !== 'admin')
      return res.status(403).json({ ok: false, message: 'Acceso denegado.' });

    const productos = await prisma.productos.findMany({
      where:   { detalle: { estado: 'pendiente' } },
      orderBy: { fecha: 'desc' },
      include: {
        detalle: true,
        duenios: {
          include: {
            personas: {
              include: {
                registros: {
                  select: { email: true },
                },
              },
            },
          },
        },
        fotos: true,
      },
    });

    const resultado = productos.map((p) => ({
      productoId:          p.identificador,
      nombre:              p.detalle?.nombre || 'Producto',
      descripcionCompleta: p.descripcionCompleta,
      estado:              p.detalle?.estado || 'pendiente',
      fecha:               p.fecha,
      nombreDuenio:        p.duenios.personas.nombre,
      emailDuenio:         p.duenios.personas.registros?.[0]?.email || null,
      cantidadFotos:       p.fotos.length,
    }));

    return res.json({ ok: true, productos: resultado });

  } catch (err) {
    console.error('productosPendientes error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener productos pendientes.' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/productos/:id/aprobar  (revisor/admin)
// Aprueba el producto y envía propuesta al usuario
// Body: { precioBase, comision, fechaSubasta, horaSubasta,
//         lugarSubasta, catalogoId, direccionEnvio? }
// ─────────────────────────────────────────────────────────────
exports.aprobarProducto = async (req, res) => {
  try {
    if (req.user.rol !== 'revisor' && req.user.rol !== 'admin')
      return res.status(403).json({ ok: false, message: 'Acceso denegado.' });

    const { personaId } = req.user;
    const id = parseInt(req.params.id);
    const { precioBase, comision, fechaSubasta, horaSubasta, lugarSubasta, catalogoId, direccionEnvio } = req.body;

    if (!precioBase || !comision || !fechaSubasta || !horaSubasta || !lugarSubasta || !catalogoId)
      return res.status(400).json({ ok: false, message: 'Faltan datos de la propuesta.' });

    // Verificar que sea empleado
    const empleado = await prisma.empleados.findFirst({
      where: { identificador: personaId },
    });

    if (!empleado)
      return res.status(403).json({ ok: false, message: 'Solo empleados pueden aprobar productos.' });

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
          estado:         'esperando_usuario',
          revisor:        personaId,
          direccionEnvio: direccionEnvio || null,
        },
      });

      let catalogoDestinoId = parseInt(catalogoId, 10);
      const catalogoBase = await tx.catalogos.findFirst({
        where: { identificador: catalogoDestinoId },
        include: {
          subastas: true,
          _count: { select: { itemsCatalogo: true } },
        },
      });

      if (!catalogoBase)
        throw new Error('Catálogo no encontrado.');

      let item = await tx.itemsCatalogo.findFirst({ where: { producto: id } });

      const crearCatalogoUnitario = async (baseCatalogo) => {
        const subastaBase = baseCatalogo.subastas;
        const nuevaSubasta = await tx.subastas.create({
          data: {
            fecha:               new Date(fechaSubasta),
            hora:                horaTextoADate(horaSubasta),
            estado:              subastaBase?.estado || 'programada',
            subastador:          subastaBase?.subastador || null,
            ubicacion:           lugarSubasta,
            capacidadAsistentes: subastaBase?.capacidadAsistentes || 100,
            tieneDeposito:       subastaBase?.tieneDeposito || 'si',
            seguridadPropia:     subastaBase?.seguridadPropia || 'si',
            categoria:           subastaBase?.categoria || 'comun',
          },
        });

        const nuevoCatalogo = await tx.catalogos.create({
          data: {
            descripcion: `${baseCatalogo.descripcion} - producto ${id}`,
            subasta:     nuevaSubasta.identificador,
            responsable: baseCatalogo.responsable,
          },
        });

        return nuevoCatalogo.identificador;
      };

      // Regla de negocio: una subasta publicada en una card tiene un solo artículo.
      // Si el catálogo elegido ya tiene otro ítem, se crea una subasta/catálogo propio
      // para este producto sin modificar las tablas base.
      if (!item && catalogoBase._count.itemsCatalogo > 0) {
        catalogoDestinoId = await crearCatalogoUnitario(catalogoBase);
      }

      if (item) {
        const catalogoActual = await tx.catalogos.findFirst({
          where: { identificador: item.catalogo },
          include: {
            subastas: true,
            _count: { select: { itemsCatalogo: true } },
          },
        });

        if (catalogoActual?._count?.itemsCatalogo > 1) {
          catalogoDestinoId = await crearCatalogoUnitario(catalogoActual);
        }
      }

      if (item) {
        item = await tx.itemsCatalogo.update({
          where: { identificador: item.identificador },
          data: {
            catalogo:   catalogoDestinoId,
            precioBase: parseFloat(precioBase),
            comision:   parseFloat(comision),
            subastado:  'no',
          },
        });
      } else {
        item = await tx.itemsCatalogo.create({
          data: {
            catalogo:     catalogoDestinoId,
            producto:     id,
            precioBase:   parseFloat(precioBase),
            comision:     parseFloat(comision),
            subastado:    'no',
          },
        });
      }

      await tx.itemsCatalogoDetalle.upsert({
        where: { item: item.identificador },
        create: { item: item.identificador, fechaSubasta: new Date(fechaSubasta), horaSubasta, lugarSubasta },
        update: { fechaSubasta: new Date(fechaSubasta), horaSubasta, lugarSubasta, ultimaPuja: null, cerrado: false },
      });

      const conversacion = await tx.conversaciones.findFirst({ where: { producto: id } });
      if (conversacion) {
        await tx.mensajes.create({
          data: {
            conversacion: conversacion.identificador,
            emisor:       personaId,
            texto:        `Tu artículo fue aprobado y tenemos una propuesta con precio base ${precioBase}. Revisá el detalle del artículo para aceptar o rechazar.`,
            leido:        false,
          },
        });
      }

      await tx.notificaciones.create({
        data: {
          persona: productoActual.duenio,
          titulo:  'Propuesta disponible',
          mensaje: `${productoActual.detalle?.nombre || 'Tu artículo'} fue aprobado. Revisá la propuesta final.`,
          tipo:    'producto_propuesta',
        },
      });
    });

    return res.json({ ok: true, message: 'Producto aprobado. Se notificó al usuario.' });

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
        categoriaSubasta:    propuesta?.catalogos?.subastas?.categoria || null,
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
