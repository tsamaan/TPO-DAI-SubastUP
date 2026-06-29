// controllers/productosController.js
// Productos — Prisma + PostgreSQL

const prisma = require('../config/prisma');
const { enviarMail } = require('../services/mailService');

// ─────────────────────────────────────────────────────────────
// POST /api/productos
// Usuario carga un producto nuevo
// Body: { nombre, descripcionCompleta, fotosBase64[] }
// ─────────────────────────────────────────────────────────────
exports.cargarProducto = async (req, res) => {
  try {
    const { personaId } = req.user;
    const { nombre, descripcionCompleta, fotosBase64 } = req.body;

    if (!nombre || !descripcionCompleta)
      return res.status(400).json({ ok: false, message: 'Nombre y descripción son obligatorios.' });

    if (!fotosBase64 || fotosBase64.length === 0)
      return res.status(400).json({ ok: false, message: 'Debe subir al menos una foto.' });

    if (fotosBase64.length > 4)
      return res.status(400).json({ ok: false, message: 'Máximo 4 fotos por producto.' });

    // Verificar que la persona sea dueño
    const duenio = await prisma.duenios.findFirst({
      where: { identificador: personaId },
    });

    if (!duenio)
      return res.status(403).json({ ok: false, message: 'Solo los dueños pueden cargar productos.' });

    // Crear producto + fotos en transacción
    const producto = await prisma.$transaction(async (tx) => {
      const p = await tx.productos.create({
        data: {
          nombre,
          descripcionCompleta,
          duenio:    personaId,
          fecha:     new Date(),
          estado:    'pendiente',
          disponible: 'no',
        },
      });

      for (const fotoBase64 of fotosBase64) {
        const fotoBuffer = Buffer.from(
          fotoBase64.replace(/^data:image\/\w+;base64,/, ''),
          'base64'
        );
        await tx.fotos.create({
          data: { producto: p.identificador, foto: fotoBuffer },
        });
      }

      return p;
    });

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
    });

  } catch (err) {
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
      select: {
        identificador:      true,
        nombre:             true,
        estado:             true,
        fecha:              true,
        descripcionCompleta: true,
        motivoRechazo:      true,
        direccionEnvio:     true,
        descripcionCatalogo: true,
      },
    });

    return res.json({ ok: true, productos });

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
        fotos:         true,
        itemsCatalogo: {
          select: {
            precioBase:       true,
            comision:         true,
            fechaSubasta:     true,
            horaSubasta:      true,
            lugarSubasta:     true,
            aceptadoPorDuenio: true,
          },
        },
      },
    });

    if (!producto)
      return res.status(404).json({ ok: false, message: 'Producto no encontrado.' });

    const fotosBase64 = producto.fotos.map((f) => ({
      id:   f.identificador,
      foto: Buffer.from(f.foto).toString('base64'),
    }));

    const propuesta = producto.itemsCatalogo?.[0] || null;

    const textoEstado = {
      pendiente:          'Tu producto está siendo revisado por nuestro equipo.',
      en_inspeccion:      'Tu producto fue recibido y está siendo inspeccionado físicamente.',
      aprobado:           'Tu producto fue aceptado por la empresa.',
      esperando_usuario:  'La empresa hizo una propuesta. Revisá los detalles y decidí si aceptás.',
      confirmado:         'Tu producto fue confirmado y será incluido en una subasta próximamente.',
      rechazado:          `Tu producto no fue aceptado. Motivo: ${producto.motivoRechazo || 'Sin motivo especificado'}`,
      devuelto:           'Tu producto está siendo devuelto. Se aplicarán los cargos correspondientes.',
    };

    return res.json({
      ok: true,
      producto: {
        identificador:       producto.identificador,
        nombre:              producto.nombre,
        estado:              producto.estado,
        textoEstado:         textoEstado[producto.estado] || '',
        fecha:               producto.fecha,
        descripcionCompleta: producto.descripcionCompleta,
        descripcionCatalogo: producto.descripcionCatalogo,
        motivoRechazo:       producto.motivoRechazo,
        direccionEnvio:      producto.direccionEnvio,
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
    });

    if (!producto)
      return res.status(404).json({ ok: false, message: 'Producto no encontrado.' });

    if (producto.estado !== 'pendiente')
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
    const { acepta } = req.body;

    if (acepta === undefined)
      return res.status(400).json({ ok: false, message: 'Debés indicar si aceptás o no la propuesta.' });

    const producto = await prisma.productos.findFirst({
      where:   { identificador: id, duenio: personaId, estado: 'esperando_usuario' },
      include: { itemsCatalogo: true },
    });

    if (!producto || producto.itemsCatalogo.length === 0)
      return res.status(404).json({ ok: false, message: 'Producto no encontrado o sin propuesta pendiente.' });

    const itemId     = producto.itemsCatalogo[0].identificador;
    const nuevoEstado = acepta ? 'confirmado' : 'devuelto';

    await prisma.$transaction(async (tx) => {
      await tx.productos.update({
        where: { identificador: id },
        data:  { estado: nuevoEstado },
      });

      await tx.itemsCatalogo.update({
        where: { identificador: itemId },
        data:  { aceptadoPorDuenio: acepta },
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
      where:   { estado: 'pendiente' },
      orderBy: { fecha: 'desc' },
      include: {
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
      nombre:              p.nombre,
      descripcionCompleta: p.descripcionCompleta,
      estado:              p.estado,
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

    await prisma.$transaction(async (tx) => {
      await tx.productos.update({
        where: { identificador: id },
        data: {
          estado:         'esperando_usuario',
          revisor:        personaId,
          direccionEnvio: direccionEnvio || null,
        },
      });

      await tx.itemsCatalogo.create({
        data: {
          catalogo:     catalogoId,
          producto:     id,
          precioBase:   parseFloat(precioBase),
          comision:     parseFloat(comision),
          subastado:    'no',
          fechaSubasta: new Date(fechaSubasta),
          horaSubasta,
          lugarSubasta,
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

    await prisma.$transaction(async (tx) => {
      await tx.productos.update({
        where: { identificador: id },
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
      where:   { duenio: personaId, estado: 'confirmado' },
      orderBy: { fecha: 'desc' },
      include: {
        fotos: { take: 1 },
        itemsCatalogo: {
          select: {
            precioBase:   true,
            comision:     true,
            moneda:       true,
            fechaSubasta: true,
            horaSubasta:  true,
            lugarSubasta: true,
            subastado:    true,
          },
        },
      },
    });

    const resultado = productos.map((p) => {
      const foto      = p.fotos?.[0]?.foto;
      const propuesta = p.itemsCatalogo?.[0] || null;

      return {
        productoId:          p.identificador,
        nombre:              p.nombre,
        descripcionCompleta: p.descripcionCompleta,
        portada:             foto ? Buffer.from(foto).toString('base64') : null,
        precioBase:          propuesta?.precioBase   || null,
        comision:            propuesta?.comision     || null,
        moneda:              propuesta?.moneda       || 'ARS',
        fechaSubasta:        propuesta?.fechaSubasta || null,
        horaSubasta:         propuesta?.horaSubasta  || null,
        lugarSubasta:        propuesta?.lugarSubasta || null,
        subastado:           propuesta?.subastado    || 'no',
      };
    });

    return res.json({ ok: true, articulos: resultado });

  } catch (err) {
    console.error('misArticulosEnSubastas error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener tus artículos en subastas.' });
  }
};
