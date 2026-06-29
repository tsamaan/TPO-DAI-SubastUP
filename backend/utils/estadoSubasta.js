const ZONA_HORARIA_SUBASTA = 'America/Argentina/Buenos_Aires';

const ESTADOS_ABIERTOS = ['abierta', 'activa', 'activo', 'vivo'];
const ESTADOS_PROGRAMABLES = ['programada', 'proximamente', 'pr\u00f3ximamente', 'proxima', 'pendiente'];

function partesActualesArgentina(ahora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA_SUBASTA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(ahora);

  const valor = (tipo) => Number(partes.find((parte) => parte.type === tipo)?.value || 0);
  return {
    anio: valor('year'),
    mes: valor('month'),
    dia: valor('day'),
    hora: valor('hour'),
    minuto: valor('minute'),
  };
}

function partesFechaSubasta(fecha) {
  if (!fecha) return null;

  const texto = String(fecha);
  const match = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return {
      anio: Number(match[1]),
      mes: Number(match[2]),
      dia: Number(match[3]),
    };
  }

  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return null;

  return {
    anio: date.getUTCFullYear(),
    mes: date.getUTCMonth() + 1,
    dia: date.getUTCDate(),
  };
}

function partesHoraSubasta(hora) {
  if (!hora) return { hora: 0, minuto: 0 };

  if (hora instanceof Date) {
    return {
      hora: hora.getUTCHours(),
      minuto: hora.getUTCMinutes(),
    };
  }

  const texto = String(hora);
  const match = texto.match(/(?:T)?(\d{2}):(\d{2})/);
  if (match) return { hora: Number(match[1]), minuto: Number(match[2]) };

  const date = new Date(hora);
  if (Number.isNaN(date.getTime())) return { hora: 0, minuto: 0 };

  return {
    hora: date.getUTCHours(),
    minuto: date.getUTCMinutes(),
  };
}

function valorComparable({ anio, mes, dia, hora = 0, minuto = 0 }) {
  return Date.UTC(anio, mes - 1, dia, hora, minuto);
}

function horarioSubastaAlcanzado(fecha, hora, ahora = new Date()) {
  const fechaPartes = partesFechaSubasta(fecha);
  if (!fechaPartes) return false;

  const horaPartes = partesHoraSubasta(hora);
  const inicio = valorComparable({ ...fechaPartes, ...horaPartes });
  const actual = valorComparable(partesActualesArgentina(ahora));

  return actual >= inicio;
}

function estadoEfectivoSubasta(subasta, cerrado = false, ahora = new Date()) {
  if (cerrado) return 'finalizada';

  const estado = String(subasta?.estado || '').toLowerCase();
  if (ESTADOS_ABIERTOS.includes(estado)) return subasta.estado;
  if (ESTADOS_PROGRAMABLES.includes(estado) && horarioSubastaAlcanzado(subasta?.fecha, subasta?.hora, ahora)) {
    return 'abierta';
  }

  return subasta?.estado || 'programada';
}

function esSubastaAbiertaParaPujar(subasta, cerrado = false, ahora = new Date()) {
  const estado = String(estadoEfectivoSubasta(subasta, cerrado, ahora)).toLowerCase();
  return ESTADOS_ABIERTOS.includes(estado);
}

module.exports = {
  estadoEfectivoSubasta,
  esSubastaAbiertaParaPujar,
  horarioSubastaAlcanzado,
};
