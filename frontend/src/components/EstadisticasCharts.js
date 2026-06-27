/*
Intro: EstadisticasCharts es un modulo de apoyo del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en components/EstadisticasCharts.js.
Endpoints: no llama endpoints directamente.
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ /**
 * EstadisticasCharts.js
 *
 * Gráficos de estadísticas en tiempo real para la pantalla de Información.
 * Requiere: react-native-svg  →  npm install react-native-svg
 *           (expo: npx expo install react-native-svg)
 *
 * Exporta dos componentes listos para usar:
 *   <GraficoEvolucion data={...} periodo="semana"|"mes" />
 *   <GraficoDistribucion ganadas={n} perdidas={n} activas={n} />
 */ // Explica: importa dependencias desde 'react'.
import React, { useEffect, useRef, useState } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions } from
'react-native'; // Explica: importa dependencias desde 'react-native-svg'.
import Svg, {
  Path,
  Polyline,
  Line,
  Circle,
  G,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
  Rect } from
'react-native-svg'; // Explica: importa dependencias desde '../constants/colors'.
import { COLORS } from '../constants/colors'; // Explica: define objeto desestructurado usando el resultado de Dimensions.get.

const { width: SCREEN_WIDTH } = Dimensions.get('window'); // Explica: define CHART_WIDTH para usarlo en este archivo.
const CHART_WIDTH = SCREEN_WIDTH - 48; // padding horizontal 24 * 2
// Explica: define ACCENT para usarlo en este archivo.
const ACCENT = COLORS.primary; // Explica: define ACCENT2 para usarlo en este archivo.
const ACCENT2 = COLORS.primary; // Explica: define BLUE para usarlo en este archivo.
const BLUE = '#3B82F6'; // Explica: define GREEN para usarlo en este archivo.
const GREEN = '#22C55E'; // Explica: define RED para usarlo en este archivo.
const RED = '#EF4444'; // Explica: define GRAY para usarlo en este archivo.
const GRAY = '#94A3B8'; // Explica: define CARD_BG para usarlo en este archivo.
const CARD_BG = '#FAFAFA'; // Explica: define BORDER para usarlo en este archivo.
const BORDER = '#E8ECF0';
// ─────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────

/** Normaliza un array de valores al rango [0, 1] */ // Explica: define normalize para usarlo en este archivo.
const normalize = (values) => {// Explica: define min usando el resultado de Math.min.
  const min = Math.min(...values); // Explica: define max usando el resultado de Math.max.
  const max = Math.max(...values); // Control: evalua una condicion para decidir el siguiente paso.
  if (max === min) // Render: devuelve el resultado que consume React o la funcion llamadora.
    return values.map(() => 0.5); // Render: devuelve el resultado que consume React o la funcion llamadora.
  return values.map((v) => (v - min) / (max - min));};

/** Genera el path SVG de una línea suavizada (curva bezier) */ // Explica: define smoothPath para usarlo en este archivo.
const smoothPath = (points) => {// Control: evalua una condicion para decidir el siguiente paso.
  if (points.length < 2) // Render: devuelve el resultado que consume React o la funcion llamadora.
    return ''; // Explica: define d para usarlo en este archivo.
  let d = `M ${points[0].x},${points[0].y}`;for (// Explica: define i para usarlo en este archivo.
  let i = 1; i < points.length; i++) {// Explica: define prev para usarlo en este archivo.
    const prev = points[i - 1]; // Explica: define curr para usarlo en este archivo.
    const curr = points[i]; // Explica: define cpX para usarlo en este archivo.
    const cpX = (prev.x + curr.x) / 2; // Estado: asigna un nuevo valor para mantener sincronizado el flujo.
    d += ` C ${cpX},${prev.y} ${cpX},${curr.y} ${curr.x},${curr.y}`;} // Render: devuelve el resultado que consume React o la funcion llamadora.
  return d;
};

/** Formatea números grandes: 1200 → $1.2k */ // Explica: define fmtMonto para usarlo en este archivo.
const fmtMonto = (n) => {// Control: evalua una condicion para decidir el siguiente paso.
  if (n >= 1000) // Render: devuelve el resultado que consume React o la funcion llamadora.
    return `$${(n / 1000).toFixed(1)}k`; // Render: devuelve el resultado que consume React o la funcion llamadora.
  return `$${n}`;};

// ─────────────────────────────────────────────────────────────
// Hook: simula datos en tiempo real
// ─────────────────────────────────────────────────────────────

/**
 * useRealtimeData
 * En producción, reemplazá fetchFn por tu llamada real a la API.
 * El hook re-fetcha cada `intervalMs` milisegundos.
 * @deprecated - usar useFocusEffect en su lugar
 */
export // Explica: declara la funcion useRealtimeData que concentra una parte del flujo.
function useRealtimeData(fetchFn, intervalMs = 15000) {// Estado: crea el estado valores desestructurados y su actualizador.
  const [data, setData] = useState(null); // Efecto: ejecuta logica cuando cambia el ciclo de vida o sus dependencias.
  useEffect(() => {// Explica: define load para usarlo en este archivo.
    const load = async () => {// Explica: define result para usarlo en este archivo.
      const result = await fetchFn(); // Estado: actualiza un valor usado por la interfaz.
      setData(result);
    }; // Explica: ejecuta load como parte del flujo.
    load(); // Explica: define id usando el resultado de setInterval.
    const id = setInterval(load, intervalMs); // Render: devuelve el resultado que consume React o la funcion llamadora.
    return () => clearInterval(id);
  }, []); // Render: devuelve el resultado que consume React o la funcion llamadora.

  return data;
}

// ─────────────────────────────────────────────────────────────
// Datos mock (reemplazá con tu API)
// ─────────────────────────────────────────────────────────────

export // Explica: define fetchEvolucionMock para usarlo en este archivo.
const fetchEvolucionMock = async () => {// Simula variación aleatoria pequeña en cada refresh
  // Explica: define base para usarlo en este archivo.
  const base = [4200, 7800, 5500, 12000, 9300, 15600, 11200, 18900, 14500, 22300, 19800, 28400]; // Render: devuelve el resultado que consume React o la funcion llamadora.
  return { semana: ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => ({
      label: d,
      gasto: Math.round(base[i] * (0.95 + Math.random() * 0.1)),
      pujas: Math.round((i + 1) * 2.3 * (0.9 + Math.random() * 0.2))
    })),
    mes: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((m, i) => ({
      label: m,
      gasto: Math.round(base[i] * (0.95 + Math.random() * 0.1)),
      pujas: Math.round((i + 1) * 1.4 * (0.9 + Math.random() * 0.2))
    }))
  };
};

export // Explica: define fetchDistribucionMock para usarlo en este archivo.
const fetchDistribucionMock = async () => ({ ganadas: 3 + Math.floor(Math.random() * 2),
  perdidas: 8 + Math.floor(Math.random() * 3)
});

// ─────────────────────────────────────────────────────────────
// Componente: Gráfico de línea con área (Evolución)
// ─────────────────────────────────────────────────────────────

/**
 * GraficoEvolucion
 * Props:
 *   data   → objeto con keys 'semana' y 'mes', cada uno array de { label, gasto, pujas }
 *   loading → bool
 */
export // Explica: declara la funcion GraficoEvolucion que concentra una parte del flujo.
function GraficoEvolucion({ data, loading = false }) {// Estado: crea el estado valores desestructurados y su actualizador.
  const [periodo, setPeriodo] = useState('semana'); // Estado: crea el estado valores desestructurados y su actualizador.
  const [metrica, setMetrica] = useState('gasto'); // 'gasto' | 'pujas'
  // Explica: define animProgress para usarlo en este archivo.
  const animProgress = useRef(new Animated.Value(0)).current; // Estado: crea el estado valores desestructurados y su actualizador.
  const [animVal, setAnimVal] = useState(0); // Explica: define CHART_H para usarlo en este archivo.
  const CHART_H = 160; // Explica: define PADDING para usarlo en este archivo.
  const PADDING = { top: 16, bottom: 32, left: 40, right: 12 }; // Explica: define plotW para usarlo en este archivo.
  const plotW = CHART_WIDTH - PADDING.left - PADDING.right; // Explica: define plotH para usarlo en este archivo.
  const plotH = CHART_H - PADDING.top - PADDING.bottom; // Efecto: ejecuta logica cuando cambia el ciclo de vida o sus dependencias.
  useEffect(() => {// Explica: ejecuta animProgress.setValue como parte del flujo.
    animProgress.setValue(0); // Estado: actualiza un valor usado por la interfaz.
    setAnimVal(0); // Explica: ejecuta start como parte del flujo.
    Animated.timing(animProgress, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false
    }).start(); // Explica: define listener usando el resultado de animProgress.addListener.
    const listener = animProgress.addListener(({ value }) => setAnimVal(value)); // Render: devuelve el resultado que consume React o la funcion llamadora.
    return () => animProgress.removeListener(listener);
  }, [data, periodo, metrica]); // Control: evalua una condicion para decidir el siguiente paso.

  if (loading || !data) {// Render: devuelve el resultado que consume React o la funcion llamadora.
    return (// UI: renderiza el componente SkeletonCard.
      <SkeletonCard height={220} />);} // Explica: define rows para usarlo en este archivo.

  const rows = data[periodo] || []; // Explica: define valores usando el resultado de rows.map.
  const valores = rows.map((r) => r[metrica]); // Explica: define norm usando el resultado de normalize.
  const norm = normalize(valores); // Explica: define points usando el resultado de rows.map.

  const points = rows.map((r, i) => ({
    x: PADDING.left + i / (rows.length - 1) * plotW,
    y: PADDING.top + plotH - norm[i] * plotH,
    raw: r[metrica],
    label: r.label
  }));

  // Aplicar animación: solo dibujamos hasta animVal
  // Explica: define cutIdx usando el resultado de Math.floor.
  const cutIdx = Math.floor(animVal * (points.length - 1)); // Explica: define visiblePoints usando el resultado de map.
  const visiblePoints = points.slice(0, cutIdx + 2).map((p, i) => {// Control: evalua una condicion para decidir el siguiente paso.
      if (i < cutIdx) // Render: devuelve el resultado que consume React o la funcion llamadora.
        return p; // Explica: define frac para usarlo en este archivo.
      const frac = animVal * (points.length - 1) - cutIdx; // Explica: define next para usarlo en este archivo.
      const next = points[cutIdx + 1]; // Control: evalua una condicion para decidir el siguiente paso.
      if (!next) // Render: devuelve el resultado que consume React o la funcion llamadora.
        return p; // Render: devuelve el resultado que consume React o la funcion llamadora.
      return { ...p, x: p.x + (next.x - p.x) * frac, y: p.y + (next.y - p.y) * frac
      };
    }); // Explica: define linePath usando el resultado de smoothPath.

  const linePath = smoothPath(visiblePoints); // Explica: define areaPath para usarlo en este archivo.
  const areaPath =
  visiblePoints.length > 1 ?
  `${linePath} L ${visiblePoints[visiblePoints.length - 1].x},${PADDING.top + plotH} L ${visiblePoints[0].x},${PADDING.top + plotH} Z` :
  ''; // Explica: define color para usarlo en este archivo.

  const color = metrica === 'gasto' ? ACCENT : BLUE; // Explica: define gradId para usarlo en este archivo.
  const gradId = metrica === 'gasto' ? 'gradGasto' : 'gradPujas';

  // Ticks del eje Y (3 niveles)
  // Explica: define maxVal usando el resultado de Math.max.
  const maxVal = Math.max(...valores); // Explica: define yTicks usando el resultado de map.
  const yTicks = [0, 0.5, 1].map((t) => ({ y: PADDING.top + plotH - t * plotH,
      label: metrica === 'gasto' ? fmtMonto(Math.round(maxVal * t)) : Math.round(maxVal * t)
    })); // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (// UI: renderiza el componente View.
    <View style={styles.card}>
      {/* Título y selector de métrica */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Evolución</Text>
        <View style={styles.pill}>
          {['gasto', 'pujas'].map((m) => // UI: renderiza un control presionable para el usuario.
            <TouchableOpacity key={m} style={[styles.pillBtn, metrica === m && { backgroundColor: color }]} onPress={() => setMetrica(m)}>
              
              <Text style={[styles.pillText, metrica === m && { color: COLORS.white }]}>
                {m === 'gasto' ? 'Gasto' : 'Pujas'}
              </Text>
            </TouchableOpacity>)}
        </View>
      </View>

      {/* Selector de período */}
      <View style={styles.periodoRow}>
        {['semana', 'mes'].map((p) => // UI: renderiza un control presionable para el usuario.
          <TouchableOpacity key={p}
          style={[styles.periodoBtn, periodo === p && styles.periodoBtnActive]}
          onPress={() => setPeriodo(p)}>
            
            <Text style={[styles.periodoText, periodo === p && styles.periodoTextActive]}>
              {p === 'semana' ? 'Esta semana' : 'Este año'}
            </Text>
          </TouchableOpacity>)}
      </View>

      {/* SVG chart */}
      <Svg width={CHART_WIDTH} height={CHART_H}>
        <Defs>
          <LinearGradient id="gradGasto" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={ACCENT} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={ACCENT} stopOpacity="0.01" />
          </LinearGradient>
          <LinearGradient id="gradPujas" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={BLUE} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={BLUE} stopOpacity="0.01" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {yTicks.map((t, i) => // UI: renderiza el componente G.
          <G key={i}>
            <Line x1={PADDING.left} y1={t.y} x2={CHART_WIDTH - PADDING.right} y2={t.y} stroke={BORDER} strokeWidth="1" strokeDasharray="4,4" />
            <SvgText x={PADDING.left - 6} y={t.y + 4}
              fontSize="9"
              fill={GRAY}
              textAnchor="end">
              
              {t.label}
            </SvgText>
          </G>
        )}

        {/* Área */}
        {areaPath ? // UI: renderiza el componente Path.
        <Path d={areaPath} fill={`url(#${gradId})`} /> : null}

        {/* Línea */}
        {linePath ? // UI: renderiza el componente Path.
        <Path d={linePath} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" /> : null}

        {/* Puntos y labels X */}
        {points.map((p, i) => // UI: renderiza el componente G.
        <G key={i}>
          <SvgText x={p.x} y={CHART_H - 6} fontSize="9" fill={GRAY} textAnchor="middle">
              {p.label}
            </SvgText>
            {i <= cutIdx && // UI: renderiza el componente Circle.
          <Circle cx={p.x} cy={p.y} r="3.5" fill={color} stroke={COLORS.white} strokeWidth="1.5" />}
          </G>
        )}
      </Svg>

      {/* Valor actual destacado */}
      {valores.length > 0 && // UI: renderiza el componente View.
      <View style={styles.currentVal}>
        <Text style={[styles.currentValNum, { color }]}>
            {metrica === 'gasto' ? fmtMonto(valores[valores.length - 1]) : valores[valores.length - 1]}
          </Text>
        <Text style={styles.currentValLabel}>
            {metrica === 'gasto' ? 'último período' : 'pujas último período'}
          </Text>
        </View>}
    </View>);
}

// ─────────────────────────────────────────────────────────────
// Componente: Donut chart (Distribución de pujas)
// ─────────────────────────────────────────────────────────────

/**
 * GraficoDistribucion
 * Props:
 *   ganadas, perdidas, activas  → números
 *   loading → bool
 */
export // Explica: declara la funcion GraficoDistribucion que concentra una parte del flujo.
function GraficoDistribucion({ ganadas = 0, perdidas = 0, loading = false }) {// Control: evalua una condicion para decidir el siguiente paso.
  if (loading) // Render: devuelve el resultado que consume React o la funcion llamadora.
    return (// UI: renderiza el componente SkeletonCard.
      <SkeletonCard height={200} />); // Explica: define total para usarlo en este archivo.
  const total = ganadas + perdidas || 1; // Explica: define segmentos para usarlo en este archivo.
  const segmentos = [{ label: 'Ganadas', valor: ganadas, color: COLORS.success }, { label: 'Perdidas', valor: perdidas, color: COLORS.primary }]; // Explica: define circunferencia para usarlo en este archivo.


  const circunferencia = 2 * Math.PI * 45; // Explica: define porcentajeGanadas para usarlo en este archivo.
  const porcentajeGanadas = total > 0 ? ganadas / total : 0; // Explica: define porcentajePerdidas para usarlo en este archivo.
  const porcentajePerdidas = total > 0 ? perdidas / total : 0; // Explica: define dashGanadas para usarlo en este archivo.
  const dashGanadas = porcentajeGanadas * circunferencia; // Explica: define dashPerdidas para usarlo en este archivo.
  const dashPerdidas = porcentajePerdidas * circunferencia; // Explica: define ganPct usando el resultado de Math.round.
  const ganPct = Math.round(porcentajeGanadas * 100); // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (// UI: renderiza el componente View.
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Distribución de pujas</Text>

      <View style={styles.donutRow}>
        {/* Donut */}
        <Svg width={120} height={120} viewBox="0 0 120 120">
          {/* Fondo gris */}
          <Circle cx={60} cy={60} r={45} fill="none" stroke="#F0F0F0" strokeWidth={18} />
          
          {/* Segmento ganadas */}
          {dashGanadas > 0 && // UI: renderiza el componente Circle.
          <Circle
            cx={60} cy={60} r={45}
            fill="none"
            stroke={COLORS.success}
            strokeWidth={18}
            strokeDasharray={`${dashGanadas} ${circunferencia}`}
            strokeDashoffset={circunferencia / 4}
            rotation={-90}
            origin="60, 60" />

          }
          {/* Segmento perdidas */}
          {dashPerdidas > 0 && // UI: renderiza el componente Circle.
          <Circle
            cx={60} cy={60} r={45}
            fill="none"
            stroke={COLORS.primary}
            strokeWidth={18}
            strokeDasharray={`${dashPerdidas} ${circunferencia}`}
            strokeDashoffset={circunferencia / 4 - dashGanadas}
            rotation={-90}
            origin="60, 60" />

          }
          {/* Centro: porcentaje ganadas */}
          <SvgText x={60} y={55} textAnchor="middle" fontSize="18" fontWeight="bold" fill={TEXT_PRIMARY_SYM}>
            {ganPct}%
          </SvgText>
          <SvgText x={60} y={70} textAnchor="middle" fontSize="9" fill={GRAY}>
            ganadas
          </SvgText>
        </Svg>

        {/* Leyenda */}
        <View style={styles.leyenda}>
          {segmentos.map((s) => // UI: renderiza el componente View.
            <View key={s.label} style={styles.leyendaItem}>
              <View style={[styles.leyendaDot, { backgroundColor: s.color }]} />
              <View>
                <Text style={styles.leyendaLabel}>{s.label}</Text>
                <Text style={[styles.leyendaVal, { color: s.color }]}>
                  {s.valor}{' '}
                  <Text style={styles.leyendaPct}>
                    ({Math.round(s.valor / total * 100)}%)
                  </Text>
                </Text>
              </View>
            </View>)}
          <View style={styles.leyendaDivider} />
          <View style={styles.leyendaItem}>
            <View style={[styles.leyendaDot, { backgroundColor: '#CBD5E1' }]} />
            <View>
              <Text style={styles.leyendaLabel}>Total</Text>
              <Text style={[styles.leyendaVal, { color: '#64748B' }]}>{total}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>);} // ─────────────────────────────────────────────────────────────
// Skeleton loader
// ─────────────────────────────────────────────────────────────
// Explica: declara la funcion SkeletonCard que concentra una parte del flujo.
function SkeletonCard({ height = 200 }) {// Explica: define anim para usarlo en este archivo.
  const anim = useRef(new Animated.Value(0.4)).current; // Efecto: ejecuta logica cuando cambia el ciclo de vida o sus dependencias.
  useEffect(() => {// Explica: ejecuta start como parte del flujo.
      Animated.loop(Animated.sequence([Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }), Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true })])).start();}, []); // Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente componente.
    <Animated.View style={[styles.card, { height, backgroundColor: '#F0F0F0', opacity: anim }]} />);
}

// ─────────────────────────────────────────────────────────────
// Constante usada en SVG (no puede ser JSX string)
// ─────────────────────────────────────────────────────────────
// Explica: define TEXT_PRIMARY_SYM para usarlo en este archivo.
const TEXT_PRIMARY_SYM = '#1A1A1A';
// ─────────────────────────────────────────────────────────────
// Indicador de actualización
// ─────────────────────────────────────────────────────────────

export // Explica: declara la funcion RealtimeBadge que concentra una parte del flujo.
function RealtimeBadge({ lastUpdate }) {// Explica: define pulse para usarlo en este archivo.
  const pulse = useRef(new Animated.Value(1)).current; // Efecto: ejecuta logica cuando cambia el ciclo de vida o sus dependencias.
  useEffect(() => {// Explica: ejecuta start como parte del flujo.
      Animated.sequence([Animated.timing(pulse, { toValue: 1.4, duration: 200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 200, useNativeDriver: true })]
      ).start();
    }, [lastUpdate]); // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (// UI: renderiza el componente View.
    <View style={styles.realtimeBadge}>
      <Animated.View style={[styles.realtimeDot, { transform: [{ scale: pulse }] }]} />
      <Text style={styles.realtimeText}>
        En vivo · {lastUpdate ? lastUpdate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--'}
      </Text>
    </View>);}

// ─────────────────────────────────────────────────────────────
// Pantalla de ejemplo que integra todo
// ─────────────────────────────────────────────────────────────
// Explica: exporta este modulo para que otras partes de la app lo usen.
export default // Explica: declara la funcion EstadisticasSection que concentra una parte del flujo.
function EstadisticasSection() {// Estado: crea el estado valores desestructurados y su actualizador.
  const [lastUpdate, setLastUpdate] = useState(null); // Explica: define evolucionData usando el resultado de useRealtimeData.
  const evolucionData = useRealtimeData(async () => {// Explica: define d para usarlo en este archivo.
      const d = await fetchEvolucionMock(); // Estado: actualiza un valor usado por la interfaz.
      setLastUpdate(new Date()); // Render: devuelve el resultado que consume React o la funcion llamadora.
      return d;}, 15000); // Explica: define distData usando el resultado de useRealtimeData.

  const distData = useRealtimeData(fetchDistribucionMock, 15000); // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (// UI: renderiza el componente View.
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>ESTADÍSTICAS</Text>
        <RealtimeBadge lastUpdate={lastUpdate} />
      </View>

      <GraficoEvolucion data={evolucionData} loading={!evolucionData} />
      <GraficoDistribucion ganadas={distData?.ganadas} perdidas={distData?.perdidas} loading={!distData} />
    </View>);
}

// ─────────────────────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────────────────────
// Explica: define styles usando el resultado de StyleSheet.create.
const styles = StyleSheet.create({
  section: {
    marginBottom: 8
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: TEXT_PRIMARY_SYM
  },

  // Card
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY_SYM
  },

  // Pill selector
  pill: {
    flexDirection: 'row',
    backgroundColor: BORDER,
    borderRadius: 20,
    padding: 2
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 18
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B'
  },

  // Período
  periodoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },
  periodoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER
  },
  periodoBtnActive: {
    backgroundColor: '#FFF5F5',
    borderColor: ACCENT
  },
  periodoText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500'
  },
  periodoTextActive: {
    color: ACCENT,
    fontWeight: '700'
  },

  // Current value
  currentVal: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6
  },
  currentValNum: {
    fontSize: 22,
    fontWeight: '800'
  },
  currentValLabel: {
    fontSize: 12,
    color: GRAY
  },

  // Donut
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  leyenda: {
    flex: 1,
    paddingLeft: 8,
    gap: 10
  },
  leyendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  leyendaDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  leyendaLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500'
  },
  leyendaVal: {
    fontSize: 15,
    fontWeight: '700'
  },
  leyendaPct: {
    fontSize: 12,
    fontWeight: '400',
    color: GRAY
  },
  leyendaDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 2
  },

  // Realtime badge
  realtimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  realtimeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: GREEN
  },
  realtimeText: {
    fontSize: 10,
    color: GRAY,
    fontWeight: '500'
  }
});
