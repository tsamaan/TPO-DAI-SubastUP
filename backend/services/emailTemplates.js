// services/emailTemplates.js
// Plantillas HTML para correos transaccionales de SubastUp

const BASE = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #F5F5F5;
  margin: 0; padding: 0;
`;

const wrap = (body) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SubastUp</title>
</head>
<body style="${BASE}">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#8b0000; padding:28px 40px; text-align:center;">
              <span style="color:#FFFFFF; font-size:26px; font-weight:800; letter-spacing:1px;">SubastUp</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9F9F9; padding:20px 40px; text-align:center; border-top:1px solid #EEEEEE;">
              <p style="margin:0; font-size:12px; color:#AAAAAA; line-height:1.6;">
                Este correo fue enviado automáticamente por SubastUp.<br/>
                Si no solicitaste esta acción, podés ignorar este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─────────────────────────────────────────────────────────────
// 1. Verificación de cuenta
// ─────────────────────────────────────────────────────────────
const htmlVerificacion = (token) => wrap(`
  <h2 style="margin:0 0 16px; font-size:22px; color:#1A1A1A; font-weight:700;">
    Verificá tu cuenta
  </h2>
  <p style="margin:0 0 24px; font-size:15px; color:#555555; line-height:1.7;">
    Gracias por registrarte en <strong>SubastUp</strong>. Usá el código de verificación
    a continuación para confirmar tu dirección de correo electrónico.
  </p>

  <div style="background:#FFF5EC; border-left:4px solid #8b0000; border-radius:8px; padding:20px 28px; margin-bottom:28px; text-align:center;">
    <span style="font-size:36px; font-weight:800; color:#8b0000; letter-spacing:12px;">${token}</span>
  </div>

  <p style="margin:0; font-size:13px; color:#AAAAAA; line-height:1.6;">
    Este código expira en <strong>15 minutos</strong>. Si no solicitaste esta verificación,
    ignorá este mensaje.
  </p>
`);

// ─────────────────────────────────────────────────────────────
// 2. Recuperación de contraseña
// ─────────────────────────────────────────────────────────────
const htmlResetPassword = (codigo) => wrap(`
  <h2 style="margin:0 0 16px; font-size:22px; color:#1A1A1A; font-weight:700;">
    Recuperación de contraseña
  </h2>
  <p style="margin:0 0 24px; font-size:15px; color:#555555; line-height:1.7;">
    Recibimos una solicitud para restablecer la contraseña de tu cuenta en
    <strong>SubastUp</strong>. Ingresá el siguiente código en la aplicación:
  </p>

  <div style="background:#FFF5EC; border-left:4px solid #8b0000; border-radius:8px; padding:20px 28px; margin-bottom:28px; text-align:center;">
    <span style="font-size:36px; font-weight:800; color:#8b0000; letter-spacing:12px;">${codigo}</span>
  </div>

  <p style="margin:0 0 12px; font-size:13px; color:#AAAAAA; line-height:1.6;">
    Este código es válido por <strong>15 minutos</strong>.
  </p>
  <p style="margin:0; font-size:13px; color:#AAAAAA; line-height:1.6;">
    Si no solicitaste restablecer tu contraseña, ignorá este correo.
    Tu contraseña actual permanece sin cambios.
  </p>
`);

// ─────────────────────────────────────────────────────────────
// 3. Aprobación de cuenta (puede incluir contraseña temporal)
// ─────────────────────────────────────────────────────────────
const htmlAprobacion = (passwordTemporal = null) => wrap(`
  <div style="text-align:center; margin-bottom:24px;">
    <div style="display:inline-block; background:#F0FFF4; border-radius:50%; width:64px; height:64px; line-height:64px; text-align:center;">
      <span style="font-size:32px;">✅</span>
    </div>
  </div>

  <h2 style="margin:0 0 16px; font-size:22px; color:#1A1A1A; font-weight:700; text-align:center;">
    ¡Tu cuenta fue aprobada!
  </h2>
  <p style="margin:0 0 24px; font-size:15px; color:#555555; line-height:1.7; text-align:center;">
    Un administrador de <strong>SubastUp</strong> revisó tu documentación
    y aprobó tu cuenta. Ya podés iniciar sesión y empezar a participar en subastas.
  </p>

  ${passwordTemporal ? `
  <div style="background:#FFF5EC; border-left:4px solid #8b0000; border-radius:8px; padding:20px 28px; margin-bottom:28px;">
    <p style="margin:0 0 8px; font-size:13px; color:#888888; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">
      Contraseña temporal
    </p>
    <p style="margin:0; font-size:20px; font-weight:800; color:#8b0000; letter-spacing:4px;">${passwordTemporal}</p>
    <p style="margin:8px 0 0; font-size:12px; color:#AAAAAA;">
      Recordá cambiarla desde Configuración una vez que ingreses.
    </p>
  </div>
  ` : ''}

  <p style="margin:0; font-size:13px; color:#AAAAAA; line-height:1.6; text-align:center;">
    Bienvenido/a a la comunidad SubastUp.
  </p>
`);

// ─────────────────────────────────────────────────────────────
// 4. Rechazo de cuenta
// ─────────────────────────────────────────────────────────────
const htmlRechazo = (motivo = 'Sin motivo especificado') => wrap(`
  <div style="text-align:center; margin-bottom:24px;">
    <div style="display:inline-block; background:#FFF0F0; border-radius:50%; width:64px; height:64px; line-height:64px; text-align:center;">
      <span style="font-size:32px;">❌</span>
    </div>
  </div>

  <h2 style="margin:0 0 16px; font-size:22px; color:#1A1A1A; font-weight:700; text-align:center;">
    Tu solicitud fue rechazada
  </h2>
  <p style="margin:0 0 24px; font-size:15px; color:#555555; line-height:1.7; text-align:center;">
    Luego de revisar la documentación enviada, el equipo de <strong>SubastUp</strong>
    no pudo aprobar tu cuenta en este momento.
  </p>

  <div style="background:#FFF5F5; border-left:4px solid #C62828; border-radius:8px; padding:20px 28px; margin-bottom:28px;">
    <p style="margin:0 0 6px; font-size:12px; color:#888888; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">
      Motivo
    </p>
    <p style="margin:0; font-size:14px; color:#1A1A1A; line-height:1.6;">${motivo}</p>
  </div>

  <p style="margin:0; font-size:13px; color:#AAAAAA; line-height:1.6; text-align:center;">
    Si creés que hubo un error o querés proporcionar documentación adicional,
    contactate con nuestro equipo de soporte.
  </p>
`);

module.exports = { htmlVerificacion, htmlResetPassword, htmlAprobacion, htmlRechazo };
