// screens/HistorialPujasScreen.js
// Historial de pujas del usuario con filtros: Recientes, Antiguas, Ganadas, Perdidas

import React, { useState, useEffect, useCallback } from 'react';
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
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import { imageSourceFromBase64 } from '../../utils/images';

const FILTROS = ['Recientes', 'Antiguas', 'Ganadas', 'Perdidas'];

const COLORS = {
  primary:     '#8B0000',
  background:  '#F5F5F5',
  white:       '#FFFFFF',
  text:        '#1A1A1A',
  textLight:   '#888888',
  border:      '#E0E0E0',
  ganada:      '#2E7D32',
  perdida:     '#8B0000',
  enCurso:     '#555555',
  filtroActivo: '#8B0000',
  filtroInactivo: '#4A4A4A',
};

const RESULTADO_CONFIG = {
  ganada:   { label: 'Ganada',   color: COLORS.ganada },
  superada: { label: 'Superada', color: COLORS.perdida },
  en_curso: { label: 'En curso', color: COLORS.enCurso },
};

export default function HistorialPujasScreen({ navigation }) {
  const [filtro,    setFiltro]    = useState('Recientes');
  const [historial, setHistorial] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const fetchHistorial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get(ENDPOINTS.MY_BIDS);
      setHistorial(data.historial || []);
    } catch (err) {
      setError('No se pudo cargar el historial. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  const historialFiltrado = () => {
    switch (filtro) {
      case 'Antiguas':
        return [...historial].reverse();
      case 'Ganadas':
        return historial.filter((p) => p.resultado === 'ganada');
      case 'Perdidas':
        return historial.filter((p) => p.resultado === 'superada');
      default:
        return historial;
    }
  };

  const renderItem = ({ item }) => {
    const config = RESULTADO_CONFIG[item.resultado] || RESULTADO_CONFIG.en_curso;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {}}
        activeOpacity={0.7}
      >
        {/* Foto */}
        <View style={styles.fotoContainer}>
          {item.portada ? (
            <Image
              source={imageSourceFromBase64(item.portada)}
              style={styles.foto}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.foto, styles.fotoPlaceholder]}>
              <Ionicons name="image-outline" size={24} color={COLORS.border} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
          <Text style={styles.importe}>
            ${parseFloat(item.importe).toLocaleString('es-AR')}
          </Text>
          <View style={[styles.badge, { backgroundColor: config.color + '20' }]}>
            <Text style={[styles.badgeText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        {/* Estado indicador + flecha */}
        <View style={styles.rightSection}>
          <View style={[styles.dot, { backgroundColor: config.color }]} />
          <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={48} color={COLORS.border} />
      <Text style={styles.emptyText}>
        {filtro === 'Ganadas'
          ? 'Todavía no ganaste ninguna subasta.'
          : filtro === 'Perdidas'
          ? 'No tenés pujas superadas.'
          : 'No tenés historial de pujas todavía.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.titulo}>Historial de pujas</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        {FILTROS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filtroBadge,
              filtro === f && styles.filtroBadgeActivo,
            ]}
            onPress={() => setFiltro(f)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.filtroTexto,
              filtro === f && styles.filtroTextoActivo,
            ]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenido */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.perdida} />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchHistorial}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={historialFiltrado()}
          keyExtractor={(item) => item.pujaId.toString()}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.lista,
            historialFiltrado().length === 0 && styles.listaVacia,
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: 16,
    paddingVertical:   12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width:           32,
    height:          32,
    justifyContent:  'center',
    alignItems:      'center',
  },
  titulo: {
    fontSize:   18,
    fontWeight: '700',
    color:      COLORS.text,
  },
  filtrosContainer: {
    flexDirection:   'row',
    paddingHorizontal: 16,
    paddingVertical:   12,
    gap:             8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filtroBadge: {
    paddingHorizontal: 14,
    paddingVertical:    7,
    borderRadius:      20,
    backgroundColor:   COLORS.filtroInactivo,
  },
  filtroBadgeActivo: {
    backgroundColor: COLORS.filtroActivo,
  },
  filtroTexto: {
    fontSize:   13,
    fontWeight: '600',
    color:      COLORS.white,
  },
  filtroTextoActivo: {
    color: COLORS.white,
  },
  lista: {
    padding: 16,
    gap:     10,
  },
  listaVacia: {
    flex:           1,
    justifyContent: 'center',
  },
  card: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  COLORS.white,
    borderRadius:     12,
    padding:          12,
    marginBottom:     10,
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: 1 },
    shadowOpacity:    0.06,
    shadowRadius:     4,
    elevation:        2,
  },
  fotoContainer: {
    marginRight: 12,
  },
  foto: {
    width:        60,
    height:       60,
    borderRadius: 8,
  },
  fotoPlaceholder: {
    backgroundColor: COLORS.border,
    justifyContent:  'center',
    alignItems:      'center',
  },
  info: {
    flex: 1,
    gap:  4,
  },
  nombre: {
    fontSize:   14,
    fontWeight: '600',
    color:      COLORS.text,
  },
  importe: {
    fontSize:   14,
    fontWeight: '700',
    color:      COLORS.primary,
  },
  badge: {
    alignSelf:        'flex-start',
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      6,
  },
  badgeText: {
    fontSize:   12,
    fontWeight: '600',
  },
  rightSection: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            6,
    marginLeft:     8,
  },
  dot: {
    width:        10,
    height:       10,
    borderRadius: 5,
  },
  loadingContainer: {
    flex:           1,
    justifyContent: 'center',
    alignItems:     'center',
  },
  emptyContainer: {
    flex:           1,
    justifyContent: 'center',
    alignItems:     'center',
    padding:        32,
    gap:            12,
  },
  emptyText: {
    fontSize:   15,
    color:      COLORS.textLight,
    textAlign:  'center',
    lineHeight: 22,
  },
  retryBtn: {
    marginTop:        8,
    paddingHorizontal: 24,
    paddingVertical:   10,
    backgroundColor:  COLORS.primary,
    borderRadius:     8,
  },
  retryText: {
    color:      COLORS.white,
    fontWeight: '700',
    fontSize:   14,
  },
});
