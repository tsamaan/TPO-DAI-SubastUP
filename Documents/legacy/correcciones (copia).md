> Nota de normalizacion (2026-06-26): este documento es historico. Para endpoints vigentes usar `Documents/API_ENDPOINTS.md` y `SubastUp_API_Endpoints_v3_FINAL.xlsx`, que coinciden con `backend/server.js` y `backend/routes/*`.

# Correcciones realizadas

## Auditoría de tablas base de la consigna

- Estado: revisado; no cumple todavía con la restricción de inmutabilidad.
- Fuentes comparadas: `estructurabasica.sql` y `backend/prisma/schema.prisma`.
- Hallazgo: `personas` incorpora `telefono`; `productos` incorpora `nombre`, `estado`, `motivoRechazo` y `direccionEnvio`, y cambia `revisor` de obligatorio a opcional.
- Hallazgo: `itemscatalogo` incorpora `moneda`, fechas, lugar, estado de cierre y otros campos; `pujos` incorpora `fecha`.
- Alcance: no se modificaron `schema.prisma`, migraciones ni la base de datos durante esta auditoría. La conexión a Supabase está inaccesible, por lo que no puede confirmarse el estado físico actual de las tablas remotas.

## Chats: respuesta del endpoint

- Estado: aplicado; pendiente de verificación manual en Expo.
- Archivos: `frontend/src/screens/chat/ChatsScreen.js`.
- Cambio: se normaliza la respuesta de `GET /api/chats` para guardar únicamente arreglos y evitar `chats.filter is not a function`.
- Cambio: se adaptan los campos del contrato de conversaciones (`conversacionId`, `nombreProducto`, `sinLeer`, `ultimaFecha`, `portada`).

## Calendario: respuesta del endpoint

- Estado: aplicado; pendiente de verificación manual.
- Archivo: `frontend/src/screens/tabs/CalendarScreen.js`.
- Cambio: se extrae el arreglo desde `data.dias` para respetar la respuesta `{ ok, dias }` de `GET /api/auctions/calendar`.

## Mi Cuenta: perfil real

- Estado: aplicado; pendiente de verificación manual.
- Archivos: `frontend/src/screens/profile/MiCuentaScreen.js`.
- Cambio: carga el perfil con `GET /api/users/me`, muestra un indicador durante la carga y guarda nombre, teléfono y email con `PUT /api/users/me`.
- Cambio: usa la foto devuelta por el backend y restaura el último perfil real al cancelar la edición.

## Mi Cuenta: documento y contraseña

- Estado: aplicado; pendiente de verificación manual.
- Archivos: `frontend/src/screens/profile/MiCuentaScreen.js`, `backend/controllers/perfilController.js`.
- Cambio: permite modificar documento, validando que no pertenezca a otra persona.
- Cambio: incorpora contraseña actual y nueva contraseña en el formulario; el backend valida ambas antes de actualizar el hash.

## Configuraciones: hero del usuario

- Estado: aplicado; pendiente de verificación manual después de volver a iniciar sesión.
- Archivos: `frontend/src/screens/tabs/ConfiguracionScreen.js`, `frontend/src/store/authStore.js`.
- Cambio: el hero usa `user?.name` y `user?.email` sin textos hardcodeados.
- Cambio: el store conserva el email que devuelve el endpoint de login.

## Métodos de pago: listado, alta y eliminación

- Estado: aplicado; pendiente de verificación manual.
- Archivos: `frontend/src/screens/payments/MetodosDePagoScreen.js`, `frontend/src/screens/payments/AgregarMetodoPagoScreen.js`, `frontend/src/screens/payments/MetodoDePagoDetalleScreen.js`.
- Cambio: el listado consume `GET /api/settings/payment-methods`, muestra carga, estado vacío y errores; se refresca al volver desde alta o detalle.
- Cambio: los formularios de tarjeta, cuenta bancaria y cheque consumen sus endpoints específicos y muestran carga o errores durante el envío; el cheque conserva y envía la imagen capturada en base64.
- Cambio: la eliminación usa `DELETE /api/settings/payment-methods/:id`; al regresar, la lista se vuelve a cargar.

## Historial de pujas: estado vacío

- Estado: aplicado; pendiente de verificación manual.
- Archivo: `frontend/src/screens/tabs/InformacionScreen.js`.
- Cambio: extrae el arreglo desde `data.historial`, mantiene skeletons solo durante la carga y muestra “No tenés pujas registradas todavía.” cuando el usuario no tiene pujas.

## Mis subastas: navegación segura

- Estado: aplicado; pendiente de verificación manual.
- Archivo: `frontend/src/screens/tabs/ConfiguracionScreen.js`.
- Cambio: se reemplazó la navegación a `MisSubastas` —ruta inexistente— por un aviso de funcionalidad próxima, evitando el crash.

## Tus artículos en subasta: navegación segura

- Estado: aplicado; pendiente de verificación manual.
- Archivo: `frontend/src/screens/tabs/InformacionScreen.js`.
- Cambio: se comentó el `console.log` anterior y se muestra un aviso de funcionalidad próxima porque no existe una pantalla registrada para listar los artículos propios.

## Seed demo: usuarios, subastas y pujas

- Estado: creado; pendiente de ejecución con conexión a Supabase.
- Archivo: `backend/prisma/seed_demo.js`.
- Cambio: crea o reutiliza cuatro usuarios demo aprobados, con login y tarjeta verificada.
- Cambio: crea el personal técnico necesario, cuatro subastas activas para la próxima semana, productos aprobados, ítems disponibles y pujas de ejemplo.
- Cambio: cada alta verifica previamente los datos mediante `findFirst`, por lo que el script es idempotente.

## Seed demo: ejecución bloqueada por conectividad

- Estado: revisado; sin cambios en la base de datos.
- Evidencia: `node prisma/seed_demo.js` falló antes de la primera consulta útil con `PrismaClientInitializationError: Can't reach database server` hacia `aws-1-sa-east-1.pooler.supabase.com:6543`.
- Diagnóstico: la URL usa el pooler esperado y `pgbouncer=true`, pero la resolución/conexión de red al host no está disponible y falta declarar `sslmode=require`.
- Acción pendiente: usar hotspot o una red que resuelva el host, agregar `sslmode=require` a las URLs de Supabase y ejecutar nuevamente el seed. No ejecutar `prisma db push` ni migraciones para esta prueba.

## Rediseño de compatibilidad con la consigna

- Estado: autorizado y diferido hasta finalizar las tareas funcionales pendientes.
- Base de datos objetivo: PostgreSQL en Supabase; no se realizará conversión a MySQL.
- Objetivo: conservar sin modificaciones las tablas de `estructurabasica.sql` y trasladar los campos adicionales a nuevas tablas relacionadas.
- Dependencias: rediseñar `backend/prisma/schema.prisma`, adaptar controladores y reescribir `backend/prisma/seed_demo.js` antes de ejecutar datos demo.

## Modo oscuro: cobertura parcial

- Estado: diferido; pendiente de cobertura completa.
- Pantallas adaptadas: `frontend/src/screens/SplashScreen.js`, `frontend/src/screens/tabs/HomeUnauthenticatedScreen.js`, `frontend/src/screens/auth/VerifyCodeScreen.js` y `frontend/src/screens/auth/ResetPasswordScreen.js`.
- Pendiente: aplicar `useAppTheme()` a las pantallas restantes y reemplazar sus colores hardcodeados mediante estilos inline, sin reescribir los `StyleSheet`.

## Backend: compatibilidad con tablas base

- Estado: schema y controladores migrados; pendiente de validar contra Supabase.
- Cambio: los campos extendidos se trasladaron a `perfiles_contacto`, `productos_detalle`, `items_catalogo_detalle` y `pujos_detalle`.
- Cambio: los endpoints conservan rutas y métodos; perfil, productos, subastas, pujas, estadísticas y chat consultan las extensiones.
- Validación local: `prisma validate` exitoso y sintaxis de controladores verificada con `node --check`.
- Pendiente: aplicar las nuevas tablas en PostgreSQL mediante un procedimiento revisado, sin alterar las tablas base de `estructurabasica.sql`.

## Backend: aplicación de tablas satélite

- Estado: script creado; ejecución bloqueada por conectividad.
- Archivo: `backend/prisma/crear_extensiones.sql`.
- Garantía: usa solo `CREATE TABLE IF NOT EXISTS` sobre `perfiles_contacto`, `productos_detalle`, `items_catalogo_detalle` y `pujos_detalle`.
- Ejecución intentada: `npx prisma db execute --file prisma/crear_extensiones.sql --schema prisma/schema.prisma`.
- Resultado: `P1001` contra `aws-1-sa-east-1.pooler.supabase.com:5432`; no se modificó Supabase.

## Backend: reconciliación y seed de prueba

- Estado: completado en la base de pruebas PostgreSQL.
- Archivo: `backend/prisma/reconciliar_tablas_base.sql` eliminó las columnas ajenas a la consigna de las tablas base vacías y restauró `productos.revisor` como obligatorio.
- Archivo: `backend/prisma/crear_extensiones.sql` creó las cuatro tablas satélite.
- Verificación: 4 usuarios demo, 4 registros de `productos_detalle`, 4 de `items_catalogo_detalle`, 4 pujas y 4 registros de `pujos_detalle`.
- Seed: `seed_demo.js` es idempotente; una segunda ejecución no creó duplicados.

## Subastas: listado y detalle autenticado

- Estado: aplicado; pendiente de verificación manual en Expo.
- Archivos: `frontend/src/screens/auction/AuctionListScreen.js`, `frontend/src/screens/auction/AuctionListAuthScreen.js`, `frontend/src/screens/auction/AuctionDetailAuthScreen.js` y `backend/prisma/seed_demo.js`.
- Cambio: los listados ahora extraen `data.subastas` de la respuesta real de `GET /api/auctions` y convierten sus datos al formato que requieren las tarjetas.
- Cambio: se importó `ActivityIndicator`, eliminando el error de render de la carga en el detalle autenticado.
- Cambio: el detalle adapta la respuesta `{ subasta, articulos }` de `GET /api/auctions/:id`, consulta `GET /api/bids/:itemId/status` para mostrar datos y precio actuales, y envía la puja con el `itemId` correcto.
- Cambio: el seed deja las subastas demo en estado `abierta` y suma dos pujas de ejemplo para las categorías Oro y Plata. La última ejecución creó esas cuatro pujas.

## Flujo de participación, ganador y notificaciones

- Estado: implementado; pendiente de verificación integrada contra Render/Supabase.
- Archivos: `backend/controllers/pujasController.js`, `backend/controllers/pagosController.js`, `backend/controllers/authController.js`, `frontend/src/store/authStore.js`, `frontend/src/screens/auction/AuctionDetailAuthScreen.js` y `frontend/src/screens/tabs/HomeAuthenticatedScreen.js`.
- Regla de pago: al intentar ingresar una puja, la app consulta los métodos de pago reales y solo habilita el teclado si existe uno verificado. Si no existe o el backend lo rechaza, aparece el popup de método de pago requerido.
- Regla de categoría: se mantiene la navegación y consulta libre de cualquier subasta, pero al confirmar una puja el backend rechaza categorías superiores. El frontend muestra un popup con el motivo devuelto, sin registrar la puja.
- Cierre: la pantalla consulta periódicamente el estado del ítem; al expirar el plazo, el backend marca el ítem y la puja ganadora dentro de una transacción.
- Ganador: al cerrar, el backend crea una conversación persistente para el ganador —si no existía una para el producto— con un mensaje inicial provisorio, y registra una notificación `subasta_ganada` sin leer. El texto definitivo de términos podrá reemplazar el mensaje provisorio cuando sea provisto.
- Interfaz: el popup de ganador se decide con el `ganadorId` confirmado por el backend; al aceptar vuelve a Inicio. La campana de Inicio obtiene `data.notificaciones`, muestra el detalle y un contador de no leídas.
- Compatibilidad: no se modificó ninguna tabla base ni se alteraron rutas HTTP existentes; solo se enriquecieron respuestas ya existentes con los datos necesarios para el flujo.

## Flujo de puja: timer y validaciones previas

- Estado: aplicado; pendiente de verificación manual en Expo luego de deploy.
- Archivos: `frontend/src/screens/auction/AuctionDetailAuthScreen.js`, `backend/controllers/pujasController.js` y `backend/prisma/seed_demo.js`.
- Cambio: el endpoint de estado de puja ahora devuelve `categoria` y `ultimaPujaAt`, manteniendo las mismas rutas existentes.
- Cambio: si `items_catalogo_detalle.ultima_puja` no está cargado, el backend ya no usa pujas históricas demo como inicio del timer; así las pujas precargadas no cierran automáticamente el artículo apenas se abre la pantalla.
- Cambio: el seed demo reactiva los ítems existentes, marca `cerrado = false` y limpia `ultima_puja` para que el set demo vuelva a quedar disponible al reejecutarlo.
- Cambio: si una subasta sí llega finalizada, el detalle autenticado muestra un bloque claro de “Subasta finalizada” en vez de dejar la pantalla sin acciones y confusa.
- Cambio: el cronómetro del detalle ya no se reinicia en cada polling; solo se sincroniza contra backend cuando cambia la última puja real del ítem.
- Cambio: la validación de categoría se ejecuta antes de abrir el teclado de monto. Si el usuario no alcanza la categoría requerida, se muestra el popup inmediatamente al intentar participar.
- Cambio: la validación de método de pago aprobado/verificado también ocurre antes de abrir el teclado. Si no existe método activo y aprobado, aparece el popup correspondiente sin dejar ingresar monto.
- Validación local: `npx prisma validate`, `node --check controllers/pujasController.js` y `node --check frontend/src/screens/auction/AuctionDetailAuthScreen.js` exitosos.

## Navegación a mensajes y datos del drawer

- Estado: aplicado; pendiente de verificación manual en Expo.
- Archivos: `frontend/src/screens/tabs/HomeAuthenticatedScreen.js`, `frontend/src/screens/auction/AuctionListAuthScreen.js`, `frontend/src/screens/auction/AuctionDetailAuthScreen.js` y `frontend/src/screens/payments/MetodosDePagoScreen.js`.
- Cambio: los botones de “Mensajes” del menú hamburguesa y de barras inferiores custom navegan a `Chats`, la ruta stack registrada para `ChatsScreen`, evitando el error por `Search` o rutas internas no disponibles.
- Cambio: el drawer ya no muestra “Nombre del usuario”; ahora toma el nombre/email del usuario logueado desde `authStore`.
- Cambio: el avatar del drawer ya no usa una imagen fija; muestra las iniciales del usuario dentro del círculo de perfil.
- Validación local: `node --check` exitoso en las cuatro pantallas modificadas.

## Chat: detalle, envío persistente y fallback sin socket

- Estado: aplicado; pendiente de verificación manual en Expo.
- Archivos: `frontend/src/screens/chat/ChatDetailScreen.js` y `frontend/src/screens/chat/ChatsScreen.js`.
- Cambio: el detalle del chat dejó de depender de WebSocket para funcionar; ahora carga el historial con `GET /api/chats/:id/messages`.
- Cambio: el envío de mensajes se persiste con `POST /api/chats/:id/messages`, por lo que el mensaje queda guardado en backend y vuelve a aparecer al reabrir el chat.
- Cambio: se normalizó la respuesta real del backend (`mensajeId`, `texto`, `fecha`, `esMio`) al formato que renderiza la pantalla.
- Cambio: la lista de chats usa `conversacionId` como key y como identificador principal, evitando claves `undefined` con conversaciones reales.
- Cambio: `ChatsScreen` ahora tiene una flecha de regreso equivalente a la de `ChatDetailScreen`, navegando directamente a `Main` para volver al inicio.
- Validación local: `node --check frontend/src/screens/chat/ChatDetailScreen.js` y `node --check frontend/src/screens/chat/ChatsScreen.js` exitosos.

## Notificaciones: badge, lectura y eliminación manual

- Estado: aplicado; pendiente de verificación manual en Expo luego de deploy backend.
- Archivos: `frontend/src/screens/tabs/HomeAuthenticatedScreen.js`, `frontend/src/constants/api.js`, `backend/controllers/notificacionesController.js` y `backend/routes/notificaciones.js`.
- Cambio: al abrir la campanita se llama a `PATCH /api/notifications/read-all`; el contador de no leídas desaparece, pero las notificaciones permanecen en el panel.
- Cambio: las notificaciones se muestran como tarjetas acumuladas dentro del panel, conservando título y mensaje.
- Cambio: cada notificación se puede eliminar manualmente deslizándola hacia un costado; la app llama a `DELETE /api/notifications/:id`.
- Cambio backend: se agregó el endpoint de eliminación validando que la notificación pertenezca al usuario logueado.
- Validación local: `node --check` exitoso en controller, rutas, constantes y Home autenticado.

## Mi cuenta: datos reales, edición inline y cambio de contraseña

- Estado: aplicado; pendiente de verificación manual en Expo.
- Archivos: `frontend/src/screens/profile/MiCuentaScreen.js`, `frontend/src/navigation/AppNavigator.js`, `frontend/src/store/authStore.js`, `frontend/src/screens/auth/VerifyCodeScreen.js` y `frontend/src/screens/auth/ResetPasswordScreen.js`.
- Cambio: la pantalla carga el perfil real desde `GET /api/users/me`, incluyendo nombre, email, teléfono, documento, dirección, foto e identificador.
- Cambio: al tocar modificar, los campos del perfil se editan inline y se guardan con `PUT /api/users/me`; la contraseña queda fuera de ese formulario.
- Cambio: la contraseña ya no muestra un ojo sobre puntitos falsos; se indica como protegida por seguridad porque el backend nunca debe devolver la contraseña real.
- Cambio: en modo edición aparece el botón `Cambiar contraseña`, con colores de la app, que abre un modal equivalente al de “Olvidé mi contraseña”.
- Cambio: el modal envía el código con `POST /api/auth/forgot-password` y navega a `VerifyCode`/`ResetPassword` dentro del flujo logueado, volviendo a `MiCuenta` al terminar.
- Cambio: `authStore.setUser` ahora persiste los cambios del perfil en `AsyncStorage` para conservarlos tras reiniciar la app.
- Validación local: `node --check` exitoso en las cinco piezas modificadas.

## Detalle de subasta no autenticado

- Estado: aplicado; pendiente de verificación manual en Expo.
- Archivo: `frontend/src/screens/auction/AuctionDetailScreen.js`.
- Cambio: la pantalla ya no usa la respuesta cruda de `GET /api/auctions/:id`; ahora adapta `{ subasta, articulos }` al formato visual esperado.
- Cambio: consulta `GET /api/bids/:itemId/status` para obtener nombre, descripción y fotos reales, sin mostrar precio base ni categoría en el detalle público.
- Cambio: se blindó el carrusel para que use `[null]` como fallback y no rompa con `producto.imagenes.map` cuando la API no trae imágenes.
- Cambio: se mantiene el flujo no autenticado: sin botones de puja/enlace/info, con cartel de que no puede participar sin registrarse y botón para iniciar sesión.
- Validación local: `node --check frontend/src/screens/auction/AuctionDetailScreen.js` exitoso.

## Flujo de carga de bien y seguimiento del artículo

- Estado: primer bloque aplicado; pendiente de verificación integrada en Expo y Render.
- Archivos backend: `backend/controllers/productosController.js` y `backend/routes/productos.js`.
- Archivos frontend: `frontend/src/screens/auction/CargarProductoScreen.js`, `frontend/src/screens/auction/ArticulosEnSubastasScreen.js`, `frontend/src/screens/auction/ArticuloEnSubastaDetalleScreen.js`, `frontend/src/screens/tabs/InformacionScreen.js`, `frontend/src/screens/auction/HistorialPujasScreen.js`, `frontend/src/constants/api.js` y `frontend/src/navigation/AppNavigator.js`.
- Cambio backend: al cargar un bien se crea el producto en estado `pendiente`, se guardan fotos, se crea automáticamente una conversación asociada al producto, se agrega un mensaje automático inicial y se crea una notificación para la campanita.
- Cambio backend: se corrigió el límite de fotos para que el formulario de 6 imágenes mínimas pueda enviarse; ahora acepta hasta 12 fotos.
- Cambio backend: se expuso `PUT /api/products/:id/respond` para que el usuario acepte o rechace la propuesta final.
- Cambio backend: al aceptar/rechazar propuesta se actualiza el estado, se registra mensaje automático en el chat y se crea notificación.
- Cambio backend: los endpoints de aprobar/rechazar producto por revisor/tasador ahora también escriben mensaje y notificación al usuario.
- Cambio frontend: al finalizar la carga del bien se vuelve a `Main`, evitando navegar a una ruta inexistente `Home`.
- Cambio frontend: `InformacionScreen` ahora separa correctamente “Tus artículos en subastas” de “Tu historial de pujas”; cada botón navega a su pantalla correspondiente.
- Cambio frontend: `ArticulosEnSubastasScreen` ahora lista los productos propios desde `GET /api/users/me/auctions` como cards con foto, nombre, fecha y estado.
- Cambio frontend: se creó `ArticuloEnSubastaDetalleScreen`, conectada a `GET /api/products/:id`, con detalle del artículo, estado, fotos, descripción, propuesta final y botones aceptar/rechazar cuando el estado es `esperando_usuario`.
- Cambio frontend: `HistorialPujasScreen` usa `GET /api/users/me/bids` correctamente y se desactivó la navegación a `DetallePuja` porque esa pantalla todavía no está registrada.
- Compatibilidad: se mantiene el uso de tablas satélite para estados/detalles; no se modifican tablas base de la consigna.
- Validación local: `npx prisma validate`, `node --check` en controller/rutas de productos y pantallas modificadas exitosos.

## Subastas programadas, calendario y recordatorios

- Estado: aplicado; pendiente de deploy backend, reejecución de seed y verificación manual en Expo.
- Archivos backend: `backend/controllers/subastasController.js`, `backend/controllers/notificacionesController.js` y `backend/prisma/seed_demo.js`.
- Archivos frontend: `frontend/src/utils/auctionState.js`, `frontend/src/screens/auction/AuctionListScreen.js`, `frontend/src/screens/auction/AuctionListAuthScreen.js`, `frontend/src/screens/auction/AuctionDetailScreen.js`, `frontend/src/screens/auction/AuctionDetailAuthScreen.js` y `frontend/src/screens/tabs/CalendarScreen.js`.
- Cambio backend: `GET /api/auctions` ahora lista subastas visibles tanto `abierta` como `programada`/`pendiente`, manteniendo la misma ruta.
- Cambio backend: `GET /api/auctions/calendar` acepta `month/year` además de `mes/anio`, conserva `dias` y agrega `subastas` completas del mes para poder listar “Subastas del día”.
- Cambio backend: las respuestas de subasta incluyen `precioBase` cuando existe el primer ítem del catálogo.
- Cambio backend: `POST /api/notifications/subscribe/:auctionId` valida que la subasta exista, crea la suscripción y genera una notificación inmediata tipo `recordatorio_subasta` para la campanita.
- Cambio seed: se agregó una quinta subasta demo, `Radio antigua programada demo`, con estado `programada`, sin alterar las cuatro subastas abiertas usadas para probar pujas.
- Cambio frontend: se creó `auctionState.js` para normalizar estados: `abierta` se muestra como `vivo`; `programada`, `proximamente` y `pendiente` se muestran como `proximamente`; estados cerrados se muestran como `finalizado`.
- Cambio frontend: se corrigió el parseo de fecha/hora de subastas para evitar que fechas PostgreSQL en UTC se muestren como el día anterior en Argentina.
- Cambio frontend: los listados autenticado y no autenticado muestran cards programadas con overlay de campanita, texto `Proximamente` y fecha/hora.
- Cambio frontend: el detalle autenticado de subasta programada muestra cartel `Proximamente`, fecha/hora y botón `Agregar Recordatorio`, conectado al endpoint real de suscripción.
- Cambio frontend: el detalle no autenticado muestra el cartel `Proximamente` y ofrece iniciar sesión para agregar recordatorio.
- Cambio frontend: `CalendarScreen` consume las subastas reales del mes, marca días con subastas y lista debajo las subastas del día/mes; cada card navega al detalle correspondiente según si el usuario está logueado.
- Compatibilidad: no se agregaron rutas nuevas y no se modificaron las tablas base de la consigna.
- Validación local: `npx prisma validate`, `node --check` en controllers, seed, pantallas modificadas y helper frontend exitosos.

## Flujo de pujas: consistencia de categorías, timer persistente y cierre

- Estado: aplicado; pendiente de deploy backend y verificación manual en Expo.
- Archivos backend: `backend/controllers/subastasController.js` y `backend/controllers/pujasController.js`.
- Archivos frontend: `frontend/src/screens/auction/AuctionListScreen.js`, `frontend/src/screens/auction/AuctionListAuthScreen.js`, `frontend/src/screens/auction/AuctionDetailAuthScreen.js` y `frontend/src/screens/tabs/InformacionScreen.js`.
- Cambio backend: `GET /api/auctions` ahora interpreta `category` como filtro exacto. Si se pide `Oro` desde subastas comunes o especiales, devuelve el mismo set de subastas Oro.
- Cambio backend: el agrupado de subastas especiales queda reservado para `tipo=especial` cuando no se envía una categoría puntual.
- Cambio frontend: los listados autenticado y no autenticado envían `tipo` y `category` con el mismo contrato, evitando diferencias entre categorías equivalentes.
- Cambio frontend: la pantalla de subastas especiales ahora muestra los chips `Especial`, `Plata`, `Oro` y `Platino`; la categoría `Oro` es consistente con la de subastas comunes.
- Cambio backend: si una subasta activa tiene pujas existentes pero no tiene `ultima_puja`, el backend inicializa ese timestamp una sola vez en base para que el contador no se reinicie al salir y volver a entrar.
- Cambio frontend: el contador ya no corre “de mentira” si todavía no existe una puja real con `ultimaPujaAt`; queda estable hasta que el backend informe una puja registrada.
- Cambio backend: `POST /api/bids` rechaza pujas si la subasta no está `abierta`, respetando el flujo donde un administrador la activa manualmente cambiando el estado.
- Cambio backend: al pujar, si el usuario cumple categoría y método de pago pero todavía no tiene registro de asistente en esa subasta, se crea automáticamente el asistente/postor.
- Cambio backend: al cerrar una subasta con ganador, se marca la puja ganadora, se crea o reasigna el chat del producto al ganador, se agrega siempre el mensaje automático de ganador y se crea la notificación `subasta_ganada`.
- Cambio frontend: `InformacionScreen` ahora lee correctamente `estadisticas` desde la respuesta real de `GET /api/users/me/stats`, por lo que ganadas, perdidas, pujas realizadas y total gastado reflejan los cierres.
- Compatibilidad: no se agregaron rutas nuevas y no se modificaron las tablas base de la consigna.
- Validación local: `npx prisma validate`, `node --check` en controllers y pantallas modificadas exitosos.

## Imágenes: base64 en transporte y Bytes en PostgreSQL

- Estado: aplicado; pendiente de prueba manual subiendo un producto con fotos desde Expo.
- Archivos backend: `backend/utils/imagenes.js`, `backend/controllers/productosController.js`, `backend/controllers/subastasController.js`, `backend/controllers/pujasController.js`, `backend/controllers/estadisticasController.js`, `backend/controllers/chatController.js`, `backend/controllers/perfilController.js`, `backend/controllers/pagosController.js` y `backend/controllers/authController.js`.
- Archivos frontend: `frontend/src/utils/images.js`, `frontend/src/screens/auction/CargarProductoScreen.js`, `frontend/src/screens/auction/AuctionListScreen.js`, `frontend/src/screens/auction/AuctionListAuthScreen.js`, `frontend/src/screens/auction/AuctionDetailScreen.js`, `frontend/src/screens/auction/AuctionDetailAuthScreen.js`, `frontend/src/screens/auction/ArticulosEnSubastasScreen.js`, `frontend/src/screens/auction/ArticuloEnSubastaDetalleScreen.js`, `frontend/src/screens/auction/HistorialPujasScreen.js`, `frontend/src/screens/chat/ChatsScreen.js`, `frontend/src/screens/chat/ChatDetailScreen.js`, `frontend/src/screens/profile/MiCuentaScreen.js`, `frontend/src/screens/payments/AgregarMetodoPagoScreen.js` y `frontend/src/screens/tabs/CalendarScreen.js`.
- Documentación: se creó `flujodefotos.md` y se agregó el contrato técnico en `BACKEND_CONTRATO.md`.
- Cambio backend: se agregó helper común para limpiar base64, convertir base64 a `Buffer`, convertir `Bytes` a base64 y formar respuestas de fotos.
- Cambio backend: productos ahora acepta el contrato nuevo `fotos: [{ base64, mimeType }]` y conserva compatibilidad con `fotosBase64: string[]`.
- Cambio backend: las fotos se guardan como `Bytes`/`bytea` en PostgreSQL, no como texto base64.
- Cambio backend: se agregó límite de 2MB por imagen luego de compresión y máximo 12 fotos por producto.
- Cambio frontend: carga de producto envía fotos con `{ base64, mimeType }` y usa compresión `quality: 0.65`.
- Cambio frontend: se agregó helper común para renderizar base64 como `Image source`, evitando repetir `data:image/jpeg;base64,` en todas las pantallas.
- Compatibilidad: no se modificaron tablas base ni rutas existentes.

## Control de endpoints contra Excel de primera entrega

- Estado: aplicado y verificado.
- Archivo revisado/actualizado: `SubastUp_API_Endpoints_v3_FINAL.xlsx`.
- Confirmación base de datos: no se modificó `backend/prisma/schema.prisma`, no se crearon migraciones, no se ejecutó `db push` y no se alteraron tablas base de `estructurabasica.sql`.
- Cambio: se compararon las rutas montadas en `backend/server.js` + `backend/routes/*.js` contra el Excel de endpoints.
- Cambio: se agregaron aliases de compatibilidad para respetar endpoints presentes en la primera entrega: `GET /api/products/mine`, `GET /api/products/mine/confirmed`, `POST /api/settings/payment-methods`, `GET /api/auctions/search/suggestions` y `POST /api/auctions/upload-images`.
- Cambio: se agregaron al Excel las rutas actuales que faltaban: `GET /notifications/unread-count`, `DELETE /notifications/{id}`, `GET /users/me/auctions/confirmed` y `PUT /products/{id}/respond`.
- Resultado de cruce: Excel 58 endpoints; backend montado 58 endpoints; diferencias 0.
- Nota: se generó backup automático `SubastUp_API_Endpoints_v3_FINAL.xlsx.bak` antes de modificar el Excel.

## Seed demo para probar fotos

- Estado: aplicado; pendiente de ejecución contra la base de pruebas.
- Archivo: `backend/prisma/seed_fotos_demo.js`.
- Cambio: se creó un seed idempotente que genera una subasta demo programada, catálogo, producto, ítem y 6 imágenes PNG guardadas como `Bytes` en la tabla base `fotos`.
- Objetivo: probar el circuito completo de fotos sin depender de subir imágenes manualmente desde Expo.
- Compatibilidad: no modifica `schema.prisma`, no crea tablas nuevas y no altera las tablas base; solo inserta datos de prueba usando las tablas existentes.
- Validación local: `node --check backend/prisma/seed_fotos_demo.js` y `npx prisma validate` exitosos.

## Artículos propios en subasta, fotos y bloqueo de puja del dueño

- Estado: aplicado; pendiente de ejecutar seeds y verificar en Expo.
- Archivos backend: `backend/controllers/productosController.js`, `backend/controllers/pujasController.js`, `backend/prisma/seed_demo.js` y `backend/prisma/seed_fotos_demo.js`.
- Archivos frontend: `frontend/src/screens/auction/ArticulosEnSubastasScreen.js`, `frontend/src/screens/auction/ArticuloEnSubastaDetalleScreen.js` y `frontend/src/screens/auction/AuctionDetailAuthScreen.js`.
- Cambio backend: el estado de puja devuelve `duenioId` para que el frontend pueda reconocer si el usuario logueado es dueño del artículo.
- Cambio backend: `POST /api/bids` bloquea desde servidor la puja del dueño con mensaje `No podés pujar por este artículo porque vos lo publicaste.`
- Cambio backend: respuestas de productos propios ahora incluyen `itemId`, `subastaId`, `estadoSubasta` y `categoriaSubasta` cuando el artículo ya tiene ítem/catálogo/subasta asociados.
- Cambio frontend: al entrar desde “Tus artículos en subasta”, se pasa el resumen del producto como fallback para evitar pantalla vacía si el detalle completo falla.
- Cambio frontend: `ArticuloEnSubastaDetalleScreen` muestra carrusel grande de fotos, textos del producto, propuesta si existe y un cartel final con el estado del artículo.
- Cambio frontend: se agregó el estado `aprobado` al mapa visual de la card y del detalle para evitar que un artículo aprobado se muestre como pendiente al entrar.
- Cambio frontend: `AuctionDetailAuthScreen` muestra popup si el dueño intenta participar en la puja de su propio artículo.
- Cambio seed: `seed_fotos_demo.js` ahora genera PNG reales en bytes en lugar de SVG, para que React Native pueda renderizarlas como imagen.
- Cambio seed: `seed_demo.js` agrega fotos PNG demo a productos existentes que no tengan fotos, incluyendo `Radio antigua programada demo`.
- Compatibilidad: no se modificaron tablas base, no se modificó `schema.prisma`, no se agregaron rutas nuevas.
- Validación local: `npx prisma validate`, `node --check` en controllers, seeds y pantallas modificadas exitosos.

## Categorías y subastas unitarias

- Estado: aplicado; pendiente de ejecutar normalización contra la base de pruebas y verificar en Expo.
- Regla confirmada: una card publicada representa una subasta y una subasta publicada tiene un solo artículo.
- Archivos backend: `backend/controllers/subastasController.js`, `backend/controllers/productosController.js` y `backend/prisma/normalizar_subastas_unitarias.js`.
- Archivos frontend: `frontend/src/screens/auction/AuctionListScreen.js`, `frontend/src/screens/auction/AuctionListAuthScreen.js`, `frontend/src/screens/auction/AuctionDetailScreen.js` y `frontend/src/screens/auction/AuctionDetailAuthScreen.js`.
- Cambio backend: los listados de subastas vuelven a devolver una card por subasta, usando el único artículo asociado a esa subasta.
- Cambio backend: cada card incluye `itemId` y `productoId` del artículo publicado para que el frontend pueda abrir el detalle exacto.
- Cambio backend: al aprobar un producto, si el catálogo elegido ya tiene otro artículo, se crea una subasta y catálogo propios para ese producto, copiando categoría/datos base, sin modificar tablas de la consigna.
- Cambio backend: si un producto ya tenía ítem dentro de un catálogo compartido, al volver a aprobarlo se mueve a una subasta/catálogo propio.
- Cambio backend: se agregó `normalizar_subastas_unitarias.js` para reacomodar datos viejos de prueba que hayan quedado con más de un artículo en la misma subasta.
- Cambio frontend: las cards envían `subastaId` + `itemId` al detalle, evitando abrir por accidente el primer artículo de otra subasta/catálogo.
- Cambio backend: las cards de subasta ahora exponen datos del artículo asociado: `itemId`, `productoId`, nombre, descripción, precio base, moneda, categoría, estado, fecha/hora y portada.
- Cambio frontend: las cards de subasta autenticadas/no autenticadas muestran nombre y descripción breve del artículo, además del overlay de `Proximamente` con fecha/hora cuando corresponde.
- Cambio frontend: las cards en estado `Proximamente` ahora muestran botón `Agregar recordatorio`; autenticado registra el recordatorio contra `/api/notifications/subscribe/:auctionId`, no autenticado pide iniciar sesión.
- Cambio frontend: se normalizan estados `activa`, `activo`, `abierta` y `vivo` como subasta activa; `programada`, `proximamente`, `próximamente`, `pendiente` y `proxima` como próxima.
- Cambio frontend: `CalendarScreen` recibe `itemId`/`productoId`, muestra descripción breve y navega al detalle con `subastaId + itemId`.
- Cambio calendario: las subastas programadas/activas del mes siguen marcando el día correspondiente y aparecen en la lista inferior del calendario.
- Compatibilidad: no se modificó `schema.prisma`, no se modificaron tablas base y no se agregaron endpoints nuevos.
- Validación local: `npx prisma validate` y `node --check` en controllers, pantallas y script nuevo exitosos.

## Prompt final: deploy, seeds, fixes UI y demo

- Estado: aplicado parcialmente y documentado; pendiente de verificación visual completa en Expo.
- Commit/deploy: el working tree estaba limpio al iniciar el paso; `git push origin desarrollo` respondió `Everything up-to-date`.
- Health Render: `curl -s https://tpo-dai-subastup.onrender.com/health` respondió `{ ok: true, server: "SubastaAPI" }`.
- Seeds ejecutados contra Supabase: `normalizar_subastas_unitarias.js`, `seed_demo.js` y `seed_fotos_demo.js` finalizaron sin errores.
- Resultado seeds: normalización no movió ítems; seed demo reutilizó usuarios/productos/subastas sin duplicar; seed fotos dejó subasta 6 programada, producto 7, item 6 y 6 fotos guardadas como `Bytes`.
- Cambio frontend: `ConfiguracionScreen` navega desde “Mis subastas” a la ruta real `ArticulosEnSubastas`; se comentó la navegación anterior a `MisSubastas`.
- Cambio frontend: `HistorialPujasScreen` muestra el estado vacío solicitado: `No tenés pujas registradas todavía.`
- Cambio frontend: se agregó integración mínima de `useAppTheme` con comentario `@TASK` en pantallas no-auth/no-auth que no tenían ThemeContext, excluyendo auth por instrucción del prompt.
- Cambio backend: `pujasController` acepta estados equivalentes de subasta activa (`abierta`, `activa`, `activo`, `vivo`) al validar pujas.
- Cambio backend: `pujasController` normaliza categorías para que `oro` y `platino` no apliquen límites de máximo aunque lleguen con mayúsculas o variantes de casing.
- Cambio backend: al cerrar una subasta con ganador, además de chat y notificación, se envía mail al ganador vía `enviarMail`/Mailtrap si existe email.
- Documentación: se creó `DEMO_SCRIPT.md` con credenciales, flujo de demo, pasos de pujas, carga de producto, notificaciones, métodos de pago y comandos de emergencia.
- Validación local: `node --check` exitoso en pantallas tocadas y `backend/controllers/pujasController.js`.
