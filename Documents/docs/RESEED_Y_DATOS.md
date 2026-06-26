# Seed y reseed — datos de prueba

Toda la data de prueba vive en `backend/prisma/seed_demo.js` y se puede reiniciar de dos formas:

| Forma | Cómo |
| --- | --- |
| **Endpoint** (recomendado) | `POST http://localhost:3001/api/dev/reseed?clave=subastup-demo` |
| **CLI** | `cd backend && node prisma/seed_demo.js` |

> La clave del endpoint es `DEV_KEY` (`.env`), por defecto `subastup-demo`. También se puede pasar por header `x-dev-key`.

El reseed **trunca todas las tablas del esquema `public`** (base de la cátedra + tablas `app_*`, excepto `_prisma_migrations`) con `TRUNCATE ... RESTART IDENTITY CASCADE` y vuelve a sembrar desde cero. Es idempotente: siempre deja el mismo estado.

Para inspeccionar el resultado sin volcar imágenes: `GET http://localhost:3001/api/dev/db?clave=subastup-demo`.

## Resumen de lo que crea

```json
{ "staff": 2, "cuentas": 11, "subastas": 14, "finalizadas": 2, "bienesPendientes": 3, "conversaciones": 2 }
```

### 0. Equipo / sistema

Una persona **"Equipo SubastUP"** (documento `90000000`) que cumple dos roles:
- **Empleado** con cargo `Revisor técnico del sistema` → es el **verificador** de todos los clientes/dueños y el revisor de los productos.
- **Subastador** (`matrícula DEMO-001`) → conduce todas las subastas.

### 1. Staff (back-office)

| Email | Password | Rol | Para qué sirve |
| --- | --- | --- | --- |
| `admin@subastup.com` | `Admin1234` | `admin` | Aprobar/rechazar cuentas, asignar categoría, verificar pagos, aprobar/rechazar bienes, responder mensajes. Es el login del **WebAdmin**. |
| `revisor@subastup.com` | `Revisor1234` | `revisor` | Mismas tareas de back-office que admin. |

### 2. Cuentas de usuario (todas con password `Demo1234`)

| Email | Nombre | Categoría | Caso | Qué demuestra |
| --- | --- | --- | --- | --- |
| `vendedor@subastup.com` | Vera Vendedora | platino | vendedor | **Dueño de todos los productos** en subasta (así cualquier otro puede pujar sin ser dueño del artículo). |
| `demo1@subastup.com` | Lucía Común | comun | completo | Flujo completo, pago verificado. Ganadora de una subasta finalizada. |
| `demo2@subastup.com` | Mateo Especial | especial | completo | Flujo completo. |
| `demo3@subastup.com` | Sofía Oro | oro | completo | Flujo completo. Ganador de la otra finalizada. |
| `demo4@subastup.com` | Tomás Plata | plata | completo | Flujo completo. |
| `demo5@subastup.com` | Pía Platino | platino | completo | Flujo completo (categoría máxima). |
| `demo6@subastup.com` | Igor Platino | platino | completo | Segundo postor para las subastas altas (probar "varias cuentas pujando"). |
| `sinpago@subastup.com` | Sara SinPago | especial | sinpago | Tarjeta **sin verificar** → mira subastas pero **no puede pujar** (`403 METODO_PAGO_REQUERIDO`). |
| `pendiente@subastup.com` | Pedro Pendiente | comun | pendiente | Registro `pendiente` → **no puede loguear** hasta que un admin lo apruebe (`403`). |
| `rechazado@subastup.com` | Rita Rechazada | comun | rechazado | Registro `rechazado` → **no puede loguear** (`403`). |
| `bloqueado@subastup.com` | Bruno Bloqueado | oro | bloqueado | Login bloqueado por 5 intentos fallidos → **no puede loguear** (`403`). |

**Lo que recibe cada cuenta aprobada** (todas menos `pendiente` y `rechazado`):
- Fila en `clientes` (puede pujar) y en `duenios` (puede cargar productos), con el verificador del sistema.
- `perfiles_contacto` con teléfono.
- Un método de pago tipo **tarjeta**, verificado (salvo `sinpago`, que queda sin verificar).

`pendiente` y `rechazado` **no** reciben identidades de dominio ni método de pago.

### 3. Subastas (14)

Dueño de todos los productos: `vendedor@subastup.com`. Cada subasta tiene 1 catálogo, 1 producto con 3 fotos, 1 ítem y su detalle (moneda, timer, etc.).

**Abiertas — 2 por categoría (10):**

| Artículo | Categoría | Precio base |
| --- | --- | --- |
| Reloj Omega vintage | comun | 120.000 ARS |
| Bicicleta de ruta de carbono | comun | 65.000 ARS |
| Guitarra Gibson de colección | especial | 850.000 ARS |
| Colección de vinilos de jazz | especial | 180.000 ARS |
| Cámara Leica analógica | plata | 420.000 ARS |
| Reloj de bolsillo suizo | plata | 300.000 ARS |
| Moneda de oro coleccionable | oro | 1.500 USD |
| Lingote conmemorativo de oro | oro | 2.500 USD |
| Cuadro firmado original | platino | 9.000 USD |
| Escultura de bronce | platino | 12.000 USD |

**Programadas — futuras, no dejan pujar (2):**

| Artículo | Categoría | Precio base | Estado |
| --- | --- | --- | --- |
| Vajilla de porcelana inglesa | comun | 90.000 ARS | `programada` |
| Joya art déco con esmeraldas | especial | 500.000 ARS | `programada` |

**Finalizadas — con ganador ya definido, muestran el tag "FINALIZADA" (2):**

| Artículo | Categoría | Resultado |
| --- | --- | --- |
| Auto a escala de colección | comun | Ganó **demo1** ($90.000) vs demo2 ($82.000) |
| Primera edición de libro raro | oro | Ganó **demo3** (US$3.500) vs demo5 (US$3.200) |

Cada finalizada crea: 2 asistentes, 2 pujas (ganadora + perdedora), ítem `cerrado`, y una **notificación** "¡Ganaste la subasta!" para el ganador.

### 4. Bienes pendientes de revisión (3)

Aparecen en la pestaña **"Bienes"** del WebAdmin (productos en estado `pendiente`, con 2 fotos cada uno).

| Bien | Dueño | ¿Con chat? |
| --- | --- | --- |
| Lámpara art déco restaurada | demo1 | Sí |
| Colección de estampillas raras | demo2 | No |
| Reloj de péndulo de madera | demo4 | Sí |

### 5. Conversaciones de ejemplo (2)

Los bienes marcados "con chat" generan una conversación admin ↔ dueño con 3 mensajes, visibles en la pestaña **"Mensajes"** del WebAdmin (logueado como `admin@subastup.com`).

## Probar el flujo "varias cuentas pujando hasta que haya un ganador"

1. Reseed: `POST /api/dev/reseed?clave=subastup-demo`.
2. Logueá `demo5@subastup.com` y `demo6@subastup.com` (dos dispositivos/ventanas).
3. Entrá ambos a la misma subasta abierta (p. ej. *Cuadro firmado original*, platino).
4. Pujen alternadamente. El **timer de 60 s** se reinicia con cada puja; cuando expira sin nuevas pujas, el ítem se cierra y el de la puja más alta queda **ganador**.
5. El estado de cierre se ve consultando `GET /api/bids/:itemId/status`.

> Las cuentas `comun`/`plata`/`oro` no pueden pujar en categorías superiores a la suya; `platino` puede en todas. Por eso `demo5` y `demo6` (platino) sirven para cualquier subasta.
