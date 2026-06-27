# Documentacion de SubastUP

Esta carpeta queda normalizada con una fuente de verdad clara para el codigo actual del repo.

## Fuente de verdad

| Archivo | Uso |
| --- | --- |
| `docs/README.md` | Entrada principal a la documentacion tecnica completa. |
| `docs/RESUMEN_PROYECTO.md` | Arquitectura, capas, flujo de negocio, base de datos, seed y guia de cambios. |
| `docs/API_ENDPOINTS.md` | Contrato detallado de todos los endpoints montados en `backend/server.js`. |
| `API_ENDPOINTS.md` | Tabla canonica resumida de endpoints, sincronizada con el Excel final. |
| `SubastUp_API_Endpoints_v3_FINAL.xlsx` | Excel final consolidado: endpoints viejos corregidos al contrato real + endpoints nuevos. |
| `docs/SubastUP.postman_collection.json` | Coleccion Postman con los mismos endpoints. |
| `docs/DESPLIEGUE.md` | Como levantar backend, app Expo y WebAdmin. |
| `docs/RESEED_Y_DATOS.md` | Datos demo, cuentas de prueba y endpoints de reseed. |
| `estructurabasica.sql` | Script base de la catedra. |
| `flujodefotos.md` | Notas especificas del flujo de fotos. |

## Regla de normalizacion

- Los endpoints documentados salen de `backend/server.js` + `backend/routes/*`.
- Todo path de API usa prefijo `/api`, salvo `/health`.
- `routes/perfil.js` y `routes/estadisticas.js` existen en el repo pero no estan montados; su funcionalidad real se expone por `/api/users/me*`.
- Los documentos historicos, avances, copias y reportes previos se guardan en `legacy/` para consulta, pero no son la fuente de verdad.

## Contrato actual

El backend monta estas areas:

- `/api/auth`
- `/api/users`
- `/api/auctions`
- `/api/products`
- `/api/bids`
- `/api/chats`
- `/api/notifications`
- `/api/settings/payment-methods`
- `/api/settings`
- `/api/help`
- `/api/dev`
- `/health`

Total documentado: 65 endpoints.
