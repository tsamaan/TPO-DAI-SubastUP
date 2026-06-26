# Reporte de Avance 03 — Proyecto SubastUP

Este documento resume la auditoría técnica, infraestructura y estado de integración de la plataforma de subastas **SubastUp** (frontend React Native / Expo y backend Node.js / Express con Prisma ORM y PostgreSQL).

---

## 1. Estado del Proyecto (Versiones)

A continuación se detallan las versiones exactas de las librerías y dependencias clave especificadas en los archivos `package.json` de ambos entornos:

### Frontend
- **Framework Base**: Expo `~54.0.35`
- **React Native**: `0.81.5`
- **React**: `19.1.0`
- **Gestor de Estado**: Zustand `^4.5.0`
- **Enrutamiento y Navegación**:
  - `@react-navigation/native`: `^7.2.4`
  - `@react-navigation/native-stack`: `^7.15.0`
  - `@react-navigation/bottom-tabs`: `^7.16.0`
- **Cliente HTTP**: Axios `^1.16.0`
- **Formularios**: React Hook Form `^7.75.0`
- **Carga de Archivos e Imágenes**:
  - `expo-image-picker`: `~17.0.11`
  - `expo-document-picker`: `~14.0.8`
- **Gráficos**: `react-native-svg`: `15.12.1`

### Backend
- **Framework Web**: Express `^4.18.2`
- **ORM**: Prisma `^5.10.0`
- **Cliente Prisma**: `@prisma/client` `^5.10.0`
- **Seguridad y Encriptación**: bcryptjs `^2.4.3`
- **Tokens de Sesión**: jsonwebtoken `^9.0.2`
- **Servicio de Emails**: nodemailer `^6.9.7`
- **Gestión de Entorno**: dotenv `^16.3.1`
- **Middleware Polivalente**: cors `^2.8.5`, multer `^1.4.5-lts.1`, express-validator `^7.0.1`

---

## 2. Infraestructura

El entorno del proyecto está configurado con servicios en la nube para asegurar su persistencia e interoperabilidad:
- **Servidor Backend (Producción)**: Desplegado en **Render** bajo la URL:  
  `https://tpo-dai-subastup.onrender.com`
- **Base de Datos Relacional**: PostgreSQL hosteado en **Supabase** (conectado a través de Prisma con soporte para pooling de conexiones).
- **Servidor de Correos (Desarrollo)**: Configurado con credenciales de **Mailtrap** para capturar e inspeccionar los correos de verificación y recuperación de contraseña enviados por la API.

---

## 3. Pantallas y Navegación

El frontend está estructurado mediante un sistema híbrido de navegación que cambia dinámicamente según el estado de autenticación (`isLoggedIn` en el store de Zustand):

| Pantalla | Ubicación del Archivo | Estado de Integración | Nivel de Navegación / Acceso |
| :--- | :--- | :--- | :--- |
| **SplashScreen** | `screens/SplashScreen.js` | Conectado (espera mínima de 3 segundos simulando la inicialización del store). | Inicial / Splash |
| **HomeUnauth** | `screens/tabs/HomeUnauthenticatedScreen.js` | Conectado a navegación. Datos de subastas mockeados. | Público / Raíz |
| **Login** | `screens/auth/LoginScreen.js` | Conectado a API. Funcional. | Público / Auth Stack |
| **Register** | `screens/auth/RegisterScreen.js` | Conectado (Paso 1). Guarda datos en Zustand store. | Público / Auth Stack |
| **RegisterStep2** | `screens/auth/RegisterScreen2.js` | Conectado a API (Paso 2). Conversión de DNI a Base64 e inserción. | Público / Auth Stack |
| **VerifyCode** | `screens/auth/VerifyCodeScreen.js` | Conectado a API. Verifica código OTP. | Público / Auth Stack |
| **ResetPassword** | `screens/auth/ResetPasswordScreen.js` | Conectado a API. Permite cambio final de contraseña. | Público / Auth Stack |
| **Calendar** | `screens/tabs/CalendarScreen.js` | Datos mock. Calendario interactivo de fechas de subastas. | Público y Autenticado / Stack General |
| **AuctionList** | `screens/auction/AuctionListScreen.js` | Datos mock. Lista de bienes comunes/especiales para no logueados. | Público / Stack General |
| **AuctionDetail** | `screens/auction/AuctionDetailScreen.js` | Datos mock. Ficha de bien. Redirige a Login al intentar pujar. | Público / Stack General |
| **Main** | `navigation/TabNavigator.js` | Inicializa el flujo autenticado con la barra inferior. | Autenticado / Tab Navigator |
| **Home** | `screens/tabs/HomeAuthenticatedScreen.js` | Conectado a navegación. Contiene Hamburger Menu y Notificaciones. | Autenticado / Tab Navigator |
| **Mensajes** (Chats) | `screens/chat/ChatsScreen.js` | Mock inicial. Contenedor de bandeja de chats. | Autenticado / Tab Navigator |
| **Publicar** | `screens/auction/CargarProductoScreen.js` | Conectado a navegación. Formulario interactivo. Envío mockeado. | Autenticado / Tab Navigator (Oculta TabBar) |
| **Pujar** (Listado Auth) | `screens/auction/AuctionListAuthScreen.js` | Datos mock. Listado de subastas con permisos para interactuar. | Autenticado / Tab Navigator |
| **AuctionDetailAuth**| `screens/auction/AuctionDetailAuthScreen.js` | Datos mock. Detalle de lote interactivo con puja simulada. | Autenticado / Stack General |
| **MiCuenta** | `screens/profile/MiCuentaScreen.js` | Estructura visual lista (campos editables y protegidos). | Autenticado / Stack General |
| **Configuracion** | `screens/tabs/ConfiguracionScreen.js` | Estructura visual. Enlaces a MiCuenta. | Autenticado / Stack General |
| **Informacion** | `screens/tabs/InformacionScreen.js` | Conectado a gráficos SVG dinámicos (simulación de tiempo real). | Autenticado / Stack General |
| **Ayuda** | `screens/tabs/AyudaScreen.js` | Preguntas frecuentes y formulario de soporte mock. | Autenticado / Stack General |

---

## 4. Flujos Implementados

### A. Inicio de Sesión (Login)
Formulario gestionado mediante `react-hook-form`. Valida las credenciales a través del endpoint `POST /api/auth/login`.  
Si las credenciales son válidas y el estado de la cuenta en el backend es `'aprobado'`, se genera un JWT que se guarda en `AsyncStorage` junto a los datos del perfil, actualizando el estado global (`isLoggedIn = true`).  
*Control de Estado*: Si el usuario tiene estado `'pendiente'`, la API responde con código `403` y el mensaje correspondiente, impidiendo el acceso hasta su validación administrativa.

### B. Registro Transaccional en 2 Pasos
1. **Paso 1**: Almacena de forma reactiva en Zustand los datos iniciales de identidad (Nombre, Apellido, DNI, Teléfono, Email, Contraseña).
2. **Paso 2**: Recoge datos de dirección física y maneja la carga de imágenes del DNI (frente/dorso). Utiliza `expo-image-picker` para capturar fotos directamente en Base64, evitando errores de lectura local de URI en iOS. Al pulsar "Finalizar", envía el payload unificado a `POST /api/auth/register`. El backend ejecuta una **transacción Prisma** que inserta:
   - Registro en la tabla `personas` (con DNI, nombre y dirección).
   - Fichas binarias decodificadas a Buffer en la tabla `fotosdni` (tipo `Bytes` en BD).
   - Credenciales de acceso hasheadas con `bcryptjs` en la tabla `logins`.
   - Registro con estado predeterminado `'pendiente'` en la tabla `registros`.

### C. Recuperación de Contraseña (Password Recovery)
1. **Solicitud**: Desde `LoginScreen` se abre un modal donde el usuario introduce su mail. Se realiza POST a `/api/auth/forgot-password`. El backend genera un código OTP de 6 dígitos con expiración (15 minutos por defecto) y lo persiste como `tokenVerif` en el registro. Se envía el correo usando el transporter de Nodemailer.
2. **Verificación**: La app redirige a `VerifyCodeScreen` para validar el OTP introducido vía `POST /api/auth/verify-code`. Si es exitoso, el backend responde con un token de corta duración (`resetToken` JWT, 10 min) de tipo `reset` para certificar la autorización.
3. **Restablecimiento**: Se redirige a `ResetPasswordScreen` donde el usuario introduce su nueva contraseña. Se envía junto al token temporal a `POST /api/auth/reset-password`. El backend valida el JWT, hashea la nueva clave en `logins` y limpia el contador de intentos fallidos de acceso.

---

## 5. Backend (Controladores y Rutas)

Toda la lógica de autenticación está implementada bajo la ruta base `/api/auth` en `backend/routes/auth.js` y procesada por `backend/controllers/authController.js`:

1. **`POST /login`**:
   - Valida presencia de campos.
   - Verifica existencia del mail en la tabla `registros`.
   - Comprueba el estado de la cuenta (debe ser `'aprobado'`).
   - Verifica si la cuenta está bloqueada temporalmente (límite de 5 intentos fallidos consecutivos).
   - Compara las contraseñas con `bcrypt.compare`. En caso de fallo, incrementa el contador de intentos. Si acierta, resetea el contador, actualiza `ultimoAcceso` y genera el JWT de sesión.
2. **`POST /register`**:
   - Valida campos obligatorios y duplicados de correo electrónico.
   - Crea en una transacción atómica el objeto persona, cuenta, credenciales hasheadas y convierte a Buffer binario las imágenes en Base64 de la documentación para guardarlas en base de datos.
3. **`POST /forgot-password`**:
   - Genera un token temporal compuesto por el prefijo `RESET`, el código aleatorio y el timestamp actual (`RESET:XXXXXX:TIMESTAMP`).
   - Envía el email con el código OTP.
4. **`POST /verify-code`**:
   - Valida que el código no haya expirado y coincida con el almacenado.
   - Retorna un JWT de corta duración firmado con el payload del usuario.
5. **`POST /reset-password`**:
   - Valida que las contraseñas coincidan y posean longitud segura.
   - Decodifica el token de restablecimiento.
   - Actualiza el hash de la clave y desbloquea la cuenta.
6. **`POST /validate-user` (Protegida)**:
   - Requiere autenticación con token.
   - Permite a un administrador cambiar el estado de un registro de usuario a `'aprobado'` o `'rechazado'` (pudiendo especificar un motivo).

---

## 6. Conexión Front ↔ Backend

La comunicación de red se realiza mediante una instancia centralizada de Axios en `frontend/src/services/api.js`:
- Posee configurada la URL base de Render en producción.
- Incorpora un **interceptor de peticiones** (`api.interceptors.request.use`) que obtiene de forma asíncrona el token guardado en `AsyncStorage` y lo adjunta en los headers como `Authorization: Bearer <token>` de manera automática en cada llamada.
- Incorpora un **interceptor de respuestas** que desempaqueta el payload (`response.data`) y, en caso de detectar un error de credenciales expiradas (`401`), limpia de forma automatizada el almacenamiento local para redirigir al login.

Las constantes de las rutas están modularizadas en `frontend/src/constants/api.js`:
```javascript
export const ENDPOINTS = {
  LOGIN:           '/api/auth/login',
  REGISTER:        '/api/auth/register',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  VERIFY_CODE:     '/api/auth/verify-code',
  RESET_PASSWORD:  '/api/auth/reset-password',
  VALIDATE_USER:   '/api/auth/validate-user',
  // ... endpoints futuros
};
```

---

## 7. Datos Mock Pendientes de Conectar

Actualmente, el backend del monorepo solo implementa la API de autenticación y validación de usuarios. Los siguientes módulos del frontend se alimentan con datos mock y requieren migración e integración futura con la base de datos real:

- **Módulo de Subastas (Listas y Fichas de Detalle)**:
  - `screens/auction/AuctionListScreen.js`
  - `screens/auction/AuctionDetailScreen.js`
  - `screens/auction/AuctionListAuthScreen.js`
  - `screens/auction/AuctionDetailAuthScreen.js`
  - *Pendiente*: Crear rutas en la API (`/api/auctions` y `/api/auctions/:id`) para consultar la tabla `subastas`, `productos`, `itemscatalogo` y el precio base del lote.
- **Módulo de Calendario**:
  - `screens/tabs/CalendarScreen.js`
  - *Pendiente*: Conectar al endpoint `/api/auctions/calendar` para agrupar las subastas programadas por día en el mes corriente.
- **Módulo de Estadísticas e Historial**:
  - `screens/tabs/InformacionScreen.js`
  - `components/EstadisticasCharts.js`
  - *Pendiente*: Reemplazar el hook simulador `useRealtimeData` por peticiones reales a base de datos sobre la evolución de pujas de los usuarios en `pujos` y los cierres en `registrodesubasta`.
- **Módulo de Perfil (Mi Cuenta)**:
  - `screens/profile/MiCuentaScreen.js`
  - *Pendiente*: Reemplazar la constante hardcodeada `usuarioInicial` por los datos del usuario autenticado persistidos en `useAuthStore` y conectar el guardado de datos a un endpoint `PATCH /api/users/me`.

---

## 8. Pendientes para Completar el TPO

Para finalizar el Trabajo Práctico Obligatorio, se requiere expandir las capas de la aplicación con los siguientes desarrollos clave:

1. **Pasarela y Métodos de Pago**:
   - Frontend: Diseñar y estructurar la interfaz para añadir, verificar y eliminar tarjetas de crédito/débito o cuentas virtuales de pago.
   - Backend: Crear la tabla y endpoints asociados a los medios de pago del postor.
2. **Pujas en Tiempo Real**:
   - Integrar un protocolo de comunicación bidireccional (por ejemplo, mediante WebSockets/Socket.io o un polling recurrente y optimizado) para actualizar dinámicamente el listado de pujas y determinar el pujo ganador actual en el detalle del lote (`AuctionDetailAuthScreen.js`) conectándose a la tabla `pujos` de la base de datos.
3. **Panel Administrativo de Validación**:
   - Desarrollar la interfaz web o un apartado administrativo dentro del frontend para listar a los usuarios registrados en estado `'pendiente'`, visualizar las fotos del DNI almacenadas en la base de datos y permitir su aprobación/rechazo mediante el endpoint `/api/auth/validate-user`.
4. **Publicación Real de Productos (Cargar Bien)**:
   - Migrar la pantalla `CargarProductoScreen.js` para enviar de forma real el PDF de la ficha técnica y la colección de imágenes del bien (mínimo 6) al backend, persistiendo los registros en las tablas `productos`, `fotos` y adjuntándolas a un `catalogo` activo de subasta.
