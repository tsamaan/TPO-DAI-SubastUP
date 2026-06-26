# Backend actual - Snapshot normalizado

Este documento reemplaza auditorias previas que mezclaban rutas antiguas.

Fuente de verdad:

- Codigo: `backend/server.js` y `backend/routes/*`.
- Tabla canonica: `Documents/API_ENDPOINTS.md`.
- Excel normalizado: `SubastUp_API_Endpoints_v3_FINAL.xlsx`.

## Stack

- Node.js + Express.
- Prisma Client.
- PostgreSQL.
- JWT con `Authorization: Bearer <token>`.
- Correos via Nodemailer.
- No hay Socket.io configurado; chat y pujas funcionan por HTTP REST.

## Modulos expuestos

| Modulo | Prefijo actual |
| --- | --- |
| Health | `/health` |
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

## Endpoints

No duplicar la tabla completa en este archivo. La lista completa y normalizada esta en:

- `Documents/API_ENDPOINTS.md`
- `SubastUp_API_Endpoints_v3_FINAL.xlsx`

## Contrato WebAdmin

El WebAdmin consume rutas reales del backend local por defecto:

```text
WebAdmin -> http://localhost:3000
```

Puede apuntar a otro backend con:

```bash
VITE_API_URL=https://tpo-dai-subastup.onrender.com npm run dev
```

Rutas administrativas conectadas:

- `GET /api/auth/pendientes`
- `POST /api/auth/validate-user`
- `PUT /api/auth/asignar-categoria`
- `GET /api/products/pending-review`
- `PUT /api/products/:id/reject`
- `GET /api/settings/payment-methods/pending-verification`
- `PUT /api/settings/payment-methods/:id/verify`

## Rutas obsoletas que no deben usarse

- `/api/chat/*`
- `/api/productos/*`
- `/api/pagos/*`
- `/auth/*`
- `/products/*` sin prefijo `/api`
- `/notifications/*` sin prefijo `/api`

## Validaciones

Comandos usados para verificar este snapshot:

```bash
cd WebAdmin && npm run build
cd backend && node --check controllers/authController.js
cd backend && node --check routes/auth.js
```
