# Documentación — SubastUP

Documentación técnica del proyecto (backend Node/Express + Prisma + PostgreSQL, frontend Expo/React Native, panel WebAdmin React+Vite).

| Documento | Qué contiene |
| --- | --- |
| [`RESUMEN_PROYECTO.md`](RESUMEN_PROYECTO.md) | **Resumen integral**: arquitectura, flujo, árbol de archivos, capas, base de datos, endpoints, seed, despliegue y guía rápida. Hay versión **[PDF](RESUMEN_PROYECTO.pdf)**. |
| [`API_ENDPOINTS.md`](API_ENDPOINTS.md) | Referencia limpia de **todos los endpoints** (método, auth, request, response, errores). |
| [`../SubastUp_API_Endpoints_v3_FINAL.xlsx`](../SubastUp_API_Endpoints_v3_FINAL.xlsx) | Excel final consolidado con el mismo contrato que el backend y la referencia Markdown. |
| [`SubastUP.postman_collection.json`](SubastUP.postman_collection.json) | **Colección Postman** lista para importar (63 requests, token automático). |
| [`CAMBIOS_f8aa32b_a_HEAD.md`](CAMBIOS_f8aa32b_a_HEAD.md) | **Cambios** desde el commit `f8aa32b` hasta el actual, por tema. |
| [`DESPLIEGUE.md`](DESPLIEGUE.md) | Cómo **levantar cada cosa** en local y cómo **volver a Supabase + Railway/Render**. Tabla de variables de entorno. |
| [`RESEED_Y_DATOS.md`](RESEED_Y_DATOS.md) | Qué **datos crea el reseed** (cuentas, subastas, bienes, conversaciones) y cómo probar el flujo. |

## Arranque rápido (local)

```bash
# 1) Base de datos
docker run -d --name subastup-local-db -e POSTGRES_DB=subastup \
  -e POSTGRES_USER=subastup_user -e POSTGRES_PASSWORD=SubastUP2026 \
  -p 5433:5432 -v subastup-local-pgdata:/var/lib/postgresql/data postgres:16

# 2) Backend (crear backend/.env primero — ver DESPLIEGUE.md)
cd backend && npm install && npx prisma generate && npx prisma db push
node prisma/seed_demo.js && npm start            # http://localhost:3001

# 3) Frontend
cd frontend && npm install && npx expo start --clear

# 4) WebAdmin
cd WebAdmin && npm install && npm run dev         # http://localhost:5173
```

Login admin del WebAdmin: `admin@subastup.com` / `Admin1234`.
Reseed en caliente: `POST http://localhost:3001/api/dev/reseed?clave=subastup-demo`.

## Probar la API en Postman

1. En Postman: **Import** → arrastrá [`SubastUP.postman_collection.json`](SubastUP.postman_collection.json).
2. (Opcional) Ajustá la variable de colección `baseUrl` (por defecto `http://localhost:3001`).
3. Corré **Auth → Login** una vez: el token JWT se **guarda solo** en `{{token}}` y el resto de las requests lo heredan (`Authorization: Bearer`).
4. Para endpoints con `:id`, completá las variables `{{registroId}}`, `{{productoId}}`, `{{itemId}}`, `{{chatId}}`, `{{auctionId}}`, `{{notifId}}`, `{{metodoId}}` en la pestaña **Variables** de la colección.
5. Los endpoints de back-office requieren login como `admin`/`revisor`.
