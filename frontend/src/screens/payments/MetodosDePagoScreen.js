import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

// ─── Barra de navegación inferior ────────────────────────────────────────────
const BOTTOM_NAV_TABS = [
  { name: 'Main',           label: 'Inicio',   icon: 'home-outline' },
  { name: 'Chats',          label: 'Mensajes', icon: 'mail-outline' },
  { name: 'CargarProducto', label: 'Publicar', icon: 'add-circle-outline' },
  { name: 'PujarAuth',      label: 'Pujar',    icon: 'flag-outline' },
];

// ─── Mock de métodos de pago ──────────────────────────────────────────────────
// TODO BACKEND: reemplazar por llamada real a la API:
//   const { data } = await api.get(ENDPOINTS.PAYMENT_METHODS)
//   setMetodosPago(data)
// @MOCK: const METODOS_PAGO_MOCK = [
// @MOCK:   { id: '1', nombre: 'Metodo de pago 1', tipo: 'tarjeta' },
// @MOCK:   { id: '2', nombre: 'Metodo de pago 2', tipo: 'banco' },
// @MOCK:   { id: '3', nombre: 'Metodo de pago 3', tipo: 'cheque' },
// @MOCK:   { id: '4', nombre: 'Metodo de pago 4', tipo: 'tarjeta' },
// @MOCK: ];

// @TASK: Genera el texto visible sin alterar los datos originales del método.
const obtenerNombreMetodo = (metodo) => {
  if (metodo.tipo === 'tarjeta') return `Tarjeta ${metodo.numeroTarjeta || ''}`.trim();
  if (metodo.tipo === 'banco') return metodo.alias || `Cuenta ${metodo.cbu || ''}`.trim();
  return `Cheque ${metodo.numeroCheque || ''}`.trim();
};

// ─── Pantalla ─────────────────────────────────────────────────────────────────
export default function MetodosDePagoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  // @TASK: Almacena únicamente los métodos devueltos por el backend.
  const [metodosPago, setMetodosPago] = useState([]);
  // @TASK: Controla el indicador de carga de la lista.
  const [loading, setLoading] = useState(true);

  // @API: GET /api/settings/payment-methods carga los métodos activos del usuario.
  const cargarMetodos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get(ENDPOINTS.PAYMENT_METHODS);
      const metodos = Array.isArray(data?.metodos) ? data.metodos : [];
      // @TASK: Agrega el nombre de presentación que consume la lista.
      setMetodosPago(metodos.map((metodo) => ({ ...metodo, nombre: obtenerNombreMetodo(metodo) })));
    } catch (error) {
      setMetodosPago([]);
      Alert.alert('Error', error?.response?.data?.message || 'No se pudieron obtener los métodos de pago.');
    } finally {
      setLoading(false);
    }
  }, []);

  // @TASK: Recarga la lista al volver desde el alta o el detalle.
  useFocusEffect(
    useCallback(() => {
      cargarMetodos();
    }, [cargarMetodos])
  );

  // ── Bottom nav handler ───────────────────────
  const handleBottomNav = (tabName) => {
    if (tabName === 'Main') {
      navigation.navigate('Main');
    } else if (tabName === 'Chats') {
      navigation.navigate('Chats');
    } else if (tabName === 'CargarProducto') {
      navigation.navigate('CargarProducto');
    } else if (tabName === 'PujarAuth') {
      navigation.navigate('PujarAuth');
    }
  };

    // ── Render cuando no hay elementos ─────────────
  const renderEfectoVacio = () => (
    <View style={styles.vacioContainer}>
      <Ionicons name="card-outline" size={48} color="#C0A898" style={{ marginBottom: 12 }} />
      <Text style={styles.vacioTexto}>No tenés métodos de pago registrados.</Text>
    </View>
  );

  // ── Render fila de método de pago ─────────────
  const renderMetodo = ({ item }) => {
    let iconName = 'card-outline';
    if (item.tipo === 'banco') iconName = 'business-outline';
    else if (item.tipo === 'cheque') iconName = 'document-text-outline';

    return (
      <TouchableOpacity
        style={styles.metodoItem}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('MetodoDePagoDetalle', { metodo: item })}
      >
        <View style={styles.iconoWrapper}>
          <Ionicons name={iconName} size={22} color="#8b0000" />
        </View>
        <Text style={styles.metodoNombre}>{item.nombre}</Text>
        <Ionicons name="chevron-forward" size={22} color="#1A1A1A" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Header corregido (Sin Campana) ──────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#1a1a1a" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Metodos de pago</Text>

        {/* Añadimos un View vacío con el mismo ancho para centrar el título perfectamente */}
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.sectionLabel}>TUS METODOS GUARDADOS</Text>

      {/* ── Lista de métodos de pago ─────────────── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b0000" />
        </View>
      ) : (
        <FlatList
          data={metodosPago}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMetodo}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 120, flexGrow: 1 }]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          ListEmptyComponent={renderEfectoVacio}
          ListFooterComponent={() => (
            <TouchableOpacity
              style={styles.agregarBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AgregarMetodoPago')}
            >
              <Text style={styles.agregarBtnText}>Agregar</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ══════════════════════════════════════════
          BARRA DE NAVEGACIÓN INFERIOR
       ══════════════════════════════════════════ */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 8 }]}>
        {BOTTOM_NAV_TABS.map((tab, i) => {
          const isActive = false;
          return (
            <TouchableOpacity
              key={i}
              style={styles.tabItem}
              onPress={() => handleBottomNav(tab.name)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={26}
                color={isActive ? '#8b0000' : '#9E9E9E'}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );
}

// ─── Estilos modificados ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header corregido
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerIcon:  { padding: 4, width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },

  listContent: {
    paddingHorizontal: 16, 
    paddingTop: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A09088',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  metodoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 22,
    paddingHorizontal: 20,
  },
  iconoWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  metodoNombre: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  itemSeparator: { height: 14 },

  // Botón agregar
  agregarBtn: {
    alignSelf: 'flex-end',
    marginTop: 20,
    backgroundColor: '#8b0000',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
  agregarBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Barra de navegación inferior
  bottomNav: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: '#FFF5EC',
    borderRadius: 30,
    paddingTop: 10,
    paddingHorizontal: 8,
    paddingBottom: 3,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    fontWeight: '500',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#8b0000',
    fontWeight: '700',
  },
  // Estilo para el estado vacío
  vacioContainer: {
    marginTop: 150,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  vacioTexto: {
    fontSize: 15,
    color: '#9E9E9E',
    fontWeight: '500',
    textAlign: 'center',
  },
});
