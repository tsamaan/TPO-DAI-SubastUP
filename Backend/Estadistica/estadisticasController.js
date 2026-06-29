// controllers/estadisticasController.js
// Estadísticas de pujas — Prisma + PostgreSQL

const prisma = require('../config/prisma');

// ── Helper: traer todas las pujas del usuario con su resultado ─
async function getPujasUsuario(personaId) {
  // Buscar todos los asistentes (participaciones) del usuario
  const asistencias = await prisma.asistentes.findMany({
    where: { cliente: personaId },
    select: { identificador: true },
  });

  const asistenteIds = asistencias.map((a) => a.identificador);

  // Traer todas las pujas hechas por el usuario
  const pujas = await prisma.pujos.findMany({
    where: { asistente: { in: asistenteIds } },
    include: {
      itemsCatalogo: {
        include: {
          productos: {
            select: { nombre: true, fotos: { take: 1 } },
          },
        },
      },
    },
    orderBy: { identificador: 'desc' },
  });

  return pujas;
}

// ─────────────────────────────────────────────────────────────
// GET /api/estadisticas
// Devuelve el resumen de estadísticas del usuario
// ─────────────────────────────────────────────────────────────
exports.getEstadisticas = async (req, res) => {
  try {
    const { personaId } = req.user;

    const pujas = await getPujasUsuario(personaId);

    // Agrupar por item para saber si fue ganada o superada (última puja por item)
    const itemsMap = new Map();
    for (const p of pujas) {
      const itemId = p.item;
      if (!itemsMap.has(itemId) || p.identificador > itemsMap.get(itemId).identificador) {
        itemsMap.set(itemId, p);
      }
    }

    let subastasGanadas = 0;
    let subastasPerdidas = 0;
    let totalGastado = 0;

    for (const [, ultimaPuja] of itemsMap) {
      if (ultimaPuja.ganador === 'si') {
        subastasGanadas++;
        totalGastado += parseFloat(ultimaPuja.importe);
      } else if (ultimaPuja.itemsCatalogo.cerrado) {
        // El ítem cerró y esta no fue la puja ganadora → perdida
        subastasPerdidas++;
      }
    }

    const pujasRealizadas = pujas.length;
    const pujasGanadas    = pujas.filter((p) => p.ganador === 'si').length;
    const pujasPerdidas   = pujasRealizadas - pujasGanadas;
    const porcentajeGanadas = pujasRealizadas > 0
      ? Math.round((pujasGanadas / pujasRealizadas) * 100)
      : 0;

    return res.json({
      ok: true,
      estadisticas: {
        subastasPerdidas,
        subastasGanadas,
        pujasRealizadas,
        totalGastado,
        distribucion: {
          ganadas:    pujasGanadas,
          perdidas:   pujasPerdidas,
          total:      pujasRealizadas,
          porcentaje: porcentajeGanadas,
        },
      },
    });

  } catch (err) {
    console.error('getEstadisticas error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener las estadísticas.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/estadisticas/evolucion?tipo=gasto&rango=semana
// tipo: 'gasto' | 'pujas'
// rango: 'semana' | 'anio'
// Devuelve los datos para el gráfico de evolución
// ─────────────────────────────────────────────────────────────
exports.getEvolucion = async (req, res) => {
  try {
    const { personaId } = req.user;
    const tipo  = req.query.tipo  || 'gasto';
    const rango = req.query.rango || 'semana';

    const pujas = await getPujasUsuario(personaId);

    // Determinar rango de fechas y agrupación
    const ahora = new Date();
    let puntos = [];

    if (rango === 'semana') {
      // Últimos 7 días (L a D)
      const inicioSemana = new Date(ahora);
      const diaSemana = (ahora.getDay() + 6) % 7; // lunes = 0
      inicioSemana.setDate(ahora.getDate() - diaSemana);
      inicioSemana.setHours(0, 0, 0, 0);

      const dias = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
      puntos = dias.map((label, i) => {
        const fecha = new Date(inicioSemana);
        fecha.setDate(inicioSemana.getDate() + i);
        return { label, fecha, valor: 0 };
      });

      for (const p of pujas) {
        const fechaPuja = p.fecha || ahora; // si no hay campo fecha, usar identificador como proxy
        for (const punto of puntos) {
          const mismDia =
            new Date(fechaPuja).toDateString() === punto.fecha.toDateString();
          if (mismDia) {
            punto.valor += tipo === 'gasto' ? parseFloat(p.importe) : 1;
          }
        }
      }

    } else {
      // Este año, agrupado por mes
      const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      puntos = meses.map((label, i) => ({ label, mes: i, valor: 0 }));

      for (const p of pujas) {
        const fechaPuja = p.fecha ? new Date(p.fecha) : ahora;
        if (fechaPuja.getFullYear() === ahora.getFullYear()) {
          puntos[fechaPuja.getMonth()].valor += tipo === 'gasto' ? parseFloat(p.importe) : 1;
        }
      }
    }

    const serie = puntos.map((p) => ({ label: p.label, valor: p.valor }));
    const ultimoPeriodo = serie.reduce((acc, p) => acc + p.valor, 0);

    return res.json({
      ok:     true,
      tipo,
      rango,
      serie,
      ultimoPeriodo,
    });

  } catch (err) {
    console.error('getEvolucion error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener la evolución.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/estadisticas/historial
// Lista el historial de pujas del usuario
// ─────────────────────────────────────────────────────────────
exports.getHistorialPujas = async (req, res) => {
  try {
    const { personaId } = req.user;

    const pujas = await getPujasUsuario(personaId);

    const resultado = pujas.map((p) => {
      const foto = p.itemsCatalogo?.productos?.fotos?.[0]?.foto;
      return {
        pujaId:   p.identificador,
        nombre:   p.itemsCatalogo?.productos?.nombre || 'Producto',
        importe:  p.importe,
        // ganada | superada | en_curso
        resultado: p.ganador === 'si'
          ? 'ganada'
          : p.itemsCatalogo?.cerrado
            ? 'superada'
            : 'en_curso',
        portada: foto ? Buffer.from(foto).toString('base64') : null,
      };
    });

    return res.json({ ok: true, historial: resultado });

  } catch (err) {
    console.error('getHistorialPujas error:', err);
    return res.status(500).json({ ok: false, message: 'Error al obtener el historial de pujas.' });
  }
};
