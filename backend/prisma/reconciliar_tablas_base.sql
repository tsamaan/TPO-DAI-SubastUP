-- Base de pruebas vacía: elimina únicamente columnas ajenas a estructurabasica.sql.
-- Ejecutar antes del seed demo; las extensiones viven en tablas satélite.

ALTER TABLE personas DROP COLUMN IF EXISTS telefono;

ALTER TABLE productos DROP COLUMN IF EXISTS nombre;
ALTER TABLE productos DROP COLUMN IF EXISTS estado;
ALTER TABLE productos DROP COLUMN IF EXISTS motivorechazo;
ALTER TABLE productos DROP COLUMN IF EXISTS direccionenvio;
ALTER TABLE productos ALTER COLUMN revisor SET NOT NULL;

ALTER TABLE itemscatalogo DROP COLUMN IF EXISTS moneda;
ALTER TABLE itemscatalogo DROP COLUMN IF EXISTS fechasubasta;
ALTER TABLE itemscatalogo DROP COLUMN IF EXISTS horasubasta;
ALTER TABLE itemscatalogo DROP COLUMN IF EXISTS lugarsubasta;
ALTER TABLE itemscatalogo DROP COLUMN IF EXISTS aceptadoporduenio;
ALTER TABLE itemscatalogo DROP COLUMN IF EXISTS ultimapuja;
ALTER TABLE itemscatalogo DROP COLUMN IF EXISTS cerrado;
ALTER TABLE itemscatalogo DROP COLUMN IF EXISTS linkstream;

ALTER TABLE pujos DROP COLUMN IF EXISTS fecha;
