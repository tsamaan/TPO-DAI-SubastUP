# Contrato técnico del backend

## Estado

Documento de referencia para el rediseño PostgreSQL. Las rutas HTTP se preservan; el cambio es interno al modelo de persistencia.

## Tablas base inmutables

`paises`, `personas`, `empleados`, `sectores`, `seguros`, `clientes`, `duenios`, `subastadores`, `subastas`, `productos`, `fotos`, `catalogos`, `itemscatalogo`, `asistentes`, `pujos` y `registrodesubasta`, según `estructurabasica.sql`.

## Tablas adicionales requeridas

- `perfiles_contacto`: teléfono de una persona.
- `productos_detalle`: nombre, estado, revisor, motivo de rechazo y dirección de envío de un producto.
- `items_catalogo_detalle`: moneda, agenda, aceptación, timer, cierre y stream de un ítem.
- `pujas_detalle`: fecha de una puja.
- Las tablas ya agregadas de autenticación, pagos, notificaciones y chat permanecen como extensiones.

## Endpoints preservados

La lista completa y normalizada esta en `Documents/API_ENDPOINTS.md` y en `SubastUp_API_Endpoints_v3_FINAL.xlsx`. Esas dos fuentes deben coincidir con `backend/server.js` y `backend/routes/*`.

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

Rutas obsoletas que no forman parte del contrato actual: `/api/chat/*`, `/api/productos/*`, `/api/pagos/*`, `/auth/*` sin prefijo `/api`.

## Regla de migración

No ejecutar `prisma db push` ni migraciones hasta validar el schema final contra una copia de la base de datos. El seed demo solo se ejecutará después de esa validación.

## Validación aplicada

- `npx prisma validate`: schema válido.
- Controladores: sintaxis JavaScript validada con `node --check`.
- No se ejecutó `db push`, migraciones ni cambios contra Supabase.

## Aplicación controlada de extensiones

El archivo `backend/prisma/crear_extensiones.sql` crea únicamente las cuatro tablas satélite con `CREATE TABLE IF NOT EXISTS`. No contiene `ALTER TABLE`, `DROP`, `db push` ni migraciones sobre las tablas base.

## Estado de la base de pruebas

- Las tablas satélite fueron creadas y verificadas en PostgreSQL.
- La reconciliación de tablas base se ejecutó solo porque la base de pruebas estaba vacía.
- Datos demo verificados: 4 usuarios, 4 productos, 4 ítems y 4 pujas con sus metadatos de fecha.

## Contrato de imágenes

- El frontend envía imágenes como base64 por JSON.
- El contrato recomendado para productos es `fotos: [{ base64, mimeType }]`.
- Por compatibilidad, el backend todavía acepta `fotosBase64: string[]`.
- El backend convierte base64 a `Buffer` y persiste en PostgreSQL como `Bytes`/`bytea`.
- La base no guarda strings base64 para fotos de productos; guarda bytes.
- Al responder, el backend convierte los bytes a base64 y devuelve `{ id, mimeType, foto }`.
- El frontend usa helpers para convertir base64 a `Image source`.
- Límite actual: máximo 12 fotos por producto y máximo 2MB por imagen luego de compresión.

Helpers:

- Backend: `backend/utils/imagenes.js`.
- Frontend: `frontend/src/utils/images.js`.
