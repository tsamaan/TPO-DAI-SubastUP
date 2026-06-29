// controllers/authController.js
// Autenticación completa — Prisma + PostgreSQL

require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const prisma = require('../config/prisma');

const {
  enviarResetPassword,
  enviarAprobacion,
  enviarRechazo,
} = require('../services/mailService');

// ── Helpers ───────────────────────────────────────────────────

const generarCodigo = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const codeExpiryMs = () =>
  parseInt(process.env.VERIFY_CODE_EXPIRY_MINUTES || '15') * 60 * 1000;

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
// ─────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ ok: false, message: 'Email y contraseña son requeridos.' });

    // Buscar registro con persona y login incluidos
    const registro = await prisma.registros.findFirst({
      where:   { email: email.toLowerCase().trim() },
      include: { personas: true, logins: true },
    });

    if (!registro)
      return res.status(401).json({ ok: false, message: 'Email o contraseña incorrectos.' });

    // Verificar estado de la cuenta
    if (registro.estado !== 'aprobado') {
      let message;
      if (registro.estado === 'pendiente')
        message = 'Tu cuenta aún no fue aprobada por un administrador. Revisá tu correo.';
      else if (registro.estado === 'rechazado')
        message = `Tu cuenta fue rechazada: ${registro.motivoRechazo || 'Sin motivo especificado'}`;
      else
        message = 'Tu cuenta no está habilitada.';
      return res.status(403).json({ ok: false, message, pendiente: registro.estado === 'pendiente' });
    }

    // Verificar que la persona esté activa
    if (registro.personas.estado !== 'activo')
      return res.status(403).json({ ok: false, message: 'Tu cuenta está deshabilitada.' });

    const login = registro.logins;
    if (!login)
      return res.status(401).json({ ok: false, message: 'Email o contraseña incorrectos.' });

    // Verificar bloqueo
    if (login.bloqueado)
      return res.status(403).json({
        ok: false,
        message: 'Tu cuenta está bloqueada por demasiados intentos fallidos. Contactá al soporte.',
      });

    // Verificar contraseña
    const passwordOk = await bcrypt.compare(password, login.passwordHash);

    if (!passwordOk) {
      const nuevosIntentos = login.intentosFallidos + 1;
      await prisma.logins.update({
        where: { registro: registro.identificador },
        data: {
          intentosFallidos: nuevosIntentos,
          bloqueado:        nuevosIntentos >= 5,
        },
      });

      if (nuevosIntentos >= 5)
        return res.status(403).json({
          ok: false,
          message: 'Cuenta bloqueada por demasiados intentos. Contactá al soporte.',
        });

      return res.status(401).json({ ok: false, message: 'Email o contraseña incorrectos.' });
    }

    // Login exitoso: resetear intentos y registrar acceso
    await prisma.logins.update({
      where: { registro: registro.identificador },
      data: {
        intentosFallidos: 0,
        bloqueado:        false,
        ultimoAcceso:     new Date(),
      },
    });

    // Generar JWT
    const token = jwt.sign(
      {
        registroId: registro.identificador,
        personaId:  registro.personas.identificador,
        email:      registro.email,
        rol:        registro.rol,
        categoria:  registro.categoria,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      ok: true,
      message: 'Login exitoso.',
      token,
      usuario: {
        registroId: registro.identificador,
        nombre:     registro.personas.nombre,
        documento:  registro.personas.documento,
        email:      registro.email,
        rol:        registro.rol,
        categoria:  registro.categoria,
      },
    });

  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register
// Body: { nombre, apellido, dni, telefono, email, password,
//         direccion, numero, ciudad, codigoPostal, pais,
//         foto1Base64?, foto2Base64? }
// ─────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const {
      nombre, apellido, dni, telefono, email, password,
      direccion, numero, ciudad, codigoPostal, pais,
      foto1Base64, foto2Base64,
    } = req.body;

    if (!nombre || !apellido || !dni || !email || !password)
      return res.status(400).json({ ok: false, message: 'Faltan datos obligatorios.' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ ok: false, message: 'El formato del email no es válido.' });

    if (password.length < 6)
      return res.status(400).json({ ok: false, message: 'La contraseña debe tener al menos 6 caracteres.' });

    // Email duplicado
    const existe = await prisma.registros.findFirst({
      where: { email: email.toLowerCase().trim() },
    });
    if (existe)
      return res.status(409).json({ ok: false, message: 'Ya existe una cuenta con ese email.' });

    // DNI duplicado
    const dniExiste = await prisma.personas.findFirst({
      where: { documento: dni.trim() },
    });
    if (dniExiste)
      return res.status(409).json({ ok: false, message: 'Ya existe una cuenta con ese DNI.' });

    // Hash de contraseña
    const salt         = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Dirección completa
    const direccionCompleta = [direccion, numero, ciudad, codigoPostal, pais]
      .filter(Boolean)
      .join(', ');

    // Transacción: persona + registro + login + fotosDNI
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Persona
      const persona = await tx.personas.create({
        data: {
          documento: dni.trim(),
          nombre:    `${nombre.trim()} ${apellido.trim()}`,
          direccion: direccionCompleta || null,
          estado:    'activo',
          foto:      foto1Base64 ? Buffer.from(foto1Base64.replace(/^data:image\/\w+;base64,/, ''), 'base64') : null,
        },
      });

      // 2. Registro
      const registro = await tx.registros.create({
        data: {
          persona:  persona.identificador,
          email:    email.toLowerCase().trim(),
          telefono: telefono?.trim() || null,
          estado:   'pendiente',
          rol:      'usuario',
        },
      });

      // 3. Login
      await tx.logins.create({
        data: {
          registro:         registro.identificador,
          passwordHash,
          salt,
          intentosFallidos: 0,
          bloqueado:        false,
        },
      });

      // 4. Fotos DNI
      if (foto1Base64) {
        await tx.fotosDNI.create({
          data: {
            registro: registro.identificador,
            tipo:     'frente',
            foto:     Buffer.from(foto1Base64.replace(/^data:image\/\w+;base64,/, ''), 'base64'),
          },
        });
      }
      if (foto2Base64) {
        await tx.fotosDNI.create({
          data: {
            registro: registro.identificador,
            tipo:     'dorso',
            foto:     Buffer.from(foto2Base64.replace(/^data:image\/\w+;base64,/, ''), 'base64'),
          },
        });
      }

      return { registroId: registro.identificador };
    });

    return res.status(201).json({
      ok:         true,
      message:    'Registro enviado correctamente. Un administrador revisará tus datos.',
      registroId: resultado.registroId,
    });

  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// Body: { email }
// ─────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ ok: false, message: 'El email es requerido.' });

    const registro = await prisma.registros.findFirst({
      where: { email: email.toLowerCase().trim() },
    });

    // Respuesta genérica por seguridad
    if (!registro)
      return res.json({ ok: true, message: 'Si el email existe, recibirás un código de verificación.' });

    const codigo     = generarCodigo();
    const timestamp  = Date.now();
    const tokenVerif = `RESET:${codigo}:${timestamp}`;

    await prisma.registros.update({
      where: { identificador: registro.identificador },
      data:  { tokenVerif },
    });

    try {
      await enviarResetPassword(registro.email, codigo);
    } catch (mailErr) {
      console.error('Error enviando email:', mailErr.message);
      console.log(`🔑  Código de reset (dev): ${codigo}`);
    }

    return res.json({ ok: true, message: 'Si el email existe, recibirás un código de verificación.' });

  } catch (err) {
    console.error('forgotPassword error:', err);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/verify-code
// Body: { email, code }
// ─────────────────────────────────────────────────────────────
exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code)
      return res.status(400).json({ ok: false, message: 'Email y código son requeridos.' });

    const registro = await prisma.registros.findFirst({
      where: { email: email.toLowerCase().trim() },
    });

    if (!registro || !registro.tokenVerif)
      return res.status(400).json({ ok: false, message: 'Código inválido o expirado.' });

    const [prefix, storedCode, timestamp] = registro.tokenVerif.split(':');

    if (prefix !== 'RESET' || storedCode !== code.trim())
      return res.status(400).json({ ok: false, message: 'El código ingresado no es válido.' });

    if (Date.now() - parseInt(timestamp) > codeExpiryMs())
      return res.status(400).json({ ok: false, message: 'El código expiró. Solicitá uno nuevo.' });

    // Limpiar token
    await prisma.registros.update({
      where: { identificador: registro.identificador },
      data:  { tokenVerif: null },
    });

    // Generar resetToken de un solo uso (válido 10 min)
    const resetToken = jwt.sign(
      { registroId: registro.identificador, email: registro.email, action: 'reset-password' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    return res.json({ ok: true, message: 'Código verificado.', resetToken });

  } catch (err) {
    console.error('verifyCode error:', err);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// Body: { resetToken, newPassword, confirmPassword }
// ─────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword)
      return res.status(400).json({ ok: false, message: 'Todos los campos son requeridos.' });

    if (newPassword !== confirmPassword)
      return res.status(400).json({ ok: false, message: 'Las contraseñas no coinciden.' });

    if (newPassword.length < 6)
      return res.status(400).json({ ok: false, message: 'La contraseña debe tener al menos 6 caracteres.' });

    // Verificar resetToken
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ ok: false, message: 'El token expiró o no es válido. Iniciá el proceso de nuevo.' });
    }

    if (decoded.action !== 'reset-password')
      return res.status(400).json({ ok: false, message: 'Token no válido para esta acción.' });

    // Nuevo hash
    const salt         = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.logins.update({
      where: { registro: decoded.registroId },
      data: {
        passwordHash,
        salt,
        intentosFallidos: 0,
        bloqueado:        false,
      },
    });

    return res.json({ ok: true, message: 'Contraseña actualizada correctamente. Ya podés iniciar sesión.' });

  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/validate-user  (solo admin)
// Body: { registroId, aprobar, motivoRechazo? }
// ─────────────────────────────────────────────────────────────
exports.validateUser = async (req, res) => {
  try {
    const { registroId, aprobar, motivoRechazo } = req.body;

    if (registroId === undefined || aprobar === undefined)
      return res.status(400).json({ ok: false, message: 'registroId y aprobar son requeridos.' });

    const nuevoEstado = aprobar ? 'aprobado' : 'rechazado';

    const registro = await prisma.registros.update({
      where: { identificador: parseInt(registroId) },
      data: {
        estado:        nuevoEstado,
        motivoRechazo: aprobar ? null : (motivoRechazo || 'Rechazado por el administrador'),
      },
    });

    // Enviar mail al usuario
    try {
      if (aprobar) {
        await enviarAprobacion(registro.email);
      } else {
        await enviarRechazo(registro.email, motivoRechazo || 'Rechazado por el administrador');
      }
    } catch (mailErr) {
      console.error('Error enviando mail:', mailErr.message);
    }

    return res.json({
      ok:      true,
      message: aprobar ? 'Usuario aprobado.' : 'Usuario rechazado.',
      estado:  nuevoEstado,
    });

  } catch (err) {
    console.error('validateUser error:', err);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/auth/asignar-categoria  (solo revisor/admin)
// Body: { registroId, categoria }
// categoria: comun | especial | plata | oro | platino
// ─────────────────────────────────────────────────────────────
exports.asignarCategoria = async (req, res) => {
  try {
    if (req.user.rol !== 'revisor' && req.user.rol !== 'admin')
      return res.status(403).json({ ok: false, message: 'Acceso denegado.' });

    const { registroId, categoria } = req.body;
    const categoriasValidas = ['comun', 'especial', 'plata', 'oro', 'platino'];

    if (!registroId || !categoria)
      return res.status(400).json({ ok: false, message: 'registroId y categoria son requeridos.' });

    if (!categoriasValidas.includes(categoria))
      return res.status(400).json({ ok: false, message: 'Categoría inválida.' });

    const registro = await prisma.registros.update({
      where: { identificador: parseInt(registroId) },
      data:  { categoria },
    });

    return res.json({
      ok:        true,
      message:   `Categoría actualizada a "${categoria}".`,
      categoria: registro.categoria,
    });

  } catch (err) {
    console.error('asignarCategoria error:', err);
    return res.status(500).json({ ok: false, message: 'Error al asignar la categoría.' });
  }
};
