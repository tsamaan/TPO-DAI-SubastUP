// utils/provision.js
// Provisión idempotente de las identidades de dominio que la base de la cátedra
// exige pero que el flujo de registro/aprobación no creaba.
//
// Un usuario de la app vive en `registros` (auth). Para PUJAR necesita una fila
// en `clientes` (asistentes.cliente -> clientes) y para CARGAR productos una en
// `duenios` (productos.duenio -> duenios). Ambas comparten PK con `personas` y
// requieren un `verificador` (FK a `empleados`). Estas helpers resuelven todo eso.

const prisma = require('../config/prisma');

// Resuelve (o crea) un empleado que actúe como verificador/revisor del sistema.
// `db` puede ser el cliente Prisma o un `tx` de transacción.
async function obtenerEmpleadoSistema(db = prisma) {
  // Preferimos el "Revisor técnico del sistema" (el que usa el seed).
  let empleado = await db.empleados.findFirst({
    where: { cargo: 'Revisor técnico del sistema' },
    orderBy: { identificador: 'asc' },
  });
  if (empleado) return empleado.identificador;

  // Si no está, sirve cualquier empleado existente.
  empleado = await db.empleados.findFirst({ orderBy: { identificador: 'asc' } });
  if (empleado) return empleado.identificador;

  // No hay ninguno: crear persona + empleado del sistema (idempotente por documento).
  let persona = await db.personas.findFirst({ where: { documento: '90000000' } });
  if (!persona) {
    persona = await db.personas.create({
      data: { documento: '90000000', nombre: 'Equipo SubastUP', direccion: 'Sede', estado: 'activo' },
    });
  }
  const creado = await db.empleados.upsert({
    where:  { identificador: persona.identificador },
    update: {},
    create: { identificador: persona.identificador, cargo: 'Revisor técnico del sistema' },
  });
  return creado.identificador;
}

// Garantiza que una persona tenga sus identidades de cliente (postor) y dueño.
// Idempotente: si ya existen, no hace nada. Devuelve el id de persona.
async function asegurarRolesDominio(db, personaId, categoria = 'comun') {
  const verificador = await obtenerEmpleadoSistema(db);

  await db.clientes.upsert({
    where:  { identificador: personaId },
    update: {},
    create: { identificador: personaId, admitido: 'si', categoria, verificador },
  });

  await db.duenios.upsert({
    where:  { identificador: personaId },
    update: {},
    create: {
      identificador: personaId,
      verificacionFinanciera: 'si',
      verificacionJudicial: 'si',
      calificacionRiesgo: 1,
      verificador,
    },
  });

  return personaId;
}

module.exports = { obtenerEmpleadoSistema, asegurarRolesDominio };
