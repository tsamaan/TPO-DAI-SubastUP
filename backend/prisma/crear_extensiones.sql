-- Extensiones PostgreSQL para SubastUP.
-- No altera ninguna tabla definida en estructurabasica.sql.

CREATE TABLE IF NOT EXISTS perfiles_contacto (
  persona INTEGER PRIMARY KEY REFERENCES personas(identificador),
  telefono VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS productos_detalle (
  producto INTEGER PRIMARY KEY REFERENCES productos(identificador),
  nombre VARCHAR(150) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  revisor INTEGER,
  motivo_rechazo VARCHAR(300),
  direccion_envio VARCHAR(350)
);

CREATE TABLE IF NOT EXISTS items_catalogo_detalle (
  item INTEGER PRIMARY KEY REFERENCES itemscatalogo(identificador),
  moneda VARCHAR(3) NOT NULL DEFAULT 'ARS',
  fecha_subasta DATE,
  hora_subasta VARCHAR(10),
  lugar_subasta VARCHAR(350),
  aceptado_por_duenio BOOLEAN,
  ultima_puja TIMESTAMP,
  cerrado BOOLEAN NOT NULL DEFAULT FALSE,
  link_stream VARCHAR(350)
);

CREATE TABLE IF NOT EXISTS pujos_detalle (
  puja INTEGER PRIMARY KEY REFERENCES pujos(identificador),
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
