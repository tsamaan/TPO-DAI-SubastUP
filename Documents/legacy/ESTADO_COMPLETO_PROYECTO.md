# Estado completo del proyecto SubastUP

Fecha del snapshot: 2026-06-25  
Repositorio: `TPO-DAI-SubastUP`

Este documento resume el estado funcional, técnico y pendiente del proyecto después de las correcciones acumuladas. Sirve como mapa para retomar el trabajo sin perder contexto.

## Resumen ejecutivo

El proyecto quedó en una etapa avanzada de integración entre frontend React Native/Expo, backend Node/Express/Prisma y PostgreSQL/Supabase.

Se trabajó principalmente sobre:

- Compatibilidad estricta con la consigna de no modificar tablas base de `estructurabasica.sql`.
- Movimiento de campos extra a tablas satélite.
- Flujo de subastas, pujas, calendario y recordatorios.
- Flujo de carga de productos del usuario.
- Chats persistentes.
- Notificaciones con lectura y eliminación.
- Métodos de pago reales.
- Mi cuenta con edición real.
- Imágenes base64 en frontend y `Bytes`/`bytea` en PostgreSQL.
- Seeds demo con usuarios, productos, subastas, pujas y fotos.
- Sincronización de endpoints contra el Excel de primera entrega.

Regla de negocio actualmente fijada:

```txt
Una card = una subasta = un artículo.
```

Una subasta publicada debe tener un único artículo asociado. Si un producto se aprueba usando un catálogo/subasta que ya contiene otro artículo, el backend crea una subasta y catálogo propios para mantener esa regla.

## Estado de Git / working tree

Hay cambios pendientes sin commitear en varias áreas.

Archivos modificados relevantes:

- `BACKEND_CONTRATO.md`
- `correcciones.md`
- `backend/controllers/authController.js`
- `backend/controllers/chatController.js`
- `backend/controllers/estadisticasController.js`
- `backend/controllers/pagosController.js`
- `backend/controllers/perfilController.js`
- `backend/controllers/productosController.js`
- `backend/controllers/pujasController.js`
- `backend/controllers/subastasController.js`
- `backend/prisma/seed_demo.js`
- `backend/routes/pagos.js`
- `backend/routes/productos.js`
- `backend/routes/subastas.js`
- `frontend/src/screens/auction/ArticuloEnSubastaDetalleScreen.js`
- `frontend/src/screens/auction/ArticulosEnSubastasScreen.js`
- `frontend/src/screens/auction/AuctionDetailAuthScreen.js`
- `frontend/src/screens/auction/AuctionDetailScreen.js`
- `frontend/src/screens/auction/AuctionListAuthScreen.js`
- `frontend/src/screens/auction/AuctionListScreen.js`
- `frontend/src/screens/auction/CargarProductoScreen.js`
- `frontend/src/screens/auction/HistorialPujasScreen.js`
- `frontend/src/screens/chat/ChatDetailScreen.js`
- `frontend/src/screens/chat/ChatsScreen.js`
- `frontend/src/screens/payments/AgregarMetodoPagoScreen.js`
- `frontend/src/screens/profile/MiCuentaScreen.js`
- `frontend/src/screens/tabs/CalendarScreen.js`
- `frontend/src/utils/auctionState.js`

Archivos nuevos relevantes:

- `backend/utils/imagenes.js`
- `frontend/src/utils/images.js`
- `backend/prisma/seed_fotos_demo.js`
- `backend/prisma/normalizar_subastas_unitarias.js`
- `flujodefotos.md`
- `SubastUp_API_Endpoints_v3_FINAL.xlsx`
- `SubastUp_API_Endpoints_v3_FINAL.xlsx.bak`

## Base de datos y consigna

### Regla de la consigna

Las tablas base entregadas en `estructurabasica.sql` no se deben modificar.

Tablas base consideradas inmutables:

- `paises`
- `personas`
- `empleados`
- `sectores`
- `seguros`
- `clientes`
- `duenios`
- `subastadores`
- `subastas`
- `productos`
- `fotos`
- `catalogos`
- `itemscatalogo`
- `asistentes`
- `pujos`
- `registrodesubasta`

### Solución adoptada

Para respetar esa restricción, los datos extra se movieron a tablas satélite.

Tablas satélite principales:

- `perfiles_contacto`
  - Teléfono de una persona.
- `productos_detalle`
  - Nombre del producto.
  - Estado del proceso.
  - Revisor.
  - Motivo de rechazo.
  - Dirección de envío.
- `items_catalogo_detalle`
  - Moneda.
  - Fecha/hora/lugar de subasta.
  - Aceptación del dueño.
  - Última puja.
  - Cierre.
  - Link de stream.
- `pujos_detalle`
  - Fecha de cada puja.

Además, permanecen las tablas adicionales ya usadas para:

- Autenticación.
- Métodos de pago.
- Notificaciones.
- Chats.
- Suscripciones/recordatorios.

### Estado técnico de base

No se modificó `schema.prisma` durante los últimos ajustes de subastas unitarias.  
No se agregaron endpoints nuevos en ese último bloque.  
No se hicieron migraciones Prisma ni `db push`.

Validación local:

```bash
cd backend
npx prisma validate
```

Resultado: schema válido.

## Backend

### Contrato general

Las rutas HTTP existentes se preservan.

Áreas principales:

| Área | Rutas |
| --- | --- |
| Auth | `/api/auth/*` |
| Usuarios | `/api/users/me*` |
| Subastas | `/api/auctions/*` |
| Productos | `/api/products/*` |
| Pujas | `/api/bids/*` |
| Chat | `/api/chats/*` |
| Pagos | `/api/settings/payment-methods/*` |
| Notificaciones | `/api/notifications/*` |

### Endpoints y Excel de primera entrega

Se compararon las rutas montadas en backend contra `SubastUp_API_Endpoints_v3_FINAL.xlsx`.

Resultado del cruce:

- Excel: 58 endpoints.
- Backend montado: 58 endpoints.
- Diferencias: 0.

Aliases agregados para compatibilidad:

- `GET /api/products/mine`
- `GET /api/products/mine/confirmed`
- `POST /api/settings/payment-methods`
- `GET /api/auctions/search/suggestions`
- `POST /api/auctions/upload-images`

Rutas actuales agregadas al Excel:

- `GET /notifications/unread-count`
- `DELETE /notifications/{id}`
- `GET /users/me/auctions/confirmed`
- `PUT /products/{id}/respond`

Se generó backup:

- `SubastUp_API_Endpoints_v3_FINAL.xlsx.bak`

## Subastas

### Regla actual

```txt
Una card = una subasta = un artículo.
```

Cada card de listado representa una subasta publicada y esa subasta debe tener un solo artículo.

### Datos que devuelve una card

El backend expone en las respuestas de subasta:

- `subastaId`
- `itemId`
- `productoId`
- `fecha`
- `hora`
- `ubicacion`
- `categoria`
- `estado`
- `nombreArticulo`
- `descripcionArticulo`
- `moneda`
- `precioBase`
- `portada`

### Estados normalizados en frontend

Activas:

- `abierta`
- `activa`
- `activo`
- `vivo`

Se muestran como:

```txt
vivo / Activa
```

Próximas:

- `programada`
- `proximamente`
- `próximamente`
- `pendiente`
- `proxima`

Se muestran como:

```txt
proximamente / Próximamente
```

Finalizadas:

- `cerrada`
- `finalizada`
- `finalizado`

Se muestran como:

```txt
finalizado
```

Archivo helper:

- `frontend/src/utils/auctionState.js`

### Listados de subastas

Pantallas:

- `frontend/src/screens/auction/AuctionListScreen.js`
- `frontend/src/screens/auction/AuctionListAuthScreen.js`

Estado actual:

- Consumen `GET /api/auctions`.
- Envían filtros `tipo`, `category` y `search`.
- Muestran imagen/portada.
- Muestran nombre.
- Muestran descripción breve.
- Muestran moneda.
- Si está próxima, muestran overlay con fecha/hora.
- Si está próxima, muestran botón `Agregar recordatorio`.

Comportamiento del botón `Agregar recordatorio`:

- Usuario autenticado:
  - Llama a `/api/notifications/subscribe/:auctionId`.
  - Crea recordatorio y notificación.
- Usuario no autenticado:
  - Pide iniciar sesión.

### Detalle de subasta autenticado

Pantalla:

- `frontend/src/screens/auction/AuctionDetailAuthScreen.js`

Estado actual:

- Recibe `subastaId + itemId`.
- Consulta `GET /api/auctions/:id`.
- Selecciona el artículo correcto por `itemId`.
- Consulta `GET /api/bids/:itemId/status`.
- Muestra fotos, nombre, descripción y estado.
- Si la subasta está activa, permite ingresar al flujo de puja.
- Si está próxima, muestra cartel de próxima + botón `Agregar Recordatorio`.
- Si está finalizada, muestra cartel de finalización.
- Si el usuario es dueño del producto, bloquea puja con popup.

### Detalle de subasta no autenticado

Pantalla:

- `frontend/src/screens/auction/AuctionDetailScreen.js`

Estado actual:

- Recibe `subastaId + itemId`.
- Consulta datos reales.
- Muestra fotos, nombre, ID y descripción.
- No muestra precio base ni categoría.
- No muestra botones de puja/enlace/info.
- Muestra cartel de que no puede participar sin registrarse.
- Si está próxima, ofrece iniciar sesión para agregar recordatorio.

## Calendario

Pantalla:

- `frontend/src/screens/tabs/CalendarScreen.js`

Endpoint:

- `GET /api/auctions/calendar?month=M&year=YYYY`

Estado actual:

- Consume subastas reales del mes.
- Marca los días con subastas.
- Muestra lista inferior de subastas del día o del mes.
- Cada elemento muestra:
  - Imagen.
  - Nombre.
  - Descripción breve.
  - Categoría.
  - Estado: Activa / Próximamente.
  - Fecha y hora.
- Navega al detalle correcto con `subastaId + itemId`.

Regla:

```txt
Toda subasta programada con fecha/hora debe verse marcada en calendario.
```

## Pujas

### Reglas implementadas

- Se puede navegar y ver cualquier subasta.
- Para pujar, el usuario debe estar logueado.
- Para pujar, debe tener método de pago activo/verificado/aprobado.
- Para pujar, su categoría debe alcanzar la categoría de la subasta.
- Un dueño no puede pujar por su propio artículo.
- El backend valida todo igualmente, aunque el frontend muestre popups antes.
- Si la subasta no está `abierta`, `POST /api/bids` rechaza la puja.

### Categorías

Se permite ver subastas de categorías superiores, pero no pujar en ellas si el usuario no alcanza el nivel.

Ejemplo:

- Usuario `comun` puede mirar una subasta `oro`.
- Al intentar participar, aparece popup de categoría insuficiente.

### Timer

Estado actual:

- El contador no debe reiniciarse al entrar/salir.
- Se sincroniza con `ultimaPujaAt` del backend.
- Solo cambia cuando hay una puja real.
- Si no hay `ultimaPujaAt`, no corre un contador falso.
- Si la subasta está finalizada, se muestra estado finalizado.

### Cierre y ganador

Estado implementado:

- Al cerrar una subasta con ganador:
  - Se marca la puja ganadora.
  - Se crea o reasigna chat del producto al ganador.
  - Se agrega mensaje automático provisorio.
  - Se crea notificación `subasta_ganada`.
  - El popup de ganador vuelve a Inicio al aceptar.

Texto definitivo de términos:

- Pendiente de que el usuario lo pase.

## Productos / carga de bien

Pantalla de carga:

- `frontend/src/screens/auction/CargarProductoScreen.js`

Backend:

- `backend/controllers/productosController.js`
- `backend/routes/productos.js`

Estado actual:

- Usuario logueado carga producto.
- Debe enviar nombre, descripción y fotos.
- El producto queda en estado `pendiente`.
- Se guardan fotos.
- Se crea conversación automáticamente.
- Se agrega mensaje automático inicial.
- Se crea notificación para la campanita.

### Estados del producto en seguimiento

Estados usados en el flujo:

- `pendiente`
- `aprobado`
- `esperando_usuario`
- `confirmado`
- `rechazado`
- `devuelto`

### Tus artículos en subasta

Pantalla:

- `frontend/src/screens/auction/ArticulosEnSubastasScreen.js`

Detalle:

- `frontend/src/screens/auction/ArticuloEnSubastaDetalleScreen.js`

Estado actual:

- Lista productos propios desde backend.
- Muestra cards con foto, nombre, fecha y estado.
- El detalle muestra:
  - Carrusel de fotos.
  - Nombre.
  - Descripción.
  - Estado.
  - Propuesta si existe.
  - Precio base si corresponde.
  - Botones aceptar/rechazar si el estado es `esperando_usuario`.
- Se corrigió inconsistencia visual para que `aprobado` no aparezca como `pendiente`.

### Aprobación y subasta unitaria

Cuando un revisor aprueba un producto:

- Si el catálogo/subasta destino está vacío, usa ese catálogo.
- Si el catálogo/subasta destino ya tiene otro artículo, crea:
  - Nueva subasta.
  - Nuevo catálogo.
  - Ítem del producto en ese catálogo.
- Si el producto ya estaba en un catálogo compartido, lo mueve a uno propio.

Script para normalizar datos viejos:

- `backend/prisma/normalizar_subastas_unitarias.js`

Comando recomendado:

```bash
cd backend
node prisma/normalizar_subastas_unitarias.js
node prisma/seed_demo.js
```

## Imágenes

Documentación:

- `flujodefotos.md`

Helpers:

- Backend: `backend/utils/imagenes.js`
- Frontend: `frontend/src/utils/images.js`

### Contrato

Frontend envía:

```js
{
  nombre: "Reloj antiguo",
  descripcionCompleta: "Reloj muy lindo",
  fotos: [
    {
      base64: "...",
      mimeType: "image/jpeg"
    }
  ]
}
```

Backend:

- Limpia base64.
- Convierte base64 a `Buffer`.
- Guarda en PostgreSQL como `Bytes`/`bytea`.

Base de datos:

- No guarda strings base64 en productos.
- Guarda bytes.

Backend responde:

```js
{
  id: 1,
  mimeType: "image/jpeg",
  foto: "..."
}
```

Frontend:

- Convierte base64 a `Image source`.
- Renderiza imágenes reales en cards, detalle, chats, métodos de pago y perfil.

Límites:

- Máximo 12 fotos por producto.
- Máximo 2MB por imagen luego de compresión.
- Calidad de compresión frontend: `0.65`.

## Chats

Pantallas:

- `frontend/src/screens/chat/ChatsScreen.js`
- `frontend/src/screens/chat/ChatDetailScreen.js`

Estado actual:

- `ChatsScreen` normaliza respuesta `{ ok, conversaciones }`.
- Evita el error `chats.filter is not a function`.
- Usa `conversacionId` como ID real.
- Tiene flecha para volver a Inicio.
- `ChatDetailScreen` carga historial con `GET /api/chats/:id/messages`.
- Envía mensajes con `POST /api/chats/:id/messages`.
- Los mensajes quedan persistidos.
- El socket ya no es requisito para que la pantalla funcione.

## Notificaciones

Backend:

- `backend/controllers/notificacionesController.js`
- `backend/routes/notificaciones.js`

Frontend principal:

- `frontend/src/screens/tabs/HomeAuthenticatedScreen.js`

Estado actual:

- La campanita muestra contador de no leídas.
- Al abrir el panel se marca todo como leído.
- El contador desaparece al abrir/cerrar.
- Las notificaciones quedan acumuladas.
- Se pueden eliminar manualmente deslizando hacia un costado.
- Se agregó `DELETE /api/notifications/:id`.
- Recordatorios de subasta generan notificación inmediata.

Tipos usados:

- `recordatorio_subasta`
- `subasta_ganada`
- `producto_propuesta`
- `producto_confirmado`
- `producto_rechazado`

## Métodos de pago

Pantallas:

- `frontend/src/screens/payments/MetodosDePagoScreen.js`
- `frontend/src/screens/payments/AgregarMetodoPagoScreen.js`
- `frontend/src/screens/payments/MetodoDePagoDetalleScreen.js`

Estado actual:

- Lista real desde `GET /api/settings/payment-methods`.
- Alta de tarjeta, cuenta bancaria y cheque.
- Cheque conserva imagen en base64.
- Eliminación con `DELETE /api/settings/payment-methods/:id`.
- Refresco al volver desde alta o detalle.
- Se usa para validar si un usuario puede participar en pujas.

## Mi cuenta

Pantalla:

- `frontend/src/screens/profile/MiCuentaScreen.js`

Estado actual:

- Carga datos reales con `GET /api/users/me`.
- Edita inline:
  - Nombre.
  - Email.
  - Teléfono.
  - Documento.
  - Dirección.
- Guarda con `PUT /api/users/me`.
- Persiste cambios en `authStore`.
- Contraseña no se muestra real, por seguridad.
- Botón `Cambiar contraseña` abre modal tipo “Olvidé mi contraseña”.
- Flujo conectado con `forgot-password`, `VerifyCode` y `ResetPassword`.

Backend:

- Valida documento único.
- Valida contraseña actual + nueva contraseña cuando corresponde.

## Menú hamburguesa / navegación

Estado actual:

- Botón Mensajes navega a `Chats`.
- Bottom nav Mensajes navega a `Chats`.
- Drawer muestra nombre real o email del usuario.
- Avatar muestra iniciales.
- Se eliminaron rutas inexistentes que rompían navegación.

## Información / dashboard

Pantalla:

- `frontend/src/screens/tabs/InformacionScreen.js`

Estado actual:

- Estadísticas reales desde `GET /api/users/me/stats`.
- “Tus artículos en subasta” navega a `ArticulosEnSubastasScreen`.
- “Tu historial de pujas” navega a `HistorialPujasScreen`.
- Historial de pujas consume `GET /api/users/me/bids`.
- Si no hay pujas, muestra estado vacío.

## Seeds y datos demo

### Seed principal

Archivo:

- `backend/prisma/seed_demo.js`

Estado:

- Idempotente.
- Crea o reutiliza usuarios demo.
- Crea métodos de pago verificados.
- Crea subastas demo.
- Crea productos, detalles, fotos PNG demo, ítems y pujas.

Credenciales demo:

```txt
demo1@subastup.com a demo4@subastup.com
Password: Demo1234
```

Últimos resultados reportados:

```txt
Usuarios nuevos: 0
Métodos de pago nuevos: 0
Subastas nuevas: 0
Productos nuevos: 0
Ítems nuevos: 0
Pujas nuevas: 4
```

### Seed de fotos

Archivo:

- `backend/prisma/seed_fotos_demo.js`

Estado:

- Genera una subasta demo programada.
- Genera producto/catálogo/ítem.
- Genera 6 imágenes PNG reales como bytes.
- Sirve para probar el circuito de fotos sin subir manualmente desde Expo.

### Normalización de subastas unitarias

Archivo:

- `backend/prisma/normalizar_subastas_unitarias.js`

Función:

- Busca catálogos con más de un ítem.
- Deja el primer ítem.
- Mueve los demás a subastas/catálogos propios.
- No modifica estructura de tablas.

## Validaciones realizadas

Se ejecutaron checks locales en distintos momentos:

```bash
cd backend
npx prisma validate
```

Resultado:

```txt
The schema at prisma/schema.prisma is valid
```

También se usó:

```bash
node --check <archivo.js>
```

Archivos validados en los últimos bloques:

- `backend/controllers/subastasController.js`
- `backend/controllers/productosController.js`
- `backend/controllers/pujasController.js`
- `backend/prisma/seed_demo.js`
- `backend/prisma/seed_fotos_demo.js`
- `backend/prisma/normalizar_subastas_unitarias.js`
- `frontend/src/screens/auction/AuctionListScreen.js`
- `frontend/src/screens/auction/AuctionListAuthScreen.js`
- `frontend/src/screens/auction/AuctionDetailScreen.js`
- `frontend/src/screens/auction/AuctionDetailAuthScreen.js`
- `frontend/src/screens/tabs/CalendarScreen.js`
- `frontend/src/utils/auctionState.js`

## Comandos recomendados para probar

Desde backend:

```bash
cd backend
npx prisma generate
npx prisma validate
node prisma/normalizar_subastas_unitarias.js
node prisma/seed_demo.js
```

Opcional para fotos:

```bash
node prisma/seed_fotos_demo.js
```

Probar subastas:

```bash
curl -s https://tpo-dai-subastup.onrender.com/api/auctions
curl -s https://tpo-dai-subastup.onrender.com/api/auctions/1
```

Probar calendario:

```bash
curl -s "https://tpo-dai-subastup.onrender.com/api/auctions/calendar?month=6&year=2026"
```

Probar login demo:

```bash
curl -s -X POST https://tpo-dai-subastup.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo1@subastup.com","password":"Demo1234"}'
```

Desde frontend:

```bash
cd frontend
npm start
```

## Flujo esperado para probar en Expo

### Usuario no logueado

1. Entrar a subastas comunes/especiales.
2. Ver cards con imagen, nombre, descripción y moneda.
3. Si una subasta está próxima, ver overlay con fecha/hora y botón recordatorio.
4. Al tocar recordatorio, debe pedir iniciar sesión.
5. Al entrar al detalle:
   - Ver carrusel.
   - Ver nombre, ID y descripción.
   - No ver precio base ni categoría.
   - Ver cartel de que no puede pujar sin registrarse.

### Usuario logueado

1. Iniciar sesión con `demo1@subastup.com / Demo1234`.
2. Entrar a subastas.
3. Ver cards reales.
4. Si una subasta está próxima:
   - Tocar `Agregar recordatorio`.
   - Debe crear notificación.
5. Entrar a una subasta activa:
   - Ver fotos, descripción y estado.
   - Si tiene método de pago y categoría suficiente, puede participar.
   - Si no tiene método, popup.
   - Si categoría insuficiente, popup.
   - Si es dueño del artículo, popup de bloqueo.

### Calendario

1. Entrar a Calendario.
2. Ver días marcados con subastas.
3. Seleccionar día.
4. Ver lista inferior de subastas del día.
5. Tocar una subasta.
6. Debe abrir el detalle exacto del artículo.

### Carga de producto

1. Usuario logueado entra a Cargar producto.
2. Completa formulario.
3. Sube fotos.
4. Envía.
5. Debe crearse producto pendiente.
6. Debe crearse chat automático.
7. Debe crearse notificación.
8. Debe aparecer en seguimiento de artículos cuando corresponda según estado.

## Pendientes funcionales importantes

### Verificación manual completa en Expo

Hay muchos cambios integrados que pasaron validación sintáctica, pero necesitan prueba visual y funcional completa:

- Subastas activas.
- Subastas próximas.
- Recordatorios desde card y detalle.
- Calendario.
- Pujas.
- Ganador.
- Chats.
- Notificaciones.
- Carga de producto.
- Métodos de pago.
- Mi cuenta.

### Texto definitivo del chat de ganador

El backend tiene mensaje automático provisorio para el ganador de una subasta.  
Falta reemplazarlo por el texto definitivo que el usuario dijo que pasaría más adelante.

### Administración de subastas

Queda pendiente definir cómo el administrador crea subastas y cambia estados manualmente.

Por ahora:

- Los seeds crean datos.
- El estado puede cambiarse manualmente en base.
- El backend ya respeta estado `abierta/activa` vs `programada/proximamente`.

### Panel de tasador/revisor

El flujo backend existe para aprobar/rechazar productos, pero falta una UI completa de administración/tasador si se quiere operar desde la app.

### Limpieza de datos viejos

Si la base venía con catálogos compartiendo varios ítems, correr:

```bash
cd backend
node prisma/normalizar_subastas_unitarias.js
```

### Deploy backend

Varios cambios de backend deben estar desplegados en Render para que Expo consuma el contrato correcto.

Si algo funciona local pero no en Expo contra Render, revisar:

- Si Render fue redeployado.
- Si Prisma Client fue regenerado.
- Si la base tiene tablas satélite.
- Si se corrieron seeds/normalización.

## Riesgos conocidos

### Red / Supabase

Hubo problemas previos de conexión en red UADE:

```txt
Can't reach database server at aws-1-sa-east-1.pooler.supabase.com
```

Se resolvió usando otra red/hotspot.

### Data previa inconsistente

Si antes se crearon varias asociaciones en un mismo catálogo/subasta, pueden aparecer inconsistencias hasta correr la normalización.

### Diferencia Render vs local

Si se cambia código local pero Render sigue con versión vieja, Expo contra URL pública puede mostrar errores viejos.

### No usar `db push` sin revisar

Por consigna, no ejecutar:

```bash
npx prisma db push
```

sin validar que no altere tablas base.

## Documentos relacionados

- `correcciones.md`
  - Bitácora incremental de cambios.
- `BACKEND_CONTRATO.md`
  - Contrato técnico de backend y tablas.
- `flujodefotos.md`
  - Explicación simple del flujo de fotos.
- `estructurabasica.sql`
  - Tablas base de la consigna.
- `SubastUp_API_Endpoints_v3_FINAL.xlsx`
  - Excel sincronizado de endpoints.
- `SubastUp_API_Endpoints_v3_FINAL.xlsx.bak`
  - Backup del Excel antes de actualizarlo.

## Estado final resumido

El proyecto quedó con:

- Backend adaptado a PostgreSQL.
- Tablas base respetadas mediante tablas satélite.
- Endpoints preservados y sincronizados con Excel.
- Subastas programadas y activas integradas con calendario.
- Regla `una card = una subasta = un artículo`.
- Pujas con validaciones de usuario, pago, categoría y dueño.
- Chat persistente.
- Notificaciones acumulables, leíbles y eliminables.
- Fotos guardadas como bytes en PostgreSQL.
- Perfil real editable.
- Métodos de pago reales.
- Seeds demo y script de normalización.

Siguiente paso recomendado:

```txt
1. Deploy backend actualizado.
2. Ejecutar normalización + seed.
3. Levantar Expo.
4. Probar flujo calendario → subasta próxima → recordatorio.
5. Probar flujo subasta activa → puja → cierre → ganador → chat/notificación.
6. Probar carga de producto → chat/notificación → seguimiento.
```
