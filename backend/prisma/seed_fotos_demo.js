// Seed idempotente para probar el flujo de fotos:
// frontend/base64 -> backend/Buffer -> PostgreSQL Bytes -> frontend/base64.
const { PrismaClient } = require('@prisma/client');
const zlib = require('zlib');

const prisma = new PrismaClient();

const DEMO = {
  nombre: 'Set fotográfico demo SubastUP',
  descripcion: 'Artículo demo con seis fotos guardadas como Bytes en PostgreSQL.',
  ubicacion: 'Demo SubastUP - Sala Fotos',
  categoria: 'comun',
  moneda: 'ARS',
  precioBase: 180000,
};

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function pngSolido(width, height, [r, g, b]) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const idx = row + 1 + x * 3;
      raw[idx] = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const fotosDemo = [
  [139, 0, 0],
  [162, 59, 0],
  [107, 74, 58],
  [47, 72, 88],
  [85, 107, 47],
  [75, 56, 105],
].map((color) => pngSolido(900, 650, color));

const proximoDia = (offset = 0) => {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  fecha.setDate(fecha.getDate() + 3 + offset);
  return fecha;
};

async function asegurarEquipo() {
  let persona = await prisma.personas.findFirst({ where: { documento: '90000000' } });
  if (!persona) {
    persona = await prisma.personas.create({
      data: { documento: '90000000', nombre: 'Equipo Demo SubastUP', direccion: 'Sede Demo', estado: 'activo' },
    });
  }

  let empleado = await prisma.empleados.findUnique({ where: { identificador: persona.identificador } });
  if (!empleado) {
    empleado = await prisma.empleados.create({
      data: { identificador: persona.identificador, cargo: 'Revisor técnico del sistema' },
    });
  }

  let subastador = await prisma.subastadores.findUnique({ where: { identificador: persona.identificador } });
  if (!subastador) {
    subastador = await prisma.subastadores.create({
      data: { identificador: persona.identificador, matricula: 'DEMO-FOTOS', region: 'Demo' },
    });
  }

  return { empleadoId: empleado.identificador, subastadorId: subastador.identificador };
}

async function asegurarDuenio(equipo) {
  const registro = await prisma.registros.findFirst({ where: { email: 'demo1@subastup.com' } });
  if (registro) return registro.persona;

  let persona = await prisma.personas.findFirst({ where: { documento: '41999991' } });
  if (!persona) {
    persona = await prisma.personas.create({
      data: { documento: '41999991', nombre: 'Dueño Fotos Demo', direccion: 'Av. Fotos 123', estado: 'activo' },
    });
  }

  await prisma.duenios.upsert({
    where: { identificador: persona.identificador },
    create: {
      identificador: persona.identificador,
      verificacionFinanciera: 'si',
      verificacionJudicial: 'si',
      calificacionRiesgo: 1,
      verificador: equipo.empleadoId,
    },
    update: {},
  });

  return persona.identificador;
}

async function main() {
  const equipo = await asegurarEquipo();
  const duenioId = await asegurarDuenio(equipo);

  let subasta = await prisma.subastas.findFirst({ where: { ubicacion: DEMO.ubicacion } });
  if (!subasta) {
    subasta = await prisma.subastas.create({
      data: {
        fecha: proximoDia(0),
        hora: new Date('1970-01-01T16:30:00.000Z'),
        estado: 'programada',
        subastador: equipo.subastadorId,
        ubicacion: DEMO.ubicacion,
        capacidadAsistentes: 80,
        tieneDeposito: 'si',
        seguridadPropia: 'si',
        categoria: DEMO.categoria,
      },
    });
  }

  let catalogo = await prisma.catalogos.findFirst({
    where: { subasta: subasta.identificador, descripcion: 'Catálogo demo fotos' },
  });
  if (!catalogo) {
    catalogo = await prisma.catalogos.create({
      data: { subasta: subasta.identificador, descripcion: 'Catálogo demo fotos', responsable: equipo.empleadoId },
    });
  }

  let detalle = await prisma.productosDetalle.findFirst({ where: { nombre: DEMO.nombre } });
  let producto = detalle
    ? await prisma.productos.findFirst({ where: { identificador: detalle.producto } })
    : null;

  if (!producto) {
    producto = await prisma.productos.create({
      data: {
        fecha: new Date(),
        disponible: 'si',
        descripcionCatalogo: DEMO.descripcion,
        descripcionCompleta: DEMO.descripcion,
        revisor: equipo.empleadoId,
        duenio: duenioId,
      },
    });
    detalle = await prisma.productosDetalle.create({
      data: {
        producto: producto.identificador,
        nombre: DEMO.nombre,
        estado: 'aprobado',
        revisor: equipo.empleadoId,
        direccionEnvio: 'Depósito Demo SubastUP',
      },
    });
  }

  await prisma.fotos.deleteMany({ where: { producto: producto.identificador } });
  await prisma.fotos.createMany({
    data: fotosDemo.map((foto) => ({ producto: producto.identificador, foto })),
  });

  let item = await prisma.itemsCatalogo.findFirst({ where: { producto: producto.identificador } });
  if (!item) {
    item = await prisma.itemsCatalogo.create({
      data: {
        catalogo: catalogo.identificador,
        producto: producto.identificador,
        precioBase: DEMO.precioBase,
        comision: Math.round(DEMO.precioBase * 0.1),
        subastado: 'no',
      },
    });
  } else {
    await prisma.itemsCatalogo.update({
      where: { identificador: item.identificador },
      data: {
        catalogo: catalogo.identificador,
        precioBase: DEMO.precioBase,
        comision: Math.round(DEMO.precioBase * 0.1),
        subastado: 'no',
      },
    });
  }

  await prisma.itemsCatalogoDetalle.upsert({
    where: { item: item.identificador },
    create: {
      item: item.identificador,
      moneda: DEMO.moneda,
      fechaSubasta: subasta.fecha,
      horaSubasta: '16:30',
      lugarSubasta: DEMO.ubicacion,
      aceptadoPorDuenio: true,
      cerrado: false,
    },
    update: {
      moneda: DEMO.moneda,
      fechaSubasta: subasta.fecha,
      horaSubasta: '16:30',
      lugarSubasta: DEMO.ubicacion,
      aceptadoPorDuenio: true,
      cerrado: false,
      ultimaPuja: null,
    },
  });

  console.log('Seed fotos demo listo:');
  console.log('Subasta:', subasta.identificador, '| estado:', subasta.estado);
  console.log('Producto:', producto.identificador, '| item:', item.identificador);
  console.log('Fotos guardadas como Bytes:', fotosDemo.length);
}

main()
  .catch((err) => {
    console.error('Error al crear seed fotos demo:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
