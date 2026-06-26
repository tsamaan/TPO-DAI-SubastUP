/**
 * EstadisticasCharts.js
 *
 * Gráficos de estadísticas en tiempo real para la pantalla de Información.
 * Requiere: react-native-svg  →  npm install react-native-svg
 *           (expo: npx expo install react-native-svg)
 *
 * Exporta dos componentes listos para usar:
 *   <GraficoEvolucion data={...} periodo="semana"|"mes" />
 *   <GraficoDistribucion ganadas={n} perdidas={n} activas={n} />
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
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
  Rect,
} from 'react-native-svg';
import { COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48; // padding horizontal 24 * 2
const ACCENT  = COLORS.primary;
const ACCENT2 = COLORS.primary;
const BLUE = '#3B82F6';
const GREEN = '#22C55E';
const RED = '#EF4444';
const GRAY = '#94A3B8';
const CARD_BG = '#FAFAFA';
const BORDER = '#E8ECF0';

// ─────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────

/** Normaliza un array de valores al rango [0, 1] */
const normalize = (values) => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
};

/** Genera el path SVG de una línea suavizada (curva bezier) */
const smoothPath = (points) => {
  if (points.length < 2) return '';
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    d += ` C ${cpX},${prev.y} ${cpX},${curr.y} ${curr.x},${curr.y}`;
  }
  return d;
};

/** Formatea números grandes: 1200 → $1.2k */
const fmtMonto = (n) => {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n}`;
};

// ─────────────────────────────────────────────────────────────
// Hook: simula datos en tiempo real
// ─────────────────────────────────────────────────────────────

/**
 * useRealtimeData
 * En producción, reemplazá fetchFn por tu llamada real a la API.
 * El hook re-fetcha cada `intervalMs` milisegundos.
 * @deprecated - usar useFocusEffect en su lugar
 */
export function useRealtimeData(fetchFn, intervalMs = 15000) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const result = await fetchFn();
      setData(result);
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => clearInterval(id);
  }, []);

  return data;
}

// ─────────────────────────────────────────────────────────────
// Datos mock (reemplazá con tu API)
// ─────────────────────────────────────────────────────────────

export const fetchEvolucionMock = async () => {
  // Simula variación aleatoria pequeña en cada refresh
  const base = [4200, 7800, 5500, 12000, 9300, 15600, 11200, 18900, 14500, 22300, 19800, 28400];
  return {
    semana: ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => ({
      label: d,
      gasto: Math.round(base[i] * (0.95 + Math.random() * 0.1)),
      pujas: Math.round((i + 1) * 2.3 * (0.9 + Math.random() * 0.2)),
    })),
    mes: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m, i) => ({
      label: m,
      gasto: Math.round(base[i] * (0.95 + Math.random() * 0.1)),
      pujas: Math.round((i + 1) * 1.4 * (0.9 + Math.random() * 0.2)),
    })),
  };
};

export const fetchDistribucionMock = async () => ({
  ganadas: 3 + Math.floor(Math.random() * 2),
  perdidas: 8 + Math.floor(Math.random() * 3),
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
export function GraficoEvolucion({ data, loading = false }) {
  const [periodo, setPeriodo] = useState('semana');
  const [metrica, setMetrica] = useState('gasto'); // 'gasto' | 'pujas'
  const animProgress = useRef(new Animated.Value(0)).current;
  const [animVal, setAnimVal] = useState(0);

  const CHART_H = 160;
  const PADDING = { top: 16, bottom: 32, left: 40, right: 12 };
  const plotW = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotH = CHART_H - PADDING.top - PADDING.bottom;

  useEffect(() => {
    animProgress.setValue(0);
    setAnimVal(0);
    Animated.timing(animProgress, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();
    const listener = animProgress.addListener(({ value }) => setAnimVal(value));
    return () => animProgress.removeListener(listener);
  }, [data, periodo, metrica]);

  if (loading || !data) {
    return <SkeletonCard height={220} />;
  }

  const rows = data[periodo] || [];
  const valores = rows.map((r) => r[metrica]);
  const norm = normalize(valores);

  const points = rows.map((r, i) => ({
    x: PADDING.left + (i / (rows.length - 1)) * plotW,
    y: PADDING.top + plotH - norm[i] * plotH,
    raw: r[metrica],
    label: r.label,
  }));

  // Aplicar animación: solo dibujamos hasta animVal
  const cutIdx = Math.floor(animVal * (points.length - 1));
  const visiblePoints = points.slice(0, cutIdx + 2).map((p, i) => {
    if (i < cutIdx) return p;
    const frac = animVal * (points.length - 1) - cutIdx;
    const next = points[cutIdx + 1];
    if (!next) return p;
    return {
      ...p,
      x: p.x + (next.x - p.x) * frac,
      y: p.y + (next.y - p.y) * frac,
    };
  });

  const linePath = smoothPath(visiblePoints);
  const areaPath =
    visiblePoints.length > 1
      ? `${linePath} L ${visiblePoints[visiblePoints.length - 1].x},${PADDING.top + plotH} L ${visiblePoints[0].x},${PADDING.top + plotH} Z`
      : '';

  const color = metrica === 'gasto' ? ACCENT : BLUE;
  const gradId = metrica === 'gasto' ? 'gradGasto' : 'gradPujas';

  // Ticks del eje Y (3 niveles)
  const maxVal = Math.max(...valores);
  const yTicks = [0, 0.5, 1].map((t) => ({
    y: PADDING.top + plotH - t * plotH,
    label: metrica === 'gasto' ? fmtMonto(Math.round(maxVal * t)) : Math.round(maxVal * t),
  }));

  return (
    <View style={styles.card}>
      {/* Título y selector de métrica */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Evolución</Text>
        <View style={styles.pill}>
          {['gasto', 'pujas'].map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.pillBtn, metrica === m && { backgroundColor: color }]}
              onPress={() => setMetrica(m)}
            >
              <Text style={[styles.pillText, metrica === m && { color: COLORS.white }]}>
                {m === 'gasto' ? 'Gasto' : 'Pujas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Selector de período */}
      <View style={styles.periodoRow}>
        {['semana', 'mes'].map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodoBtn, periodo === p && styles.periodoBtnActive]}
            onPress={() => setPeriodo(p)}
          >
            <Text style={[styles.periodoText, periodo === p && styles.periodoTextActive]}>
              {p === 'semana' ? 'Esta semana' : 'Este año'}
            </Text>
          </TouchableOpacity>
        ))}
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
        {yTicks.map((t, i) => (
          <G key={i}>
            <Line
              x1={PADDING.left}
              y1={t.y}
              x2={CHART_WIDTH - PADDING.right}
              y2={t.y}
              stroke={BORDER}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            <SvgText
              x={PADDING.left - 6}
              y={t.y + 4}
              fontSize="9"
              fill={GRAY}
              textAnchor="end"
            >
              {t.label}
            </SvgText>
          </G>
        ))}

        {/* Área */}
        {areaPath ? <Path d={areaPath} fill={`url(#${gradId})`} /> : null}

        {/* Línea */}
        {linePath ? (
          <Path d={linePath} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ) : null}

        {/* Puntos y labels X */}
        {points.map((p, i) => (
          <G key={i}>
            <SvgText x={p.x} y={CHART_H - 6} fontSize="9" fill={GRAY} textAnchor="middle">
              {p.label}
            </SvgText>
            {i <= cutIdx && (
              <Circle cx={p.x} cy={p.y} r="3.5" fill={color} stroke={COLORS.white} strokeWidth="1.5" />
            )}
          </G>
        ))}
      </Svg>

      {/* Valor actual destacado */}
      {valores.length > 0 && (
        <View style={styles.currentVal}>
          <Text style={[styles.currentValNum, { color }]}>
            {metrica === 'gasto' ? fmtMonto(valores[valores.length - 1]) : valores[valores.length - 1]}
          </Text>
          <Text style={styles.currentValLabel}>
            {metrica === 'gasto' ? 'último período' : 'pujas último período'}
          </Text>
        </View>
      )}
    </View>
  );
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
export function GraficoDistribucion({ ganadas = 0, perdidas = 0, loading = false }) {
  if (loading) return <SkeletonCard height={200} />;

  const total = ganadas + perdidas || 1;
  const segmentos = [
    { label: 'Ganadas',  valor: ganadas,  color: COLORS.success },
    { label: 'Perdidas', valor: perdidas, color: COLORS.primary },
  ];

  const circunferencia     = 2 * Math.PI * 45;
  const porcentajeGanadas  = total > 0 ? ganadas  / total : 0;
  const porcentajePerdidas = total > 0 ? perdidas / total : 0;
  const dashGanadas        = porcentajeGanadas  * circunferencia;
  const dashPerdidas       = porcentajePerdidas * circunferencia;
  const ganPct             = Math.round(porcentajeGanadas * 100);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Distribución de pujas</Text>

      <View style={styles.donutRow}>
        {/* Donut */}
        <Svg width={120} height={120} viewBox="0 0 120 120">
          {/* Fondo gris */}
          <Circle
            cx={60} cy={60} r={45}
            fill="none"
            stroke="#F0F0F0"
            strokeWidth={18}
          />
          {/* Segmento ganadas */}
          {dashGanadas > 0 && (
            <Circle
              cx={60} cy={60} r={45}
              fill="none"
              stroke={COLORS.success}
              strokeWidth={18}
              strokeDasharray={`${dashGanadas} ${circunferencia}`}
              strokeDashoffset={circunferencia / 4}
              rotation={-90}
              origin="60, 60"
            />
          )}
          {/* Segmento perdidas */}
          {dashPerdidas > 0 && (
            <Circle
              cx={60} cy={60} r={45}
              fill="none"
              stroke={COLORS.primary}
              strokeWidth={18}
              strokeDasharray={`${dashPerdidas} ${circunferencia}`}
              strokeDashoffset={circunferencia / 4 - dashGanadas}
              rotation={-90}
              origin="60, 60"
            />
          )}
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
          {segmentos.map((s) => (
            <View key={s.label} style={styles.leyendaItem}>
              <View style={[styles.leyendaDot, { backgroundColor: s.color }]} />
              <View>
                <Text style={styles.leyendaLabel}>{s.label}</Text>
                <Text style={[styles.leyendaVal, { color: s.color }]}>
                  {s.valor}{' '}
                  <Text style={styles.leyendaPct}>
                    ({Math.round((s.valor / total) * 100)}%)
                  </Text>
                </Text>
              </View>
            </View>
          ))}
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
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Skeleton loader
// ─────────────────────────────────────────────────────────────

function SkeletonCard({ height = 200 }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[styles.card, { height, backgroundColor: '#F0F0F0', opacity: anim }]}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Constante usada en SVG (no puede ser JSX string)
// ─────────────────────────────────────────────────────────────
const TEXT_PRIMARY_SYM = '#1A1A1A';

// ─────────────────────────────────────────────────────────────
// Indicador de actualización
// ─────────────────────────────────────────────────────────────

export function RealtimeBadge({ lastUpdate }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.4, duration: 200, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [lastUpdate]);

  return (
    <View style={styles.realtimeBadge}>
      <Animated.View style={[styles.realtimeDot, { transform: [{ scale: pulse }] }]} />
      <Text style={styles.realtimeText}>
        En vivo · {lastUpdate ? lastUpdate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--'}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Pantalla de ejemplo que integra todo
// ─────────────────────────────────────────────────────────────

export default function EstadisticasSection() {
  const [lastUpdate, setLastUpdate] = useState(null);
  const evolucionData = useRealtimeData(async () => {
    const d = await fetchEvolucionMock();
    setLastUpdate(new Date());
    return d;
  }, 15000);

  const distData = useRealtimeData(fetchDistribucionMock, 15000);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>ESTADÍSTICAS</Text>
        <RealtimeBadge lastUpdate={lastUpdate} />
      </View>

      <GraficoEvolucion data={evolucionData} loading={!evolucionData} />
      <GraficoDistribucion
        ganadas={distData?.ganadas}
        perdidas={distData?.perdidas}
        loading={!distData}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Estilos
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: TEXT_PRIMARY_SYM,
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
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY_SYM,
  },

  // Pill selector
  pill: {
    flexDirection: 'row',
    backgroundColor: BORDER,
    borderRadius: 20,
    padding: 2,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 18,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },

  // Período
  periodoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  periodoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  periodoBtnActive: {
    backgroundColor: '#FFF5F5',
    borderColor: ACCENT,
  },
  periodoText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  periodoTextActive: {
    color: ACCENT,
    fontWeight: '700',
  },

  // Current value
  currentVal: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  currentValNum: {
    fontSize: 22,
    fontWeight: '800',
  },
  currentValLabel: {
    fontSize: 12,
    color: GRAY,
  },

  // Donut
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  leyenda: {
    flex: 1,
    paddingLeft: 8,
    gap: 10,
  },
  leyendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leyendaDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  leyendaLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  leyendaVal: {
    fontSize: 15,
    fontWeight: '700',
  },
  leyendaPct: {
    fontSize: 12,
    fontWeight: '400',
    color: GRAY,
  },
  leyendaDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 2,
  },

  // Realtime badge
  realtimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  realtimeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: GREEN,
  },
  realtimeText: {
    fontSize: 10,
    color: GRAY,
    fontWeight: '500',
  },
});
