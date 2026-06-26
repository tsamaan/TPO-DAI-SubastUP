import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import {
  GraficoEvolucion,
  GraficoDistribucion,
} from '../../components/EstadisticasCharts';
import { COLORS } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import useAuthStore from '../../store/authStore';

const { width } = Dimensions.get('window');

// ──────────────────────────────────────────────
// Datos de ejemplo — reemplazá con tu API/estado
// ──────────────────────────────────────────────
// const MOCK_STATS = {
//   subastasPerdidas: 7,
//   pujasRealizadas: 17,
//   subastasGanadas: 3,
//   totalGastado: '$128.400',
// };
// 
// const MOCK_HISTORIAL = [
//   {
//     id: '1',
//     titulo: 'Cámara analógica Nikon F3',
//     imagen: 'https://picsum.photos/seed/cam/60/60',
//     monto: '$12.500',
//     estado: 'Ganada',
//     fecha: 'hace 2 días',
//   },
//   {
//     id: '2',
//     titulo: 'Reloj Seiko vintage 1978',
//     imagen: 'https://picsum.photos/seed/watch/60/60',
//     monto: '$8.200',
//     estado: 'Superada',
//     fecha: 'hace 5 días',
//   },
//   {
//     id: '3',
//     titulo: 'Silla Eames replica',
//     imagen: 'https://picsum.photos/seed/chair/60/60',
//     monto: '$31.000',
//     estado: 'Superada',
//     fecha: 'hace 1 día',
//   },
// ];

// ──────────────────────────────────────────────
// Sub-componentes
// ──────────────────────────────────────────────

const StatCard = ({ label, value }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const EstadoBadge = ({ estado }) => {
  const colores = {
    Ganada:   { bg: '#e8f5e9', text: COLORS.success },
    Superada: { bg: '#ffebee', text: COLORS.primary },
    Perdida:  { bg: '#ffebee', text: COLORS.primary },
  };
  const c = colores[estado] || { bg: '#f0f0f0', text: '#555' };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{estado}</Text>
    </View>
  );
};

const HistorialItem = ({ item, onPress }) => (
  <TouchableOpacity style={styles.historialItem} onPress={() => onPress(item)} activeOpacity={0.7}>
    <Image source={{ uri: item.imagen }} style={styles.historialImg} />
    <View style={styles.historialInfo}>
      <Text style={styles.historialTitulo} numberOfLines={1}>{item.titulo}</Text>
      <Text style={styles.historialFecha}>{item.fecha}</Text>
      <View style={styles.historialBottom}>
        <Text style={styles.historialMonto}>{item.monto}</Text>
        <EstadoBadge estado={item.estado} />
      </View>
    </View>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

// ──────────────────────────────────────────────
// Pantalla principal
// ──────────────────────────────────────────────

export default function InformacionScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [historial, setHistorial] = useState([]);
  // @TASK: Distingue los skeletons iniciales del estado vacío real del historial.
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [evolucionData, setEvolucionData] = useState(null);
  const [distData,      setDistData]      = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      const cargarGraficos = async () => {
        // TODO: reemplazar con llamada al backend cuando esté disponible
        // const evol = await fetchEvolucionMock();
        // setEvolucionData(evol);
        // const dist = await fetchDistribucionMock();
        // setDistData(dist);

      // ── CONEXIÓN BACKEND — gráficos ──────────────────────────────────────
      // GET /api/users/me/stats/evolution
      // Devuelve array de puntos: [{ fecha: 'YYYY-MM-DD', monto: number }]
      const evol = await api.get(ENDPOINTS.MY_STATS_EVOL);
      const serie = Array.isArray(evol?.serie) ? evol.serie : [];
      const puntos = serie.map((p) => ({
        label: p.label,
        gasto: Number(p.valor || 0),
        pujas: Number(p.valor || 0),
      }));
      setEvolucionData({ semana: puntos, mes: puntos });

      // GET /api/users/me/stats
      // Devuelve: { subastasGanadas, subastasPerdidas, pujasRealizadas, totalGastado }
      // Se usa para el gráfico de distribución ganadas vs perdidas
      const statsData = await api.get(ENDPOINTS.MY_STATS);
      const estadisticas = statsData?.estadisticas || statsData || {};
      setDistData({
        ganadas:  estadisticas?.subastasGanadas  ?? 0,
        perdidas: estadisticas?.subastasPerdidas ?? 0,
      });
      // ─────────────────────────────────────────────────────────────────────
      };
      cargarGraficos();
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      // TODO: reemplazar con GET /api/users/me/stats cuando el backend esté listo
      // setTimeout(() => {
      //   setStats(MOCK_STATS);
      //   setHistorial(MOCK_HISTORIAL);
      // }, 300);

      // ── CONEXIÓN BACKEND — stats y historial ─────────────────────────────
      // GET /api/users/me/stats
      // Devuelve: { subastasGanadas, subastasPerdidas, pujasRealizadas, totalGastado }
      const loadStatsAndHistory = async () => {
        try {
          const statsResponse = await api.get(ENDPOINTS.MY_STATS);
          const stats = statsResponse?.estadisticas || statsResponse || {};
          // Mapear campos del backend al formato que usan los StatCard
          setStats({
            subastasGanadas:  stats?.subastasGanadas  ?? 0,
            subastasPerdidas: stats?.subastasPerdidas ?? 0,
            pujasRealizadas:  stats?.pujasRealizadas  ?? 0,
            totalGastado:     stats?.totalGastado     ?? '$0',
          });

        } catch(error) {
          console.log('[InformacionScreen] Error fetching stats or bids', error);
          setHistorial([]);
        } finally {
          // @TASK: Habilita el mensaje vacío cuando la carga de pujas terminó.
          setLoadingHistorial(false);
        }
      };
      loadStatsAndHistory();
      // ─────────────────────────────────────────────────────────────────────
    }, [])
  );

  const handleVerArticulos = () => {
    navigation.navigate('ArticulosEnSubastas');
  };

  const handleVerHistorialPujas = () => {
    navigation.navigate('HistorialPujas');
  };

  const handleHistorialPress = (item) => {
    // navigation.navigate('DetallePuja', { item });
    console.log('Puja seleccionada:', item.titulo);
  };

  // Contenido fijo que va arriba del historial (ListHeaderComponent)
  const ListHeader = () => (
    <View style={styles.listHeader}>
      {/* ── ESTADÍSTICAS ── */}
      <View style={styles.statsHeader}>
        <Text style={styles.sectionTitle}>ESTADÍSTICAS</Text>
      </View>

      {/* Tarjetas resumen */}
      <View style={styles.statsContainer}>
        {stats ? (
          <>
            <StatCard label="Subastas perdidas" value={stats.subastasPerdidas} />
            <StatCard label="Pujas realizadas" value={stats.pujasRealizadas} />
            <StatCard label="Subastas ganadas" value={stats.subastasGanadas} />
            <StatCard label="Total gastado" value={stats.totalGastado} />
          </>
        ) : (
          <View style={styles.statsPlaceholder} />
        )}
      </View>

      {/* Gráfico evolución de gasto/pujas */}
      <GraficoEvolucion data={evolucionData} loading={!evolucionData} />

      {/* Gráfico distribución ganadas/perdidas/activas */}
      <GraficoDistribucion
        ganadas={distData?.ganadas}
        perdidas={distData?.perdidas}
        loading={!distData}
      />

      {/* ── MIS ARTÍCULOS ── */}
      <TouchableOpacity style={styles.articulosBtn} onPress={handleVerArticulos} activeOpacity={0.8}>
        <Text style={styles.articulosBtnText}>Tus artículos en subastas</Text>
        <Text style={styles.articulosChevron}>›</Text>
      </TouchableOpacity>

      {/* ── HISTORIAL DE PUJAS ── */}
      <Text style={[styles.sectionTitle, { marginBottom: 12, marginTop: 4 }]}>HISTORIAL DE PUJAS</Text>
      <TouchableOpacity style={styles.articulosBtn} onPress={handleVerHistorialPujas} activeOpacity={0.8}>
        <Text style={styles.articulosBtnText}>Tu historial de pujas</Text>
        <Text style={styles.articulosChevron}>›</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header fijo */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Información</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* FlatList: solo el historial es scrolleable */}
      <FlatList
        data={[]}
        keyExtractor={(item) => (typeof item === 'object' ? item.id : item)}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.flatContent}
        showsVerticalScrollIndicator={false}
        renderItem={() => null}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────
// Estilos
// ──────────────────────────────────────────────

const ACCENT        = COLORS.primary;
const GRAY_BG       = COLORS.background;
const GRAY_BORDER   = COLORS.border;
const TEXT_PRIMARY  = COLORS.secondary;
const TEXT_SECONDARY = COLORS.placeholder;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // ── Header ──
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

  // ── FlatList ──
  flatContent: {
    paddingBottom: 24,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // ── Section title ──
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: TEXT_PRIMARY,
    marginBottom: 0,
  },

  // ── Stats ──
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FDF5F5',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: ACCENT,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  statsPlaceholder: {
    width: '100%',
    height: 130,
    backgroundColor: GRAY_BG,
    borderRadius: 14,
  },

  // ── Artículos botón ──
  articulosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  articulosBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  articulosChevron: {
    fontSize: 22,
    color: TEXT_SECONDARY,
    lineHeight: 24,
  },

  // ── Historial ──
  historialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    padding: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  historialImg: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: GRAY_BG,
    marginRight: 12,
  },
  historialInfo: {
    flex: 1,
  },
  historialTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  historialFecha: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    marginBottom: 6,
  },
  historialBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historialMonto: {
    fontSize: 14,
    fontWeight: '700',
    color: ACCENT,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 20,
    color: TEXT_SECONDARY,
    marginLeft: 8,
  },
  historialSkeleton: {
    height: 76,
    backgroundColor: GRAY_BG,
    borderRadius: 14,
    marginHorizontal: 16,
  },
  historialVacio: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  historialVacioTexto: {
    color: TEXT_SECONDARY,
    fontSize: 15,
    textAlign: 'center',
  },
});
