# AVANCE_01_SubastUP - Documentación Técnica Frontend

**Rama:** `desarrollo`  
**Fecha:** Junio 2026  
**Stack:** React Native con Expo SDK 54

---

## 1. Descripción General del Proyecto

**SubastUP** es una aplicación mobile de subastas en línea desarrollada con React Native y Expo. Permite a usuarios no autenticados ver subastas especiales y comunes mediante un calendario de eventos, y usuarios autenticados pueden participar en pujas con acceso a funcionalidades completas de búsqueda, chat y gestión de perfil.

**Arquitectura general:**
- Frontend único para iOS y Android (Expo)
- Navegación condicional basada en estado de autenticación
- Gestión de estado con Zustand (stores separados para auth y registro)
- API Axios con interceptores para manejo de tokens
- AsyncStorage para persistencia de datos (token, usuario)

---

## 2. Stack Tecnológico

| Dependencia | Versión | Propósito |
|---|---|---|
| react | 19.1.0 | Framework UI |
| react-native | 0.81.5 | Runtime mobile |
| expo | ~54.0.33 | Toolchain y bundler |
| @react-navigation/native | ^7.2.4 | Router base |
| @react-navigation/native-stack | ^7.15.0 | Stack navigator (auth flow) |
| @react-navigation/bottom-tabs | ^7.16.0 | Tab navigator (main app) |
| react-hook-form | ^7.75.0 | Validación y manejo de formularios |
| zustand | ^4.5.0 | State management |
| axios | ^1.16.0 | HTTP client |
| @react-native-async-storage/async-storage | ^2.2.0 | Almacenamiento local |
| react-native-safe-area-context | ~5.6.0 | Safe area (notches, home bar) |
| react-native-screens | ~4.16.0 | Native screen container |
| @expo/vector-icons | (bundled) | Ionicons para UI |
| expo-image-picker | ~17.0.11 | Selección de imágenes de galería |
| expo-status-bar | ~3.0.9 | Control de barra de estado |

**Nota sobre Hermes:** El motor JavaScript Hermes está habilitado mediante configuración Babel (`unstable_transformImportMeta: true`) para soportar `import.meta` usado por react-native-screens.

---

## 3. Estructura de Carpetas

```
frontend/
├── src/
│   ├── assets/
│   │   └── images/           # Imágenes estáticas (logos, placeholders)
│   ├── constants/
│   │   ├── colors.js         # Paleta, spacing, radius, fonts
│   │   └── api.js            # BASE_URL y ENDPOINTS definidos
│   ├── navigation/
│   │   ├── AppNavigator.js   # Root navigator (condicional auth)
│   │   ├── AuthNavigator.js  # Stack navigator (login, registro, recuperar contraseña)
│   │   └── TabNavigator.js   # Bottom tabs (home autenticado, search, calendar, chats, profile)
│   ├── screens/
│   │   ├── SplashScreen.js   # Welcome screen con logo y spinner
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js           # Paso 1
│   │   │   ├── RegisterScreen2.js          # Paso 2 (fotos)
│   │   │   ├── ForgotPasswordScreen.js     # Solo stub (placeholder)
│   │   │   ├── VerifyCodeScreen.js         # Verifica código por mail
│   │   │   └── ResetPasswordScreen.js
│   │   ├── tabs/
│   │   │   ├── HomeUnauthenticatedScreen.js  # Landing sin login
│   │   │   ├── HomeAuthenticatedScreen.js    # Inicio autenticado (con menú)
│   │   │   ├── SearchScreen.js               # Stub (solo texto)
│   │   │   ├── CalendarScreen.js             # Calendario con subastas mock
│   │   │   ├── ChatsScreen.js                # Stub (solo texto)
│   │   │   └── ProfileScreen.js              # Stub (solo texto)
│   │   └── auction/
│   │       ├── AuctionListScreen.js    # Listado con categorías y filtro
│   │       └── AuctionDetailScreen.js  # Detalle de producto (con galería)
│   ├── store/
│   │   ├── authStore.js       # Zustand: user, token, login, logout, register
│   │   └── registerStore.js   # Zustand: formulario multi-step (Paso 1 + Paso 2)
│   └── services/
│       └── api.js             # Axios instance con interceptores
├── package.json
├── babel.config.js            # Transformación import.meta para Hermes
├── metro.config.js            # Resolver para symlinks
├── app.json                   # Configuración Expo (nombre, icono, versión)
└── .npmrc                     # legacy-peer-deps=true
```

---

## 4. Paleta de Colores

Definida en `src/constants/colors.js`:

```javascript
{
  primary:       '#8B0000',        // Rojo oscuro principal (subastas, activo)
  primaryLight:  '#E53935',        // Rojo claro (hover, estados)
  secondary:     '#212121',        // Gris oscuro (texto principal)
  white:         '#FFFFFF',        // Blanco (fondos, superficies)
  background:    '#7B7B7B',        // Gris (fondos secundarios)
  surface:       '#FFFFFF',        // Mismo que white
  border:        '#7B7B7B',        // Gris (bordes, divisores)
  placeholder:   '#7B7B7B',        // Gris (inputs vacíos, pestañas inactivas)
  error:         '#C62828',        // Rojo oscuro (validación)
  success:       '#2E7D32',        // Verde (confirmación)
  timerWarning:  '#FF6F00',        // Naranja (tiempo crítico en pujas)
}
```

**Espaciado y dimensiones:**
```javascript
SPACING:  { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 }
RADIUS:   { sm: 4, md: 8, lg: 12, full: 999 }
FONTS:    { xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24 }
```

---

## 5. Árbol de Navegación Completo

### 5.1 AppNavigator (Root)

Renderiza conacionalmente según `isLoggedIn`:

```
AppNavigator
├── (SplashScreen durante 3s)
├── IF !isLoggedIn
│   ├── HomeUnauth (Stack.Screen, initial)
│   ├── Calendar (Stack.Screen)
│   ├── AuctionList (Stack.Screen)
│   ├── RegisterStep2 (Stack.Screen)
│   ├── Auth (Stack.Navigator nested)
│   │   ├── Login (initial)
│   │   ├── Register
│   │   ├── ForgotPassword
│   │   ├── VerifyCode
│   │   └── ResetPassword
│   └── AuctionDetail (Stack.Screen)
└── ELSE (isLoggedIn)
    └── Main (TabNavigator nested)
        ├── Home → HomeAuthenticatedScreen
        ├── Search → SearchScreen
        ├── Calendar → CalendarScreen
        ├── Chats → ChatsScreen
        └── Profile → ProfileScreen
```

**Nota:** `gestureEnabled: false` en HomeUnauth previene swipe-back accidental. AuthNavigator también tiene `gestureEnabled: false`.

---

## 6. Documentación de Pantallas

### 6.1 SplashScreen
- **Ruta:** `src/screens/SplashScreen.js`
- **Función:** Pantalla de bienvenida con logo y spinner
- **Navegación entrada:** Inicial (AppNavigator)
- **Navegación salida:** Ninguna (se renderiza 3s en AppNavigator)
- **Datos esperados:** Ninguno
- **Componentes:** View, Image, ActivityIndicator
- **Estado local:** Ninguno

### 6.2 HomeUnauthenticatedScreen (Landing)
- **Ruta:** `src/screens/tabs/HomeUnauthenticatedScreen.js`
- **Función:** Landing page para usuarios sin sesión. Muestra "Subastas Especiales" y "Subastas Comunes" con botones "Ver más", acceso a Login/Registro, y botón Calendario central.
- **Navegación entrada:** AppNavigator (initial si !isLoggedIn)
- **Navegación salida:** 
  - `Login`: Navigate a Auth con screen='Login'
  - `Registro`: Navigate a Auth con screen='Register'
  - `Calendario`: Navigate a Calendar
  - `Ver más` Especiales/Comunes: Navigate a AuctionList con `auctionType: 'especial'|'comun'`
- **Datos esperados:** Ninguno (datos mock)
- **Componentes:** ScrollView, TouchableOpacity, Image
- **Estado local:** Ninguno (sin hooks)
- **Imágenes:** `texto_appbar.jpeg`, `imagen_menu1.jpeg`, `imagen_menu2.jpeg`, `btn_calendario.jpeg`, `btn_login.jpeg`, `btn_register.jpeg`

### 6.3 LoginScreen
- **Ruta:** `src/screens/auth/LoginScreen.js`
- **Función:** Autenticación. Formulario con email/contraseña, toggle "Recuérdame", y modal "Olvidé mi contraseña".
- **Navegación entrada:** Auth Stack
- **Navegación salida:**
  - Login exitoso → AppNavigator actualiza `isLoggedIn` (automático)
  - "Olvidé contraseña" modal → VerifyCode con `email` param
- **Datos esperados:** Ninguno
- **Componentes:** TextInput, TouchableOpacity, Modal, ActivityIndicator, Ionicons
- **Estado local:**
  - `showPassword: boolean` (toggle visibilidad)
  - `rememberMe: boolean` (switch)
  - `activeTab: 'login'` (UI state)
  - `forgotVisible, forgotEmail, forgotLoading, forgotError` (modal forgot password)
- **Validación:** Email y contraseña requeridos, regex email en modal
- **API:** `authStore.login(email, password)` → `POST /auth/login`
- **Nota:** Comentario `// await api.post(ENDPOINTS.FORGOT_PASSWORD, ...)` indica integración pendiente

### 6.4 RegisterScreen (Paso 1)
- **Ruta:** `src/screens/auth/RegisterScreen.js`
- **Función:** Primer paso del registro. Captura nombre, apellido, DNI, teléfono, email.
- **Navegación entrada:** Auth Stack
- **Navegación salida:**
  - "Siguiente": Navigate a RegisterScreen2
  - "Tengo cuenta": Navigate a Login (dentro de Auth)
- **Datos esperados:** Ninguno
- **Componentes:** TextInput, TouchableOpacity, ScrollView, SafeAreaView
- **Estado local:** `activeTab: 'register'` (UI)
- **Validación:** react-hook-form con validadores (requerido, email format, DNI length)
- **Store:** `useRegisterStore.setStep1Data(data)`
- **Persistencia:** `useFocusEffect` carga datos previos del store al volver

### 6.5 RegisterScreen2 (Paso 2)
- **Ruta:** `src/screens/auth/RegisterScreen2.js`
- **Función:** Segundo paso. Dirección, código postal, ciudad, país, número, y carga de 2 fotos.
- **Navegación entrada:** Stack.Screen (directo desde RegisterScreen)
- **Navegación salida:**
  - "Enviar": Modal de éxito → Siguiente (vacío, regresa a Login en AppNavigator)
  - "Volver": Navigate a RegisterScreen
  - "Tengo cuenta": Navigate a Auth→Login
- **Datos esperados:** Ninguno
- **Componentes:** TextInput, TouchableOpacity, Modal, ScrollView, SafeAreaView
- **Estado local:** `modalVisible: boolean`
- **Validación:** react-hook-form
- **Store:** 
  - `useRegisterStore.setStep2Data(data)`
  - `useRegisterStore.setFotos()`
  - `useRegisterStore.clearRegistration()` (en modal success)
- **API:** Integración con `expo-image-picker` para seleccionar fotos
- **Nota:** Modal de éxito post-registro indicado con estilos definidos

### 6.6 ForgotPasswordScreen
- **Ruta:** `src/screens/auth/ForgotPasswordScreen.js`
- **Estado:** Stub (solo placeholder con texto "ForgotPasswordScreen")
- **Función futura:** Enviar email de recuperación

### 6.7 VerifyCodeScreen
- **Ruta:** `src/screens/auth/VerifyCodeScreen.js`
- **Función:** Verifica código de 4 dígitos enviado por email (parte del flujo "Olvidé contraseña").
- **Navegación entrada:** Navigate desde LoginScreen modal (con `email` param)
- **Navegación salida:**
  - "Validar" exitoso: Navigate a ResetPassword con `code` y `email` params
- **Datos esperados:** `route.params.email`
- **Componentes:** TextInput, TouchableOpacity, Image, ActivityIndicator, Ionicons
- **Estado local:** `codigo, loading, error`
- **Validación:** Mínimo 4 dígitos
- **API:** Comentario `// await api.post(ENDPOINTS.VERIFY_CODE, ...)` indica integración pendiente
- **Nota:** Solicita input solo numérico

### 6.8 ResetPasswordScreen
- **Ruta:** `src/screens/auth/ResetPasswordScreen.js`
- **Función:** Establece nueva contraseña en flujo "Olvidé contraseña".
- **Navegación entrada:** VerifyCodeScreen (con `email`, `code` params)
- **Navegación salida:**
  - "Guardar" exitoso: Navigate a LoginScreen
- **Datos esperados:** `route.params.email`, `route.params.code`
- **Componentes:** TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Ionicons
- **Estado local:** `showPass1, showPass2, loading`
- **Validación:** Contraseñas coinciden, mínimo length
- **API:** Comentario `// await api.post(ENDPOINTS.RESET_PASSWORD, ...)` indica integración pendiente
- **Nota:** Dos campos password con toggles independientes (eye-outline/eye-off-outline de Ionicons)

### 6.9 HomeAuthenticatedScreen
- **Ruta:** `src/screens/tabs/HomeAuthenticatedScreen.js`
- **Función:** Home para usuarios logueados. Menú con 3 items (Métodos de Pago, Información, Calendario) y sección de subastas destacadas.
- **Navegación entrada:** TabNavigator → Home tab
- **Navegación salida:**
  - Menu buttons: `console.log()` (no implementado)
  - Notificaciones: `console.log()` (no implementado)
- **Datos esperados:** Ninguno
- **Componentes:** ScrollView, TouchableOpacity, Ionicons, Image
- **Estado local:** `activeTab: 0`
- **Datos mock:** `MENU_BUTTONS` (3 items), `BOTTOM_TABS` (4 items)

### 6.10 SearchScreen
- **Ruta:** `src/screens/tabs/SearchScreen.js`
- **Estado:** Stub (solo placeholder con texto "SearchScreen")
- **Función futura:** Búsqueda y filtro de subastas

### 6.11 CalendarScreen
- **Ruta:** `src/screens/tabs/CalendarScreen.js`
- **Función:** Calendario interactivo que muestra subastas por fecha. Vista mensual con grilla, navegación mes/año, detalle de subastas seleccionadas.
- **Navegación entrada:** 
  - TabNavigator (Calendar tab) desde HomeAuthenticatedScreen
  - AppNavigator→Calendar (directo desde HomeUnauthenticatedScreen)
- **Navegación salida:**
  - "Pujar" en subastacard: Navigate a Auth (si no logueado)
  - "Volver" (back button): Navigate a HomeUnauth
- **Datos esperados:** Ninguno (datos mock: `SUBASTAS_MOCK`)
- **Componentes:** ScrollView, TouchableOpacity, FlatList, Ionicons
- **Estado local:** `mes, anio, diaSeleccionado`
- **Datos mock:** 5 subastas con `id, titulo, imagen, moneda, precioBase, fecha, hora, colorPlaceholder`
- **Estructura esperada de API:**
  ```javascript
  { 
    id, titulo, imagen (URL Cloudinary | null), moneda, precioBase, 
    fecha (YYYY-MM-DD), hora (HH:mm) 
  }
  ```
- **Nota:** Grid dinámica con estilos para días con subasta (rojo), hoy (rosa), seleccionado (rojo oscuro)

### 6.12 ChatsScreen
- **Ruta:** `src/screens/tabs/ChatsScreen.js`
- **Estado:** Stub (solo placeholder)
- **Función futura:** Mensajería entre usuarios

### 6.13 ProfileScreen
- **Ruta:** `src/screens/tabs/ProfileScreen.js`
- **Estado:** Stub (solo placeholder)
- **Función futura:** Datos del perfil, configuración de usuario

### 6.14 AuctionListScreen
- **Ruta:** `src/screens/auction/AuctionListScreen.js`
- **Función:** Listado de subastas con filtro por categoría y búsqueda. Recibe `auctionType` ('especial' | 'comun').
- **Navegación entrada:** HomeUnauthenticatedScreen "Ver más" o AppNavigator
- **Navegación salida:**
  - Card de producto: Navigate a AuctionDetail con `productId` param
- **Datos esperados:** `route.params.auctionType`
- **Componentes:** TextInput, FlatList, TouchableOpacity, ScrollView
- **Estado local:** `search, selected` (categoría)
- **Datos mock:** `PRODUCTOS_MOCK` (4 items con `id, titulo, moneda, proximamente, fecha, color`)
- **Categorías:** especial=['Oro','Platino'], comun=['Comun','Especial','Plata','Oro','Platino']
- **Nota:** Grid 2 columnas con altura proporcional (CARD_WIDTH * 1.4)

### 6.15 AuctionDetailScreen
- **Ruta:** `src/screens/auction/AuctionDetailScreen.js`
- **Función:** Detalle completo de un producto. Galería de imágenes (scroll horizontal), descripción, precio base, categoría, botón "Pujar", información del vendedor.
- **Navegación entrada:** AuctionListScreen con `productId` param
- **Navegación salida:**
  - Back button: Pop a AuctionListScreen
  - "Pujar": Navigate a Auth (si no logueado)
- **Datos esperados:** `route.params.productId`
- **Componentes:** ScrollView, FlatList, TouchableOpacity, Image, Ionicons
- **Estado local:** `activeSlide` (índice galería)
- **Datos mock:** `PRODUCTO_MOCK` con estructura:
  ```javascript
  {
    id, titulo, descripcion, imagenes (null = placeholder),
    moneda, precioBase, categoria, estado ('activo'|'proximamente'|'finalizado'),
    coloresPlaceholder (array para placeholders)
  }
  ```
- **Estructura esperada de API:**
  ```javascript
  {
    id, titulo, descripcion, imagenes (array URLs Cloudinary),
    moneda, precioBase, categoria, estado
  }
  ```
- **Nota:** Galería con indicador de slide activo, tap fuera cierra

---

## 7. Flujos de Usuario

### 7.1 Flujo Usuario No Autenticado

```
SplashScreen (3s)
    ↓
HomeUnauthenticatedScreen
    ├─→ "Ver más Especiales" → AuctionListScreen (auctionType='especial')
    │   └─→ Producto → AuctionDetailScreen
    │       └─→ "Pujar" → Auth→Login
    ├─→ "Ver más Comunes" → AuctionListScreen (auctionType='comun')
    │   └─→ Producto → AuctionDetailScreen
    │       └─→ "Pujar" → Auth→Login
    ├─→ "Calendario" (central) → CalendarScreen
    │   └─→ Seleccionar fecha → Ver subastas del día
    │       └─→ "Pujar" → Auth→Login
    ├─→ "Login" → Auth→LoginScreen
    └─→ "Registrarse" → Auth→RegisterScreen (Paso 1)
```

### 7.2 Flujo Autenticación (Login)

```
HomeUnauthenticatedScreen → "Login"
    ↓
Auth→LoginScreen
    ├─→ Email + Contraseña válidos → authStore.login()
    │   └─→ API: POST /auth/login → Token + User data
    │       ↓
    │       AsyncStorage: token, user
    │       ↓
    │       authStore: isLoggedIn=true
    │       ↓
    │       AppNavigator: renderiza TabNavigator (Main)
    │
    └─→ "Olvidé mi contraseña" → Modal
        └─→ Email válido → "Enviar"
            ├─→ API: POST /auth/forgot-password (comentado)
            └─→ Navigate VerifyCodeScreen (email param)
```

### 7.3 Flujo Autenticación (Registro)

```
HomeUnauthenticatedScreen → "Registrarse"
    ↓
Auth→RegisterScreen (Paso 1)
    └─→ Nombre, Apellido, DNI, Teléfono, Email
        ├─→ Validación: Todos requeridos, email format
        └─→ "Siguiente" → authStore.setStep1Data()
            ↓
            Stack.Screen→RegisterScreen2 (Paso 2)
                └─→ Dirección, Número, País, Ciudad, Código Postal, 2 Fotos
                    ├─→ Validación: Todos requeridos
                    ├─→ "Seleccionar Foto" → expo-image-picker.launchImageLibraryAsync()
                    └─→ "Enviar" → authStore.setStep2Data() + authStore.setFotos()
                        └─→ API: POST /auth/register (comentado)
                            └─→ Modal Éxito
                                ├─→ authStore.clearRegistration()
                                └─→ "Siguiente" → Navigate Auth→Login
```

### 7.4 Flujo Recuperación de Contraseña

```
LoginScreen → "Olvidé mi contraseña" modal
    ↓
Email input + "Enviar"
    └─→ Email validation
        ↓
        API: POST /auth/forgot-password (comentado)
            ↓
            VerifyCodeScreen (email param)
                └─→ Código de 4 dígitos
                    ├─→ API: POST /auth/verify-code (comentado)
                    └─→ ResetPasswordScreen (email, code params)
                        └─→ Nueva contraseña + Confirmar
                            ├─→ Validación: Coinciden
                            └─→ API: POST /auth/reset-password (comentado)
                                └─→ LoginScreen
```

### 7.5 Flujo Usuario Autenticado

```
AppNavigator (isLoggedIn=true)
    ↓
TabNavigator
    ├─→ Home (HomeAuthenticatedScreen)
    │   ├─→ Menú items (no implementados)
    │   └─→ Subastas destacadas (mock)
    ├─→ Search (SearchScreen) [stub]
    ├─→ Calendar (CalendarScreen) [puede ver sin ir desde HomeUnauth]
    │   └─→ "Pujar" → (lógica puja, no implementada)
    ├─→ Chats (ChatsScreen) [stub]
    └─→ Profile (ProfileScreen) [stub]
```

---

## 8. Estado Global (Zustand)

### 8.1 authStore (`src/store/authStore.js`)

```javascript
{
  // Fields
  user:       null | { id: string, name: string }
  token:      null | string
  isLoggedIn: boolean (default: false)
  isLoading:  boolean (default: false)
  error:      null | string

  // Methods
  init():                          // Carga token/user de AsyncStorage al iniciar
  login(email, password):          // POST /auth/login → setea token, user, isLoggedIn
  register(userData):              // POST /auth/register → setea token, user, isLoggedIn
  logout():                        // POST /auth/logout (no-throw), limpia AsyncStorage
  clearError():                    // Resetea campo error
}
```

**Interceptor Axios:** Token agregado en header `Authorization: Bearer ${token}` en cada request. Si 401, limpia AsyncStorage.

### 8.2 registerStore (`src/store/registerStore.js`)

```javascript
{
  // Fields
  step1Data: {
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
  }

  step2Data: {
    direccion: '',
    numero: '',
    pais: '',
    ciudad: '',
    codigoPostal: '',
  }

  fotos: {
    foto1: null | string (URI),
    foto2: null | string (URI),
  }

  // Methods
  setStep1Data(data):               // Merge data en step1Data
  setStep2Data(data):               // Merge data en step2Data
  setFotos(fotos):                  // Setea fotos completo
  getRegistroCompleto():            // Retorna merged: {...step1Data, ...step2Data, fotos}
  clearRegistration():              // Resetea todos los campos a valores iniciales
}
```

**Nota:** `getRegistroCompleto()` usa patrón `create((set, get) => ({...}))` para acceder al estado.

---

## 9. Endpoints API

Definidos en `src/constants/api.js`:

```javascript
BASE_URL = 'http://192.168.1.100:3000'

ENDPOINTS = {
  // Auth
  LOGIN:            '/auth/login',
  REGISTER:         '/auth/register',
  LOGOUT:           '/auth/logout',
  FORGOT_PASSWORD:  '/auth/forgot-password',
  VERIFY_CODE:      '/auth/verify-code',
  RESET_PASSWORD:   '/auth/reset-password',

  // Users
  ME:               '/users/me',
  MY_BIDS:          '/users/me/bids',
  MY_AUCTIONS:      '/users/me/auctions',

  // Auctions
  AUCTIONS:         '/auctions',
  AUCTION_BY_ID:    (id) => `/auctions/${id}`,
  UPLOAD_IMAGES:    '/auctions/upload-images',
  SUGGESTIONS:      '/auctions/search/suggestions',
  CALENDAR:         '/auctions/calendar',
  AUCTION_STATUS:   (id) => `/auctions/${id}/status`,
  SHARE_LINK:       (id) => `/auctions/${id}/share-link',

  // Bids
  BIDS:             '/bids',

  // Chat
  CHATS:            '/chats',
  MESSAGES:         (id) => `/chats/${id}/messages`,

  // Notifications
  NOTIFICATIONS:    '/notifications',
  MARK_READ:        (id) => `/notifications/${id}/read`,

  // Settings
  SETTINGS:         '/settings',
  PAYMENT_METHODS:  '/settings/payment-methods',
  PAYMENT_BY_ID:    (id) => `/settings/payment-methods/${id}`,

  // Help
  FAQ:              '/help/faq',
}
```

**Nota:** Actualmente ningún endpoint está siendo consumido completamente. Hay comentarios `// await api.post(ENDPOINTS.*)` en varios screens indicando integración pendiente.

---

## 10. Decisiones Técnicas

### 10.1 Babel + Hermes

**Problema:** `import.meta` (usado por react-native-screens) no es soportado nativamente por Hermes.

**Solución:** Configuración en `babel.config.js`:
```javascript
{ presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]] }
```
Esto transforma `import.meta` en tiempo de compilación, antes de que Hermes lo procese.

**Resultado:** Bundling exitoso en Android mediante Expo Go.

### 10.2 Metro Config

`metro.config.js` configura:
- `nodeModulesPaths`: Resuelve node_modules correctamente
- `unstable_enableSymlinks`: Permite symlinks en dependencias

### 10.3 React Navigation v7

- **Nested Navigators:** AppNavigator (root) → AuthNavigator (stack) y TabNavigator (tabs) renderizados condicionalmente
- **gestureEnabled: false:** Previene swipe-back en HomeUnauth y AuthNavigator para control de flujo

### 10.4 Safe Area

`react-native-safe-area-context` maneja notches, home bar, etc. Todos los screens con header usan `useSafeAreaInsets()`.

### 10.5 Estado Global (Zustand vs Context)

Zustand elegido por:
- Menos boilerplate que Context API
- Mejor performance (updates selectivos)
- Acceso directo al estado sin hooks obligatorios

### 10.6 AsyncStorage para Persistencia

Token y user info guardados en AsyncStorage. Se cargan al iniciar app mediante `authStore.init()` en AppNavigator useEffect.

### 10.7 Axios Interceptors

- **Request:** Agrega token en header si existe
- **Response:** Si 401, limpia AsyncStorage automáticamente

---

## 11. Pendientes Identificados

### 11.1 Screens Stub (No Implementadas)

| Screen | Ruta | Estado |
|--------|------|--------|
| SearchScreen | `src/screens/tabs/SearchScreen.js` | Solo placeholder |
| ChatsScreen | `src/screens/tabs/ChatsScreen.js` | Solo placeholder |
| ProfileScreen | `src/screens/tabs/ProfileScreen.js` | Solo placeholder |
| ForgotPasswordScreen | `src/screens/auth/ForgotPasswordScreen.js` | Solo placeholder |

### 11.2 Comentarios TODO / Integraciones Pendientes

| Archivo | Línea (aprox) | Notas |
|---------|---|---|
| LoginScreen.js | ~74 | `// await api.post(ENDPOINTS.FORGOT_PASSWORD, ...)` |
| VerifyCodeScreen.js | ~39 | `// await api.post(ENDPOINTS.VERIFY_CODE, ...)` |
| ResetPasswordScreen.js | ~50+ | `// await api.post(ENDPOINTS.RESET_PASSWORD, ...)` |
| RegisterScreen2.js | N/A | `// await api.post(ENDPOINTS.REGISTER, userData)` comentado |
| HomeAuthenticatedScreen.js | ~39-45 | Menu buttons con `console.log()` en lugar de navegación |

### 11.3 Datos Mock

| Screen | Datos Mock | Estructura |
|--------|-----------|-----------|
| AuctionListScreen.js | `PRODUCTOS_MOCK` (4 items) | id, titulo, moneda, proximamente, fecha, color |
| AuctionDetailScreen.js | `PRODUCTO_MOCK` (1 item) | Completo con descripción, estado, categoría |
| CalendarScreen.js | `SUBASTAS_MOCK` (5 items) | Con fecha (YYYY-MM-DD) y hora (HH:mm) |
| HomeAuthenticatedScreen.js | `MENU_BUTTONS` (3), `BOTTOM_TABS` (4) | Labels e iconos |

### 11.4 Funcionalidades NO Implementadas

- [ ] Sistema de pujas (bidding)
- [ ] Chat en tiempo real
- [ ] Notificaciones push
- [ ] Métodos de pago
- [ ] Perfil de usuario (edición)
- [ ] Imagen real en galería AuctionDetailScreen (está como null)
- [ ] Logout con navegación automática
- [ ] Búsqueda (SearchScreen vacío)
- [ ] Información de vendedor en detalle
- [ ] Timer de cuenta regresiva en subastas activas

### 11.5 Validaciones Faltantes

- [ ] Validación de contraseña fuerte (uppercase, números, símbolos)
- [ ] Validación de DNI argentino
- [ ] Formato de teléfono
- [ ] Validación de código postal por país

---

## 12. Instrucciones para Ejecutar

### 12.1 Requisitos Previos

- Node.js (v18+)
- pnpm (o npm)
- Expo CLI: `npm install -g expo-cli`
- Android emulator OR iOS simulator (o dispositivo físico con Expo Go)

### 12.2 Setup Inicial

```bash
# Navegar a carpeta frontend
cd frontend

# Instalar dependencias
pnpm install

# (Opcional) Si hay peer dependency warnings:
# Ya tiene legacy-peer-deps=true en .npmrc
```

### 12.3 Iniciar Desarrollo

```bash
# Iniciar servidor Expo
pnpm start

# Escoger plataforma:
# - Android: Presionar 'a' o 'android'
# - iOS: Presionar 'i' o 'ios'
# - Web: Presionar 'w' o 'web'

# O directamente:
pnpm android
pnpm ios
pnpm web
```

### 12.4 Configurar API Backend

**En `src/constants/api.js`:**

```javascript
export const BASE_URL = 'http://192.168.1.100:3000'; // Cambiar IP/puerto según backend local
```

Reemplazar `192.168.1.100:3000` con IP y puerto del backend.

### 12.5 Compilar para Producción (EAS Build)

```bash
# Si no tienes cuenta Expo, crear una primero
eas login

# Build Android
eas build --platform android

# Build iOS
eas build --platform ios
```

### 12.6 Testing

No hay test suite configurado aún. Se recomienda:
- Jest + React Native Testing Library para unit tests
- E2E tests con Detox o Appium

### 12.7 Estructura .npmrc

```
legacy-peer-deps=true
```

Esto permite instalar dependencias con peer dependency conflicts (ej: react-hook-form vs version específica).

---

## 13. Notas Finales

- **Rama actual:** `desarrollo`
- **Commit reciente:** calendario integrado, LoginScreen con modal "Olvidé contraseña", ResetPasswordScreen con Ionicons, HomeAuthenticatedScreen stub
- **Estado de integración API:** 50% (auth mock, datos de subastas mock)
- **Próximas prioridades:** Integración API, implementación de SearchScreen, ChatsScreen, ProfileScreen

**Generado:** Junio 2026 | **Revisor técnico:** Análisis automatizado de codebase en rama `desarrollo`
