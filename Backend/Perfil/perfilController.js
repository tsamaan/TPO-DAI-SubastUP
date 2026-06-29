// controllers/perfilController.js
// Perfil de usuario — Prisma + PostgreSQL

const bcrypt = require('bcryptjs');
const prisma  = require('../config/prisma');

// ─────────────────────────────────────────────────────────────
// GET /api/perfil
// ─────────────────────────────────────────────────────────────
exports.getPerfil = async (req, res) => {
  try {
    const { personaId, registroId } = req.user;

    const registro = await prisma.registros.findFirst({
      where: { identificador: registroId, persona: personaId },
      include: { personas: true },
    });

    if (!registro)
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });

    const p = registro.personas;

    return res.json({
      ok: true,
      perfil: {
        personaId:     p.identificador,
        registroId:    registro.identificador,
        nombre:        p.nombre,
        documento:     p.documento,
        telefono:      p.telefono,
        direccion:     p.direccion,
        email:         registro.email,
        rol:           registro.rol,
        foto:          p.foto ? Buffer.from(p.foto).toString('base64') : null,
        fechaRegistro: registro.fechaRegistro,
      },
    });

  } catch (err) {
    console.error('getPerfil error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener el perfil.' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/perfil
// Body: { nombre?, telefono?, direccion?, email?,
//         passwordActual?, nuevaPassword?, fotoBase64? }
// ─────────────────────────────────────────────────────────────
exports.editarPerfil = async (req, res) => {
  try {
    const { personaId, registroId } = req.user;
    const { nombre, telefono, direccion, email, passwordActual, nuevaPassword, fotoBase64 } = req.body;

    // Traer registro + login
    const registro = await prisma.registros.findFirst({
      where:   { identificador: registroId },
      include: { logins: true },
    });

    if (!registro)
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });

    // ── Cambio de email: verificar que no esté en uso ──────────
    if (email && email.toLowerCase().trim() !== registro.email) {
      const emailEnUso = await prisma.registros.findFirst({
        where: { email: email.toLowerCase().trim() },
      });
      if (emailEnUso)
        return res.status(409).json({ ok: false, message: 'Ese email ya está en uso.' });
    }

    // ── Cambio de contraseña: validar la actual ─────────────────
    let nuevoHash = null;
    let nuevoSalt = null;

    if (nuevaPassword) {
      if (!passwordActual)
        return res.status(400).json({ ok: false, message: 'Ingresá tu contraseña actual para cambiarla.' });

      const passwordOk = await bcrypt.compare(passwordActual, registro.logins.passwordHash);
      if (!passwordOk)
        return res.status(401).json({ ok: false, message: 'La contraseña actual es incorrecta.' });

      if (nuevaPassword.length < 6)
        return res.status(400).json({ ok: false, message: 'La nueva contraseña debe tener al menos 6 caracteres.' });

      nuevoSalt = await bcrypt.genSalt(12);
      nuevoHash = await bcrypt.hash(nuevaPassword, nuevoSalt);
    }

    // ── Foto ────────────────────────────────────────────────────
    let fotoBuffer = null;
    if (fotoBase64) {
      const base64Data = fotoBase64.replace(/^data:image\/\w+;base64,/, '');
      fotoBuffer = Buffer.from(base64Data, 'base64');
    }

    // ── Actualizar en transacción ───────────────────────────────
    await prisma.$transaction(async (tx) => {

      // Actualizar personas
      await tx.personas.update({
        where: { identificador: personaId },
        data: {
          ...(nombre    && { nombre }),
          ...(telefono  && { telefono }),
          ...(direccion && { direccion }),
          ...(fotoBuffer && { foto: fotoBuffer }),
        },
      });

      // Actualizar email en registros
      if (email && email.toLowerCase().trim() !== registro.email) {
        await tx.registros.update({
          where: { identificador: registroId },
          data:  { email: email.toLowerCase().trim() },
        });
      }

      // Actualizar contraseña en logins
      if (nuevoHash) {
        await tx.logins.update({
          where: { registro: registroId },
          data: {
            passwordHash: nuevoHash,
            salt:         nuevoSalt,
          },
        });
      }
    });

    return res.json({ ok: true, message: 'Perfil actualizado correctamente.' });

  } catch (err) {
    console.error('editarPerfil error:', err);
    return res.status(500).json({ ok: false, message: 'Error al actualizar el perfil.' });
  }
};
