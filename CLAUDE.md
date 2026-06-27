# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**SubastUP** is an online auction platform (TPO for DAI at UADE). It has three pieces:

| Piece | Folder | Stack | Local port |
|---|---|---|---|
| Backend API | `backend/` | Node + Express + Prisma + PostgreSQL | `3001` |
| Mobile/web app | `frontend/` | Expo / React Native | `8081` (Metro) / `19006` (web) |
| Admin panel | `WebAdmin/` | React + Vite | `5173` |

---

## Commands

### Backend

```bash
cd backend
npm install
npm run dev           # nodemon — hot reload
npm start             # production start

# Database
npx prisma generate   # regenerate client after schema changes
npx prisma db push    # apply schema to DB (uses DIRECT_URL)
npx prisma studio     # GUI for the DB
node prisma/seed_demo.js   # seed demo data (destructive)
```

### Frontend (Expo)

```bash
cd frontend
npm install
npx expo start --clear        # Metro bundler (clear cache)
npx expo start --android
npx expo start --ios
npx expo start --web
```

### WebAdmin (Vite)

```bash
cd WebAdmin
npm install
npm run dev       # http://localhost:5173
npm run build     # outputs to dist/
```

---

## Local development setup

**1. Start PostgreSQL (Docker):**
```bash
docker run -d --name subastup-local-db \
  -e POSTGRES_DB=subastup \
  -e POSTGRES_USER=subastup_user \
  -e POSTGRES_PASSWORD=SubastUP2026 \
  -p 5433:5432 \
  postgres:16
# To restart later: docker start subastup-local-db
```

**2. Create `backend/.env`** (not versioned):
```env
DATABASE_URL="postgresql://subastup_user:SubastUP2026@localhost:5433/subastup"
DIRECT_URL="postgresql://subastup_user:SubastUP2026@localhost:5433/subastup"
JWT_SECRET=subastup-secret-2026
JWT_EXPIRES_IN=7d
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=<mailtrap-user>
MAIL_PASS=<mailtrap-pass>
MAIL_FROM=noreply@subastup.com
VERIFY_CODE_EXPIRY_MINUTES=15
PORT=3001
NODE_ENV=development
DEV_KEY=subastup-demo
```

**3. Init and seed:**
```bash
cd backend && npx prisma generate && npx prisma db push && node prisma/seed_demo.js
```

**4. Reseed (wipes everything and re-creates demo data):**
```bash
POST http://localhost:3001/api/dev/reseed?clave=subastup-demo
# or: node prisma/seed_demo.js
```

**5. Override the backend URL for the frontend** (when testing on a physical device):
```bash
EXPO_PUBLIC_API_URL="http://<your-ip>:3001" npx expo start --clear
```

By default `frontend/src/constants/api.js` points to `https://tpo-dai-subastup.onrender.com` (production on Render). For WebAdmin, the env var is `VITE_API_URL`.

---

## Architecture

### Backend (`backend/`)

- **Entry point:** `server.js` — mounts all routes under `/api/*` and connects Prisma.
- **Routes → Controllers** pattern: `routes/*.js` define Express routers; `controllers/*.js` hold the logic.
- **Auth:** JWT via `middleware/auth.js`. Token payload: `{ registroId, personaId, email }`. Protected routes import and apply this middleware.
- **Database:** Prisma ORM with PostgreSQL. Schema in `backend/prisma/schema.prisma`.
- **Images:** stored as `Bytes` (binary) directly in the DB (`Fotos`, `FotosDNI`, `Cheques`).
- **Email:** `services/mailService.js` + `services/emailTemplates.js` via Nodemailer (Mailtrap in dev).
- **Dev routes:** `routes/dev.js` exposes `/api/dev/reseed` and `/api/dev/db` protected by `DEV_KEY`. Remove or guard in production.

### Database schema (two layers)

- **Base tables** (cátedra's original schema): `paises`, `personas`, `empleados`, `sectores`, `seguros`, `subastadores`, `clientes`, `duenios`, `subastas`, `productos`, `fotos`, `catalogos`, `itemscatalogo`, `asistentes`, `pujos`, `registrodesubasta`, `devoluciones`.
- **App extension tables** (prefixed `app_*`): `app_registros`, `app_logins`, `app_fotosdni`, `app_metodospago`, `app_tarjetas`, `app_cuentasbancarias`, `app_cheques`, `app_notificaciones`, `app_pushtokens`, `app_suscripcionessubasta`, `app_conversaciones`, `app_mensajes`, `app_perfiles_contacto`, `app_productos_detalle`, `app_items_catalogo_detalle`, `app_pujos_detalle`.
- Do **not** modify the base-layer tables — they belong to the university assignment. New app logic goes into `app_*` tables.

### User roles and registration flow

- Roles: `usuario`, `revisor`, `admin` (stored in `app_registros.rol`).
- Registration creates a `personas` + `app_registros` row with `estado = 'pendiente'`. An admin must approve before the user can log in.
- After approval the user also gets rows in `clientes` and `duenios`, allowing them to both bid and list products.
- Bid access is gated by category (`comun < especial < plata < oro < platino`) — a user can only bid in auctions matching or below their category.

### Frontend (`frontend/`)

- **State management:** Zustand stores in `src/store/` (`authStore.js`, `settingsStore.js`, `registerStore.js`).
- **Navigation:** React Navigation v7. `AppNavigator.js` gates unauthenticated vs. authenticated screen stacks. `TabNavigator.js` defines the bottom tabs for logged-in users.
- **API client:** `src/services/api.js` (axios wrapper). All endpoint paths centralized in `src/constants/api.js`.
- **Theme:** `src/context/ThemeContext.js` — dark/light mode; brand color is `#8b0000` (dark red).
- **Real-time:** `src/hooks/useSocket.js` — Socket.IO client for live bid updates.
- Screen naming convention: `XxxScreen.js` under `src/screens/` grouped by domain (`auth/`, `auction/`, `chat/`, `payments/`, `profile/`, `tabs/`).

### WebAdmin (`WebAdmin/`)

- Single-file React app (`App.jsx`) built with Vite. No router — section switching is internal state.
- Only `admin` and `revisor` roles can log in. Credentials from seed: `admin@subastup.com / Admin1234`, `revisor@subastup.com / Revisor1234`.
- API base from `import.meta.env.VITE_API_URL || 'http://localhost:3001'`.

---

## Key conventions

- All API responses follow `{ ok: boolean, ... }` — check `ok` first.
- All API paths use `/api` prefix except `/health`.
- `routes/perfil.js` and `routes/estadisticas.js` exist but are **not mounted** in `server.js`; their functionality is under `/api/users/me*`.
- The bid timer is 60 seconds from the last bid; when it expires the item closes and the highest bid wins.
- Source-of-truth docs: `Documents/docs/API_ENDPOINTS.md` (full endpoint contract), `Documents/docs/RESEED_Y_DATOS.md` (demo accounts and seed details), `Documents/docs/DESPLIEGUE.md` (deploy guide).

---

## Demo accounts (after seed)

| Email | Password | Role/state |
|---|---|---|
| `admin@subastup.com` | `Admin1234` | admin |
| `revisor@subastup.com` | `Revisor1234` | revisor |
| `demo1@subastup.com` – `demo6@subastup.com` | `Demo1234` | approved users, varying categories |
| `sinpago@subastup.com` | `Demo1234` | approved but payment method unverified — can't bid |
| `pendiente@subastup.com` | *(can't log in)* | registration pending |
