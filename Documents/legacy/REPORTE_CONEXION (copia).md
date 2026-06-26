> Nota de normalizacion (2026-06-26): este documento es historico. Para endpoints vigentes usar `Documents/API_ENDPOINTS.md` y `SubastUp_API_Endpoints_v3_FINAL.xlsx`, que coinciden con `backend/server.js` y `backend/routes/*`.

# Reporte de Conexión Front ↔ Backend — SubastUP
## Fecha: 2026-06-04

---

## ✅ Cambios realizados

### `frontend/src/constants/api.js`
- **Qué se modificó:** Se añadió el prefijo `/api` a los 5 endpoints de auth existentes en el backend (`LOGIN`, `REGISTER`, `FORGOT_PASSWORD`, `VERIFY_CODE`, `RESET_PASSWORD`). Se agregó la constante `VALIDATE_USER`.
- **Por qué:** El backend monta las rutas con `app.use('/api/auth', ...)` en `server.js`. Los paths anteriores sin prefijo producirían error 404 en cualquier llamada.
- **Detalle:** Se documentaron ambas opciones de `BASE_URL` (emulador Android `10.0.2.2:3000` vs dispositivo físico) dejando la de dispositivo físico activa como placeholder.

---

### `frontend/src/store/authStore.js` — función `login`
- **Qué se modificó:** Se reemplazó el mapeo `data.userId` / `data.name` por `data.usuario.registroId` / `data.usuario.nombre`, que son los campos reales devueltos por el backend.
- **Por qué:** El backend devuelve `{ ok, token, usuario: { nombre, documento, email, registroId } }`. La versión anterior intentaba acceder a propiedades inexistentes, resultando en `undefined` en `AsyncStorage`.
- **Adicional:** El mensaje de error ahora lee `data.message` (campo real del backend) antes de `data.error`.

---

### `frontend/src/store/authStore.js` — función `register`
- **Qué se modificó:** Se eliminó la lógica que intentaba guardar un token e iniciar sesión tras el registro. Ahora la función solo ejecuta el POST y retorna el `data` del backend.
- **Por qué:** El backend devuelve `{ ok: true, message, registroId }` sin token porque la cuenta queda en estado `validado = 0` hasta que un administrador la aprueba. Intentar leer `data.token` producía `undefined` y rompía el flujo.

---

### `frontend/src/store/registerStore.js`
- **Qué se modificó:** Se agregó el campo `password: ''` al objeto `step1Data` (valor inicial) y al bloque `clearRegistration` (reset).
- **Por qué:** El formulario del paso 1 ahora captura la contraseña. Sin este campo en el store, `step1Data.password` devolvería `undefined` al construir el payload en el paso 2.

---

### `frontend/src/screens/auth/RegisterScreen.js`
- **Qué se modificó:**
  1. Se agregó `import { Ionicons } from '@expo/vector-icons'`.
  2. Se agregaron los estados `showPassword` y `showConfirm` para los campos de visibilidad.
  3. Se agregó `watch` al `useForm` para validar coincidencia de contraseñas.
  4. Se agregaron los campos `password` (minLength 6) y `confirmPassword` (validate = watch) con sus respectivos `TextInput` y botones de ojo.
  5. Se agregaron los estilos `passwordWrapper`, `passwordInput` y `eyeBtn`.
- **Por qué:** El backend declara `password` como campo requerido con validación de longitud >= 6 en `authController.js`. El formulario anterior no lo solicitaba, haciendo imposible el registro.

---

### `frontend/src/screens/auth/RegisterScreen2.js`
- **Qué se modificó:**
  1. Se agregaron `import api` e `import { ENDPOINTS }`.
  2. Se reemplazó el `onSubmit` completo: ahora convierte cada foto de URI a base64 usando `fetch` + `blob()` + `FileReader.readAsDataURL`, construye el payload con los nombres exactos del backend (`foto1Base64`, `foto2Base64`, y todos los campos de paso 1 y paso 2), y ejecuta `api.post(ENDPOINTS.REGISTER, payload)`.
  3. El modal de aviso se muestra en caso de éxito. No navega a `HomeAuth`.
  4. En caso de error, muestra `err.response?.data?.message` del backend.
- **Por qué:** El código anterior solo hacía `console.log` del objeto completo sin ninguna llamada HTTP. El backend requiere todos los campos en una sola petición con las fotos en base64.

---

### `frontend/src/screens/auth/LoginScreen.js`
- **Qué se modificó:**
  1. Se descomentaron los imports de `api` y `ENDPOINTS`.
  2. Se activó la llamada real `await api.post(ENDPOINTS.FORGOT_PASSWORD, { email: forgotEmail })`.
  3. El mensaje de error en el `catch` cambió a uno genérico de red (el backend no revela si el email existe por diseño de seguridad).
- **Por qué:** La función `handleForgotPassword` tenía la llamada comentada. La pantalla ya tenía toda la lógica de UI lista (modal, validación de email, estado de loading/error).

---

### `frontend/src/screens/auth/VerifyCodeScreen.js`
- **Qué se modificó:**
  1. Se agregaron los imports de `api` y `ENDPOINTS`.
  2. Se reemplazó el placeholder comentado por la llamada real `await api.post(ENDPOINTS.VERIFY_CODE, { email, code: codigo })`.
  3. La navegación a `ResetPassword` ahora pasa `{ resetToken: response.data.resetToken }` en lugar de `{ email, code }`.
  4. El error del `catch` ahora muestra `err.response?.data?.message` del backend.
- **Por qué:** El backend en `verifyCode` devuelve un JWT de un solo uso (`resetToken`) que es el único parámetro aceptado por el siguiente endpoint. Pasar `email + code` directamente a `reset-password` no funciona.

---

### `frontend/src/screens/auth/ResetPasswordScreen.js`
- **Qué se modificó:**
  1. Se descomentaron los imports de `api` y `ENDPOINTS`.
  2. Se reemplazaron las variables `email` y `code` de `route.params` por `resetToken`.
  3. Se activó la llamada real con el body exacto: `{ resetToken, newPassword: nuevaPassword, confirmPassword: confirmarPassword }`.
  4. El error del `catch` ahora muestra `err.response?.data?.message` del backend.
- **Por qué:** El backend en `resetPassword` valida un JWT firmado (`resetToken`) y rechaza cualquier otro esquema de body. El código comentado anterior era incompatible (enviaba `email`, `code`).

---

## ⚠️ Cambios parciales

### Conversión de fotos a Base64 en `RegisterScreen2.js`
- **Estado:** Implementado, pero con riesgo de compatibilidad.
- **Detalle:** La API de `FileReader` existe en el entorno Hermes/React Native a través del polyfill de `whatwg-fetch`, pero su comportamiento puede variar según la versión de Expo y el dispositivo. Si `FileReader` no está disponible en runtime, el bloque lanzará un error que será capturado por el `catch` y mostrado al usuario.
- **Alternativa documentada:** Si falla en producción, reemplazar el bloque de `FileReader` con `expo-file-system`:
  ```javascript
  import * as FileSystem from 'expo-file-system';
  const foto1Base64 = fotos.foto1
    ? 'data:image/jpeg;base64,' + await FileSystem.readAsStringAsync(fotos.foto1, { encoding: FileSystem.EncodingType.Base64 })
    : null;
  ```

---

## ❌ Bloqueantes encontrados

### `BASE_URL` sin IP de red real
- **Archivo:** `frontend/src/constants/api.js`, línea 3.
- **Descripción:** La IP `192.168.1.100` es un placeholder. El usuario debe reemplazarla por la IP real de su PC en la red WiFi local antes de probar en dispositivo físico. Para emulador Android, debe cambiar a `http://10.0.2.2:3000`.

### Backend sin archivo `.env`
- **Archivo:** No existe `backend/.env`.
- **Descripción:** El backend requiere variables de entorno `JWT_SECRET`, `DB_SERVER`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`, `VERIFY_CODE_EXPIRY_MINUTES`. Sin este archivo el servidor no arranca.

### Backend sin rutas para el resto de la app
- **Descripción:** Las siguientes constantes de `constants/api.js` no tienen ruta correspondiente en el backend: `LOGOUT`, `ME`, `MY_BIDS`, `MY_AUCTIONS`, `AUCTIONS`, `AUCTION_BY_ID`, `UPLOAD_IMAGES`, `SUGGESTIONS`, `CALENDAR`, `AUCTION_STATUS`, `SHARE_LINK`, `BIDS`, `CHATS`, `MESSAGES`, `NOTIFICATIONS`, `MARK_READ`, `SETTINGS`, `PAYMENT_METHODS`, `PAYMENT_BY_ID`, `FAQ`. Solo existen las rutas de auth.

### `foto2Base64` sin columna de destino en la BD
- **Descripción:** El backend en `authController.js` acepta `foto2Base64` en el body pero no la guarda en ninguna tabla. La tabla `personas` solo tiene la columna `foto` (para `foto1Base64`). La segunda foto se descarta silenciosamente.

---

## 🧪 Cómo probar cada módulo

### Módulo 1 — Prefijos
1. Abrir `frontend/src/constants/api.js`.
2. Verificar que `LOGIN` vale `'/api/auth/login'` (no `/auth/login`).
3. Cambiar `BASE_URL` a `http://10.0.2.2:3000` si se usa emulador Android.
4. Arrancar el backend: `cd backend && node server.js`. Debe imprimir `Servidor corriendo en http://localhost:3000`.
5. Desde la app, intentar login. La request debe llegar al backend (verificar en logs del servidor).

### Módulo 2 — Login
1. Crear un usuario en la BD con `validado = 1` usando SSMS / `migracion_auth.sql`.
2. Abrir la app en `LoginScreen`, ingresar email y contraseña correctos.
3. Verificar que la app navega a `HomeAuthenticated`.
4. Verificar que `AsyncStorage.getItem('user')` devuelve `{ "id": <registroId>, "name": "<nombre>" }`.
5. Con contraseña incorrecta, verificar que el banner de error muestra el mensaje del backend.
6. Con cuenta `validado = 0`, verificar que el error muestra "Tu cuenta aún no fue aprobada...".

### Módulo 3 — Registro
1. Abrir la app en `RegisterScreen` (Paso 1).
2. Completar nombre, apellido, DNI, teléfono, email, contraseña (≥6 chars) y confirmación.
3. Verificar que el botón "Siguiente" no avanza si las contraseñas no coinciden o son < 6 chars.
4. Avanzar al Paso 2, completar domicilio, opcionalmente cargar fotos.
5. Presionar "Finalizar". Verificar en los logs del backend que llegó un POST a `/api/auth/register` con todos los campos.
6. Verificar que el modal de aviso aparece y al cerrarlo navega a `HomeUnauth`.
7. Intentar hacer login con las credenciales registradas → debe fallar con "cuenta pendiente de aprobación" hasta que un admin la valide.

### Módulo 4 — Recuperar contraseña
**4A — ForgotPassword:**
1. En `LoginScreen`, presionar "Olvidé mi contraseña".
2. Ingresar un email válido y presionar "Enviar".
3. Verificar en los logs del backend que llegó un POST a `/api/auth/forgot-password`.
4. El backend imprimirá el código en consola (`console.log('🔑  Código de reset (dev):', codigo)`).
5. Verificar que la app navega a `VerifyCodeScreen` pasando el email.

**4B — VerifyCode:**
1. En `VerifyCodeScreen`, ingresar el código de 6 dígitos impreso en los logs del backend.
2. Presionar "Validar".
3. Verificar en los logs del backend que llegó un POST a `/api/auth/verify-code` y que devolvió `resetToken`.
4. Verificar que la app navega a `ResetPasswordScreen`.
5. Con un código incorrecto, verificar que el error aparece debajo del input.

**4C — ResetPassword:**
1. En `ResetPasswordScreen`, ingresar nueva contraseña (≥6 chars) y confirmarla.
2. Presionar "Guardar".
3. Verificar en los logs del backend que llegó un POST a `/api/auth/reset-password` con `resetToken`, `newPassword` y `confirmPassword`.
4. Verificar que aparece el `Alert` de éxito y que navega a `Login`.
5. Hacer login con la nueva contraseña para confirmar que el cambio fue persistido.
