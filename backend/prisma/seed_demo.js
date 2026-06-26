// prisma/seed_demo.js
// Seed demo de SubastUP. Exporta seedDemo()/resetAndSeed() para reutilizar desde
// el endpoint POST /api/dev/reseed y desde la CLI (node prisma/seed_demo.js).
//
// Roster (cuentas de prueba, estilo Auxion):
//   admin@subastup.com      / Admin1234    -> rol admin (aprueba cuentas, verifica pagos/productos)
//   revisor@subastup.com    / Revisor1234  -> rol revisor (idem back-office)
//   vendedor@subastup.com   / Demo1234     -> dueño de TODOS los productos en subasta
//   demo1@subastup.com      / Demo1234     -> comun     (flujo completo, pago verificado)
//   demo2@subastup.com      / Demo1234     -> especial  (flujo completo)
//   demo3@subastup.com      / Demo1234     -> oro       (flujo completo)
//   demo4@subastup.com      / Demo1234     -> plata     (flujo completo)
//   demo5@subastup.com      / Demo1234     -> platino   (flujo completo)
//   demo6@subastup.com      / Demo1234     -> platino   (segundo postor para subastas altas)
//   sinpago@subastup.com    / Demo1234     -> especial, pago SIN verificar (mira pero no puja)
//   pendiente@subastup.com  / Demo1234     -> registro 'pendiente' (no puede entrar hasta aprobación)
//   rechazado@subastup.com  / Demo1234     -> registro 'rechazado'
//   bloqueado@subastup.com  / Demo1234     -> aprobado pero login bloqueado por intentos
//
// Como el vendedor es dueño de todos los productos, cualquier demoN puede pujar
// en cualquier subasta (según su categoría); ningún postor es dueño del artículo.

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const zlib = require('zlib');

// ── Helpers para generar una imagen PNG sólida (foto demo) ──────
function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}
function chunkPng(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}
function pngDemo([r, g, b]) {
  const width = 600, height = 420;
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const idx = row + 1 + x * 3;
      raw[idx] = r; raw[idx + 1] = g; raw[idx + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunkPng('IHDR', ihdr),
    chunkPng('IDAT', zlib.deflateSync(raw)),
    chunkPng('IEND', Buffer.alloc(0)),
  ]);
}
// Fecha futura (lunes + offset) para las subastas.
const proximoDia = (offset) => {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  const diasHastaLunes = ((8 - fecha.getDay()) % 7) || 7;
  fecha.setDate(fecha.getDate() + diasHastaLunes + offset);
  return fecha;
};

// ── Datos del seed ─────────────────────────────────────────────
const PASS_DEMO = 'Demo1234';

const STAFF = [
  { email: 'admin@subastup.com',   pass: 'Admin1234',   rol: 'admin',   nombre: 'Admin SubastUP',   doc: '80000000' },
  { email: 'revisor@subastup.com', pass: 'Revisor1234', rol: 'revisor', nombre: 'Revisor SubastUP', doc: '80000001' },
];

// caso: vendedor | completo | sinpago | pendiente | rechazado | bloqueado
const CUENTAS = [
  { email: 'vendedor@subastup.com',  nombre: 'Vera Vendedora',  doc: '42000000', categoria: 'platino',  caso: 'vendedor' },
  { email: 'demo1@subastup.com',     nombre: 'Lucía Común',     doc: '42000001', categoria: 'comun',    caso: 'completo' },
  { email: 'demo2@subastup.com',     nombre: 'Mateo Especial',  doc: '42000002', categoria: 'especial', caso: 'completo' },
  { email: 'demo3@subastup.com',     nombre: 'Sofía Oro',       doc: '42000003', categoria: 'oro',      caso: 'completo' },
  { email: 'demo4@subastup.com',     nombre: 'Tomás Plata',     doc: '42000004', categoria: 'plata',    caso: 'completo' },
  { email: 'demo5@subastup.com',     nombre: 'Pía Platino',     doc: '42000005', categoria: 'platino',  caso: 'completo' },
  { email: 'demo6@subastup.com',     nombre: 'Igor Platino',    doc: '42000006', categoria: 'platino',  caso: 'completo' },
  { email: 'sinpago@subastup.com',   nombre: 'Sara SinPago',    doc: '42000007', categoria: 'especial', caso: 'sinpago' },
  { email: 'pendiente@subastup.com', nombre: 'Pedro Pendiente', doc: '42000008', categoria: 'comun',    caso: 'pendiente' },
  { email: 'rechazado@subastup.com', nombre: 'Rita Rechazada',  doc: '42000009', categoria: 'comun',    caso: 'rechazado' },
  { email: 'bloqueado@subastup.com', nombre: 'Bruno Bloqueado', doc: '42000010', categoria: 'oro',      caso: 'bloqueado' },
];

const SUBASTAS = [
  // ── Abiertas: 2 por categoría ──────────────────────────────
  { nombre: 'Reloj Omega vintage',          categoria: 'comun',    precioBase: 120000, moneda: 'ARS', sala: 'Sala Común',     desc: 'Reloj vintage en excelente estado, con estuche original.' },
  { nombre: 'Bicicleta de ruta de carbono', categoria: 'comun',    precioBase: 65000,  moneda: 'ARS', sala: 'Sala Común 2',   desc: 'Bicicleta de ruta usada, cuadro de carbono, lista para rodar.' },
  { nombre: 'Guitarra Gibson de colección', categoria: 'especial', precioBase: 850000, moneda: 'ARS', sala: 'Sala Especial',  desc: 'Guitarra eléctrica de colección, totalmente original.' },
  { nombre: 'Colección de vinilos de jazz', categoria: 'especial', precioBase: 180000, moneda: 'ARS', sala: 'Sala Especial 2',desc: 'Lote de vinilos originales de jazz de los años 60.' },
  { nombre: 'Cámara Leica analógica',       categoria: 'plata',    precioBase: 420000, moneda: 'ARS', sala: 'Sala Plata',     desc: 'Cámara analógica lista para coleccionista.' },
  { nombre: 'Reloj de bolsillo suizo',      categoria: 'plata',    precioBase: 300000, moneda: 'ARS', sala: 'Sala Plata 2',   desc: 'Reloj de bolsillo suizo a cuerda, funcionando.' },
  { nombre: 'Moneda de oro coleccionable',  categoria: 'oro',      precioBase: 1500,   moneda: 'USD', sala: 'Sala Oro',       desc: 'Moneda de oro para subasta especializada.' },
  { nombre: 'Lingote conmemorativo de oro', categoria: 'oro',      precioBase: 2500,   moneda: 'USD', sala: 'Sala Oro 2',     desc: 'Lingote conmemorativo certificado.' },
  { nombre: 'Cuadro firmado original',      categoria: 'platino',  precioBase: 9000,   moneda: 'USD', sala: 'Sala Platino',   desc: 'Obra original firmada, con certificado de autenticidad.' },
  { nombre: 'Escultura de bronce',          categoria: 'platino',  precioBase: 12000,  moneda: 'USD', sala: 'Sala Platino 2', desc: 'Escultura de bronce de autor, pieza única.' },
  // ── Programadas (futuras) ──────────────────────────────────
  { nombre: 'Vajilla de porcelana inglesa', categoria: 'comun',    precioBase: 90000,  moneda: 'ARS', sala: 'Sala Programada',  desc: 'Juego de porcelana, subasta próximamente.', estado: 'programada' },
  { nombre: 'Joya art déco con esmeraldas', categoria: 'especial', precioBase: 500000, moneda: 'ARS', sala: 'Sala Programada 2',desc: 'Joya art déco, próximamente en subasta.', estado: 'programada' },
  // ── Finalizadas (con ganador ya definido) ──────────────────
  { nombre: 'Auto a escala de colección',   categoria: 'comun',    precioBase: 80000,  moneda: 'ARS', sala: 'Sala Finalizada',   desc: 'Auto a escala 1:18, edición limitada.', finalizada: { ganador: 'demo1@subastup.com', perdedor: 'demo2@subastup.com', montoPerdedor: 82000, montoGanador: 90000 } },
  { nombre: 'Primera edición de libro raro',categoria: 'oro',      precioBase: 3000,   moneda: 'USD', sala: 'Sala Finalizada 2', desc: 'Primera edición firmada, muy buscada.', finalizada: { ganador: 'demo3@subastup.com', perdedor: 'demo5@subastup.com', montoPerdedor: 3200, montoGanador: 3500 } },
];

const COLORES = [[139, 0, 0], [162, 59, 0], [47, 72, 88]];

// Bienes que un usuario publicó y están pendientes de revisión por la empresa
// (aparecen en la pestaña "Bienes" del panel admin). Los de conChat suman ademas
// una conversación con el admin (pestaña "Mensajes", logueado como admin).
const BIENES_PENDIENTES = [
  { nombre: 'Lámpara art déco restaurada',    duenioEmail: 'demo1@subastup.com', desc: 'Lámpara art déco original, cableado restaurado y en funcionamiento.', conChat: true },
  { nombre: 'Colección de estampillas raras', duenioEmail: 'demo2@subastup.com', desc: 'Álbum de estampillas argentinas y extranjeras, décadas del 40 al 60.' },
  { nombre: 'Reloj de péndulo de madera',     duenioEmail: 'demo4@subastup.com', desc: 'Reloj de péndulo de roble, funcionando, con su llave original.',       conChat: true },
];

// ── Inserción (asume la base recién truncada / vacía) ──────────
async function seedDemo(prisma) {
  const resumen = { staff: 0, cuentas: 0, subastas: 0, finalizadas: 0, bienesPendientes: 0, conversaciones: 0 };

  // Equipo: empleado verificador + subastador (mismas personas).
  const personaEquipo = await prisma.personas.create({
    data: { documento: '90000000', nombre: 'Equipo SubastUP', direccion: 'Sede', estado: 'activo' },
  });
  const empleado = await prisma.empleados.create({
    data: { identificador: personaEquipo.identificador, cargo: 'Revisor técnico del sistema' },
  });
  const subastador = await prisma.subastadores.create({
    data: { identificador: personaEquipo.identificador, matricula: 'DEMO-001', region: 'Demo' },
  });
  const verificador = empleado.identificador;

  // Staff (admin / revisor).
  const staffPorEmail = {};
  for (const s of STAFF) {
    const salt = await bcrypt.genSalt(10);
    const persona = await prisma.personas.create({
      data: { documento: s.doc, nombre: s.nombre, direccion: 'Sede', estado: 'activo' },
    });
    staffPorEmail[s.email] = persona.identificador;
    const registro = await prisma.registros.create({
      data: { persona: persona.identificador, email: s.email, telefono: '1100000000', estado: 'aprobado', rol: s.rol, categoria: 'platino' },
    });
    await prisma.logins.create({
      data: { registro: registro.identificador, passwordHash: await bcrypt.hash(s.pass, salt), salt, intentosFallidos: 0, bloqueado: false },
    });
    resumen.staff += 1;
  }

  // Cuentas de prueba.
  const personaPorEmail = {};
  for (const c of CUENTAS) {
    const salt = await bcrypt.genSalt(10);
    const persona = await prisma.personas.create({
      data: { documento: c.doc, nombre: c.nombre, direccion: 'Av. Demo 100', estado: 'activo' },
    });
    personaPorEmail[c.email] = persona.identificador;

    const estadoRegistro =
      c.caso === 'pendiente' ? 'pendiente' : c.caso === 'rechazado' ? 'rechazado' : 'aprobado';

    const registro = await prisma.registros.create({
      data: {
        persona: persona.identificador,
        email: c.email,
        telefono: '1111111111',
        estado: estadoRegistro,
        rol: 'usuario',
        categoria: c.categoria,
        motivoRechazo: c.caso === 'rechazado' ? 'Documentación insuficiente (caso de prueba).' : null,
      },
    });
    await prisma.perfilesContacto.create({ data: { persona: persona.identificador, telefono: '1111111111' } });
    await prisma.logins.create({
      data: {
        registro: registro.identificador,
        passwordHash: await bcrypt.hash(PASS_DEMO, salt),
        salt,
        intentosFallidos: c.caso === 'bloqueado' ? 5 : 0,
        bloqueado: c.caso === 'bloqueado',
      },
    });

    // Solo las cuentas aprobadas reciben identidades de dominio (cliente + dueño)
    // y método de pago. pendiente/rechazado quedan sin esas filas.
    if (estadoRegistro === 'aprobado') {
      await prisma.clientes.create({
        data: { identificador: persona.identificador, admitido: 'si', categoria: c.categoria, verificador },
      });
      await prisma.duenios.create({
        data: { identificador: persona.identificador, verificacionFinanciera: 'si', verificacionJudicial: 'si', calificacionRiesgo: 1, verificador },
      });

      const verificado = c.caso !== 'sinpago'; // sinpago: tarjeta sin verificar
      const mp = await prisma.metodosPago.create({
        data: { persona: persona.identificador, tipo: 'tarjeta', activo: true, verificado },
      });
      await prisma.tarjetas.create({
        data: {
          identificador: mp.identificador,
          titular: c.nombre,
          numeroTarjeta: `411111111111${c.doc.slice(-4)}`,
          mesVencimiento: '12',
          anioVencimiento: '2030',
          codigoSeguridad: '123',
          direccion: 'Av. Demo 100',
          codigoPostal: '1000',
          pais: 'Argentina',
          localidad: 'Buenos Aires',
        },
      });
    }
    resumen.cuentas += 1;
  }

  const vendedorId = personaPorEmail['vendedor@subastup.com'];

  // Subastas: 2 abiertas por categoría + 2 programadas + 2 finalizadas.
  // Dueño de todos los productos = vendedor (así cualquier postor puede pujar).
  for (const [i, sub] of SUBASTAS.entries()) {
    const estadoSubasta = sub.estado || 'abierta';
    const ubicacion = `Demo SubastUP - ${sub.sala}`;
    // Las finalizadas quedan con fecha pasada; el resto, próximas.
    const fechaSubasta = sub.finalizada ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : proximoDia(i);

    const subasta = await prisma.subastas.create({
      data: {
        fecha: fechaSubasta,
        hora: new Date('1970-01-01T15:00:00.000Z'),
        estado: estadoSubasta,
        subastador: subastador.identificador,
        ubicacion,
        capacidadAsistentes: 100,
        tieneDeposito: 'si',
        seguridadPropia: 'si',
        categoria: sub.categoria,
      },
    });
    const catalogo = await prisma.catalogos.create({
      data: { descripcion: `Catálogo ${sub.categoria}`, subasta: subasta.identificador, responsable: verificador },
    });
    const producto = await prisma.productos.create({
      data: {
        fecha: new Date(),
        disponible: sub.finalizada ? 'no' : 'si',
        descripcionCatalogo: sub.desc,
        descripcionCompleta: sub.desc,
        revisor: verificador,
        duenio: vendedorId,
      },
    });
    await prisma.productosDetalle.create({
      data: { producto: producto.identificador, nombre: sub.nombre, estado: 'aprobado', revisor: verificador, direccionEnvio: 'Depósito Demo SubastUP' },
    });
    await prisma.fotos.createMany({
      data: COLORES.map((color) => ({ producto: producto.identificador, foto: pngDemo(color) })),
    });
    const item = await prisma.itemsCatalogo.create({
      data: { catalogo: catalogo.identificador, producto: producto.identificador, precioBase: sub.precioBase, comision: Math.round(sub.precioBase * 0.1), subastado: sub.finalizada ? 'si' : 'no' },
    });
    await prisma.itemsCatalogoDetalle.create({
      data: {
        item: item.identificador,
        moneda: sub.moneda,
        fechaSubasta,
        horaSubasta: '15:00',
        lugarSubasta: ubicacion,
        aceptadoPorDuenio: true,
        cerrado: Boolean(sub.finalizada),
        ultimaPuja: sub.finalizada ? new Date(Date.now() - 60 * 60 * 1000) : null,
      },
    });

    // Subasta ya finalizada con ganador: asistentes + pujas + ítem cerrado.
    if (sub.finalizada) {
      const f = sub.finalizada;
      const ganadorId = personaPorEmail[f.ganador];
      const perdedorId = personaPorEmail[f.perdedor];
      const aPerdedor = await prisma.asistentes.create({ data: { numeroPostor: 1, cliente: perdedorId, subasta: subasta.identificador } });
      const aGanador  = await prisma.asistentes.create({ data: { numeroPostor: 2, cliente: ganadorId,  subasta: subasta.identificador } });
      const pPerdedor = await prisma.pujos.create({ data: { asistente: aPerdedor.identificador, item: item.identificador, importe: f.montoPerdedor, ganador: 'no' } });
      const pGanador  = await prisma.pujos.create({ data: { asistente: aGanador.identificador,  item: item.identificador, importe: f.montoGanador,  ganador: 'si' } });
      await prisma.pujosDetalle.createMany({ data: [{ puja: pPerdedor.identificador }, { puja: pGanador.identificador }] });
      await prisma.notificaciones.create({
        data: { persona: ganadorId, titulo: '¡Ganaste la subasta!', mensaje: `Ganaste ${sub.nombre}. Coordinaremos el pago y la entrega.`, tipo: 'subasta_ganada' },
      });
      resumen.finalizadas += 1;
    }
    resumen.subastas += 1;
  }

  // ── Bienes pendientes de revisión + conversaciones admin↔usuario ──
  const adminId = staffPorEmail['admin@subastup.com'];
  for (const bien of BIENES_PENDIENTES) {
    const duenioId = personaPorEmail[bien.duenioEmail];
    const producto = await prisma.productos.create({
      data: { fecha: new Date(), disponible: 'si', descripcionCatalogo: bien.desc, descripcionCompleta: bien.desc, revisor: verificador, duenio: duenioId },
    });
    await prisma.productosDetalle.create({
      data: { producto: producto.identificador, nombre: bien.nombre, estado: 'pendiente', revisor: verificador, direccionEnvio: 'Domicilio del usuario' },
    });
    await prisma.fotos.createMany({
      data: COLORES.slice(0, 2).map((color) => ({ producto: producto.identificador, foto: pngDemo(color) })),
    });
    resumen.bienesPendientes += 1;

    if (bien.conChat && adminId) {
      const conv = await prisma.conversaciones.create({
        data: { producto: producto.identificador, duenio: duenioId, empleado: adminId, estado: 'activo' },
      });
      const mensajes = [
        { emisor: adminId,  texto: `Hola, somos del equipo de SubastUP. Estamos revisando "${bien.nombre}". ¿Nos contás un poco más sobre su estado y procedencia?` },
        { emisor: duenioId, texto: 'Hola! Está en muy buen estado, lo tengo hace años. Cualquier dato que necesiten, a disposición.' },
        { emisor: adminId,  texto: 'Perfecto, gracias. Te confirmamos el resultado de la revisión en breve.' },
      ];
      for (const m of mensajes) {
        await prisma.mensajes.create({ data: { conversacion: conv.identificador, emisor: m.emisor, texto: m.texto, leido: false } });
      }
      resumen.conversaciones += 1;
    }
  }

  return resumen;
}

// Trunca todas las tablas del esquema public (base + app_) y vuelve a sembrar.
const TABLAS_EXCLUIDAS = ['_prisma_migrations'];
async function resetAndSeed(prisma) {
  const filas = await prisma.$queryRawUnsafe("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  const tablas = filas
    .map((f) => f.tablename)
    .filter((t) => !TABLAS_EXCLUIDAS.includes(t))
    .map((t) => `"${t}"`);
  if (tablas.length) {
    await prisma.$executeRawUnsafe(`TRUNCATE ${tablas.join(', ')} RESTART IDENTITY CASCADE`);
  }
  return seedDemo(prisma);
}

module.exports = { seedDemo, resetAndSeed };

// Ejecución como script: resetea y siembra.
if (require.main === module) {
  const prisma = new PrismaClient();
  resetAndSeed(prisma)
    .then((r) => {
      console.log('Seed demo OK:', r);
      console.log('Staff:  admin@subastup.com / Admin1234   |   revisor@subastup.com / Revisor1234');
      console.log('Demo:   demo1..6@subastup.com / Demo1234  (comun, especial, oro, plata, platino, platino)');
      console.log('Otras:  vendedor@ (dueño), sinpago@, pendiente@, rechazado@, bloqueado@  / Demo1234');
    })
    .catch((e) => { console.error('Error al sembrar:', e); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
