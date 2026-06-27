/*
Intro: auctionState es un modulo de apoyo del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en utils/auctionState.js.
Endpoints: no llama endpoints directamente.
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: define ESTADOS_PROXIMAMENTE para usarlo en este archivo.
const ESTADOS_PROXIMAMENTE = ['programada', 'proximamente', 'pendiente', 'proxima', 'próximamente'];export // Explica: define normalizarEstadoSubasta para usarlo en este archivo.
const normalizarEstadoSubasta = (estado, cerrado = false) => {// Control: evalua una condicion para decidir el siguiente paso.
  if (cerrado) // Render: devuelve el resultado que consume React o la funcion llamadora.
    return 'finalizado'; // Explica: define valor usando el resultado de toLowerCase.
  const valor = String(estado || '').toLowerCase(); // Control: evalua una condicion para decidir el siguiente paso.
  if (valor === 'abierta' || valor === 'activa' || valor === 'activo' || valor === 'vivo') // Render: devuelve el resultado que consume React o la funcion llamadora.
    return 'vivo'; // Control: evalua una condicion para decidir el siguiente paso.
  if (ESTADOS_PROXIMAMENTE.includes(valor)) // Render: devuelve el resultado que consume React o la funcion llamadora.
    return 'proximamente'; // Control: evalua una condicion para decidir el siguiente paso.
  if (valor === 'cerrada' || valor === 'finalizada' || valor === 'finalizado') // Render: devuelve el resultado que consume React o la funcion llamadora.
    return 'finalizado'; // Render: devuelve el resultado que consume React o la funcion llamadora.
  return valor || 'proximamente';};export // Explica: define esSubastaProximamente para usarlo en este archivo.
const esSubastaProximamente = (estado) => normalizarEstadoSubasta(estado) === 'proximamente';export // Explica: define fechaSubastaLocal para usarlo en este archivo.
const fechaSubastaLocal = (fecha) => {// Control: evalua una condicion para decidir el siguiente paso.
  if (!fecha) // Render: devuelve el resultado que consume React o la funcion llamadora.
    return null; // Explica: define match usando el resultado de match.
  const match = String(fecha).match(/^(\d{4})-(\d{2})-(\d{2})/); // Control: evalua una condicion para decidir el siguiente paso.
  if (match) {// Render: devuelve el resultado que consume React o la funcion llamadora.
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));} // Explica: define parsed para usarlo en este archivo.
  const parsed = new Date(fecha); // Render: devuelve el resultado que consume React o la funcion llamadora.
  return Number.isNaN(parsed.getTime()) ? null : parsed;};export // Explica: define formatearFechaHoraSubasta para usarlo en este archivo.
const formatearFechaHoraSubasta = (fecha, hora) => {// Explica: define fechaBase usando el resultado de fechaSubastaLocal.
  const fechaBase = fechaSubastaLocal(fecha); // Explica: define partes para usarlo en este archivo.
  const partes = []; // Control: evalua una condicion para decidir el siguiente paso.
  if (fechaBase && !Number.isNaN(fechaBase.getTime())) {// Explica: ejecuta partes.push como parte del flujo.
    partes.push(fechaBase.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric',
          month: 'long'
        })
    );
  } // Control: evalua una condicion para decidir el siguiente paso.

  if (hora) {// Explica: define horaTexto para usarlo en este archivo.
    const horaTexto = String(hora).includes('T') ?
    String(hora).slice(11, 16) :
    String(hora).slice(0, 5); // Explica: ejecuta partes.push como parte del flujo.
    partes.push(`${horaTexto} hs`);
  } // Render: devuelve el resultado que consume React o la funcion llamadora.

  return partes.join(', ') || 'Fecha a confirmar';
};
