# Analisis de Integracion - Estado normalizado

## Fuente de verdad

Los endpoints validos del proyecto estan definidos en:

- `backend/server.js`
- `backend/routes/*`
- `frontend/src/constants/api.js`
- `WebAdmin/App.jsx`
- `Documents/API_ENDPOINTS.md`
- `SubastUp_API_Endpoints_v3_FINAL.xlsx`

`Documents/API_ENDPOINTS.md` y el Excel contienen la misma tabla normalizada.

## Backend

El backend monta estos prefijos:

| Area | Prefijo |
| --- | --- |
| Auth | `/api/auth` |
| Usuarios | `/api/users` |
| Subastas | `/api/auctions` |
| Productos | `/api/products` |
| Pujas | `/api/bids` |
| Chats | `/api/chats` |
| Notificaciones | `/api/notifications` |
| Pagos | `/api/settings/payment-methods` |
| Configuracion | `/api/settings` |
| Ayuda | `/api/help` |

La lista endpoint por endpoint esta en `Documents/API_ENDPOINTS.md`.

## Frontend movil

`frontend/src/constants/api.js` ya usa paths con prefijo `/api`.

Ejemplos correctos:

- `LOGIN: '/api/auth/login'`
- `PRODUCTS: '/api/products'`
- `CHATS: '/api/chats'`
- `PAYMENT_METHODS: '/api/settings/payment-methods'`
- `NOTIFICATIONS: '/api/notifications'`

## WebAdmin

`WebAdmin/App.jsx` apunta por defecto al mismo backend publico que la app movil:

```text
https://tpo-dai-subastup.onrender.com
```

Se puede cambiar con:

```bash
VITE_API_URL=<backend-url> npm run dev
```

Endpoints usados por el panel:

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

## Excel

`SubastUp_API_Endpoints_v3_FINAL.xlsx` fue normalizado para coincidir con las rutas reales del backend.

Regla: si se agrega, elimina o renombra una ruta en `backend/routes/*`, actualizar tambien:

1. `frontend/src/constants/api.js`, si la app movil la consume.
2. `WebAdmin/App.jsx`, si el panel la consume.
3. `Documents/API_ENDPOINTS.md`.
4. `SubastUp_API_Endpoints_v3_FINAL.xlsx`.

## Rutas obsoletas

No usar estas variantes:

- `/auth/login`
- `/api/chat`
- `/api/chat/:id`
- `/api/chat/:id/mensaje`
- `/api/productos`
- `/api/productos/revision/pendientes`
- `/api/pagos`
- `/api/pagos/pendientes-verificacion`
- `/notifications`
- `/products`

## Estado WebAdmin

Verificado:

```bash
cd WebAdmin
npm run build
```

Servidor local:

```bash
cd WebAdmin
npm run dev
```

URL:

```text
http://127.0.0.1:5173/
```
