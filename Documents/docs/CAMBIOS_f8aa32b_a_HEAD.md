# Cambios desde `f8aa32b` hasta `HEAD`

Punto de partida: `f8aa32b578600ed8d15b79252d308b9974d7d0ef` (estado del repo original, rama `desarrollo`).
Estado actual: `3c17831` (rama `main` de nuestro repo privado `FrancoMal/subastup-fix`).

Son **3 commits** que (1) ponen el backend a correr en local, (2) arreglan el flujo de subastas, (3) renombran las tablas satélite, (4) reescriben el seed y agregan endpoints de dev, (5) muestran el tag "finalizada" en el front, y (6) integran el panel **WebAdmin**.

```
3c17831  Seed: bienes pendientes de revisión y conversaciones de ejemplo para el panel admin
3b87470  Integra panel WebAdmin (Vredondo) contra el backend local
be78848  Backend local + fixes de flujo de subastas, seed y endpoints de dev
```

Diff total: **22 archivos, +2899 / −321**.

---

## 1. La causa raíz que estaba rota: faltaba provisionar `clientes` / `duenios`

Un usuario de la app vive en la tabla `registros` (auth). Pero la base de la cátedra exige, para **pujar**, una fila en `clientes` (`asistentes.cliente → clientes`) y, para **cargar productos**, una en `duenios` (`productos.duenio → duenios`). El flujo de registro/aprobación **nunca creaba esas filas**, así que la primera puja de cualquier usuario reventaba con una violación de foreign key. Ese era el "flujo que andaba mal".

**Solución:**

- **Nuevo:** `backend/utils/provision.js`
  - `obtenerEmpleadoSistema(db)`: resuelve (o crea) el empleado `Revisor técnico del sistema`, que actúa de verificador.
  - `asegurarRolesDominio(db, personaId, categoria)`: hace `upsert` de `clientes` + `duenios` para una persona. Idempotente; acepta un `tx` de transacción.

- `backend/controllers/authController.js` → `validateUser` ahora:
  1. Exige rol `admin`/`revisor` (antes cualquiera con token podía aprobar) → `403` si no.
  2. Al **aprobar**, dentro de una `prisma.$transaction`, cambia el estado **y** llama a `asegurarRolesDominio(tx, persona, categoria)`. Así la cuenta queda lista para pujar y cargar productos.

- `backend/controllers/pujasController.js` → `pujar` agrega una **red de seguridad**: si la persona aún no tiene fila en `clientes` (usuario aprobado antes de este fix), la crea antes de insertar el asistente.

---

## 2. Backend en local

- **Nuevo:** `backend/.env` (no versionado) apuntando a una PostgreSQL local (Docker, puerto 5433) y `PORT=3001` (el 3000 estaba ocupado por otra app). Ver [`DESPLIEGUE.md`](DESPLIEGUE.md).
- `backend/.env.example` se conserva con la configuración **original de Supabase** como plantilla.
- El `datasource` de Prisma (`postgresql`, `DATABASE_URL` + `DIRECT_URL`) no cambió: solo se cambia el valor de las variables.

---

## 3. Flujo de pujas más robusto

`backend/controllers/pujasController.js` → la regla "no participar en otra subasta activa al mismo tiempo" era demasiado agresiva: bloqueaba a un usuario por **cualquier** puja vieja en un ítem no cerrado (incluso las del seed, con `ultimaPuja` null). Ahora solo cuenta como "activa" si en otro ítem hay una puja cuyo **timer sigue corriendo** (`ultimaPuja` dentro de los últimos 60 s) y el ítem no está cerrado:

```js
const limiteActivo = new Date(Date.now() - TIMER_SEGUNDOS * 1000);
// ...
itemsCatalogo: { detalle: { is: { cerrado: false, ultimaPuja: { gte: limiteActivo } } } }
```

---

## 4. Tag "FINALIZADA"

En SubastUP el cierre marca el **ítem** como `cerrado` pero **no** cambia `subasta.estado`. Para que la lista muestre el tag:

- `backend/controllers/subastasController.js` → `formatearSubasta` deriva `estado: cerrado ? 'finalizada' : s.estado` y agrega el booleano `cerrado` a la respuesta.
- `frontend/.../AuctionListScreen.js` y `AuctionListAuthScreen.js` → calculan `finalizado` con `normalizarEstadoSubasta(estado, cerrado)` y dibujan un overlay oscuro con el texto **"FINALIZADA"** (`Ionicons checkmark-done-outline`).

---

## 5. Tablas satélite renombradas a `app_*`

`backend/prisma/schema.prisma` → para diferenciarlas de las tablas de `estructurabasica.sql`, las **17 tablas agregadas por la app** cambiaron su `@@map` físico a prefijo `app_` (los modelos de Prisma y los controladores **no** cambian, solo el nombre de la tabla en la base):

`app_registros`, `app_logins`, `app_fotosdni`, `app_metodospago`, `app_tarjetas`, `app_cuentasbancarias`, `app_cheques`, `app_notificaciones`, `app_pushtokens`, `app_suscripcionessubasta`, `app_conversaciones`, `app_mensajes`, `app_perfiles_contacto`, `app_productos_detalle`, `app_items_catalogo_detalle`, `app_pujos_detalle`, `app_devoluciones`.

Las **16 tablas base** de la cátedra quedan intactas: `paises, personas, empleados, sectores, seguros, clientes, duenios, subastadores, subastas, productos, fotos, catalogos, itemscatalogo, asistentes, pujos, registrodesubasta`.

---

## 6. Seed reescrito + endpoints de desarrollo

- `backend/prisma/seed_demo.js` reescrito. Exporta `seedDemo(prisma)` y `resetAndSeed(prisma)` (trunca todo y siembra). Roster amplio con casos especiales y 14 subastas (abiertas / programadas / finalizadas) + bienes pendientes + conversaciones. Detalle completo en [`RESEED_Y_DATOS.md`](RESEED_Y_DATOS.md).
- **Nuevo:** `backend/controllers/devController.js` + `backend/routes/dev.js`:
  - `POST /api/dev/reseed?clave=subastup-demo` → reinicia la base al seed.
  - `GET /api/dev/db?clave=subastup-demo` → visor de solo lectura (conteos, usuarios, subastas).
- `backend/server.js` → monta `app.use('/api/dev', require('./routes/dev'))`.
- `backend/routes/auth.js` → expone `PUT /api/auth/asignar-categoria` y `GET /api/auth/pendientes` (este último, nuevo en `authController`).

---

## 7. Frontend apuntando a local

`frontend/src/constants/api.js` → `BASE_URL` pasa de la URL de Render a:

```js
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.137:3001';
```

Configurable con `EXPO_PUBLIC_API_URL` (web local, celular en la misma WiFi, emulador, ngrok…).

---

## 8. Panel WebAdmin integrado (de la rama `Vredondo`)

Se copió el panel `WebAdmin/` (React + Vite) desde `origin/Vredondo` **sin mergear ramas** (`git checkout origin/Vredondo -- WebAdmin`) y se adaptó para que funcione contra nuestro backend:

- `BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'`.
- Rutas adaptadas a las del backend actual: `/api/chat*` → `/api/chats*`, `/api/productos/revision/pendientes` → `/api/products/pending-review`, `/api/productos/:id/rechazar` → `/api/products/:id/reject`, `/api/pagos/pendientes-verificacion` → `/api/settings/payment-methods/pending-verification`, `/api/pagos/:id/verificar` → `/api/settings/payment-methods/:id/verify`.
- `index.html`: `/src/main.jsx` → `/main.jsx`.
- 4 pestañas: **Usuarios** (pendientes/aprobar/rechazar/categoría), **Mensajes** (chats), **Bienes** (productos pending-review/reject), **Métodos de pago** (pending-verification/verify). El login solo admite rol `admin`/`revisor`.

El commit `3c17831` agrega al seed los **bienes pendientes** y **conversaciones** de ejemplo para que esas pestañas no aparezcan vacías.

---

## Bugs conocidos (no introducidos por estos cambios, pendientes)

- `GET /api/auctions/:id/share-link`: el controlador lee `req.params.itemId` pero la ruta declara `:id` → `parseInt(undefined)` = `NaN`. Inofensivo (responde `404`), pero conviene unificar el nombre del parámetro.
- Otros pendientes del análisis original están en [`../TODO.md`](../TODO.md).
