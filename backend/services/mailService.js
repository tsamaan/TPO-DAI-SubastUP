const transporter = require('../config/mailer');
const {
  htmlVerificacion,
  htmlResetPassword,
  htmlAprobacion,
  htmlRechazo,
} = require('./emailTemplates');

const enviarVerificacion = async (email, token) => {
  await transporter.sendMail({
    from:    '"SubastUp" <noreply@subastup.com>',
    to:      email,
    subject: 'Verificá tu cuenta',
    html:    htmlVerificacion(token),
  });
};

const enviarResetPassword = async (email, codigo) => {
  await transporter.sendMail({
    from:    '"SubastUp" <noreply@subastup.com>',
    to:      email,
    subject: 'Recuperación de contraseña',
    html:    htmlResetPassword(codigo),
  });
};

const enviarAprobacion = async (email, passwordTemporal) => {
  await transporter.sendMail({
    from:    '"SubastUp" <noreply@subastup.com>',
    to:      email,
    subject: 'Tu cuenta fue aprobada',
    html:    htmlAprobacion(passwordTemporal),
  });
};

const enviarRechazo = async (email, motivo) => {
  await transporter.sendMail({
    from:    '"SubastUp" <noreply@subastup.com>',
    to:      email,
    subject: 'Tu solicitud de cuenta fue rechazada',
    html:    htmlRechazo(motivo),
  });
};

// @TASK: genérico requerido por productosController.js (notificación a revisores).
// No tenía export propio en el mailService original.
const enviarMail = async (to, subject, html) => {
  await transporter.sendMail({
    from: '"SubastUp" <noreply@subastup.com>',
    to,
    subject,
    html,
  });
};

module.exports = {
  enviarVerificacion,
  enviarResetPassword,
  enviarAprobacion,
  enviarRechazo,
  enviarMail,
};