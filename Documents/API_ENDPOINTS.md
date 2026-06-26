# API Endpoints Canonicos - SubastUP

Fuente de verdad: `backend/server.js` y `backend/routes/*`. Este documento esta normalizado con `SubastUp_API_Endpoints_v3_FINAL.xlsx` y con `docs/API_ENDPOINTS.md`.

Regla: todo endpoint consumido por frontend, WebAdmin o documentacion debe usar estos paths completos con prefijo `/api`, salvo `/health`.

## Base URLs

- Backend publico: `https://tpo-dai-subastup.onrender.com`
- Backend local opcional: `http://localhost:3001` si se usa el `.env` local documentado, o `http://localhost:3000` si no se define `PORT`
- WebAdmin local: `http://127.0.0.1:5173`
- WebAdmin usa `VITE_API_URL` y por defecto apunta a `http://localhost:3001`.

## Endpoints

| # | Metodo | Endpoint | Area | Auth | Descripcion |
|---:|---|---|---|---|---|
| 1 | `GET` | `/health` | Sistema | No | Healthcheck del backend |
| 2 | `POST` | `/api/auth/login` | Auth | No | Iniciar sesion y obtener JWT |
| 3 | `POST` | `/api/auth/register` | Auth | No | Registrar usuario pendiente de aprobacion |
| 4 | `POST` | `/api/auth/forgot-password` | Auth | No | Solicitar codigo de recuperacion |
| 5 | `POST` | `/api/auth/verify-code` | Auth | No | Validar codigo de recuperacion y obtener resetToken |
| 6 | `POST` | `/api/auth/reset-password` | Auth | No | Cambiar contrasena con resetToken |
| 7 | `GET` | `/api/auth/pendientes` | Admin | Si (revisor/admin) | Listar usuarios pendientes de aprobacion |
| 8 | `POST` | `/api/auth/validate-user` | Admin | Si (admin) | Aprobar o rechazar usuario registrado |
| 9 | `PUT` | `/api/auth/asignar-categoria` | Admin | Si (revisor/admin) | Asignar categoria a un usuario |
| 10 | `POST` | `/api/auth/logout` | Auth | Si | Cerrar sesion logica |
| 11 | `GET` | `/api/users/me` | Usuarios | Si | Obtener perfil del usuario autenticado |
| 12 | `PUT` | `/api/users/me` | Usuarios | Si | Editar perfil del usuario autenticado |
| 13 | `GET` | `/api/users/me/bids` | Usuarios | Si | Historial de pujas del usuario |
| 14 | `GET` | `/api/users/me/stats` | Usuarios | Si | Resumen de metricas del usuario |
| 15 | `GET` | `/api/users/me/stats/evolution` | Usuarios | Si | Evolucion de metricas del usuario |
| 16 | `GET` | `/api/users/me/auctions` | Usuarios | Si | Productos/subastas del usuario |
| 17 | `GET` | `/api/users/me/auctions/confirmed` | Usuarios | Si | Articulos confirmados para subasta |
| 18 | `GET` | `/api/auctions` | Subastas | No | Listar subastas |
| 19 | `GET` | `/api/auctions/calendar` | Subastas | No | Calendario de subastas por mes/anio |
| 20 | `GET` | `/api/auctions/today` | Subastas | No | Subastas del dia |
| 21 | `GET` | `/api/auctions/search/suggestions` | Subastas | No | Sugerencias de busqueda |
| 22 | `POST` | `/api/auctions/upload-images` | Subastas | Si | Compatibilidad para carga de imagenes |
| 23 | `GET` | `/api/auctions/:id` | Subastas | No | Detalle de subasta |
| 24 | `GET` | `/api/auctions/:id/share-link` | Subastas | No | Link de stream/compartir subasta |
| 25 | `POST` | `/api/auctions` | Subastas | Si | Compatibilidad: cargar producto desde flujo antiguo |
| 26 | `PATCH` | `/api/auctions/:id/status` | Subastas | Si | Compatibilidad: responder propuesta/estado |
| 27 | `POST` | `/api/products` | Productos | Si | Cargar producto para revision |
| 28 | `GET` | `/api/products/mine` | Productos | Si | Listar productos propios |
| 29 | `GET` | `/api/products/mine/confirmed` | Productos | Si | Listar articulos propios confirmados |
| 30 | `GET` | `/api/products/pending-review` | Admin | Si (revisor/admin) | Listar productos pendientes de revision |
| 31 | `PUT` | `/api/products/:id/respond` | Productos | Si | Usuario acepta/rechaza propuesta del revisor |
| 32 | `PUT` | `/api/products/:id/approve` | Admin | Si (revisor/admin) | Revisor/admin aprueba producto y genera propuesta |
| 33 | `PUT` | `/api/products/:id/reject` | Admin | Si (revisor/admin) | Revisor/admin rechaza producto |
| 34 | `GET` | `/api/products/:id` | Productos | Si | Detalle de producto |
| 35 | `DELETE` | `/api/products/:id` | Productos | Si | Eliminar producto propio si aplica |
| 36 | `GET` | `/api/bids/:itemId/status` | Pujas | No | Estado actual de puja de un item |
| 37 | `POST` | `/api/bids` | Pujas | Si | Realizar puja |
| 38 | `GET` | `/api/chats/unread-count` | Chat | Si | Cantidad de mensajes no leidos |
| 39 | `GET` | `/api/chats` | Chat | Si | Listar conversaciones del usuario |
| 40 | `GET` | `/api/chats/:chatId/messages` | Chat | Si | Obtener mensajes de una conversacion |
| 41 | `POST` | `/api/chats/:chatId/messages` | Chat | Si | Enviar mensaje de texto o imagen |
| 42 | `POST` | `/api/chats/create/:productId` | Chat | Si | Crear conversacion para producto |
| 43 | `POST` | `/api/notifications/push-token` | Notificaciones | Si | Guardar token push |
| 44 | `GET` | `/api/notifications` | Notificaciones | Si | Listar notificaciones |
| 45 | `GET` | `/api/notifications/unread-count` | Notificaciones | Si | Cantidad de notificaciones no leidas |
| 46 | `PATCH` | `/api/notifications/read-all` | Notificaciones | Si | Marcar todas como leidas |
| 47 | `PATCH` | `/api/notifications/:id/read` | Notificaciones | Si | Marcar notificacion como leida |
| 48 | `POST` | `/api/notifications/subscribe/:auctionId` | Notificaciones | Si | Suscribirse a una subasta |
| 49 | `DELETE` | `/api/notifications/subscribe/:auctionId` | Notificaciones | Si | Cancelar suscripcion a una subasta |
| 50 | `DELETE` | `/api/notifications/:id` | Notificaciones | Si | Eliminar notificacion |
| 51 | `GET` | `/api/settings/payment-methods` | Pagos | Si | Listar metodos de pago propios |
| 52 | `POST` | `/api/settings/payment-methods` | Pagos | Si | Agregar metodo de pago generico |
| 53 | `POST` | `/api/settings/payment-methods/card` | Pagos | Si | Agregar tarjeta |
| 54 | `POST` | `/api/settings/payment-methods/bank` | Pagos | Si | Agregar cuenta bancaria |
| 55 | `POST` | `/api/settings/payment-methods/check` | Pagos | Si | Agregar cheque |
| 56 | `DELETE` | `/api/settings/payment-methods/:id` | Pagos | Si | Eliminar metodo de pago |
| 57 | `GET` | `/api/settings/payment-methods/pending-verification` | Admin | Si (revisor/admin) | Listar metodos pendientes de verificacion |
| 58 | `PUT` | `/api/settings/payment-methods/:id/verify` | Admin | Si (revisor/admin) | Verificar metodo de pago |
| 59 | `GET` | `/api/settings` | Configuracion | No | Obtener configuracion simple |
| 60 | `PUT` | `/api/settings` | Configuracion | No | Actualizar configuracion simple |
| 61 | `GET` | `/api/help/faq` | Ayuda | No | Listar preguntas frecuentes |
| 62 | `POST` | `/api/dev/reseed` | Desarrollo | DEV_KEY | Reiniciar y cargar datos demo |
| 63 | `GET` | `/api/dev/db` | Desarrollo | DEV_KEY | Ver conteos y datos demo sin imagenes |

## Endpoints usados por WebAdmin

- `POST /api/auth/login`
- `GET /api/auth/pendientes`
- `POST /api/auth/validate-user`
- `PUT /api/auth/asignar-categoria`
- `GET /api/chats`
- `GET /api/chats/:chatId/messages`
- `POST /api/chats/:chatId/messages`
- `GET /api/products/pending-review`
- `PUT /api/products/:id/reject`
- `GET /api/settings/payment-methods/pending-verification`
- `PUT /api/settings/payment-methods/:id/verify`

## Notas de normalizacion

- Rutas antiguas `/api/chat`, `/api/productos`, `/api/pagos`, `/auth/*`, `/products/*` sin prefijo no deben usarse.
- `frontend/src/constants/api.js` ya usa los paths canonicos para la app movil.
- `WebAdmin/App.jsx` usa los paths canonicos, apunta por defecto a `http://localhost:3001` y permite cambiar backend con `VITE_API_URL`.
- `/api/dev/*` no usa JWT: valida `DEV_KEY` por query `?clave=` o header `x-dev-key`.
