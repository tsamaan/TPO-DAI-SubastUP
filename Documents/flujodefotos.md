# Flujo de fotos explicado en cavernícola

## Idea grande

Usuario elige foto.

App convierte foto a texto base64.

App manda ese texto al backend.

Backend convierte texto base64 a bytes.

PostgreSQL guarda bytes en campo `bytea` mediante Prisma `Bytes`.

Cuando app necesita mostrar foto, backend agarra bytes, los vuelve base64 y los manda.

App recibe base64, le pone `data:image/jpeg;base64,` adelante y muestra imagen.

## Como habla cada parte

### 1. App elige imagen

La app usa `expo-image-picker`.

Pide esto:

```js
base64: true
quality: 0.65
```

Resultado:

```js
{
  uri: "file://foto-local.jpg",
  base64: "muchotextolargo...",
  mimeType: "image/jpeg"
}
```

La `uri` sirve para vista previa en el celular.

El `base64` sirve para mandar al backend.

## 2. App manda al backend

Para cargar un producto, la app manda:

```js
{
  nombre: "Reloj antiguo",
  descripcionCompleta: "Reloj muy lindo",
  fotos: [
    {
      base64: "muchotextolargo...",
      mimeType: "image/jpeg"
    }
  ]
}
```

## 3. Backend guarda

Backend recibe base64.

Backend hace:

```js
Buffer.from(base64, "base64")
```

Eso convierte texto a bytes.

Después guarda en PostgreSQL:

```js
fotos.foto = bytes
```

No guardamos el texto base64 como texto.

Guardamos bytes.

Más limpio. Más correcto para PostgreSQL.

## 4. Backend devuelve

Cuando frontend pide un producto, backend lee bytes.

Después hace:

```js
Buffer.from(bytes).toString("base64")
```

Y responde:

```js
{
  id: 1,
  mimeType: "image/jpeg",
  foto: "muchotextolargo..."
}
```

## 5. App muestra

App arma esto:

```js
{
  uri: "data:image/jpeg;base64,muchotextolargo..."
}
```

Y React Native muestra la imagen.

## Regla cavernícola

Frontend manda base64.

Backend guarda bytes.

Base de datos no sabe de base64.

Backend devuelve base64.

Frontend muestra imagen.

## Límites

No subir monstruos.

Cada imagen debe pesar como máximo 2MB después de comprimirse.

Producto puede tener máximo 12 fotos.

La app comprime con calidad `0.65`.

## Archivos importantes

- Backend helper: `backend/utils/imagenes.js`
- Frontend helper: `frontend/src/utils/images.js`
- Carga de producto: `frontend/src/screens/auction/CargarProductoScreen.js`
- Guardado de producto: `backend/controllers/productosController.js`

