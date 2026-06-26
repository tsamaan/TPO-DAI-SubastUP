# Despliegue y cómo levantar cada cosa

El proyecto tiene **tres piezas**:

| Pieza | Carpeta | Stack | Puerto local |
| --- | --- | --- | --- |
| **Backend** (API REST) | `backend/` | Node + Express + Prisma + PostgreSQL | `3001` |
| **Frontend** (app móvil/web) | `frontend/` | Expo / React Native | `8081` (Metro) / `19006` (web) |
| **WebAdmin** (panel admin) | `WebAdmin/` | React + Vite | `5173` |

> El backend usa el puerto **3001** en local porque el 3000 estaba ocupado por otra app en esta PC. En producción usa el puerto que asigne el host (`process.env.PORT`).

---

## Requisitos

- **Node.js 18+** y npm.
- **Docker** (para la base de datos local) — o una PostgreSQL local instalada.
- **Expo CLI** (se baja solo con `npx expo`).
- Para generar el PDF de la documentación: Google Chrome (ya instalado).

---

# A) Levantar TODO en LOCAL (estado actual)

## 1. Base de datos PostgreSQL local (Docker)

```bash
docker run -d --name subastup-local-db \
  -e POSTGRES_DB=subastup \
  -e POSTGRES_USER=subastup_user \
  -e POSTGRES_PASSWORD=SubastUP2026 \
  -p 5433:5432 \
  -v subastup-local-pgdata:/var/lib/postgresql/data \
  postgres:16
```

- Se publica en el puerto **5433** del host (para no chocar con un Postgres local en 5432).
- Si ya existe el contenedor: `docker start subastup-local-db`.

## 2. Configurar `backend/.env`

Crear `backend/.env` (no se versiona) con la base **local**:

```env
DATABASE_URL="postgresql://subastup_user:SubastUP2026@localhost:5433/subastup"
DIRECT_URL="postgresql://subastup_user:SubastUP2026@localhost:5433/subastup"

JWT_SECRET=subastup-secret-2026
JWT_EXPIRES_IN=7d

MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=<tu-usuario-mailtrap>
MAIL_PASS=<tu-pass-mailtrap>
MAIL_FROM=noreply@subastup.com

VERIFY_CODE_EXPIRY_MINUTES=15
PORT=3001
NODE_ENV=development
DEV_KEY=subastup-demo
```

> En local `DATABASE_URL` y `DIRECT_URL` apuntan a la misma URL (no hay pooler).

## 3. Instalar, crear el esquema y sembrar

```bash
cd backend
npm install
npx prisma generate
npx prisma db push        # crea las tablas (base + app_*) en la BD local
node prisma/seed_demo.js  # carga los datos de prueba
npm start                 # levanta la API en http://localhost:3001
```

Verificar: `GET http://localhost:3001/health` → `{ ok: true, ... }`.
Reseed en caliente: `POST http://localhost:3001/api/dev/reseed?clave=subastup-demo`.

## 4. Frontend (Expo)

```bash
cd frontend
npm install
npx expo start --clear
```

- Por defecto apunta a `http://192.168.0.137:3001`. Para otra IP/host:
  ```bash
  # Windows PowerShell
  $env:EXPO_PUBLIC_API_URL="http://localhost:3001"; npx expo start --clear
  ```
- **Web en esta PC:** `http://localhost:3001`.
- **Celular (misma WiFi):** `http://<IP-de-tu-PC>:3001` (la PC y el celu en la misma red).
- **Emulador Android:** `http://10.0.2.2:3001`.
- Si cambiás `BASE_URL`/env, levantá Metro con `--clear` para invalidar el bundle cacheado.

## 5. WebAdmin (panel administrador)

```bash
cd WebAdmin
npm install
npm run dev               # http://localhost:5173
```

- Por defecto pega al backend en `http://localhost:3001`. Para otro host:
  ```bash
  # Windows PowerShell
  $env:VITE_API_URL="http://localhost:3001"; npm run dev
  ```
- Login con `admin@subastup.com / Admin1234` (o `revisor@subastup.com / Revisor1234`). Solo rol `admin`/`revisor`.

---

# B) Volver a Supabase + un host en la nube (config original)

El repo **original** usaba la base en **Supabase** y el backend desplegado en la nube (el front apuntaba a **Render**: `https://tpo-dai-subastup.onrender.com`). El proceso para **Railway** es equivalente; abajo va para Railway, que es lo pedido.

## B.1 Base de datos en Supabase

En `backend/.env` (o en las variables del host) poné las dos URLs de tu proyecto Supabase. La plantilla original está en `backend/.env.example`:

```env
# Connection pooling (PgBouncer) — para la app en runtime
DATABASE_URL="postgresql://postgres.<REF>:<PASSWORD>@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
# Conexión directa — para migraciones / prisma db push
DIRECT_URL="postgresql://postgres.<REF>:<PASSWORD>@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
```

Claves de la diferencia respecto a local:
- **`DATABASE_URL`** usa el **pooler** en el puerto **6543** con `?pgbouncer=true` (Prisma lo necesita para no romper con prepared statements).
- **`DIRECT_URL`** usa la **conexión directa** en el puerto **5432** (Prisma la usa para `migrate`/`db push`).
- `<REF>` es el ref del proyecto Supabase; `<PASSWORD>` la contraseña de la base; la región (`aws-1-sa-east-1`) puede variar.

Crear el esquema en Supabase (una vez):

```bash
cd backend
npx prisma generate
npx prisma db push      # usa DIRECT_URL
node prisma/seed_demo.js   # opcional: cargar datos demo en Supabase
```

> El `datasource` de Prisma (`backend/prisma/schema.prisma`) ya está preparado: `provider = "postgresql"`, `url = env("DATABASE_URL")`, `directUrl = env("DIRECT_URL")`. **No hay que tocar el schema**, solo las variables de entorno.

## B.2 Backend en Railway

1. **New Project → Deploy from GitHub repo** y elegí el repo. Si el repo tiene varias carpetas, configurá el **Root Directory** en `backend`.
2. **Variables** (Settings → Variables): cargá todo lo del `.env` apuntando a Supabase: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `MAIL_*`, `VERIFY_CODE_EXPIRY_MINUTES`, `DEV_KEY`. **No** setees `PORT`: Railway lo inyecta y `server.js` ya hace `process.env.PORT || 3000`.
3. **Build**: Railway corre `npm install`. Prisma necesita generar el cliente, así que agregá uno de estos:
   - un script `"postinstall": "prisma generate"` en `backend/package.json`, **o**
   - un Build Command `npm install && npx prisma generate`.
4. **Start Command**: `npm start` (corre `node server.js`).
5. Generá un dominio público (Settings → Networking → Generate Domain). Esa URL `https://...railway.app` es la API.
6. Las tablas deben existir en Supabase (`prisma db push` del paso B.1). Railway **no** corre el push por vos salvo que lo agregues al build.

> Mismo procedimiento sirve para Render (que es lo que usaba el original): New Web Service → Root `backend` → Build `npm install && npx prisma generate` → Start `npm start` → variables iguales.

## B.3 Apuntar el Frontend al backend en la nube

`frontend/src/constants/api.js` tiene:

```js
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.137:3001';
```

Opciones:
- Levantar Expo con `EXPO_PUBLIC_API_URL=https://<tu-app>.railway.app`, **o**
- Cambiar el default de `BASE_URL` a esa URL (como tenía el original con la de Render).

## B.4 Apuntar el WebAdmin al backend en la nube

`WebAdmin/App.jsx` tiene:

```js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
```

Para build de producción, definí `VITE_API_URL=https://<tu-app>.railway.app` (variable de entorno en el build, o un `.env` con `VITE_API_URL=...`). El WebAdmin se publica con `npm run build` (genera `dist/`) en cualquier hosting estático (Vercel/Netlify/Render Static).

---

## Tabla de variables de entorno (backend)

| Variable | Para qué | Local | Supabase/Nube |
| --- | --- | --- | --- |
| `DATABASE_URL` | Conexión de runtime (Prisma) | `...localhost:5433/subastup` | pooler `:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Migraciones/`db push` | igual a la anterior | directa `:5432/postgres` |
| `JWT_SECRET` | Firma de los JWT | cualquier secreto | secreto fuerte |
| `JWT_EXPIRES_IN` | Vencimiento del token | `7d` | `7d` |
| `MAIL_HOST/PORT/USER/PASS/FROM` | SMTP (Mailtrap en dev) | Mailtrap sandbox | SMTP real o Mailtrap |
| `VERIFY_CODE_EXPIRY_MINUTES` | Vida del código de reset | `15` | `15` |
| `PORT` | Puerto del server | `3001` | lo asigna el host (no setear) |
| `DEV_KEY` | Clave de `/api/dev/*` | `subastup-demo` | poné una distinta o desactivá las rutas |

> **Seguridad:** `backend/.env` nunca se versiona (está en `.gitignore`). En la nube, `DEV_KEY` protege `POST /api/dev/reseed` (que **borra y recarga** la base): cambiá la clave o quitá el mount de `/api/dev` en `server.js` para producción.

## Puertos usados

| Servicio | Local |
| --- | --- |
| PostgreSQL (Docker) | `5433` → contenedor `5432` |
| Backend API | `3001` |
| Expo Metro / web | `8081` / `19006` |
| WebAdmin (Vite) | `5173` |
