// prisma/seed.js
// Usuario de prueba con cuenta aprobada

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'cuentademprendimiento10@gmail.com';

  // Evitar duplicados
  const existe = await prisma.registros.findFirst({ where: { email } });
  if (existe) {
    console.log('⚠  Usuario de prueba ya existe.');
    return;
  }

  const salt         = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Admin123', salt);

  await prisma.$transaction(async (tx) => {
    const persona = await tx.personas.create({
      data: {
        documento: '99999999',
        nombre:    'Admin SubastUp',
        direccion: 'Av. Test 123',
        estado:    'activo',
      },
    });

    const registro = await tx.registros.create({
      data: {
        persona:  persona.identificador,
        email,
        telefono: '1100000000',
        estado:   'aprobado',
      },
    });

    await tx.logins.create({
      data: {
        registro:         registro.identificador,
        passwordHash,
        salt,
        intentosFallidos: 0,
        bloqueado:        false,
      },
    });
  });

  console.log('✅  Usuario de prueba creado:', email, '/ Admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
