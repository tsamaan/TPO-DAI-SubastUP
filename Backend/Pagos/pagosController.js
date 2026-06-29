// controllers/pagosController.js
// Métodos de pago — Prisma + PostgreSQL

const prisma = require('../config/prisma');

// ─────────────────────────────────────────────────────────────
// GET /api/pagos
// Lista todos los métodos de pago activos del usuario
// ─────────────────────────────────────────────────────────────
exports.listarMetodos = async (req, res) => {
  try {
    const { personaId } = req.user;

    const metodos = await prisma.metodosPago.findMany({
      where:   { persona: personaId, activo: true },
      include: {
        tarjetas:        true,
        cuentasBancarias: true,
        cheques:         true,
      },
      orderBy: { fechaCreacion: 'desc' },
    });

    // Limpiar la respuesta según el tipo
    const resultado = metodos.map((m) => {
      const base = {
        id:           m.identificador,
        tipo:         m.tipo,
        fechaCreacion: m.fechaCreacion,
      };

      if (m.tipo === 'tarjeta' && m.tarjetas) {
        return {
          ...base,
          titular:        m.tarjetas.titular,
          // Enmascarar número: mostrar solo últimos 4 dígitos
          numeroTarjeta:  `**** **** **** ${m.tarjetas.numeroTarjeta.slice(-4)}`,
          mesVencimiento: m.tarjetas.mesVencimiento,
          anioVencimiento: m.tarjetas.anioVencimiento,
          direccion:      m.tarjetas.direccion,
          codigoPostal:   m.tarjetas.codigoPostal,
          pais:           m.tarjetas.pais,
          localidad:      m.tarjetas.localidad,
        };
      }

      if (m.tipo === 'banco' && m.cuentasBancarias) {
        return {
          ...base,
          cbu:     m.cuentasBancarias.cbu,
          alias:   m.cuentasBancarias.alias,
          titular: m.cuentasBancarias.titular,
        };
      }

      if (m.tipo === 'cheque' && m.cheques) {
        return {
          ...base,
          nombreBanco:    m.cheques.nombreBanco,
          fechaPago:      m.cheques.fechaPago,
          numeroSucursal: m.cheques.numeroSucursal,
          numeroCheque:   m.cheques.numeroCheque,
          imagen:         m.cheques.imagen
            ? Buffer.from(m.cheques.imagen).toString('base64')
            : null,
        };
      }

      return base;
    });

    return res.json({ ok: true, metodos: resultado });

  } catch (err) {
    console.error('listarMetodos error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener los métodos de pago.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/pagos/tarjeta
// Body: { titular, numeroTarjeta, mesVencimiento, anioVencimiento,
//         codigoSeguridad, direccion?, codigoPostal?, pais?, localidad? }
// ─────────────────────────────────────────────────────────────
exports.agregarTarjeta = async (req, res) => {
  try {
    const { personaId } = req.user;
    const {
      titular, numeroTarjeta, mesVencimiento, anioVencimiento,
      codigoSeguridad, direccion, codigoPostal, pais, localidad,
    } = req.body;

    if (!titular || !numeroTarjeta || !mesVencimiento || !anioVencimiento || !codigoSeguridad)
      return res.status(400).json({ ok: false, message: 'Faltan datos obligatorios de la tarjeta.' });

    const metodo = await prisma.$transaction(async (tx) => {
      const mp = await tx.metodosPago.create({
        data: { persona: personaId, tipo: 'tarjeta' },
      });

      await tx.tarjetas.create({
        data: {
          identificador:  mp.identificador,
          titular,
          numeroTarjeta,
          mesVencimiento,
          anioVencimiento,
          codigoSeguridad,
          direccion:    direccion    || null,
          codigoPostal: codigoPostal || null,
          pais:         pais         || null,
          localidad:    localidad    || null,
        },
      });

      return mp;
    });

    return res.status(201).json({
      ok:       true,
      message:  'Tarjeta agregada correctamente.',
      metodoId: metodo.identificador,
    });

  } catch (err) {
    console.error('agregarTarjeta error:', err);
    return res.status(500).json({ ok: false, message: 'Error al agregar la tarjeta.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/pagos/banco
// Body: { cbu, alias?, titular }
// ─────────────────────────────────────────────────────────────
exports.agregarBanco = async (req, res) => {
  try {
    const { personaId } = req.user;
    const { cbu, alias, titular } = req.body;

    if (!cbu || !titular)
      return res.status(400).json({ ok: false, message: 'CBU y titular son obligatorios.' });

    const metodo = await prisma.$transaction(async (tx) => {
      const mp = await tx.metodosPago.create({
        data: { persona: personaId, tipo: 'banco' },
      });

      await tx.cuentasBancarias.create({
        data: {
          identificador: mp.identificador,
          cbu,
          alias:   alias || null,
          titular,
        },
      });

      return mp;
    });

    return res.status(201).json({
      ok:       true,
      message:  'Cuenta bancaria agregada correctamente.',
      metodoId: metodo.identificador,
    });

  } catch (err) {
    console.error('agregarBanco error:', err);
    return res.status(500).json({ ok: false, message: 'Error al agregar la cuenta bancaria.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/pagos/cheque
// Body: { nombreBanco, fechaPago, numeroSucursal?, numeroCheque, imagen? }
// ─────────────────────────────────────────────────────────────
exports.agregarCheque = async (req, res) => {
  try {
    const { personaId } = req.user;
    const { nombreBanco, fechaPago, numeroSucursal, numeroCheque, imagen } = req.body;

    if (!nombreBanco || !fechaPago || !numeroCheque)
      return res.status(400).json({ ok: false, message: 'Nombre del banco, fecha de pago y número de cheque son obligatorios.' });

    const imagenBuffer = imagen
      ? Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      : null;

    const metodo = await prisma.$transaction(async (tx) => {
      const mp = await tx.metodosPago.create({
        data: { persona: personaId, tipo: 'cheque' },
      });

      await tx.cheques.create({
        data: {
          identificador:  mp.identificador,
          nombreBanco,
          fechaPago:      new Date(fechaPago),
          numeroSucursal: numeroSucursal || null,
          numeroCheque,
          imagen:         imagenBuffer,
        },
      });

      return mp;
    });

    return res.status(201).json({
      ok:       true,
      message:  'Cheque agregado correctamente.',
      metodoId: metodo.identificador,
    });

  } catch (err) {
    console.error('agregarCheque error:', err);
    return res.status(500).json({ ok: false, message: 'Error al agregar el cheque.' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/pagos/:id
// Soft delete: marca el método como inactivo
// ─────────────────────────────────────────────────────────────
exports.eliminarMetodo = async (req, res) => {
  try {
    const { personaId } = req.user;
    const id = parseInt(req.params.id);

    // Verificar que el método pertenece al usuario
    const metodo = await prisma.metodosPago.findFirst({
      where: { identificador: id, persona: personaId },
    });

    if (!metodo)
      return res.status(404).json({ ok: false, message: 'Método de pago no encontrado.' });

    await prisma.metodosPago.update({
      where: { identificador: id },
      data:  { activo: false },
    });

    return res.json({ ok: true, message: 'Método de pago eliminado.' });

  } catch (err) {
    console.error('eliminarMetodo error:', err);
    return res.status(500).json({ ok: false, message: 'Error al eliminar el método de pago.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/pagos/pendientes-verificacion  (solo revisor/admin)
// Lista métodos de pago activos sin verificar, de todos los usuarios
// ─────────────────────────────────────────────────────────────
exports.metodosPendientesVerificacion = async (req, res) => {
  try {
    if (req.user.rol !== 'revisor' && req.user.rol !== 'admin')
      return res.status(403).json({ ok: false, message: 'Acceso denegado.' });

    const metodos = await prisma.metodosPago.findMany({
      where:   { activo: true, verificado: false },
      include: {
        personas:         { select: { nombre: true, documento: true } },
        tarjetas:         true,
        cuentasBancarias: true,
        cheques:          true,
      },
      orderBy: { fechaCreacion: 'asc' },
    });

    const resultado = metodos.map((m) => ({
      id:           m.identificador,
      tipo:         m.tipo,
      titular:      m.tarjetas?.titular || m.cuentasBancarias?.titular || null,
      nombreDuenio: m.personas?.nombre,
      documento:    m.personas?.documento,
      fechaCreacion: m.fechaCreacion,
    }));

    return res.json({ ok: true, metodos: resultado });

  } catch (err) {
    console.error('metodosPendientesVerificacion error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener los métodos pendientes.' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/pagos/:id/verificar  (solo revisor/admin)
// Marca un método de pago como verificado
// ─────────────────────────────────────────────────────────────
exports.verificarMetodo = async (req, res) => {
  try {
    if (req.user.rol !== 'revisor' && req.user.rol !== 'admin')
      return res.status(403).json({ ok: false, message: 'Acceso denegado.' });

    const id = parseInt(req.params.id);

    const metodo = await prisma.metodosPago.findFirst({
      where: { identificador: id, activo: true },
    });

    if (!metodo)
      return res.status(404).json({ ok: false, message: 'Método de pago no encontrado.' });

    await prisma.metodosPago.update({
      where: { identificador: id },
      data:  { verificado: true },
    });

    return res.json({ ok: true, message: 'Método de pago verificado correctamente.' });

  } catch (err) {
    console.error('verificarMetodo error:', err);
    return res.status(500).json({ ok: false, message: 'Error al verificar el método de pago.' });
  }
};
