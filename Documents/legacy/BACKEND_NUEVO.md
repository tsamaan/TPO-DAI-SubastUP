# Snapshot del Backend: Auditoría Técnica

### 1. RESUMEN
Se auditaron 25 archivos del backend y el schema.prisma. Se detectaron 9 rutas con 39 endpoints operando sobre 29 modelos (6 modelos de autenticación, 4 de pagos, 3 de notificaciones, 2 de chat, entre otros nuevos). **No hay implementación de sockets (Socket.io) ni en rutas ni en server.js**, el chat y pujas actualmente operan vía HTTP REST tradicional (idealmente usando polling o en proceso de migrar a realtime). Existen funciones "STUB PROVISORIO" como en `notificacionesController.js` a ser revisadas.

### 2. MODELOS DE BASE DE DATOS
| Modelo | Nuevo/Existente | Campos clave | Relaciones |
|--------|-----------------|--------------|------------|
| `Paises`, `Personas`, `Empleados`, `Sectores`, `Seguros`, `Subastadores`, `Clientes`, `Duenios`, `Subastas`, `Productos`, `Fotos`, `Devoluciones`, `Catalogos`, `ItemsCatalogo`, `Asistentes`, `Pujos`, `RegistroDeSubasta` | Existente (ampliado) | identificador, varios... | Multiples |
| `Registros` | Nuevo (Auth) | persona, email, estado, rol, categoria | Personas, Logins, FotosDNI |
| `Logins` | Nuevo (Auth) | registro, passwordHash, intentosFallidos | Registros |
| `FotosDNI` | Nuevo (Auth) | registro, tipo, foto | Registros |
| `MetodosPago` | Nuevo (Pagos) | persona, tipo, activo, verificado | Personas, Tarjetas, CuentasBancarias, Cheques |
| `Tarjetas` | Nuevo (Pagos) | numeroTarjeta, codigoSeguridad, etc | MetodosPago |
| `CuentasBancarias` | Nuevo (Pagos) | cbu, alias, titular | MetodosPago |
| `Cheques` | Nuevo (Pagos) | nombreBanco, fechaPago, numeroCheque | MetodosPago |
| `Notificaciones` | Nuevo (Notif) | persona, titulo, mensaje, tipo, leido | Personas |
| `PushTokens` | Nuevo (Notif) | persona, token, activo | Personas |
| `SuscripcionesSubasta` | Nuevo (Notif) | persona, subasta | Personas, Subastas |
| `Conversaciones` | Nuevo (Chat) | producto, duenio, empleado, estado | Productos, Mensajes |
| `Mensajes` | Nuevo (Chat) | conversacion, emisor, texto, imagen, leido | Conversaciones |

*(Nota: Conversaciones y Mensajes son los modelos directamente vinculados a Chats/Soporte)*

### 3. ENDPOINTS

| Método | Ruta | Controller.función | Auth requerida | Descripción |
|--------|------|--------------------|----------------|-------------|
| POST | `/api/auth/login` | `login` | No | Inicia sesión y devuelve JWT |
| POST | `/api/auth/register` | `register` | No | Crea usuario en BD (pendiente) |
| POST | `/api/auth/forgot-password` | `forgotPassword` | No | Envía correo con código |
| POST | `/api/auth/verify-code` | `verifyCode` | No | Valida código de reset |
| POST | `/api/auth/reset-password` | `resetPassword` | No | Cambia contraseña |
| POST | `/api/auth/validate-user` | `validateUser` | Sí (Admin) | Aprueba/Rechaza cuenta |
| GET | `/api/chat/sin-leer` | `contadorSinLeer` | Sí | Cuenta mensajes no leídos |
| GET | `/api/chat/` | `listarConversaciones` | Sí | Lista chats del usuario |
| GET | `/api/chat/:conversacionId` | `getMensajes` | Sí | Obtiene mensajes de un chat |
| POST | `/api/chat/:conversacionId/mensaje`| `enviarMensaje` | Sí | Envía un mensaje (con texto/img) |
| POST | `/api/chat/crear/:productoId` | `crearConversacion` | Sí (Revisor) | Crea un chat con el dueño |
| GET | `/api/estadisticas/` | `getEstadisticas` | Sí | Resumen de métricas del usuario |
| GET | `/api/estadisticas/evolucion` | `getEvolucion` | Sí | Datos gráficos para chart |
| GET | `/api/estadisticas/historial` | `getHistorialPujas` | Sí | Historial de subastas pujadas |
| POST | `/api/notificaciones/token` | `guardarToken` | Sí | Registra token push del user |
| GET | `/api/notificaciones/` | `listarNotificaciones` | Sí | Lista de notifs del usuario |
| GET | `/api/notificaciones/sin-leer` | `contadorSinLeer` | Sí | Número de notifs no leídas |
| PUT | `/api/notificaciones/leer-todas`| `marcarTodasLeidas` | Sí | Marca todas como leídas |
| PUT | `/api/notificaciones/:id/leer` | `marcarLeida` | Sí | Marca notif. específica leída |
| POST | `/api/notificaciones/suscribir/:subastaId`| `suscribirSubasta` | Sí | Suscribirse a una subasta |
| DELETE| `/api/notificaciones/suscribir/:subastaId`| `cancelarSuscripcion` | Sí | Cancelar suscripción a subasta |
| GET | `/api/pagos/` | `listarMetodos` | Sí | Lista medios de pago del user |
| POST | `/api/pagos/tarjeta` | `agregarTarjeta` | Sí | Agrega método TC |
| POST | `/api/pagos/banco` | `agregarBanco` | Sí | Agrega método Banco (CBU) |
| POST | `/api/pagos/cheque` | `agregarCheque` | Sí | Agrega método Cheque |
| DELETE| `/api/pagos/:id` | `eliminarMetodo` | Sí | Borrado lógico (activo=false) |
| GET | `/api/pagos/pendientes-verificacion`| `metodosPendientesVerificacion`| Sí (Revisor) | Medios sin verificar |
| PUT | `/api/pagos/:id/verificar` | `verificarMetodo` | Sí (Revisor) | Aprueba medio de pago |
| GET | `/api/perfil/` | `getPerfil` | Sí | Datos del usuario actual |
| PUT | `/api/perfil/` | `editarPerfil` | Sí | Modifica datos/password/foto |
| POST | `/api/productos/` | `cargarProducto` | Sí | Dueño carga producto |
| GET | `/api/productos/mis-productos` | `misProductos` | Sí | Productos de un dueño |
| GET | `/api/productos/mis-articulos-en-subastas`| `misArticulosEnSubastas`| Sí | Productos ya confirmados |
| GET | `/api/productos/:id` | `detalleProducto` | Sí | Detalle producto para el dueño|
| DELETE| `/api/productos/:id` | `eliminarProducto` | Sí | Elimina solo si 'pendiente' |
| POST | `/api/productos/:id/responder` | `responderPropuesta` | Sí | Usuario acepta/rechaza oferta |
| GET | `/api/productos/revision/pendientes`| `productosPendientes` | Sí (Revisor) | Prod. en estado 'pendiente' |
| PUT | `/api/productos/:id/aprobar` | `aprobarProducto` | Sí (Revisor) | Pasa a esperando_usuario |
| PUT | `/api/productos/:id/rechazar` | `rechazarProducto` | Sí (Revisor) | Pasa a rechazado |
| GET | `/api/pujas/:itemId` | `getEstadoPuja` | No | Estado, puja max, tiempo |
| POST | `/api/pujas/:itemId` | `pujar` | Sí | Ejecuta transacción de puja |
| GET | `/api/subastas/buscar` | `buscarSubastas` | No | Busca en todos los prod. |
| GET | `/api/subastas/calendario` | `calendario` | No | Fechas de mes con subastas |
| GET | `/api/subastas/del-dia` | `subastasDia` | No | Subastas del día indicado |
| GET | `/api/subastas/especiales` | `subastasEspeciales` | No | Últimas top categories |
| GET | `/api/subastas/comunes` | `subastasComunes` | No | Últimas categoría común |
| GET | `/api/subastas/:subastaId/detalle` | `detalleSubasta` | No | Items y data de la subasta |
| GET | `/api/subastas/item/:itemId/link` | `linkStream` | No | URL de stream |

### 4. SOCKETS
No se encontraron configuraciones ni eventos de WebSockets ni de `Socket.io` en el servidor (`server.js`) ni en la estructura de carpetas. Actualmente, el flujo de pujas se resolvió con polling desde el front y bloqueos for-update a nivel de SQL.

### 5. DEPENDENCIAS NUEVAS
No existen dependencias de terceros nuevas en el package.json que no estuvieran previamente (el archivo solo contiene los módulos base `express`, `@prisma/client`, `bcryptjs`, `jsonwebtoken`, `nodemailer`, `dotenv`, `cors`, `multer`, `express-validator`).

### 6. VARIABLES DE ENTORNO NUEVAS
Se detectó uso de `NODE_ENV` dentro de `backend/config/prisma.js` para diferenciar el comportamiento del logger en desarrollo frente a producción. Todas las demás variables (`JWT_SECRET`, `DATABASE_URL`, etc.) ya estaban listadas.

### 7. COMPARACIÓN CON FRONTEND

| ENDPOINT (constants/api.js) | Implementado en backend | Notas |
|-----------------------------|-------------------------|-------|
| `/api/auth/login` | Sí | Directo |
| `/api/auth/register` | Sí | Directo |
| `/api/auth/forgot-password` | Sí | Directo |
| `/api/auth/verify-code` | Sí | Directo |
| `/api/auth/reset-password` | Sí | Directo |
| `/api/auth/validate-user` | Sí | Directo |
| `/auth/logout` | No | Innecesario, JWT es stateless (se borra en front) |
| `/users/me` | Sí (con otro nombre) | Es `/api/perfil/` |
| `/users/me/bids` | Sí (con otro nombre) | Es `/api/estadisticas/historial` |
| `/users/me/auctions` | Sí (con otro nombre) | Es `/api/productos/mis-productos` |
| `/auctions` | Sí (con otro nombre) | Varias rutas en `/api/subastas/` |
| `/auctions/${id}` | Sí (con otro nombre) | Es `/api/subastas/${id}/detalle` |
| `/auctions/upload-images` | Sí (integrado) | El upload es base64 en `/api/productos/` (POST) |
| `/auctions/search/suggestions`| No exacto | Se usa `/api/subastas/buscar?q=` |
| `/auctions/calendar` | Sí (con otro nombre) | Es `/api/subastas/calendario` |
| `/auctions/${id}/status` | Sí (con otro nombre) | Es `/api/pujas/${itemId}` |
| `/auctions/${id}/share-link`| Sí (con otro nombre) | Es `/api/subastas/item/${itemId}/link` |
| `/bids` | Sí (con otro nombre) | Es `/api/pujas` |
| `/api/chats` | Sí (con otro nombre) | Es `/api/chat` |
| `/api/chats/${id}` | Sí (con otro nombre) | Es `/api/chat/${id}` (GET `getMensajes`) |
| `/api/chats/${id}/mensajes` | No exacto | Es `/api/chat/${id}/mensaje` (POST) y GET arriba |
| `/notifications` | Sí (con otro nombre) | Es `/api/notificaciones` |
| `/notifications/${id}/read` | Sí (con otro nombre) | Es `/api/notificaciones/${id}/leer` |
| `/settings` | No | Perfil se usa para ajustes |
| `/settings/payment-methods` | Sí (con otro nombre) | Es `/api/pagos` |
| `/settings/payment-methods/${id}` | Sí (con otro nombre) | Es `/api/pagos/${id}` |
| `/help/faq` | No | No hay controlador ni DB para FAQ |

### 8. PENDIENTES DETECTADOS
1. **Sockets Realtime Faltantes**: Todo el módulo de pujas (pujasController.js) funciona con peticiones HTTP/Transacciones a base de datos para simular tiempo real, obligando al frontend a hacer polling continuo en lugar de usar WebSockets reales.
2. **Notificaciones Dummy**: En `notificacionesController.js` existe un comentario de Valentín alertando que el archivo es un stub provisorio que crea la notificación ignorando el campo `data` (ej: id de conversación/subasta) ya que el modelo DB real (`Notificaciones`) no tiene columna JSON o campo para este fin.
3. **Rol `admin`/`revisor`**: Actualmente las validaciones confían ciegamente en el string dentro del payload del JWT en el middleware. Para algunas acciones muy críticas la verificación real sobre base de datos aportaría solidez ante manipulaciones de estado de usuario.
