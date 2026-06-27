# API REST — SubastUP Backend

Referencia de todos los endpoints HTTP del backend (`backend/`, Node + Express + Prisma + PostgreSQL).

- **Base URL local:** `http://localhost:3001` (o `http://<IP-de-tu-PC>:3001` desde el celular).
- **Formato:** JSON en request y response. Las imágenes viajan como `base64` dentro del JSON.
- **Autenticación:** JWT en el header `Authorization: Bearer <token>`. El middleware `auth` (`backend/middleware/auth.js`) verifica el token y deja en `req.user` el payload: `{ registroId, personaId, email, rol, categoria, iat, exp }`.
- **Roles:** `usuario` (default), `revisor` y `admin`. Varios endpoints de back-office exigen rol `admin` o `revisor` (se valida dentro del controlador).
- **Errores comunes:** `401` token faltante/inválido, `403` sin permisos, `404` no encontrado, `400` datos inválidos, `409` conflicto (duplicado).

> Los routers se montan en `backend/server.js`. `routes/perfil.js` y `routes/estadisticas.js` existen pero **no están montados**: el perfil y las estadísticas se sirven por `/api/users/me*`.

> 📮 **Postman:** importá [`SubastUP.postman_collection.json`](SubastUP.postman_collection.json) (65 requests). Corré *Auth → Login* y el token queda guardado solo para el resto de las llamadas.

## Índice por área

| Área | Prefijo | Router |
| --- | --- | --- |
| Autenticación | `/api/auth` | `routes/auth.js` |
| Perfil y estadísticas | `/api/users` | `routes/users.js` |
| Subastas | `/api/auctions` | `routes/subastas.js` |
| Productos (ciclo de vida del bien) | `/api/products` | `routes/productos.js` |
| Pujas | `/api/bids` | `routes/pujas.js` |
| Chat | `/api/chats` | `routes/chat.js` |
| Notificaciones | `/api/notifications` | `routes/notificaciones.js` |
| Métodos de pago | `/api/settings/payment-methods` | `routes/pagos.js` |
| Configuración | `/api/settings` | `routes/settings.js` |
| Ayuda | `/api/help` | `routes/help.js` |
| Desarrollo / Demo | `/api/dev` | `routes/dev.js` |
| Health check | `/health` | `server.js` |

---

## /api/auth — Autenticación (`authController`)

### POST /api/auth/login
- **Auth:** público
- **Descripción:** Inicia sesión y devuelve un JWT.
- **Request:** body `email`, `password`.
- **Respuesta:** `{ ok, message, token, usuario: { registroId, personaId, nombre, documento, email, rol, categoria } }`.
- **Errores:** `400` faltan email/password; `401` credenciales incorrectas o sin login; `403` cuenta no aprobada (pendiente/rechazada), persona deshabilitada, o cuenta bloqueada por intentos fallidos (se bloquea a los 5 intentos).

### POST /api/auth/register
- **Auth:** público
- **Descripción:** Registra una nueva solicitud de cuenta (queda en estado `pendiente`).
- **Request:** body `nombre`, `apellido`, `dni`, `telefono`, `email`, `password`, `direccion`, `numero`, `ciudad`, `codigoPostal`, `pais`, `foto1Base64?`, `foto2Base64?`.
- **Respuesta:** `201 { ok, message, registroId }`.
- **Errores:** `400` faltan datos, email inválido o password < 6 caracteres; `409` email o DNI ya existentes.

### POST /api/auth/forgot-password
- **Auth:** público
- **Descripción:** Genera y envía por mail un código de verificación para resetear la contraseña.
- **Request:** body `email`.
- **Respuesta:** `{ ok, message }` (mensaje genérico por seguridad, exista o no el email).
- **Errores:** `400` falta email.

### POST /api/auth/verify-code
- **Auth:** público
- **Descripción:** Verifica el código y devuelve un `resetToken` de un solo uso (10 min).
- **Request:** body `email`, `code`.
- **Respuesta:** `{ ok, message, resetToken }`.
- **Errores:** `400` faltan email/code, código inválido o expirado.

### POST /api/auth/reset-password
- **Auth:** público (requiere `resetToken` válido en el body)
- **Descripción:** Establece la nueva contraseña usando el `resetToken`.
- **Request:** body `resetToken`, `newPassword`, `confirmPassword`.
- **Respuesta:** `{ ok, message }`.
- **Errores:** `400` faltan campos, contraseñas no coinciden, password < 6, token expirado/inválido.

### POST /api/auth/validate-user
- **Auth:** Bearer + rol `admin` o `revisor`
- **Descripción:** Aprueba o rechaza una solicitud de registro. **Al aprobar provisiona las identidades de dominio** (`clientes` + `duenios`) en una transacción.
- **Request:** body `registroId`, `aprobar` (boolean), `motivoRechazo?`.
- **Respuesta:** `{ ok, message, estado }` (`estado`: `aprobado` | `rechazado`).
- **Errores:** `403` rol no autorizado; `400` faltan `registroId`/`aprobar`.

### PUT /api/auth/asignar-categoria
- **Auth:** Bearer + rol `admin` o `revisor`
- **Descripción:** Asigna la categoría de un usuario.
- **Request:** body `registroId`, `categoria` (`comun` | `especial` | `plata` | `oro` | `platino`).
- **Respuesta:** `{ ok, message, categoria }`.
- **Errores:** `403` rol no autorizado; `400` faltan campos o categoría inválida.

### GET /api/auth/pendientes
- **Auth:** Bearer + rol `admin` o `revisor`
- **Descripción:** Lista las solicitudes de registro en estado `pendiente`.
- **Respuesta:** `{ ok, usuarios: [{ registroId, nombre, email, documento, fechaRegistro }] }`.
- **Errores:** `403` rol no autorizado.

### POST /api/auth/logout
- **Auth:** Bearer
- **Descripción:** Cierra sesión (nominal; el cliente descarta el token).
- **Respuesta:** `{ ok, message }`.

---

## /api/users — Perfil y estadísticas (`perfilController`, `estadisticasController`, `productosController`)

Todas requieren **Bearer token** (`router.use(auth)`).

### GET /api/users/me
- **Descripción:** Perfil del usuario logueado.
- **Respuesta:** `{ ok, perfil: { personaId, registroId, nombre, documento, telefono, direccion, email, rol, foto, fechaRegistro } }`.
- **Errores:** `404` usuario no encontrado.

### PUT /api/users/me
- **Descripción:** Edita el perfil (datos, contraseña, foto).
- **Request:** body `nombre?`, `telefono?`, `direccion?`, `documento?`, `email?`, `passwordActual?`, `nuevaPassword?`, `fotoBase64?`.
- **Respuesta:** `{ ok, message }`.
- **Errores:** `404` no encontrado; `409` email/documento en uso; `400` falta `passwordActual` o nueva password < 6; `401` contraseña actual incorrecta.

### GET /api/users/me/bids
- **Descripción:** Historial de pujas del usuario.
- **Respuesta:** `{ ok, historial: [{ pujaId, nombre, importe, resultado: 'ganada'|'superada'|'en_curso', portada }] }`.

### GET /api/users/me/stats
- **Descripción:** Resumen de estadísticas de pujas.
- **Respuesta:** `{ ok, estadisticas: { subastasPerdidas, subastasGanadas, pujasRealizadas, totalGastado, distribucion: { ganadas, perdidas, total, porcentaje } } }`.

### GET /api/users/me/stats/evolution
- **Descripción:** Serie para el gráfico de evolución (gasto o cantidad de pujas).
- **Request:** query `tipo` (`gasto`|`pujas`, default `gasto`), `rango` (`semana`|`anio`, default `semana`).
- **Respuesta:** `{ ok, tipo, rango, serie: [{ label, valor }], ultimoPeriodo }`.

### GET /api/users/me/auctions
- **Descripción:** Todos los productos cargados por el usuario (`misProductos`).
- **Respuesta:** `{ ok, productos: [{ identificador, productoId, nombre, estado, fecha, descripcionCompleta, motivoRechazo, direccionEnvio, descripcionCatalogo, portada, propuesta: {...} | null }] }`.

### GET /api/users/me/auctions/confirmed
- **Descripción:** Productos del usuario ya confirmados / en subasta (`misArticulosEnSubastas`).
- **Respuesta:** `{ ok, articulos: [{ productoId, itemId, subastaId, estadoSubasta, categoriaSubasta, nombre, descripcionCompleta, portada, precioBase, comision, moneda, fechaSubasta, horaSubasta, lugarSubasta, subastado }] }`.

---

## /api/auctions — Subastas (`subastasController`, `productosController`)

### GET /api/auctions
- **Auth:** público
- **Descripción:** Lista subastas visibles; si llega `search` (≥2 chars) delega en la búsqueda.
- **Request:** query `category?`, `search?`, `status?`, `tipo?` (`especial`), `currency?`, `page?`, `size?`.
- **Respuesta:** `{ ok, subastas: [{ subastaId, itemId, productoId, fecha, hora, ubicacion, categoria, estado, cerrado, nombreArticulo, descripcionArticulo, moneda, precioBase, portada }] }`. Con búsqueda: `{ ok, resultados: [...] }`.

### GET /api/auctions/calendar
- **Auth:** público
- **Descripción:** Días del mes con subastas + las subastas de ese mes.
- **Request:** query `mes`/`month`, `anio`/`year` (default: mes/año actual).
- **Respuesta:** `{ ok, dias: [int], subastas: [<subasta>] }`.

### GET /api/auctions/today
- **Auth:** público
- **Descripción:** Subastas de un día específico.
- **Request:** query `fecha` (requerida).
- **Respuesta:** `{ ok, subastas: [<subasta>] }`.
- **Errores:** `400` falta `fecha`.

### GET /api/auctions/search/suggestions
- **Auth:** público
- **Descripción:** Sugerencias de búsqueda por nombre de producto.
- **Request:** query `q`/`search` (mín. 2 chars).
- **Respuesta:** `{ ok, suggestions: [{ productoId, nombre }] }`.

### POST /api/auctions/upload-images
- **Auth:** Bearer
- **Descripción:** Valida imágenes base64 (compatibilidad; no persiste, la persistencia ocurre al crear el producto).
- **Request:** body `fotos[]` o `fotosBase64[]`.
- **Respuesta:** `{ ok, message, cantidad }`.
- **Errores:** `400` sin imágenes o más de 12.

### GET /api/auctions/:id
- **Auth:** público
- **Descripción:** Detalle de una subasta con sus artículos.
- **Respuesta:** `{ ok, subasta: { subastaId, fecha, hora, ubicacion, categoria, estado, articulos: [{ itemId, productoId, nombre, precioBase, moneda }] } }`.
- **Errores:** `404` no encontrada.

### GET /api/auctions/:id/share-link
- **Auth:** público
- **Descripción:** Link de stream del ítem.
- **Respuesta:** `{ ok, linkStream }`.
- **Errores:** `404` ítem sin link. *(Nota: el controlador lee `req.params.itemId` pero la ruta declara `:id` — ver bug conocido en `CAMBIOS`/`TODO`.)*

### POST /api/auctions/
- **Auth:** Bearer (debe ser dueño)
- **Descripción:** Carga un producto nuevo (`cargarProducto`).
- **Request:** body `nombre`, `descripcionCompleta`, `fotosBase64[]` o `fotos[]`.
- **Respuesta:** `201 { ok, message, productoId, conversacionId }`.
- **Errores:** `400` faltan datos/fotos o base64 inválido; `403` la persona no es dueño; `503` sin revisor técnico configurado.

### PATCH /api/auctions/:id/status
- **Auth:** Bearer (dueño del producto)
- **Descripción:** El dueño responde la propuesta del revisor (`responderPropuesta`).
- **Request:** path `:id` (productoId); body `action` (`ACCEPT`|`REJECT`), `reason?`.
- **Respuesta:** `{ ok, message }`.
- **Errores:** `400` action inválida; `404` sin propuesta pendiente.

---

## /api/products — Productos (`productosController`)

Todas requieren **Bearer token**.

### POST /api/products/
- **Descripción:** Carga un producto nuevo (igual que `POST /api/auctions/`).
- **Request:** body `nombre`, `descripcionCompleta`, `fotosBase64[]` o `fotos[]`.
- **Respuesta:** `201 { ok, message, productoId, conversacionId }`.

### GET /api/products/mine
- **Descripción:** Productos del usuario (`misProductos`). Mismo shape que `GET /api/users/me/auctions`.

### GET /api/products/mine/confirmed
- **Descripción:** Productos confirmados (`misArticulosEnSubastas`). Mismo shape que `GET /api/users/me/auctions/confirmed`.

### GET /api/products/pending-review
- **Auth:** Bearer + rol `revisor`/`admin`
- **Descripción:** Productos pendientes de revisión.
- **Respuesta:** `{ ok, productos: [{ productoId, nombre, descripcionCompleta, estado, fecha, nombreDuenio, emailDuenio, cantidadFotos }] }`.
- **Errores:** `403` rol no autorizado.

### GET /api/products
- **Auth:** Bearer + rol `revisor`/`admin`
- **Descripción:** Lista todos los productos para el WebAdmin. Acepta filtro opcional por estado y devuelve la misma estructura enriquecida que usa la pestaña **Bienes**.
- **Request:** query `estado?` (`pendiente`, `en_inspeccion`, `esperando_usuario`, `confirmado`, `rechazado`, `devuelto`, etc.).
- **Respuesta:** `{ ok, productos: [{ productoId, nombre, descripcionCompleta, estado, motivoRechazo, fecha, nombreDuenio, emailDuenio, cantidadFotos, propuesta }] }`.
- **Errores:** `403` rol no autorizado.

### PUT /api/products/:id/status
- **Auth:** Bearer + rol `revisor`/`admin`
- **Descripción:** Cambia estados intermedios del producto desde WebAdmin y notifica al dueño.
- **Request:** path `:id`; body `estado` (`pendiente` | `en_inspeccion`).
- **Respuesta:** `{ ok, message, estado }`.
- **Errores:** `400` estado inválido; `403` rol no autorizado; `404` producto no encontrado.

### PUT /api/products/:id/respond
- **Auth:** Bearer (dueño)
- **Descripción:** El dueño acepta/rechaza la propuesta.
- **Request:** path `:id`; body `action` (`ACCEPT`|`REJECT`), `reason?`.
- **Respuesta:** `{ ok, message }`.

### PUT /api/products/:id/approve
- **Auth:** Bearer + rol `revisor`/`admin` (además debe ser empleado)
- **Descripción:** Aprueba el producto y genera la propuesta al usuario.
- **Request:** path `:id`; body `precioBase`, `comision`, `fechaSubasta`, `horaSubasta`, `lugarSubasta`, `catalogoId`, `direccionEnvio?`.
- **Respuesta:** `{ ok, message }`.
- **Errores:** `403` rol no autorizado o no es empleado; `400` faltan datos; `404` no encontrado.

### PUT /api/products/:id/reject
- **Auth:** Bearer + rol `revisor`/`admin`
- **Descripción:** Rechaza el producto, registra la devolución e informa al usuario.
- **Request:** path `:id`; body `motivo`, `cargo?`.
- **Respuesta:** `{ ok, message }`.
- **Errores:** `403` rol no autorizado; `400` falta `motivo`; `404` no encontrado.

### GET /api/products/:id
- **Auth:** Bearer (dueño)
- **Descripción:** Detalle de un producto del usuario.
- **Respuesta:** `{ ok, producto: { identificador, nombre, estado, textoEstado, fecha, descripcionCompleta, descripcionCatalogo, motivoRechazo, direccionEnvio, fotos: [...], propuesta: {...} | null } }`.

### DELETE /api/products/:id
- **Auth:** Bearer (dueño)
- **Descripción:** Elimina un producto (solo si está en estado `pendiente`).
- **Respuesta:** `{ ok, message }`.
- **Errores:** `404` no encontrado; `400` no está pendiente.

---

## /api/bids — Pujas (`pujasController`)

### GET /api/bids/:itemId/status
- **Auth:** público
- **Descripción:** Estado de la puja de un ítem (puja actual, timer, límites). Cierra automáticamente el ítem si el timer expiró con pujas.
- **Respuesta (en curso):** `{ ok, cerrado: false, itemId, nombre, descripcion, duenioId, moneda, categoria, precioBase, pujaActual, minimoSiguiente, maximoSiguiente, sinLimite, tiempoRestante, ultimaPujaAt, fotos: [...] }`.
- **Respuesta (cerrado):** `{ ok, cerrado: true, message, pujaActual, moneda, ganadorId, categoria, ultimaPujaAt }` (al cerrar por timer agrega `ganador`, `conversacionId`).
- **Errores:** `404` ítem no encontrado.

### POST /api/bids/
- **Auth:** Bearer
- **Descripción:** Registra una nueva puja (con bloqueo de fila `SELECT ... FOR UPDATE` y validaciones de negocio).
- **Request:** body `auctionId` (itemId), `amount` (importe).
- **Respuesta:** `201 { ok, message, importeNuevo, tiempoRestante, ultimaPujaAt }`.
- **Errores:** `400` importe inválido, subasta finalizada/no activa, timer expirado, fuera de límites, o ya tenés la puja más alta; `403` el dueño no puede pujar (`DUENIO_NO_PUEDE_PUJAR`), categoría insuficiente (`CATEGORIA_INSUFICIENTE`) o sin medio de pago verificado (`METODO_PAGO_REQUERIDO`); `404` ítem no encontrado; `409` ya participás en otra subasta activa. Los errores de negocio incluyen `codigo` y a veces `minimo`/`maximo`.

---

## /api/chats — Chat (`chatController`)

Todas requieren **Bearer token**.

### GET /api/chats/unread-count
- **Descripción:** Mensajes no leídos del usuario.
- **Respuesta:** `{ ok, cantidad }`.

### GET /api/chats/
- **Descripción:** Conversaciones del usuario (como dueño o empleado).
- **Respuesta:** `{ ok, conversaciones: [{ conversacionId, productoId, nombreProducto, portada, estado, ultimoMensaje, ultimaFecha, sinLeer }] }`.

### GET /api/chats/:chatId/messages
- **Descripción:** Mensajes de una conversación; marca como leídos los ajenos.
- **Respuesta:** `{ ok, conversacion: { id, nombreProducto, estado }, mensajes: [{ mensajeId, texto, imagen, fecha, esMio, leido }] }`.
- **Errores:** `404` conversación no encontrada o no pertenecés a ella.

### POST /api/chats/:chatId/messages
- **Descripción:** Envía un mensaje en una conversación activa.
- **Request:** path `:chatId`; body `texto?`, `imagenBase64?` (al menos uno).
- **Respuesta:** `201 { ok, message, mensajeId, fecha }`.
- **Errores:** `400` falta texto e imagen; `404` conversación no encontrada o cerrada.

### POST /api/chats/create/:productId
- **Auth:** Bearer + rol `revisor`/`admin`
- **Descripción:** Crea una conversación con el dueño del producto y manda el primer mensaje.
- **Request:** path `:productId`; body `texto`.
- **Respuesta:** `201 { ok, message, conversacionId }`.
- **Errores:** `403` rol no autorizado; `400` falta `texto`; `404` producto no encontrado; `409` ya existe conversación (devuelve `conversacionId`).

---

## /api/notifications — Notificaciones (`notificacionesController`)

Todas requieren **Bearer token**.

| Método | Ruta | Descripción | Respuesta |
| --- | --- | --- | --- |
| POST | `/push-token` | Guarda el push token del dispositivo (body `token`) | `{ ok, message }` |
| GET | `/` | Últimas 50 notificaciones | `{ ok, notificaciones: [...] }` |
| GET | `/unread-count` | Contador de no leídas | `{ ok, total }` |
| PATCH | `/read-all` | Marca todas como leídas | `{ ok, message }` |
| PATCH | `/:id/read` | Marca una como leída | `{ ok, message }` (`404` si no existe) |
| POST | `/subscribe/:auctionId` | Suscribe (recordatorio) a una subasta → **campanita** | `201 { ok, message }` (`200` si ya estaba) |
| DELETE | `/subscribe/:auctionId` | Cancela la suscripción | `{ ok, message }` (`404` si no estaba) |
| DELETE | `/:id` | Elimina una notificación | `{ ok, message }` (`404` si no existe) |

---

## /api/settings/payment-methods — Métodos de pago (`pagosController`)

Todas requieren **Bearer token**.

### GET /api/settings/payment-methods/
- **Descripción:** Métodos de pago activos del usuario.
- **Respuesta:** `{ ok, metodos: [...] }`. Base `{ id, tipo, verificado, fechaCreacion }`; según tipo agrega campos de tarjeta / banco / cheque.

### POST /api/settings/payment-methods/
- **Descripción:** Agrega un método genérico; despacha por `tipo`.
- **Request:** body `tipo` (`tarjeta`|`banco`|`cheque`) + campos del tipo.
- **Respuesta:** `201 { ok, message, metodoId }`. `400` tipo inválido.

### POST /api/settings/payment-methods/card
- **Request:** body `titular`, `numeroTarjeta`, `mesVencimiento`, `anioVencimiento`, `codigoSeguridad`, `direccion?`, `codigoPostal?`, `pais?`, `localidad?`.
- **Respuesta:** `201 { ok, message, metodoId }`.

### POST /api/settings/payment-methods/bank
- **Request:** body `cbu`, `alias?`, `titular`.

### POST /api/settings/payment-methods/check
- **Request:** body `nombreBanco`, `fechaPago`, `numeroSucursal?`, `numeroCheque`, `imagen?` (base64).

### DELETE /api/settings/payment-methods/:id
- **Descripción:** Soft delete (marca el método inactivo). `404` si no existe.

### GET /api/settings/payment-methods/pending-verification
- **Auth:** Bearer + rol `revisor`/`admin`
- **Descripción:** Métodos activos sin verificar de todos los usuarios.
- **Respuesta:** `{ ok, metodos: [{ id, tipo, titular, nombreDuenio, documento, fechaCreacion }] }`. `403` rol no autorizado.

### PUT /api/settings/payment-methods/:id/verify
- **Auth:** Bearer + rol `revisor`/`admin`
- **Descripción:** Marca un método como verificado.
- **Respuesta:** `{ ok, message }`. `403` rol no autorizado; `404` no encontrado.

---

## /api/settings — Configuración (handlers inline)

| Método | Ruta | Auth | Descripción | Respuesta |
| --- | --- | --- | --- | --- |
| GET | `/` | público | Configuración por defecto (valores fijos) | `{ ok, settings: { theme: 'LIGHT', preferredCurrency: 'ARS', notificationsEnabled: true } }` |
| PUT | `/` | público | Acepta el guardado (no persiste) | `{ ok, message: 'Settings saved' }` |

> El mount de `/api/settings/payment-methods` está registrado **antes** que `/api/settings`, por lo que tiene prioridad.

---

## /api/help — Ayuda (handler inline)

| Método | Ruta | Auth | Respuesta |
| --- | --- | --- | --- |
| GET | `/faq` | público | `{ ok, faq: [{ id, question, answer }] }` (estático) |

---

## /api/dev — Desarrollo / Demo (`devController`)

Protegidas por clave `DEV_KEY` (no por JWT). La clave va en query `?clave=` o header `x-dev-key`. Default: `subastup-demo`.

### POST /api/dev/reseed
- **Descripción:** Trunca todo y vuelve a cargar los datos de prueba. Ver [`RESEED_Y_DATOS.md`](RESEED_Y_DATOS.md).
- **Request:** query `clave` (o header `x-dev-key`).
- **Respuesta:** `{ ok, message, resumen, cuentas: { staff, demo, otras } }`.
- **Errores:** `403` clave inválida; `500` error al reiniciar (incluye `detalle`).

### GET /api/dev/db
- **Descripción:** Visor de solo lectura: conteos + usuarios + subastas (sin volcar imágenes).
- **Request:** query `clave` (o header `x-dev-key`).
- **Respuesta:** `{ ok, counts, usuarios: [...], subastas: [...] }`.
- **Errores:** `403` clave inválida; `500` error (incluye `detalle`).

---

## /health — Health check (`server.js`)

| Método | Ruta | Auth | Respuesta |
| --- | --- | --- | --- |
| GET | `/health` | público | `{ ok: true, server: 'SubastaAPI', ts: <Date> }` |
