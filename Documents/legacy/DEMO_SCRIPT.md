# Demo Script — SubastUP

Guía rápida para demostrar el proyecto en vivo.

## 1. Usuarios demo

Password para todos:

```txt
Demo1234
```

Usuarios:

- `demo1@subastup.com`
  - Usuario comprador/vendedor demo.
  - Categoría según seed: usada para probar subastas comunes.
  - Tiene método de pago verificado.
- `demo2@subastup.com`
  - Usuario comprador demo alternativo.
  - Sirve para probar competencia de pujas contra demo1.
  - Tiene método de pago verificado.
- `demo3@subastup.com`
  - Usuario demo de categoría superior.
  - Sirve para probar subastas especiales/oro/plata según datos cargados.
  - Tiene método de pago verificado.
- `demo4@subastup.com`
  - Usuario demo adicional.
  - Sirve para validar historial, navegación y restricciones.
  - Tiene método de pago verificado.

## 2. Preparación antes de la demo

Backend público:

```txt
https://tpo-dai-subastup.onrender.com
```

Verificar health:

```bash
curl -s https://tpo-dai-subastup.onrender.com/health
```

Respuesta esperada:

```json
{ "ok": true }
```

Si Render está dormido, el primer request puede tardar cerca de 50 segundos.

## 3. Seeds recomendados

Usar hotspot si la red UADE bloquea Supabase.

```bash
cd backend
node prisma/normalizar_subastas_unitarias.js
node prisma/seed_demo.js
node prisma/seed_fotos_demo.js
```

Resultados esperados aproximados:

- Normalización sin errores.
- Usuarios demo reutilizados o creados.
- Métodos de pago verificados.
- Subastas activas y programadas.
- Productos con fotos.
- Pujas demo.
- Fotos guardadas como `Bytes`.

Verificar en Supabase:

- `registros`: al menos 5, aprobados.
- `subastas`: al menos 3.
- `productos`: al menos 4.
- `fotos`: registros con bytes no vacíos.

## 4. Demo de subastas y calendario

### Subastas listadas

1. Abrir la app.
2. Entrar a `Pujar`.
3. Ver cards.
4. Cada card representa:

```txt
una subasta = un artículo
```

La card debe mostrar:

- Imagen.
- Nombre del artículo.
- Descripción corta.
- Moneda.
- Estado visual.

### Subasta próxima

1. Buscar una card con overlay `Proximamente`.
2. Ver fecha y hora.
3. Tocar `Agregar recordatorio`.
4. Si el usuario está logueado:
   - Debe crear recordatorio.
   - Debe aparecer notificación en campanita.
5. Si no está logueado:
   - Debe pedir iniciar sesión.

### Calendario

1. Ir a `Calendario`.
2. Confirmar que los días con subastas están marcados.
3. Tocar un día marcado.
4. Ver la lista inferior de subastas del día.
5. Tocar una subasta.
6. Debe abrir el detalle correcto del artículo.

## 5. Demo de pujas

### Usuario demo1 realiza puja

1. Iniciar sesión con:

```txt
demo1@subastup.com / Demo1234
```

2. Entrar a una subasta activa.
3. Ver:
   - Fotos.
   - Nombre.
   - Descripción.
   - Precio base.
   - Puja actual.
   - Timer.
4. Tocar participar/pujar.
5. Ingresar monto válido.

Reglas de monto:

- Mínimo: mejor oferta + 1% del precio base.
- Máximo: mejor oferta + 20% del precio base.
- Oro y Platino no tienen máximo.

6. Confirmar puja.
7. Ver que el precio actual se actualiza.

### Usuario demo2 supera la puja

1. Cerrar sesión.
2. Iniciar sesión con:

```txt
demo2@subastup.com / Demo1234
```

3. Entrar a la misma subasta.
4. Confirmar que ve la puja de demo1.
5. Pujar más alto.
6. Confirmar que el timer se reinicia solo por la nueva puja.

### Cierre de subasta

Cuando el timer llega a cero:

- El backend marca la subasta como cerrada.
- Marca la puja ganadora.
- Crea notificación `subasta_ganada`.
- Crea o reasigna chat del producto al ganador.
- Envía mensaje automático al chat.
- Envía mail al ganador por Mailtrap.

## 6. Demo de restricciones de puja

### Sin método de pago

1. Usar un usuario sin método verificado o desactivar método en DB.
2. Intentar pujar.
3. Debe aparecer popup de método de pago requerido.

### Categoría insuficiente

1. Usar usuario de categoría baja.
2. Entrar a subasta de categoría mayor.
3. Puede ver el detalle.
4. Al intentar participar, debe aparecer popup de categoría insuficiente.

### Dueño del artículo

1. Iniciar sesión con el dueño del artículo.
2. Entrar al detalle de su propia subasta.
3. Intentar participar.
4. Debe aparecer:

```txt
No podés pujar por este artículo porque vos lo publicaste.
```

## 7. Demo de carga de producto

1. Iniciar sesión.
2. Ir a `Cargar producto`.
3. Completar formulario.
4. Subir fotos.
5. Enviar.

Resultado esperado:

- Producto creado en estado `pendiente`.
- Fotos guardadas.
- Chat creado automáticamente.
- Mensaje automático inicial.
- Notificación en campanita.

Luego:

1. Ir a `Información`.
2. Tocar `Tus artículos en subasta`.
3. Ver card del producto según estado.
4. Entrar al detalle.
5. Ver fotos, descripción y estado.

## 8. Demo de seguimiento de artículo

Estados esperados:

- `pendiente`
- `aprobado`
- `esperando_usuario`
- `confirmado`
- `rechazado`
- `devuelto`

Si el producto está en `esperando_usuario`:

- Debe mostrar propuesta.
- Debe mostrar precio base.
- Debe permitir aceptar o rechazar.

Si acepta:

- Estado pasa a `confirmado`.
- Se crea mensaje automático.
- Se crea notificación.

Si rechaza:

- Estado pasa a `devuelto`.
- Se crea mensaje automático.
- Se crea notificación.

## 9. Demo de chats

1. Ir a `Mensajes`.
2. Ver lista de conversaciones reales.
3. Entrar a un chat.
4. Ver historial.
5. Enviar mensaje.
6. Salir y volver.
7. Confirmar que el mensaje persiste.

Nota:

- El socket no es requisito para que el chat funcione.
- Si falla WebSocket, la pantalla debe seguir funcionando por HTTP.

## 10. Demo de notificaciones

1. Generar una acción:
   - Recordatorio.
   - Producto cargado.
   - Producto aprobado/rechazado.
   - Subasta ganada.
2. Ver contador en campanita.
3. Abrir campanita.
4. El contador debe desaparecer.
5. La notificación debe quedar acumulada.
6. Deslizar notificación para eliminarla.

## 11. Demo de métodos de pago

1. Ir a `Configuración`.
2. Entrar a métodos de pago.
3. Ver listado real.
4. Agregar método.
5. Volver y verificar que aparece.
6. Entrar a detalle.
7. Eliminar método.
8. Confirmar que desaparece.

## 12. Comandos de emergencia

### Backend dormido

```bash
curl -s https://tpo-dai-subastup.onrender.com/health
```

Esperar hasta 60 segundos.

### Regenerar Prisma Client

```bash
cd backend
npx prisma generate
```

No actualizar Prisma a v7.

### Recargar datos demo

```bash
cd backend
node prisma/normalizar_subastas_unitarias.js
node prisma/seed_demo.js
node prisma/seed_fotos_demo.js
```

### Ver subastas públicas

```bash
curl -s https://tpo-dai-subastup.onrender.com/api/auctions
```

### Ver calendario

```bash
curl -s "https://tpo-dai-subastup.onrender.com/api/auctions/calendar?month=6&year=2026"
```

### Login demo

```bash
curl -s -X POST https://tpo-dai-subastup.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo1@subastup.com","password":"Demo1234"}'
```

## 13. Qué no hacer en la demo

- No ejecutar `prisma migrate`.
- No actualizar Prisma.
- No ejecutar `DROP`, `TRUNCATE` ni comandos destructivos.
- No hacer `db push` sin revisar antes.
- No modificar tablas base de `estructurabasica.sql`.

## 14. Estado final esperado

La demo debe mostrar:

- Login funcional.
- Subastas reales.
- Calendario real.
- Recordatorios.
- Pujas con reglas.
- Cierre de subasta.
- Ganador con notificación, chat y mail.
- Carga de producto.
- Seguimiento de producto.
- Métodos de pago.
- Chat persistente.
- Notificaciones acumulables y eliminables.
