const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const catalogos = await prisma.catalogos.findMany({
    include: {
      subastas: true,
      itemsCatalogo: {
        orderBy: { identificador: 'asc' },
      },
    },
  });

  let subastasCreadas = 0;
  let catalogosCreados = 0;
  let itemsMovidos = 0;

  for (const catalogo of catalogos) {
    const items = catalogo.itemsCatalogo || [];
    if (items.length <= 1 || !catalogo.subastas) continue;

    const [, ...itemsExtra] = items;
    const subastaBase = catalogo.subastas;

    for (const item of itemsExtra) {
      const nuevaSubasta = await prisma.subastas.create({
        data: {
          fecha:               subastaBase.fecha,
          hora:                subastaBase.hora,
          estado:              subastaBase.estado,
          subastador:          subastaBase.subastador,
          ubicacion:           subastaBase.ubicacion,
          capacidadAsistentes: subastaBase.capacidadAsistentes,
          tieneDeposito:       subastaBase.tieneDeposito,
          seguridadPropia:     subastaBase.seguridadPropia,
          categoria:           subastaBase.categoria,
        },
      });
      subastasCreadas += 1;

      const nuevoCatalogo = await prisma.catalogos.create({
        data: {
          descripcion: `${catalogo.descripcion} - item ${item.identificador}`,
          subasta:     nuevaSubasta.identificador,
          responsable: catalogo.responsable,
        },
      });
      catalogosCreados += 1;

      await prisma.itemsCatalogo.update({
        where: { identificador: item.identificador },
        data:  { catalogo: nuevoCatalogo.identificador },
      });
      itemsMovidos += 1;
    }
  }

  console.log('Normalización de subastas unitarias finalizada:');
  console.log('Subastas creadas:', subastasCreadas);
  console.log('Catálogos creados:', catalogosCreados);
  console.log('Ítems movidos:', itemsMovidos);
}

main()
  .catch((error) => {
    console.error('Error al normalizar subastas unitarias:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
