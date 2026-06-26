> Nota de normalizacion (2026-06-26): este documento es historico. Para endpoints vigentes usar `Documents/API_ENDPOINTS.md` y `SubastUp_API_Endpoints_v3_FINAL.xlsx`, que coinciden con `backend/server.js` y `backend/routes/*`.

# SubastUP — Avance 02
## 2 de junio de 2026

### 1. Incorporaciones de este avance
- Nueva pantalla de Información (`frontend/src/screens/tabs/InformacionScreen.js`) con interfaz interactiva y visualización de historial de pujas.
- Nueva pantalla de Configuración (`frontend/src/screens/tabs/ConfiguracionScreen.js`) con panel de control de cuenta, sistema, soporte y sesión.
- Nueva pantalla de Ayuda (`frontend/src/screens/tabs/AyudaScreen.js`) con acordeón interactivo de preguntas frecuentes (FAQ) y enlace de correo de soporte.
- Nuevos componentes gráficos SVG en tiempo real (`GraficoEvolucion`, `GraficoDistribucion` y `RealtimeBadge`) implementados en `frontend/src/components/EstadisticasCharts.js`.
- Incorporación de las nuevas pantallas y duplicación de rutas del listado, detalle y calendario en el Stack principal para usuarios autenticados dentro de `frontend/src/navigation/AppNavigator.js`.
- Inclusión de la variable de desarrollo `DEV_FORCE_LOGIN` en `frontend/src/navigation/AppNavigator.js` para forzar el inicio de sesión durante las pruebas.
- Lógica de menús interactivos, animaciones spring/timing para Drawer lateral y barra de notificaciones en `frontend/src/screens/tabs/HomeAuthenticatedScreen.js`.
- Definición de la estructura de endpoints del lado del cliente en `frontend/src/constants/api.js`.

### 2. Nuevas pantallas

**InformacionScreen** `frontend/src/screens/tabs/InformacionScreen.js`
- Qué hace: Muestra métricas de subastas mediante gráficos dinámicos de gasto/pujas e historial interactivo.
- Entrada: Se accede desde `HomeAuthenticatedScreen` presionando el botón de menú "Información".
- Salida: Regresa a `HomeAuthenticatedScreen` mediante el botón superior izquierdo de volver.
- API: Consume `MOCK_STATS` e historial estático locales, y ejecuta simulación de updates periódicos con hooks.

**ConfiguracionScreen** `frontend/src/screens/tabs/ConfiguracionScreen.js`
- Qué hace: Centraliza opciones de personalización (tema oscuro, notificaciones), datos de perfil, métodos de pago y cierre de sesión.
- Entrada: Se accede desde el menú hamburguesa de `HomeAuthenticatedScreen` seleccionando la opción "Configuracion".
- Salida: Regresa a `HomeAuthenticatedScreen` mediante el botón superior izquierdo de volver.
- API: Datos de usuario mock locales y simulación de switches locales.

**AyudaScreen** `frontend/src/screens/tabs/AyudaScreen.js`
- Qué hace: Muestra preguntas frecuentes con acordeón interactivo y datos de soporte para contacto técnico.
- Entrada: Se accede desde el menú hamburguesa de `HomeAuthenticatedScreen` seleccionando la opción "Ayuda".
- Salida: Regresa a `HomeAuthenticatedScreen` mediante el botón superior de volver.
- API: Contenido local de FAQS e interacción con el correo soporteSubastUp@gmail.com por Linking.

### 3. Nuevos componentes

**GraficoEvolucion** `frontend/src/components/EstadisticasCharts.js`
- Qué hace: Dibuja una línea de evolución suavizada SVG animada con relleno de gradiente interactivo para visualizar métricas temporales de gasto o pujas.
- Usado en: `frontend/src/screens/tabs/InformacionScreen.js`
- Props: `data` (objeto con series para periodo semana/mes), `loading` (booleano)

**GraficoDistribucion** `frontend/src/components/EstadisticasCharts.js`
- Qué hace: Renderiza un gráfico tipo dona SVG animado que divide visualmente las pujas en ganadas, perdidas y activas.
- Usado en: `frontend/src/screens/tabs/InformacionScreen.js`
- Props: `ganadas` (número), `perdidas` (número), `activas` (número), `loading` (booleano)

**RealtimeBadge** `frontend/src/components/EstadisticasCharts.js`
- Qué hace: Muestra un badge visual animado indicando que las estadísticas están actualizadas junto con el tiempo del último fetch.
- Usado en: `frontend/src/screens/tabs/InformacionScreen.js`
- Props: `lastUpdate` (instancia de Date)

### 4. Cambios en AppNavigator
Los siguientes componentes de Stack.Screen fueron añadidos al NavigationContainer en `frontend/src/navigation/AppNavigator.js` en el flujo de usuario autenticado (`isLoggedIn` o `DEV_FORCE_LOGIN` activos):
- `<Stack.Screen name="Informacion" component={InformacionScreen} />`
- `<Stack.Screen name="Configuracion" component={ConfiguracionScreen} />`
- `<Stack.Screen name="Ayuda" component={AyudaScreen} />`
- `<Stack.Screen name="AuctionList" component={AuctionListScreen} />`
- `<Stack.Screen name="AuctionDetail" component={AuctionDetailScreen} />`
- `<Stack.Screen name="Calendar" component={CalendarScreen} />`

### 5. Backend
- **Stack:** archivo no encontrado
- **Variables de entorno requeridas:** archivo no encontrado
- **Modelos Prisma:**
| Modelo | Campos clave | Relaciones |
|--------|-------------|------------|
| archivo no encontrado | archivo no encontrado | archivo no encontrado |

- **Rutas montadas:**
| Prefijo | Archivo | Métodos disponibles |
|---------|---------|---------------------|
| archivo no encontrado | archivo no encontrado | archivo no encontrado |

### 6. Inconsistencias front ↔ backend
| Endpoint en frontend | Existe en backend | Acción requerida |
|---|---|---|
| `POST /auth/login` | No (archivo no encontrado) | Crear servidor y definir ruta de inicio de sesión con validación JWT |
| `POST /auth/register` | No (archivo no encontrado) | Crear servidor y definir ruta de registro y recepción de imágenes de DNI |
| `POST /auth/logout` | No (archivo no encontrado) | Crear servidor y definir ruta de invalidación de token |
| `POST /auth/forgot-password` | No (archivo no encontrado) | Crear servidor y definir ruta de envío de email de recuperación |
| `POST /auth/verify-code` | No (archivo no encontrado) | Crear servidor y definir ruta para contrastar código OTP |
| `POST /auth/reset-password` | No (archivo no encontrado) | Crear servidor y definir ruta para guardar nueva contraseña |
| `GET /users/me` | No (archivo no encontrado) | Crear servidor y definir ruta para consultar perfil del usuario autenticado |
| `GET /users/me/bids` | No (archivo no encontrado) | Crear servidor y definir ruta para historial de ofertas personales |
| `GET /users/me/auctions` | No (archivo no encontrado) | Crear servidor y definir ruta para listado de subastas creadas por el usuario |
| `GET /auctions` | No (archivo no encontrado) | Crear servidor y definir ruta para consulta general y filtros de subastas |
| `GET /auctions/:id` | No (archivo no encontrado) | Crear servidor y definir ruta para consulta del artículo por ID |
| `POST /auctions/upload-images` | No (archivo no encontrado) | Crear servidor y definir ruta de carga de archivos a almacenamiento Cloudinary |
| `GET /auctions/search/suggestions` | No (archivo no encontrado) | Crear servidor y definir ruta de autocompletado en búsquedas |
| `GET /auctions/calendar` | No (archivo no encontrado) | Crear servidor y definir ruta de consulta de eventos de calendario de subastas |
| `GET /auctions/:id/status` | No (archivo no encontrado) | Crear servidor y definir ruta de estado en vivo de subasta |
| `GET /auctions/:id/share-link` | No (archivo no encontrado) | Crear servidor y definir ruta de generación de links |
| `POST /bids` | No (archivo no encontrado) | Crear servidor y definir ruta para envío de pujas |
| `GET /chats` | No (archivo no encontrado) | Crear servidor y definir ruta para salas de chat activas |
| `GET /chats/:id/messages` | No (archivo no encontrado) | Crear servidor y definir ruta para envío y recepción de mensajes de chat |
| `GET /notifications` | No (archivo no encontrado) | Crear servidor y definir ruta para notificaciones push/in-app |
| `PATCH /notifications/:id/read` | No (archivo no encontrado) | Crear servidor y definir ruta para actualizar estado de lectura de notificaciones |
| `GET /settings` | No (archivo no encontrado) | Crear servidor y definir ruta para configuraciones globales del usuario |
| `GET/POST /settings/payment-methods` | No (archivo no encontrado) | Crear servidor y definir ruta para administración de medios de pago |
| `GET/DELETE /settings/payment-methods/:id` | No (archivo no encontrado) | Crear servidor y definir ruta para operaciones específicas sobre medios de pago |
| `GET /help/faq` | No (archivo no encontrado) | Crear servidor y definir ruta para descarga dinámica de FAQS |

### 7. Pendientes Avance 03
- Integrar la base de datos y endpoints en el backend debido a la inexistencia de la carpeta `backend/`.
- Conectar los botones de menú `Metodos de Pago` y `Cargar producto` en `HomeAuthenticatedScreen.js` que actualmente poseen `nav: null`.
- Conectar la opción `Cerrar sesion` del Drawer en `HomeAuthenticatedScreen.js` que posee `nav: null`.
- Reemplazar las notificaciones de ejemplo en `HomeAuthenticatedScreen.js` que están definidas como un arreglo vacío (`NOTIFICATIONS = []`).
- Reemplazar los datos mock locales (`MOCK_STATS` y `MOCK_HISTORIAL`) en `InformacionScreen.js` por llamadas reales a la API.
- Habilitar e implementar navegación real en `InformacionScreen.js` reemplazando los logs y rutas comentadas de `'MisArticulos'` y `'DetallePuja'`.
- Conectar botones inactivos en `ConfiguracionScreen.js` que ejecutan únicamente llamadas a `console.log()` al presionar "Editar perfil", "Métodos de pago", "Mis subastas", "Moneda", "Idioma", "Privacidad" y "Ayuda".
- Enlazar la confirmación real en backend para "Cerrar sesión" y "Eliminar cuenta" en `ConfiguracionScreen.js` (actualmente simulados con alertas e impresión en consola).
- Reemplazar la simulación de números aleatorios con `Math.random()` en `EstadisticasCharts.js` (`fetchEvolucionMock`, `fetchDistribucionMock`) por datos reales del servidor.
- Desactivar la variable temporal `DEV_FORCE_LOGIN = true` de `AppNavigator.js` para habilitar el flujo condicional real.
- Completar la implementación de las pantallas que persisten como stubs con placeholders de texto simple: `SearchScreen.js`, `ChatsScreen.js`, `ProfileScreen.js` y `ForgotPasswordScreen.js`.
