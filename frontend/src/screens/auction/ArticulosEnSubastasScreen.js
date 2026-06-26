import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import { imageSourceFromBase64 } from '../../utils/images';

const COLORS = {
  primary: '#8B0000',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#1A1A1A',
  muted: '#777777',
  border: '#E0E0E0',
  success: '#2E7D32',
  warning: '#B26A00',
  danger: '#8B0000',
  neutral: '#555555',
};

const ESTADO_CONFIG = {
  pendiente: { label: 'Pendiente', color: COLORS.warning },
  aprobado: { label: 'Aprobado', color: COLORS.success },
  en_inspeccion: { label: 'Artículo en revisión', color: COLORS.warning },
  esperando_usuario: { label: 'Esperando confirmación final', color: COLORS.success },
  confirmado: { label: 'Aceptado', color: COLORS.success },
  rechazado: { label: 'Rechazado', color: COLORS.danger },
  devuelto: { label: 'Propuesta rechazada', color: COLORS.danger },
};

const formatFecha = (fecha) => {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-AR');
};

export default function ArticulosEnSubastasScreen({ navigation }) {
  const [articulos, setArticulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarArticulos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get(ENDPOINTS.MY_AUCTIONS);
      setArticulos(Array.isArray(data?.productos) ? data.productos : []);
    } catch (err) {
      setError('No se pudieron cargar tus artículos. Intentá de nuevo.');
      setArticulos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarArticulos();
    }, [cargarArticulos])
  );

  const renderItem = ({ item }) => {
    const estado = ESTADO_CONFIG[item.estado] || { label: item.estado || 'Pendiente', color: COLORS.neutral };

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('ArticuloEnSubastaDetalle', {
          productoId: item.productoId || item.identificador,
          productoResumen: item,
        })}
      >
        {item.portada ? (
          <Image source={imageSourceFromBase64(item.portada)} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="cube-outline" size={28} color={COLORS.border} />
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.nombre}</Text>
          <Text style={styles.date}>Enviado {formatFecha(item.fecha) || 'recientemente'}</Text>
          <View style={[styles.badge, { backgroundColor: `${estado.color}18` }]}>
            <Text style={[styles.badgeText, { color: estado.color }]}>{estado.label}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Tus artículos en subasta</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.primary} />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={cargarArticulos}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={articulos}
          keyExtractor={(item) => String(item.productoId || item.identificador)}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, articulos.length === 0 && styles.emptyList]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="cube-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>Todavía no cargaste artículos para subastar.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  list: { padding: 16 },
  emptyList: { flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  image: { width: 62, height: 62, borderRadius: 10, marginRight: 12, backgroundColor: COLORS.border },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 15, color: COLORS.text, fontWeight: '800' },
  date: { fontSize: 12, color: COLORS.muted },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  emptyText: { fontSize: 15, color: COLORS.muted, textAlign: 'center', lineHeight: 22 },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
});
