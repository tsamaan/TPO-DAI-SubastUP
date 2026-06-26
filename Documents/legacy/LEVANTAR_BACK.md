# SubastUP — Guía para levantar el entorno de desarrollo
---
## PASO 1 — Levantar Docker

### Requisitos
- Docker Desktop instalado y corriendo
- Archivo `docker-compose.yml` en la raíz del proyecto `backend/`

### Comandos
```bash
# Desde la carpeta backend/
cd backend

# Levantar el contenedor de SQL Server
docker-compose up -d

# Verificar que está corriendo
docker ps
# Debe aparecer una línea con "sqlserver" o similar y estado "Up"

# Ver logs si algo falla
docker-compose logs sqlserver
```

### Verificar conexión al contenedor
```bash
# Opcional: entrar al contenedor y testear SQL Server
docker exec -it <nombre_contenedor> /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "<tu_password>" -Q "SELECT @@VERSION"
```

> **Nota:** El contenedor expone SQL Server en el puerto `1433` de tu máquina local.

---

## PASO 2 — Crear la base de datos en DBeaver

### Conectar DBeaver al contenedor

1. Abrir DBeaver
2. `File → New Connection` → seleccionar **Microsoft SQL Server**
3. Completar los datos:
   - **Host:** `localhost`
   - **Port:** `1433`
   - **Database:** `master` *(para la conexión inicial)*
   - **Authentication:** SQL Server Authentication
   - **Username:** `sa`
   - **Password:** la que configuraste en `.env` / `docker-compose.yml`
4. Probar conexión → **Finish**

### Crear la base de datos
En DBeaver, abrir una nueva pestaña SQL (`Ctrl+]` o botón SQL Editor) y ejecutar:

```sql
CREATE DATABASE subastup;
GO
```

Luego hacer clic derecho en la conexión → **Refresh** para que aparezca `subastup` en el panel.

### Ejecutar el script de estructura
1. Seleccionar la base `subastup` como contexto activo (doble clic en ella)
2. `File → Open SQL Script` → seleccionar `EstructuraCompleta_Fusionada.sql`
3. Seleccionar todo (`Ctrl+A`)
4. Ejecutar con `Alt+X` o el botón **Execute Script**
5. Verificar en el panel izquierdo que aparecen las tablas:
   `personas`, `registros`, `logins`, `fotosDNI`, `subastas`, `productos`, etc.
6. Al final debe aparecer el mensaje:
   ```
   Usuario de prueba creado: cuentademprendimiento10@gmail.com / Admin123
   Estructura completa aplicada correctamente.
   ```

---

## PASO 3 — Levantar el backend

### Configurar `.env`
Verificar que el archivo `backend/.env` existe con estos valores:

```env
JWT_SECRET=subastup-secret-2026
JWT_EXPIRES_IN=7d

DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=subastup
DB_USER=sa
DB_PASSWORD=<tu_password_del_docker>

MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=<usuario_de_mailtrap>
MAIL_PASS=<password_de_mailtrap>
MAIL_FROM=noreply@subastup.com

VERIFY_CODE_EXPIRY_MINUTES=15
PORT=3000
```

### Instalar dependencias y correr el servidor
```bash
# Desde la carpeta backend/
cd backend
npm install

# Desarrollo (con hot reload)
npm run dev

# O producción
npm start
```

### Verificar que levantó correctamente
La terminal debe mostrar:
```
✅ Conectado a SQL Server: subastup
🚀 Servidor corriendo en http://localhost:3000
```

### Testear con curl o Postman
```bash
# Test básico — login con el usuario de prueba
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cuentademprendimiento10@gmail.com","password":"Admin123"}'

# Respuesta esperada:
# { "ok": true, "token": "...", "usuario": { "nombre": "Admin SubastUp", ... } }
```

---

```

---

## GESTIÓN DE USUARIOS — SQL para la demo

Conectate a la base `subastup` en DBeaver y usá estos scripts:

### Ver usuarios pendientes de aprobación
```sql
SELECT * FROM vw_RegistrosPendientes;
```

### Ver todos los usuarios del sistema
```sql
SELECT * FROM vw_UsuariosCompleto;
```

### Aprobar un usuario
```sql
UPDATE registros SET estado = 'aprobado' WHERE identificador = 1;
```

### Rechazar un usuario con motivo
```sql
UPDATE registros
SET estado = 'rechazado',
    motivoRechazo = 'Documentación inválida'
WHERE identificador = 2;
```

### Poner usuario en pausa
```sql
UPDATE registros SET estado = 'en pausa' WHERE identificador = 3;
```

### Desbloquear cuenta bloqueada por intentos fallidos
```sql
EXEC sp_DesbloquearLogin @registroId = 1;
```

### Ver fotos de DNI enviadas
```sql
SELECT f.identificador, r.email, f.tipo, f.fechaRegistro
FROM fotosDNI f
INNER JOIN registros r ON r.identificador = f.registro
ORDER BY f.identificador DESC;
```

---

## SECUENCIA COMPLETA DE ARRANQUE

Cada vez que trabajes en el proyecto, el orden es:

```
1. docker-compose up -d          (levantar SQL Server)
2. cd backend && npm run dev     (levantar API)
3. cd frontend && pnpm expo start --clear --tunnel  (levantar app)
```

Para detener todo:
```
Ctrl+C en la terminal del backend
docker-compose down              (detener y conservar datos)
docker-compose down -v           (detener y BORRAR datos — usar con cuidado)
```

---

## COMANDOS DOCKER — Referencia rápida

### Levantar el contenedor
```bash
docker compose up -d
```

### Pausar (conserva los datos)
```bash
docker compose stop
```

### Reanudar
```bash
docker compose start
```

### Eliminar contenedor (conserva los datos del volumen)
```bash
docker compose down
```

### Eliminar contenedor Y datos
```bash
docker compose down -v
```

### Ver estado del contenedor
```bash
docker ps
```

### Ver logs
```bash
docker compose logs sqlserver
```

> Con `restart: always` en el `docker-compose.yml`, el contenedor arranca automáticamente cada vez que prendés la notebook (siempre que Docker Desktop esté configurado para iniciarse con Windows en Settings → General → Start Docker Desktop when you sign in).

---

## COMANDOS DE DEPENDENCIAS

### Frontend (pnpm)
```bash
# Instalar todas las dependencias
cd frontend
pnpm install

# Agregar una dependencia nueva
pnpm add <paquete>

# Agregar dependencia de Expo (resuelve versiones compatibles)
pnpm expo install <paquete>
```

### Backend (npm)
```bash
# Instalar todas las dependencias
cd backend
npm install

# Agregar una dependencia nueva
npm install <paquete>
```

---

## EJECUTAR SQL DESDE DOCKER (método recomendado)

DBeaver no soporta el separador `GO` de SQL Server. Usar este método en su lugar:

**Paso 1** — Copiar el script al contenedor:
```bash
docker cp EstructuraCompleta_Fusionada.sql subastup-db:/tmp/script.sql
```

**Paso 2** — Ejecutar con sqlcmd (usar comillas simples en la contraseña para evitar que `!` sea interpretado por bash):
```bash
docker exec -it subastup-db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'SubastUP2026!' -d subastup -i /tmp/script.sql -C
```

Resultado esperado:
```
Estructura completa aplicada correctamente.
(1 rows affected)
Usuario de prueba creado: cuentademprendimiento10@gmail.com / Admin123
```

> Si necesitás volver a correr el script (por ejemplo para resetear la base), primero eliminá y recreá la base desde DBeaver:
> ```sql
> DROP DATABASE subastup;
> GO
> CREATE DATABASE subastup;
> GO
> ```
> Y volvé a ejecutar el Paso 2.
