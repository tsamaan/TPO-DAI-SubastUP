import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import useAuthStore from '../../store/authStore';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import { fechaSubastaLocal, formatearFechaHoraSubasta, normalizarEstadoSubasta } from '../../utils/auctionState';
import { dataUriFromBase64 } from '../../utils/images';

const LOGO = require('../../assets/images/texto_appbar.jpeg');
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

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_SEMANA = ['Su','Mo','Tu','We','Th','Fr','Sa'];

export default function CalendarScreen({ navigation }) {
  const { theme, isDark } = useAppTheme();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const insets = useSafeAreaInsets();
  const hoy    = new Date();

  const [mes,  setMes]  = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [subastas, setSubastas] = useState([]);
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
  useEffect(() => {
    const cargarCalendario = async () => {
      try {
        setLoadingSubastas(true);
        // GET /api/auctions/calendar?month=MES&year=AÑO
        // Devuelve array de subastas con fecha en formato YYYY-MM-DD
        const data = await api.get(
          `${ENDPOINTS.CALENDAR}?month=${mes + 1}&year=${anio}`
        );
        const subastasMes = Array.isArray(data?.subastas) ? data.subastas : [];
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
          colorPlaceholder: '#C9B99A',
        })));
      } catch (error) {
        // Si falla el backend, dejar el array vacío (no mostrar datos falsos)
        console.log('[CalendarScreen] Error al cargar calendario:', error);
        setSubastas([]);
      } finally {
        setLoadingSubastas(false);
      }
    };
    cargarCalendario();
  }, [mes, anio]); // Re-corre cuando el usuario navega de mes

  // BLOQUE DE FILTRADO REAL (reemplaza SUBASTAS_MOCK.filter)
  // Calcula días que tienen subasta en el mes/año visible
  const diasConSubasta = subastas
    .filter(s => {
      // Parsear la fecha que viene del backend (YYYY-MM-DD)
      const f = fechaSubastaLocal(s.fecha);
      if (!f) return false;
      return f.getMonth() === mes && f.getFullYear() === anio;
    })
    .map(s => fechaSubastaLocal(s.fecha)?.getDate()); // Extraer solo el número de día

  // Filtra las subastas según si hay un día seleccionado o muestra todo el mes
  const subastasFiltradas = diaSeleccionado
    ? subastas.filter(s => {
        const f = fechaSubastaLocal(s.fecha);
        if (!f) return false;
        return (
          f.getDate()     === diaSeleccionado &&
          f.getMonth()    === mes             &&
          f.getFullYear() === anio
        );
      })
    : subastas.filter(s => {
        const f = fechaSubastaLocal(s.fecha);
        if (!f) return false;
        return f.getMonth() === mes && f.getFullYear() === anio;
      });

  // El resto de la pantalla usa subastasFiltradas igual que antes —
  // los campos del objeto cambian de (titulo, moneda, precioBase, hora, colorPlaceholder)
  // a los que devuelva el backend. Ajustar renderSubasta si los nombres difieren.
  // ─────────────────────────────────────────────────────────────────────────

  const cambiarMes = (delta) => {
    let nuevoMes  = mes + delta;
    let nuevoAnio = anio;
    if (nuevoMes < 0)  { nuevoMes = 11; nuevoAnio--; }
    if (nuevoMes > 11) { nuevoMes = 0;  nuevoAnio++; }
    setMes(nuevoMes);
    setAnio(nuevoAnio);
    setDiaSeleccionado(null);
  };

  // Construir grilla del mes
  const primerDia    = new Date(anio, mes, 1).getDay();
  const diasEnMes    = new Date(anio, mes + 1, 0).getDate();
  const diasAntMes   = new Date(anio, mes, 0).getDate();
  const celdas       = [];

  for (let i = primerDia - 1; i >= 0; i--) {
    celdas.push({ dia: diasAntMes - i, esMesActual: false });
  }
  for (let d = 1; d <= diasEnMes; d++) {
    celdas.push({ dia: d, esMesActual: true });
  }
  const restantes = 7 - (celdas.length % 7);
  if (restantes < 7) {
    for (let d = 1; d <= restantes; d++) {
      celdas.push({ dia: d, esMesActual: false });
    }
  }

  const esHoy = (dia) =>
    dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear();

  const tieneSubasta = (dia) => diasConSubasta.includes(dia);

  const renderSubasta = ({ item }) => (
    <TouchableOpacity
      style={[styles.subastaCard, { backgroundColor: theme.background }]}
      activeOpacity={0.86}
      onPress={() => navigation.navigate(isLoggedIn ? 'AuctionDetailAuth' : 'AuctionDetail', { productId: item.id, itemId: item.itemId })}
    >
      {/* Imagen */}
      {item.imagen
        ? <Image source={{ uri: item.imagen }} style={styles.subastaImg} resizeMode="cover" />
        : <View style={[styles.subastaImg, { backgroundColor: item.colorPlaceholder }]} />
      }

      {/* Info */}
      <View style={styles.subastaInfo}>
        <Text style={[styles.subastaTitulo, { color: theme.secondary }]} numberOfLines={1}>{item.titulo}</Text>
        {!!item.descripcion && <Text style={styles.subastaDescripcion} numberOfLines={1}>{item.descripcion}</Text>}
        <Text style={styles.subastaDetalle}>{item.categoria || 'comun'} · {item.estado === 'vivo' ? 'Activa' : 'Proximamente'}</Text>
        <Text style={styles.subastaHora}>{item.fechaTexto}</Text>
      </View>

      <TouchableOpacity
        style={styles.btnPujar}
        onPress={() => {
          navigation.navigate(isLoggedIn ? 'AuctionDetailAuth' : 'AuctionDetail', { productId: item.id, itemId: item.itemId });
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.btnPujarText}>{item.estado === 'vivo' ? 'Pujar' : 'Ver'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
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
        <View style={[styles.calCard, { backgroundColor: theme.background }]}>

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
            {DIAS_SEMANA.map(d => (
              <Text key={d} style={styles.diaSemana}>{d}</Text>
            ))}
          </View>

          {/* Grilla días */}
          <View style={styles.grilla}>
            {celdas.map((celda, i) => {
              const activo   = celda.esMesActual;
              const subasta  = activo && tieneSubasta(celda.dia);
              const hoyFlag  = activo && esHoy(celda.dia);
              const selec    = activo && diaSeleccionado === celda.dia;

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.celdaDia,
                    subasta && styles.celdaConSubasta,
                    hoyFlag && !subasta && styles.celdaHoy,
                    selec    && styles.celdaSeleccionada,
                  ]}
                  onPress={() => activo && setDiaSeleccionado(selec ? null : celda.dia)}
                  disabled={!activo}
                >
                  <Text style={[
                    styles.celdaTexto,
                    !activo   && styles.textoApagado,
                    subasta   && styles.textoBlancoSubasta,
                    hoyFlag && !subasta && styles.textoHoy,
                    selec     && styles.textoBlanco,
                  ]}>
                    {celda.dia}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Lista subastas ── */}
        <Text style={[styles.seccionTitulo, { color: theme.secondary }]}>
          {diaSeleccionado
            ? `Subastas del ${diaSeleccionado} de ${MESES[mes]}`
            : 'Subastas este mes'
          }
        </Text>

        {subastasFiltradas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={40} color="#E0E0E0" />
            <Text style={styles.emptyText}>No hay subastas para este día</Text>
          </View>
        ) : (
          subastasFiltradas.map(item => (
            <View key={item.id}>
              {renderSubasta({ item })}
            </View>
          ))
        )}

      </ScrollView>
    </View>
  );
}

const CELDA = (width - 24 - 24) / 7;

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#FFFFFF' },
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
    shadowRadius: 6,
  },
  backBtn:     { padding: 4 },
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
    shadowRadius: 3,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navBtn:  { padding: 4 },
  navMes:  { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  navAnio: { fontSize: 16, fontWeight: '400', color: '#555555', marginLeft: 6 },

  semanaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  diaSemana: {
    width: CELDA,
    textAlign: 'center',
    fontSize: 12,
    color: '#888888',
    fontWeight: '600',
  },

  grilla: { flexDirection: 'row', flexWrap: 'wrap' },
  celdaDia: {
    width: CELDA,
    height: CELDA,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: CELDA / 2,
  },
  celdaConSubasta:   { backgroundColor: '#8b0000' },
  celdaHoy:          { backgroundColor: '#FFCDD2' },
  celdaSeleccionada: { backgroundColor: '#5a0000' },
  celdaTexto:        { fontSize: 13, fontWeight: '500', color: '#1A1A1A' },
  textoApagado:      { color: '#CCCCCC' },
  textoBlancoSubasta:{ color: '#FFFFFF', fontWeight: '700' },
  textoHoy:          { color: '#8b0000', fontWeight: '700' },
  textoBlanco:       { color: '#FFFFFF', fontWeight: '700' },

  // Sección subastas
  seccionTitulo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
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
    shadowRadius: 2,
  },
  subastaImg: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#CCCCCC',
  },
  subastaInfo: {
    flex: 1,
    marginHorizontal: 10,
  },
  subastaTitulo:  { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  subastaDescripcion: { fontSize: 11, color: '#666666', marginTop: 1 },
  subastaDetalle: { fontSize: 12, color: '#888888', marginTop: 2 },
  subastaHora:    { fontSize: 11, color: '#8b0000', marginTop: 2, fontWeight: '600' },

  btnPujar: {
    backgroundColor: '#8b0000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  btnPujarText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', marginTop: 32 },
  emptyText:      { color: '#9E9E9E', fontSize: 14, marginTop: 10 },
});
