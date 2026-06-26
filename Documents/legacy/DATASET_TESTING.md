# Dataset de testing - SubastUP

Dataset creado sobre la base remota configurada en `backend/.env`.

## Resumen

| Recurso | Cantidad |
| --- | ---: |
| Registros | 15 |
| Usuarios aprobados | 12 |
| Usuarios pendientes | 3 |
| Medios de pago | 25 |
| Subastas | 15 |
| Productos | 20 |
| Productos pendientes de revision | 5 |
| Items de catalogo | 15 |
| Fotos en DB | 50 |
| Fotos en Supabase Storage | 50 |
| Asistentes | 150 |
| Pujas | 15 |

## Credenciales admin

| Rol | Email | Password |
| --- | --- | --- |
| Admin | `admin@subastup.com` | `Admin123` |
| Revisor | `revisor@subastup.com` | `Revisor123` |

## Usuarios aprobados

Todos usan password `Demo1234`.

| Email | Categoria |
| --- | --- |
| `lucia@subastup.com` | comun |
| `mateo@subastup.com` | especial |
| `sofia@subastup.com` | plata |
| `tomas@subastup.com` | oro |
| `valentina@subastup.com` | platino |
| `nicolas@subastup.com` | comun |
| `camila@subastup.com` | especial |
| `julian@subastup.com` | plata |
| `martina@subastup.com` | oro |
| `agustin@subastup.com` | platino |

## Usuarios pendientes

Todos usan password `Demo1234`.

| Email | Estado |
| --- | --- |
| `pendiente1@subastup.com` | pendiente |
| `pendiente2@subastup.com` | pendiente |
| `pendiente3@subastup.com` | pendiente |

## Subastas

Se crearon 3 subastas por categoria:

- `comun`
- `especial`
- `plata`
- `oro`
- `platino`

Cada subasta tiene:

- Producto vinculado.
- Catalogo.
- Item de catalogo.
- Detalle de item con moneda, fecha, hora, lugar y link de stream demo.
- Fotos en tabla `fotos`.
- Copia de fotos en Supabase Storage, bucket `subastup-demo`.
- Asistentes.
- Pujas en las subastas abiertas.

## Productos pendientes

Se crearon 5 productos en estado `pendiente` para probar el flujo de revision del WebAdmin.

## Script usado

```bash
cd backend
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> node prisma/reset_dataset_completo.js
```

El script es destructivo: borra tablas con `TRUNCATE ... RESTART IDENTITY CASCADE` antes de cargar el dataset.
