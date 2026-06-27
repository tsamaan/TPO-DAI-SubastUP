/*
Intro: CalendarScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/tabs/CalendarScreen.js.
Endpoints: CALENDAR (/api/auctions/calendar: cargar subastas por mes para el calendario).
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useState, useEffect } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, ScrollView, TouchableOpacity, FlatList, StyleSheet, Image,
  Dimensions } from
'react-native'; // Explica: importa dependencias desde 'react-native-safe-area-context'.
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde '../../context/ThemeContext'.
import { useAppTheme } from '../../context/ThemeContext'; // Explica: importa dependencias desde '../../store/authStore'.
import useAuthStore from '../../store/authStore'; // Explica: importa dependencias desde '@react-navigation/native'.
import { useFocusEffect } from '@react-navigation/native'; // Explica: importa dependencias desde '../../services/api'.
import api from '../../services/api'; // Explica: importa dependencias desde '../../constants/api'.
import { ENDPOINTS } from '../../constants/api'; // Explica: importa dependencias desde '../../utils/auctionState'.
import { fechaSubastaLocal, formatearFechaHoraSubasta, normalizarEstadoSubasta } from '../../utils/auctionState'; // Explica: importa dependencias desde '../../utils/images'.
import { dataUriFromBase64 } from '../../utils/images'; // Explica: define LOGO usando el resultado de require.

const LOGO = require('../../assets/images/texto_appbar.jpeg'); // Explica: define objeto desestructurado usando el resultado de Dimensions.get.
const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// ESTRUCTURA DE DATOS QUE VIENE DE LA API
// Cada subasta del calendario:
// {
//   id:         string
//   titulo:     string
//   imagen:     string | null   → URL Cloudinary
//   moneda:     'ARS' | 'USD'
//   precioBase: number
//   fecha:      string          → 'YYYY-MM-DD'
//   hora:       string          → 'HH:mm'
// }
// ─────────────────────────────────────────────────────────────

// const SUBASTAS_MOCK = [
//   { id: '1', titulo: 'Cuadro de rosas',  imagen: null, moneda: 'USD', precioBase: 500,    fecha: '2025-09-04', hora: '15:00', colorPlaceholder: '#C9B99A' },
//   { id: '2', titulo: 'Silla de oficina', imagen: null, moneda: 'ARS', precioBase: 85000,  fecha: '2025-09-09', hora: '18:00', colorPlaceholder: '#B0BEC5' },
//   { id: '3', titulo: 'Lampara de pared', imagen: null, moneda: 'ARS', precioBase: 32000,  fecha: '2025-09-13', hora: '10:00', colorPlaceholder: '#A5C4A8' },
//   { id: '4', titulo: 'Auto antiguo',     imagen: null, moneda: 'USD', precioBase: 12000,  fecha: '2025-09-13', hora: '20:00', colorPlaceholder: '#C4A58A' },
//   { id: '5', titulo: 'Reloj de pared',   imagen: null, moneda: 'ARS', precioBase: 15000,  fecha: '2025-09-20', hora: '17:00', colorPlaceholder: '#D4B8C0' },
// ];
// Explica: define MESES para usarlo en este archivo.
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']; // Explica: define DIAS_SEMANA para usarlo en este archivo.
const DIAS_SEMANA = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']; // Explica: exporta este modulo para que otras partes de la app lo usen.

export default // Explica: declara la funcion CalendarScreen que concentra una parte del flujo.
function CalendarScreen({ navigation }) {// Explica: define objeto desestructurado usando el resultado de useAppTheme.
  const { theme, isDark } = useAppTheme(); // Explica: define isLoggedIn usando el resultado de useAuthStore.
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn); // Explica: define insets usando el resultado de useSafeAreaInsets.
  const insets = useSafeAreaInsets(); // Explica: define hoy para usarlo en este archivo.
  const hoy = new Date(); // Estado: crea el estado valores desestructurados y su actualizador.
  const [mes, setMes] = useState(hoy.getMonth()); // Estado: crea el estado valores desestructurados y su actualizador.
  const [anio, setAnio] = useState(hoy.getFullYear()); // Estado: crea el estado valores desestructurados y su actualizador.
  const [diaSeleccionado, setDiaSeleccionado] = useState(null); // Estado: crea el estado valores desestructurados y su actualizador.
  const [subastas, setSubastas] = useState([]); // Estado: crea el estado valores desestructurados y su actualizador.
  const [loadingSubastas, setLoadingSubastas] = useState(false);

  // Días con subastas en el mes actual
  // const diasConSubasta = SUBASTAS_MOCK
  //   .filter(s => {
  //     const f = new Date(s.fecha);
  //     return f.getMonth() === mes && f.getFullYear() === anio;
  //   })
  //   .map(s => new Date(s.fecha).getDate());
  // 
  // // Subastas del día seleccionado o todas del mes
  // const subastasFiltradas = diaSeleccionado
  //   ? SUBASTAS_MOCK.filter(s => {
  //       const f = new Date(s.fecha);
  //       return f.getDate() === diaSeleccionado && f.getMonth() === mes && f.getFullYear() === anio;
  //     })
  //   : SUBASTAS_MOCK.filter(s => {
  //       const f = new Date(s.fecha);
  //       return f.getMonth() === mes && f.getFullYear() === anio;
  //     });

  // ── CONEXIÓN BACKEND ─────────────────────────────────────────────────────
  // Carga subastas del mes visible cada vez que la pantalla recibe foco
  // o el usuario cambia de mes (mes/anio cambian → useFocusEffect no re-corre solo;
  // se usa useEffect con [mes, anio] para eso)
  // Efecto: ejecuta logica cuando cambia el ciclo de vida o sus dependencias.
  useEffect(() => {// Explica: define cargarCalendario para usarlo en este archivo.
      const cargarCalendario = async () => {// Control: intenta una operacion y maneja errores si falla.
        try {// Estado: actualiza un valor usado por la interfaz.
          setLoadingSubastas(true); // GET /api/auctions/calendar?month=MES&year=AÑO
          // Devuelve array de subastas con fecha en formato YYYY-MM-DD
          // Explica: define data para usarlo en este archivo.
          const data = await api.get(`${ENDPOINTS.CALENDAR}?month=${mes + 1}&year=${anio}`
          ); // Explica: define subastasMes para usarlo en este archivo.
          const subastasMes = Array.isArray(data?.subastas) ? data.subastas : []; // Estado: actualiza un valor usado por la interfaz.
          setSubastas(subastasMes.map((subasta) => ({
            id: subasta.subastaId,
            itemId: subasta.itemId,
            productoId: subasta.productoId,
            titulo: subasta.nombreArticulo || 'Subasta',
            descripcion: subasta.descripcionArticulo || '',
            imagen: dataUriFromBase64(subasta.portada),
            moneda: subasta.moneda || 'ARS',
            precioBase: Number(subasta.precioBase || 0),
            fecha: subasta.fecha,
            hora: subasta.hora,
            horaTexto: formatearFechaHoraSubasta(null, subasta.hora),
            fechaTexto: formatearFechaHoraSubasta(subasta.fecha, subasta.hora),
            estado: normalizarEstadoSubasta(subasta.estado),
            categoria: subasta.categoria,
            colorPlaceholder: '#C9B99A'
          })));
        } catch (error) {
          // Si falla el backend, dejar el array vacío (no mostrar datos falsos)
          // Explica: ejecuta console.log como parte del flujo.
          console.log('[CalendarScreen] Error al cargar calendario:', error); // Estado: actualiza un valor usado por la interfaz.
          setSubastas([]);} finally {// Estado: actualiza un valor usado por la interfaz.
          setLoadingSubastas(false);
        }
      }; // Explica: ejecuta cargarCalendario como parte del flujo.
      cargarCalendario();
    }, [mes, anio]); // Re-corre cuando el usuario navega de mes

  // BLOQUE DE FILTRADO REAL (reemplaza SUBASTAS_MOCK.filter)
  // Calcula días que tienen subasta en el mes/año visible
  // Explica: define diasConSubasta usando el resultado de map.
  const diasConSubasta = subastas.filter((s) => {
    // Parsear la fecha que viene del backend (YYYY-MM-DD)
    // Explica: define f usando el resultado de fechaSubastaLocal.
    const f = fechaSubastaLocal(s.fecha); // Control: evalua una condicion para decidir el siguiente paso.
    if (!f) // Render: devuelve el resultado que consume React o la funcion llamadora.
      return false; // Render: devuelve el resultado que consume React o la funcion llamadora.
    return f.getMonth() === mes && f.getFullYear() === anio;}).map((s) => fechaSubastaLocal(s.fecha)?.getDate()); // Extraer solo el número de día

  // Filtra las subastas según si hay un día seleccionado o muestra todo el mes
  // Explica: define subastasFiltradas para usarlo en este archivo.
  const subastasFiltradas = diaSeleccionado ? subastas.filter((s) => {// Explica: define f usando el resultado de fechaSubastaLocal.
    const f = fechaSubastaLocal(s.fecha); // Control: evalua una condicion para decidir el siguiente paso.
    if (!f) // Render: devuelve el resultado que consume React o la funcion llamadora.
      return false; // Render: devuelve el resultado que consume React o la funcion llamadora.
    return f.getDate() === diaSeleccionado &&
    f.getMonth() === mes &&
    f.getFullYear() === anio;

  }) :
  subastas.filter((s) => {// Explica: define f usando el resultado de fechaSubastaLocal.
    const f = fechaSubastaLocal(s.fecha); // Control: evalua una condicion para decidir el siguiente paso.
    if (!f) // Render: devuelve el resultado que consume React o la funcion llamadora.
      return false; // Render: devuelve el resultado que consume React o la funcion llamadora.
    return f.getMonth() === mes && f.getFullYear() === anio;});

  // El resto de la pantalla usa subastasFiltradas igual que antes —
  // los campos del objeto cambian de (titulo, moneda, precioBase, hora, colorPlaceholder)
  // a los que devuelva el backend. Ajustar renderSubasta si los nombres difieren.
  // ─────────────────────────────────────────────────────────────────────────
  // Explica: define cambiarMes para usarlo en este archivo.
  const cambiarMes = (delta) => {// Explica: define nuevoMes para usarlo en este archivo.
    let nuevoMes = mes + delta; // Explica: define nuevoAnio para usarlo en este archivo.
    let nuevoAnio = anio; // Control: evalua una condicion para decidir el siguiente paso.
    if (nuevoMes < 0) {// Estado: asigna un nuevo valor para mantener sincronizado el flujo.
      nuevoMes = 11;nuevoAnio--;} // Control: evalua una condicion para decidir el siguiente paso.
    if (nuevoMes > 11) {// Estado: asigna un nuevo valor para mantener sincronizado el flujo.
      nuevoMes = 0;nuevoAnio++;} // Estado: actualiza un valor usado por la interfaz.
    setMes(nuevoMes); // Estado: actualiza un valor usado por la interfaz.
    setAnio(nuevoAnio); // Estado: actualiza un valor usado por la interfaz.
    setDiaSeleccionado(null);};
  // Construir grilla del mes
  // Explica: define primerDia usando el resultado de getDay.
  const primerDia = new Date(anio, mes, 1).getDay(); // Explica: define diasEnMes usando el resultado de getDate.
  const diasEnMes = new Date(anio, mes + 1, 0).getDate(); // Explica: define diasAntMes usando el resultado de getDate.
  const diasAntMes = new Date(anio, mes, 0).getDate(); // Explica: define celdas para usarlo en este archivo.
  const celdas = [];
  for (// Explica: define i para usarlo en este archivo.
  let i = primerDia - 1; i >= 0; i--) {// Explica: ejecuta celdas.push como parte del flujo.
    celdas.push({ dia: diasAntMes - i, esMesActual: false });}
  for (// Explica: define d para usarlo en este archivo.
  let d = 1; d <= diasEnMes; d++) {// Explica: ejecuta celdas.push como parte del flujo.
    celdas.push({ dia: d, esMesActual: true });} // Explica: define restantes para usarlo en este archivo.
  const restantes = 7 - celdas.length % 7; // Control: evalua una condicion para decidir el siguiente paso.
  if (restantes < 7) {
    for (// Explica: define d para usarlo en este archivo.
    let d = 1; d <= restantes; d++) {// Explica: ejecuta celdas.push como parte del flujo.
      celdas.push({ dia: d, esMesActual: false });}
  } // Explica: define esHoy para usarlo en este archivo.

  const esHoy = (dia) =>
  dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear(); // Explica: define tieneSubasta para usarlo en este archivo.

  const tieneSubasta = (dia) => diasConSubasta.includes(dia); // Explica: define renderSubasta para usarlo en este archivo.

  const renderSubasta = ({ item }) => // UI: renderiza un control presionable para el usuario.
  <TouchableOpacity
    style={[styles.subastaCard, { backgroundColor: theme.surface }]}
    activeOpacity={0.86}
    onPress={() => navigation.navigate(isLoggedIn ? 'AuctionDetailAuth' : 'AuctionDetail', { productId: item.id, itemId: item.itemId })}>
    
      {/* Imagen */}
      {item.imagen ? // UI: muestra una imagen o recurso visual.
    <Image source={{ uri: item.imagen }} style={styles.subastaImg} resizeMode="cover" /> : // UI: renderiza el componente View.
    <View style={[styles.subastaImg, { backgroundColor: item.colorPlaceholder }]} />
    }

      {/* Info */}
    <View style={styles.subastaInfo}>
      <Text style={[styles.subastaTitulo, { color: theme.secondary }]} numberOfLines={1}>{item.titulo}</Text>
        {!!item.descripcion && // UI: muestra texto visible en la pantalla.
      <Text style={styles.subastaDescripcion} numberOfLines={1}>{item.descripcion}</Text>}
      <Text style={styles.subastaDetalle}>{item.categoria || 'comun'} · {item.estado === 'vivo' ? 'Activa' : 'Proximamente'}</Text>
      <Text style={styles.subastaHora}>{item.fechaTexto}</Text>
      </View>

    <TouchableOpacity style={styles.btnPujar} onPress={() => {// Navegacion: cambia de pantalla o ajusta opciones de navegacion.
        navigation.navigate(isLoggedIn ? 'AuctionDetailAuth' : 'AuctionDetail', { productId: item.id, itemId: item.itemId });}} activeOpacity={0.85}>
      <Text style={styles.btnPujarText}>{item.estado === 'vivo' ? 'Pujar' : 'Ver'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>; // Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente View.
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.white }]}>

      {/* ── Top Bar ── */}
      <View style={[styles.topBar, { backgroundColor: theme.white, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: theme.secondary }]}>Calendario</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Calendario ── */}
        <View style={[styles.calCard, { backgroundColor: theme.surface }]}>

          {/* Navegación mes */}
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => cambiarMes(-1)} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color={theme.secondary} />
            </TouchableOpacity>

            <Text style={[styles.navMes, { color: theme.secondary }]}>{MESES[mes]}</Text>
            <Text style={[styles.navAnio, { color: theme.placeholder }]}>{anio}</Text>

            <TouchableOpacity onPress={() => cambiarMes(1)} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={theme.secondary} />
            </TouchableOpacity>
          </View>

          {/* Cabecera días */}
          <View style={styles.semanaRow}>
            {DIAS_SEMANA.map((d) => // UI: muestra texto visible en la pantalla.
              <Text key={d} style={styles.diaSemana}>{d}</Text>)}
          </View>

          {/* Grilla días */}
          <View style={styles.grilla}>
            {celdas.map((celda, i) => {// Explica: define activo para usarlo en este archivo.
                const activo = celda.esMesActual; // Explica: define subasta para usarlo en este archivo.
                const subasta = activo && tieneSubasta(celda.dia); // Explica: define hoyFlag para usarlo en este archivo.
                const hoyFlag = activo && esHoy(celda.dia); // Explica: define selec para usarlo en este archivo.
                const selec = activo && diaSeleccionado === celda.dia; // Render: devuelve el resultado que consume React o la funcion llamadora.
                return (// UI: renderiza un control presionable para el usuario.
                  <TouchableOpacity key={i} style={[styles.celdaDia, subasta && styles.celdaConSubasta, hoyFlag && !subasta && styles.celdaHoy, selec && styles.celdaSeleccionada]} onPress={() => activo && setDiaSeleccionado(selec ? null : celda.dia)} disabled={!activo}>
                    <Text style={[styles.celdaTexto, !activo && styles.textoApagado, subasta && styles.textoBlancoSubasta, hoyFlag && !subasta && styles.textoHoy, selec && styles.textoBlanco]
                      }>
                    {celda.dia}
                  </Text>
                </TouchableOpacity>);

              })}
          </View>
        </View>

        {/* ── Lista subastas ── */}
        <Text style={[styles.seccionTitulo, { color: theme.secondary }]}>
          {diaSeleccionado ? `Subastas del ${diaSeleccionado} de ${MESES[mes]}` :
          'Subastas este mes'
          }
        </Text>

        {subastasFiltradas.length === 0 ? // UI: renderiza el componente View.
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={40} color="#E0E0E0" />
          <Text style={styles.emptyText}>No hay subastas para este día</Text>
          </View> : subastasFiltradas.map((item) => // UI: renderiza el componente View.
        <View key={item.id}>
              {renderSubasta({ item })}
            </View>
        )
        }

      </ScrollView>
    </View>);

} // Explica: define CELDA para usarlo en este archivo.

const CELDA = (width - 24 - 24) / 7; // Explica: define styles usando el resultado de StyleSheet.create.

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { padding: 12, paddingBottom: 32 },

  // Top Bar
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8E0',
    elevation: 3,
    shadowColor: '#8b0000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6
  },
  backBtn: { padding: 4 },
  topBarTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', letterSpacing: 0.3 },

  // Calendario
  calCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  navBtn: { padding: 4 },
  navMes: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  navAnio: { fontSize: 16, fontWeight: '400', color: '#555555', marginLeft: 6 },

  semanaRow: {
    flexDirection: 'row',
    marginBottom: 4
  },
  diaSemana: {
    width: CELDA,
    textAlign: 'center',
    fontSize: 12,
    color: '#888888',
    fontWeight: '600'
  },

  grilla: { flexDirection: 'row', flexWrap: 'wrap' },
  celdaDia: {
    width: CELDA,
    height: CELDA,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: CELDA / 2
  },
  celdaConSubasta: { backgroundColor: '#8b0000' },
  celdaHoy: { backgroundColor: '#FFCDD2' },
  celdaSeleccionada: { backgroundColor: '#5a0000' },
  celdaTexto: { fontSize: 13, fontWeight: '500', color: '#1A1A1A' },
  textoApagado: { color: '#CCCCCC' },
  textoBlancoSubasta: { color: '#FFFFFF', fontWeight: '700' },
  textoHoy: { color: '#8b0000', fontWeight: '700' },
  textoBlanco: { color: '#FFFFFF', fontWeight: '700' },

  // Sección subastas
  seccionTitulo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12
  },

  subastaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2
  },
  subastaImg: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#CCCCCC'
  },
  subastaInfo: {
    flex: 1,
    marginHorizontal: 10
  },
  subastaTitulo: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  subastaDescripcion: { fontSize: 11, color: '#666666', marginTop: 1 },
  subastaDetalle: { fontSize: 12, color: '#888888', marginTop: 2 },
  subastaHora: { fontSize: 11, color: '#8b0000', marginTop: 2, fontWeight: '600' },

  btnPujar: {
    backgroundColor: '#8b0000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6
  },
  btnPujarText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', marginTop: 32 },
  emptyText: { color: '#9E9E9E', fontSize: 14, marginTop: 10 }
});
