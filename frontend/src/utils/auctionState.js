const ESTADOS_PROXIMAMENTE = ['programada', 'proximamente', 'pendiente', 'proxima', 'próximamente'];

export const normalizarEstadoSubasta = (estado, cerrado = false) => {
  if (cerrado) return 'finalizado';
  const valor = String(estado || '').toLowerCase();
  if (valor === 'abierta' || valor === 'activa' || valor === 'activo' || valor === 'vivo') return 'vivo';
  if (ESTADOS_PROXIMAMENTE.includes(valor)) return 'proximamente';
  if (valor === 'cerrada' || valor === 'finalizada' || valor === 'finalizado') return 'finalizado';
  return valor || 'proximamente';
};

export const esSubastaProximamente = (estado) =>
  normalizarEstadoSubasta(estado) === 'proximamente';

export const fechaSubastaLocal = (fecha) => {
  if (!fecha) return null;
  const match = String(fecha).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const parsed = new Date(fecha);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatearFechaHoraSubasta = (fecha, hora) => {
  const fechaBase = fechaSubastaLocal(fecha);
  const partes = [];

  if (fechaBase && !Number.isNaN(fechaBase.getTime())) {
    partes.push(
      fechaBase.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    );
  }

  if (hora) {
    const horaTexto = String(hora).includes('T')
      ? String(hora).slice(11, 16)
      : String(hora).slice(0, 5);
    partes.push(`${horaTexto} hs`);
  }

  return partes.join(', ') || 'Fecha a confirmar';
};
