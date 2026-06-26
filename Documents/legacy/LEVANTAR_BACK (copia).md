# SubastUP - Guia para levantar backend y WebAdmin

Documento normalizado contra el estado actual del repo.

Fuente de endpoints: `Documents/API_ENDPOINTS.md` y `SubastUp_API_Endpoints_v3_FINAL.xlsx`.

## Stack actual

- Backend: Node.js + Express + Prisma.
- Base de datos local: PostgreSQL 16 por Docker Compose.
- API publica: `https://tpo-dai-subastup.onrender.com`.
- API local opcional: `http://localhost:3000`.
- WebAdmin local: `http://127.0.0.1:5173`.
- WebAdmin apunta por defecto al mismo backend publico que la app movil.

## 1. Levantar PostgreSQL

Desde `backend/`:

```bash
cd backend
docker compose up -d
```

El contenedor esperado es `subastup-db`, con PostgreSQL en `localhost:5432`.

Datos locales del `docker-compose.yml`:

```text
POSTGRES_DB=subastup
POSTGRES_USER=subastup_user
POSTGRES_PASSWORD=SubastUP2026
```

## 2. Configurar backend

Crear o revisar `backend/.env`:

```env
DATABASE_URL="postgresql://subastup_user:SubastUP2026@localhost:5432/subastup?schema=public"
JWT_SECRET=subastup-secret-2026
JWT_EXPIRES_IN=7d
PORT=3000

MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=<usuario_de_mailtrap>
MAIL_PASS=<password_de_mailtrap>
MAIL_FROM=noreply@subastup.com

VERIFY_CODE_EXPIRY_MINUTES=15
NODE_ENV=development
```

Instalar dependencias y generar Prisma:

```bash
cd backend
npm install
npm run db:generate
```

Si la base esta vacia y necesitas crear estructura desde Prisma:

```bash
npm run db:push
```

Si necesitas usuario de prueba:

```bash
npm run db:seed
```

Credenciales seed:

```text
Email: cuentademprendimiento10@gmail.com
Password: Admin123
```

Para poder entrar al WebAdmin, ese registro debe tener `rol = 'admin'` o `rol = 'revisor'` y `estado = 'aprobado'`.

## 3. Levantar backend

```bash
cd backend
npm run dev
```

Salida esperada:

```text
Conectado a PostgreSQL: subastup
Servidor corriendo en http://localhost:3000
```

Probar health:

```bash
curl http://localhost:3000/health
```

Probar login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cuentademprendimiento10@gmail.com","password":"Admin123"}'
```

## 4. Levantar WebAdmin

En otra terminal:

```bash
cd WebAdmin
npm install
npm run dev
```

Abrir:

```text
http://127.0.0.1:5173/
```

Para forzar otro backend, usar `VITE_API_URL`:

```bash
cd WebAdmin
VITE_API_URL=http://localhost:3000 npm run dev
```

## 5. Conexion WebAdmin Backend

`WebAdmin/App.jsx` usa:

```js
const API_URL = import.meta.env.VITE_API_URL || 'https://tpo-dai-subastup.onrender.com'
```

Endpoints administrativos usados:

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

## 6. Reglas de normalizacion

- No usar rutas viejas sin `/api`, por ejemplo `/auth/login`.
- No usar nombres viejos en castellano para la API actual, por ejemplo `/api/productos`, `/api/pagos`, `/api/chat`.
- La fuente de verdad de endpoints es `Documents/API_ENDPOINTS.md`.
- El Excel `SubastUp_API_Endpoints_v3_FINAL.xlsx` debe mantenerse igual que `Documents/API_ENDPOINTS.md`.
