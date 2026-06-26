# Auditoría de Integración Front ↔ Backend — SubastUP

## 1. BACKEND — Rutas reales implementadas

Las rutas reales se encuentran en `backend/routes/auth.js` y se registran en `backend/server.js` bajo el prefijo `/api/auth`. El proyecto está escrito en JavaScript (Node/Express) con acceso directo a SQL Server (no usa Prisma).

| Método | Path completo | Requiere JWT | Campos del body | Controlador |
|---|---|---|---|---|
| POST | `/api/auth/login` | No | `email`, `password` | `login` (en `backend/controllers/authController.js`) |
| POST | `/api/auth/register` | No | `nombre`, `apellido`, `dni`, `telefono`, `email`, `password`, `direccion`, `numero`, `ciudad`, `codigoPostal`, `pais`, `foto1Base64` (opcional), `foto2Base64` (opcional) | `register` (en `backend/controllers/authController.js`) |
| POST | `/api/auth/forgot-password` | No | `email` | `forgotPassword` (en `backend/controllers/authController.js`) |
| POST | `/api/auth/verify-code` | No | `email`, `code` | `verifyCode` (en `backend/controllers/authController.js`) |
| POST | `/api/auth/reset-password` | No | `resetToken`, `newPassword`, `confirmPassword` | `resetPassword` (en `backend/controllers/authController.js`) |
| POST | `/api/auth/validate-user` | Sí | `registroId`, `aprobar`, `motivoRechazo` (opcional) | `validateUser` (en `backend/controllers/authController.js`) |

> **Nota:** Los siguientes archivos del backend de la lista de lectura no existen (no encontrados):
> - `backend/.env.example`
> - `backend/prisma/schema.prisma`
> - `backend/src/index.ts`
> - `backend/src/routes/auth.ts`
> - `backend/src/routes/auctions.ts`
> - `backend/src/routes/products.ts`
> - `backend/src/routes/bids.ts`
> - `backend/src/routes/payments.ts`
> - `backend/src/routes/settings.ts`
> - `backend/src/routes/help.ts`
> - `backend/src/middlewares/authMiddleware.ts`
> - `backend/src/controllers/authController.ts`
> - `backend/src/controllers/auctionController.ts`
> - `backend/src/controllers/bidController.ts`

---

## 2. FRONTEND — Endpoints definidos en constants/api.js

Endpoints definidos en `frontend/src/constants/api.js`:

| Constante | Método asumido | Path definido |
|---|---|---|
| `LOGIN` | POST | `/auth/login` |
| `REGISTER` | POST | `/auth/register` |
| `LOGOUT` | POST | `/auth/logout` |
| `FORGOT_PASSWORD` | POST | `/auth/forgot-password` |
| `VERIFY_CODE` | POST | `/auth/verify-code` |
| `RESET_PASSWORD` | POST | `/auth/reset-password` |
| `ME` | GET | `/users/me` |
| `MY_BIDS` | GET | `/users/me/bids` |
| `MY_AUCTIONS` | GET | `/users/me/auctions` |
| `AUCTIONS` | GET/POST | `/auctions` |
| `AUCTION_BY_ID` | GET | `/auctions/${id}` |
| `UPLOAD_IMAGES` | POST | `/auctions/upload-images` |
| `SUGGESTIONS` | GET | `/auctions/search/suggestions` |
| `CALENDAR` | GET | `/auctions/calendar` |
| `AUCTION_STATUS` | GET | `/auctions/${id}/status` |
| `SHARE_LINK` | GET | `/auctions/${id}/share-link` |
| `BIDS` | POST | `/bids` |
| `CHATS` | GET/POST | `/chats` |
| `MESSAGES` | GET/POST | `/chats/${id}/messages` |
| `NOTIFICATIONS` | GET | `/notifications` |
| `MARK_READ` | PATCH | `/notifications/${id}/read` |
| `SETTINGS` | GET/POST | `/settings` |
| `PAYMENT_METHODS` | GET/POST | `/settings/payment-methods` |
| `PAYMENT_BY_ID` | GET/DELETE | `/settings/payment-methods/${id}` |
| `FAQ` | GET | `/help/faq` |

---

## 3. MATCH COMPLETO — Qué está conectado correctamente

Esta tabla contrasta los endpoints declarados en el backend real vs lo definido en `frontend/src/constants/api.js`:

| Endpoint backend | Constante frontend | Estado |
|---|---|---|
| `POST /api/auth/login` | `LOGIN` | ⚠️ path difiere (falta prefijo `/api`) |
| `POST /api/auth/register` | `REGISTER` | ⚠️ path difiere (falta prefijo `/api`) |
| `POST /api/auth/forgot-password` | `FORGOT_PASSWORD` | ⚠️ path difiere (falta prefijo `/api`) |
| `POST /api/auth/verify-code` | `VERIFY_CODE` | ⚠️ path difiere (falta prefijo `/api`) |
| `POST /api/auth/reset-password` | `RESET_PASSWORD` | ⚠️ path difiere (falta prefijo `/api`) |
| `POST /api/auth/validate-user` | *No definido* | ❌ no existe |
| *No implementado* | `LOGOUT` | ❌ no existe en backend |
| *No implementado* | `ME` | ❌ no existe en backend |
| *No implementado* | `MY_BIDS` | ❌ no existe en backend |
| *No implementado* | `MY_AUCTIONS` | ❌ no existe en backend |
| *No implementado* | `AUCTIONS` | ❌ no existe en backend |
| *No implementado* | `AUCTION_BY_ID` | ❌ no existe en backend |
| *No implementado* | `UPLOAD_IMAGES` | ❌ no existe en backend |
| *No implementado* | `SUGGESTIONS` | ❌ no existe en backend |
| *No implementado* | `CALENDAR` | ❌ no existe en backend |
| *No implementado* | `AUCTION_STATUS` | ❌ no existe en backend |
| *No implementado* | `SHARE_LINK` | ❌ no existe en backend |
| *No implementado* | `BIDS` | ❌ no existe en backend |
| *No implementado* | `CHATS` | ❌ no existe en backend |
| *No implementado* | `MESSAGES` | ❌ no existe en backend |
| *No implementado* | `NOTIFICATIONS` | ❌ no existe en backend |
| *No implementado* | `MARK_READ` | ❌ no existe en backend |
| *No implementado* | `SETTINGS` | ❌ no existe en backend |
| *No implementado* | `PAYMENT_METHODS` | ❌ no existe en backend |
| *No implementado* | `PAYMENT_BY_ID` | ❌ no existe en backend |
| *No implementado* | `FAQ` | ❌ no existe en backend |

---

## 4. CAMPOS — Discrepancias de body/response

### Endpoint: `POST /api/auth/login`
* **Frontend envía**:
  ```json
  { "email": "...", "password": "..." }
  ```
* **Backend espera**:
  ```json
  { "email": "...", "password": "..." }
  ```
* **Discrepancia en la respuesta**:
  * El frontend en `authStore.js` (línea 26-27) espera un objeto plano con las claves `data.token`, `data.userId` y `data.name`.
  * El backend devuelve un objeto anidado: `{ ok: true, message: "...", token: "...", usuario: { nombre, documento, email, registroId } }`.
  * **Consecuencia**: `data.userId` y `data.name` quedan como `undefined` en el cliente.

### Endpoint: `POST /api/auth/register`
* **Frontend envía (en authStore.js)**:
  Envía el objeto `userData` sin procesar. Si viniera de las pantallas de registro, carecería de la propiedad `password`. Las fotos además se enviarían en la estructura `{ fotos: { foto1: "file://...", foto2: "file://..." } }`.
* **Backend espera**:
  ```json
  {
    "nombre": "...", "apellido": "...", "dni": "...", "telefono": "...", "email": "...",
    "password": "...", "direccion": "...", "numero": "...", "ciudad": "...",
    "codigoPostal": "...", "pais": "...", "foto1Base64": "...", "foto2Base64": "..."
  }
  ```
* **Discrepancias**:
  * **Contraseña**: El frontend no solicita ni recopila el campo `password` en el formulario de registro (`RegisterScreen.js` ni `RegisterScreen2.js`). El backend lo tiene como campo requerido y valida que su longitud sea `>= 6`.
  * **Imágenes**: El frontend maneja rutas locales de archivo (`uri`), mientras que el backend requiere los strings codificados en base64 bajo los nombres `foto1Base64` y `foto2Base64`.
  * **Respuesta**: El frontend en `authStore.js` (línea 39) intenta guardar el token e iniciar sesión tras el registro. Sin embargo, el backend no devuelve un token en el registro, sino `{ ok: true, message: "...", registroId }` porque la cuenta queda creada en estado pendiente de aprobación por administración (`validado = 0`).

### Endpoint: `POST /api/auth/reset-password`
* **Frontend envía (comentado en ResetPasswordScreen.js)**:
  ```json
  { "email": "...", "code": "...", "newPassword": "...", "confirmPassword": "..." }
  ```
* **Backend espera**:
  ```json
  { "resetToken": "...", "newPassword": "...", "confirmPassword": "..." }
  ```
* **Discrepancia**:
  * El backend requiere `resetToken` (un JWT de un solo uso generado y devuelto por la ruta `/api/auth/verify-code`). El frontend intenta enviar el `email` y el `code` directamente en lugar del token, y no captura el `resetToken` devuelto en el flujo de verificación (`VerifyCodeScreen.js`).

---

## 5. AUTH — Análisis del interceptor

* **¿El interceptor agrega el header correcto que espera authMiddleware.ts / auth.js?**
  Sí. El interceptor en `frontend/src/services/api.js` (línea 14) agrega el token como `Bearer ${token}` al header `Authorization`:
  ```javascript
  if (token) config.headers.Authorization = `Bearer ${token}`;
  ```
* **¿Cómo extrae el token el middleware? ¿Coincide con cómo lo guarda el frontend?**
  Sí, coincide. El middleware `backend/middleware/auth.js` extrae el header y realiza el split para recuperar el token:
  ```javascript
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) { ... }
  const token = authHeader.split(' ')[1];
  ```
  El frontend almacena el token en `AsyncStorage` bajo la clave `'token'` (línea 25 de `authStore.js`), la cual es consultada en el interceptor (línea 13 de `services/api.js`).

---

## 6. REGISTER — Análisis del flujo 2 pasos

A continuación se detalla la correspondencia de campos del formulario del frontend vs los campos que espera el controlador de registro del backend (`register` en `authController.js`):

| Campo Frontend | Archivo origen | Campo Backend | Coincidencia |
|---|---|---|---|
| `nombre` | `RegisterScreen.js` | `nombre` | Sí (pero el backend concatena nombre y apellido en la BD) |
| `apellido` | `RegisterScreen.js` | `apellido` | Sí |
| `dni` | `RegisterScreen.js` | `dni` | Sí |
| `telefono` | `RegisterScreen.js` | `telefono` | Sí |
| `email` | `RegisterScreen.js` | `email` | Sí |
| *No existe* | *No solicitado* | `password` | ❌ **Mismatch absoluto** (obligatorio en backend) |
| `direccion` | `RegisterScreen2.js` | `direccion` | Sí |
| `numero` | `RegisterScreen2.js` | `numero` | Sí |
| `pais` | `RegisterScreen2.js` | `pais` | Sí |
| `ciudad` | `RegisterScreen2.js` | `ciudad` | Sí |
| `codigoPostal` | `RegisterScreen2.js` | `codigoPostal` | Sí |
| `fotos.foto1` | `RegisterScreen2.js` | `foto1Base64` | ⚠️ **Mismatch de formato y nombre** (URI vs Base64) |
| `fotos.foto2` | `RegisterScreen2.js` | `foto2Base64` | ⚠️ **Mismatch de formato y nombre** (URI vs Base64) |

---

## 7. BASE DE DATOS vs FRONTEND

### Respuestas de Autenticación
* **Login**: El backend devuelve en `usuario` los campos `nombre`, `documento`, `email` y `registroId`. El frontend almacena en `AsyncStorage` con la clave `'user'` el objeto `{ id: data.userId, name: data.name }`, lo cual fallará debido a que estas propiedades no se encuentran en la raíz del response ni poseen la misma denominación idiomática.
* **Registro**: El backend devuelve `{ ok: true, message: "...", registroId }`. El frontend intenta leer `data.token`, `data.userId` y `data.name` tras la petición para establecer sesión automáticamente, provocando un fallo.

### Estructura de la Base de Datos (`migracion_auth.sql`) vs Frontend
* El modelo de base de datos SQL Server no almacena por separado los datos de domicilio. La tabla `personas` contiene una sola columna `direccion` donde el backend concatena `direccion`, `numero`, `ciudad`, `codigoPostal` y `pais` con el formato `[direccion], [numero], [ciudad], [codigoPostal], [pais]`.
* La tabla `personas` contiene una sola columna `nombre` donde el backend concatena el nombre y el apellido del formulario (`nombre` + `apellido`).
* La tabla `personas` guarda la primera foto del usuario como buffer binario (`VARBINARY`) en la columna `foto`. La segunda foto no posee columna de almacenamiento permanente en la tabla `personas`.

---

## 8. ACCIONES PARA CONECTAR

Lista ordenada de modificaciones por prioridad:

### Prioridad 1: Corregir prefijo de endpoints y URL base
* **Archivo:** `frontend/src/constants/api.js`
  * **Línea 2:** Cambiar la IP por la configurada en el backend o en su defecto una válida para el entorno de emulación (e.g. `'http://10.0.2.2:3000'`).
  * **Líneas 5 a 10:** Añadir el prefijo `/api` a las siguientes constantes:
    * `LOGIN: '/api/auth/login'`
    * `REGISTER: '/api/auth/register'`
    * `FORGOT_PASSWORD: '/api/auth/forgot-password'`
    * `VERIFY_CODE: '/api/auth/verify-code'`
    * `RESET_PASSWORD: '/api/auth/reset-password'`

### Prioridad 2: Añadir campos de contraseña al registro del Frontend
* **Archivo:** `frontend/src/store/registerStore.js`
  * **Líneas 5 a 11 (step1Data):** Añadir la propiedad `password: ''`.
  * **Líneas 59 a 65 (clearRegistration):** Añadir la propiedad `password: ''`.
* **Archivo:** `frontend/src/screens/auth/RegisterScreen.js`
  * Añadir un campo de entrada de texto `TextInput` en el formulario para capturar la contraseña (`password`), aplicando las reglas de validación necesarias (como longitud mínima de 6 caracteres requerida por el backend).

### Prioridad 3: Implementar la petición HTTP real al finalizar el Registro
* **Archivo:** `frontend/src/screens/auth/RegisterScreen2.js`
  * **Función `onSubmit` (líneas 64 a 80):** Reemplazar la lógica de guardado local por la invocación al store de autenticación:
    ```javascript
    const onSubmit = async (data) => {
      try {
        setStep2Data(data);
        
        // Conversión de fotos a Base64 antes del envío (si existen)
        let foto1Base64 = null;
        let foto2Base64 = null;
        if (fotos.foto1) {
          const manipResult = await fetch(fotos.foto1);
          const blob = await manipResult.blob();
          foto1Base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        }
        if (fotos.foto2) {
          const manipResult = await fetch(fotos.foto2);
          const blob = await manipResult.blob();
          foto2Base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        }

        const registroPayload = {
          ...step1Data,
          ...data,
          foto1Base64,
          foto2Base64,
        };

        // Invocar el registro y manejar la respuesta
        const res = await useAuthStore.getState().register(registroPayload);
        
        reset();
        clearRegistration();
        setFotos({ foto1: null, foto2: null });
        setModalVisible(true);
      } catch (err) {
        Alert.alert('Error', err.message || 'Hubo un problema al enviar el registro.');
      }
    };
    ```

### Prioridad 4: Adaptar el procesamiento de respuestas de Auth en el Store
* **Archivo:** `frontend/src/store/authStore.js`
  * **Función `login` (línea 25 a 27):** Modificar la asignación de propiedades de respuesta:
    ```javascript
    const { data } = await api.post(ENDPOINTS.LOGIN, { email, password });
    await AsyncStorage.setItem('token', data.token);
    const userData = { id: data.usuario.registroId, name: data.usuario.nombre };
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    set({ token: data.token, user: userData, isLoggedIn: true, isLoading: false });
    ```
  * **Función `register` (líneas 35 a 47):** Dado que el registro del backend no retorna un inicio de sesión inmediato (requiere aprobación), modificar para no setear sesión activa:
    ```javascript
    register: async (userData) => {
      set({ isLoading: true, error: null });
      try {
        const { data } = await api.post(ENDPOINTS.REGISTER, userData);
        set({ isLoading: false });
        return data;
      } catch (err) {
        const msg = err.response?.data?.message || 'Error al registrarse';
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
    }
    ```

### Prioridad 5: Corregir flujo de recuperación de contraseña (Reset)
* **Archivo:** `frontend/src/screens/auth/VerifyCodeScreen.js`
  * **Función `handleValidar` (líneas 25 a 46):** Descomentar la petición HTTP y pasar el `resetToken` devuelto a la siguiente pantalla:
    ```javascript
    try {
      const response = await api.post(ENDPOINTS.VERIFY_CODE, { email, code: codigo });
      setLoading(false);
      navigation.navigate('ResetPassword', { resetToken: response.data.resetToken });
    } catch (err) { ... }
    ```
* **Archivo:** `frontend/src/screens/auth/ResetPasswordScreen.js`
  * **Función `onSubmit` (líneas 44 a 71):** Modificar los datos del body de la petición HTTP para que envíe el token de recuperación y evitar parámetros descartados por el backend:
    ```javascript
    const resetToken = route?.params?.resetToken ?? '';
    // ...
    await api.post(ENDPOINTS.RESET_PASSWORD, {
      resetToken,
      newPassword:     nuevaPassword,
      confirmPassword: confirmarPassword,
    });
    ```
