/*
Intro: MetodosDePagoScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/payments/MetodosDePagoScreen.js.
Endpoints: PAYMENT_METHODS (/api/settings/payment-methods: listar metodos de pago).
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useCallback, useState } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert } from
'react-native'; // Explica: importa dependencias desde 'react-native-safe-area-context'.
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde '@react-navigation/native'.
import { useFocusEffect } from '@react-navigation/native'; // Explica: importa dependencias desde '../../services/api'.
import api from '../../services/api'; // Explica: importa dependencias desde '../../constants/api'.
import { ENDPOINTS } from '../../constants/api';

// ─── Barra de navegación inferior ────────────────────────────────────────────
// Explica: define BOTTOM_NAV_TABS para usarlo en este archivo.
const BOTTOM_NAV_TABS = [{ name: 'Main', label: 'Inicio', icon: 'home-outline' },
{ name: 'Chats', label: 'Mensajes', icon: 'mail-outline' },
{ name: 'CargarProducto', label: 'Publicar', icon: 'add-circle-outline' },
{ name: 'PujarAuth', label: 'Pujar', icon: 'flag-outline' }];


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
// Explica: define obtenerNombreMetodo para usarlo en este archivo.
const obtenerNombreMetodo = (metodo) => {// Control: evalua una condicion para decidir el siguiente paso.
  if (metodo.tipo === 'tarjeta') // Render: devuelve el resultado que consume React o la funcion llamadora.
    return `Tarjeta ${metodo.numeroTarjeta || ''}`.trim(); // Control: evalua una condicion para decidir el siguiente paso.
  if (metodo.tipo === 'banco') // Render: devuelve el resultado que consume React o la funcion llamadora.
    return metodo.alias || `Cuenta ${metodo.cbu || ''}`.trim(); // Render: devuelve el resultado que consume React o la funcion llamadora.
  return `Cheque ${metodo.numeroCheque || ''}`.trim();}; // ─── Pantalla ─────────────────────────────────────────────────────────────────
const formatearMonto = (valor) => `ARS ${Number(valor || 0).toLocaleString('es-AR')}`;
// Explica: exporta este modulo para que otras partes de la app lo usen.
export default // Explica: declara la funcion MetodosDePagoScreen que concentra una parte del flujo.
function MetodosDePagoScreen({ navigation }) {// Explica: define insets usando el resultado de useSafeAreaInsets.
  const insets = useSafeAreaInsets(); // @TASK: Almacena únicamente los métodos devueltos por el backend.
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [metodosPago, setMetodosPago] = useState([]); // @TASK: Controla el indicador de carga de la lista.
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [loading, setLoading] = useState(true); // @API: GET /api/settings/payment-methods carga los métodos activos del usuario.
  // Evento: memoiza el callback cargarMetodos.
  const cargarMetodos = useCallback(async () => {// Control: intenta una operacion y maneja errores si falla.
      try {// Estado: actualiza un valor usado por la interfaz.
        setLoading(true); // Explica: define data para usarlo en este archivo.
        const data = await api.get(ENDPOINTS.PAYMENT_METHODS); // Explica: define metodos para usarlo en este archivo.
        const metodos = Array.isArray(data?.metodos) ? data.metodos : []; // @TASK: Agrega el nombre de presentación que consume la lista.
        // Estado: actualiza un valor usado por la interfaz.
        setMetodosPago(metodos.map((metodo) => ({ ...metodo, nombre: obtenerNombreMetodo(metodo) })));} catch (error) {// Estado: actualiza un valor usado por la interfaz.
        setMetodosPago([]); // Explica: ejecuta Alert.alert como parte del flujo.
        Alert.alert('Error', error?.response?.data?.message || 'No se pudieron obtener los métodos de pago.');
      } finally {// Estado: actualiza un valor usado por la interfaz.
        setLoading(false);
      }
    }, []);

  // @TASK: Recarga la lista al volver desde el alta o el detalle.
  // Explica: ejecuta useFocusEffect como parte del flujo.
  useFocusEffect(useCallback(() => {// Explica: ejecuta cargarMetodos como parte del flujo.
    cargarMetodos();
  }, [cargarMetodos])
  );

  // ── Bottom nav handler ───────────────────────
  // Explica: define handleBottomNav para usarlo en este archivo.
  const handleBottomNav = (tabName) => {// Control: evalua una condicion para decidir el siguiente paso.
    if (tabName === 'Main') {// Navegacion: cambia de pantalla o ajusta opciones de navegacion.
      navigation.navigate('Main');} else // Control: evalua una condicion para decidir el siguiente paso.
      if (tabName === 'Chats') {// Navegacion: cambia de pantalla o ajusta opciones de navegacion.
        navigation.navigate('Chats');} else // Control: evalua una condicion para decidir el siguiente paso.
        if (tabName === 'CargarProducto') {// Navegacion: cambia de pantalla o ajusta opciones de navegacion.
          navigation.navigate('CargarProducto');} else // Control: evalua una condicion para decidir el siguiente paso.
          if (tabName === 'PujarAuth') {// Navegacion: cambia de pantalla o ajusta opciones de navegacion.
            navigation.navigate('PujarAuth');}
  };

  // ── Render cuando no hay elementos ─────────────
  // Explica: define renderEfectoVacio para usarlo en este archivo.
  const renderEfectoVacio = () => // UI: renderiza el componente View.
  <View style={styles.vacioContainer}>
    <Ionicons name="card-outline" size={48} color="#C0A898" style={{ marginBottom: 12 }} />
    <Text style={styles.vacioTexto}>No tenés métodos de pago registrados.</Text>
    </View>; // ── Render fila de método de pago ─────────────
  // Explica: define renderMetodo para usarlo en este archivo.
  const renderMetodo = ({ item }) => {// Explica: define iconName para usarlo en este archivo.
    let iconName = 'card-outline'; // Control: evalua una condicion para decidir el siguiente paso.
    if (item.tipo === 'banco') // Estado: asigna un nuevo valor para mantener sincronizado el flujo.
      iconName = 'business-outline';else // Control: evalua una condicion para decidir el siguiente paso.
      if (item.tipo === 'cheque') // Estado: asigna un nuevo valor para mantener sincronizado el flujo.
        iconName = 'document-text-outline'; // Render: devuelve el resultado que consume React o la funcion llamadora.
    return (// UI: renderiza un control presionable para el usuario.
      <TouchableOpacity style={styles.metodoItem} activeOpacity={0.7}
        onPress={() => navigation.navigate('MetodoDePagoDetalle', { metodo: item })}>
        
        <View style={styles.iconoWrapper}>
          <Ionicons name={iconName} size={22} color="#8b0000" />
        </View>
        <View style={styles.metodoTexto}>
          <Text style={styles.metodoNombre}>{item.nombre}</Text>
          {item.tipo === 'cheque' && item.monto ? <Text style={styles.metodoSubtitulo}>Tope de puja: {formatearMonto(item.monto)}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={22} color="#1A1A1A" />
      </TouchableOpacity>);}; // Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente View.
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
      {loading ? // UI: renderiza el componente View.
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b0000" />
        </View> : // UI: organiza contenido desplazable.
      <FlatList data={metodosPago} keyExtractor={(item) => String(item.id)} renderItem={renderMetodo} contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 120, flexGrow: 1 }]} showsVerticalScrollIndicator={false} ItemSeparatorComponent={() => // UI: renderiza el componente View.
        <View style={styles.itemSeparator} />} ListEmptyComponent={renderEfectoVacio} ListFooterComponent={() => // UI: renderiza un control presionable para el usuario.
        <TouchableOpacity
          style={styles.agregarBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AgregarMetodoPago')}>
          
          <Text style={styles.agregarBtnText}>Agregar</Text>
            </TouchableOpacity>} />

      }

      {/* ══════════════════════════════════════════
           BARRA DE NAVEGACIÓN INFERIOR
        ══════════════════════════════════════════ */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 8 }]}>
        {BOTTOM_NAV_TABS.map((tab, i) => {// Explica: define isActive para usarlo en este archivo.
            const isActive = false; // Render: devuelve el resultado que consume React o la funcion llamadora.
            return (// UI: renderiza un control presionable para el usuario.
              <TouchableOpacity key={i}
              style={styles.tabItem}
              onPress={() => handleBottomNav(tab.name)}
              activeOpacity={0.7}>
                
                <Ionicons name={tab.icon}
                size={26}
                color={isActive ? '#8b0000' : '#9E9E9E'} />
                
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>);
          })}
      </View>

    </View>);

}

// ─── Estilos modificados ──────────────────────────────────────────────────────
// Explica: define styles usando el resultado de StyleSheet.create.
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#FFFFFF' },
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
      borderBottomColor: '#F0F0F0'
    },
    headerIcon: { padding: 4, width: 40 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },

    listContent: {
      paddingHorizontal: 16,
      paddingTop: 8
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: '#A09088',
      letterSpacing: 1.5,
      marginBottom: 12,
      marginLeft: 4,
      paddingHorizontal: 16,
      marginTop: 20
    },
    metodoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F0F0F0',
      borderRadius: 12,
      paddingVertical: 22,
      paddingHorizontal: 20
    },
    iconoWrapper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14
    },
    metodoTexto: {
      flex: 1,
    },
    metodoNombre: {
      fontSize: 16,
      fontWeight: '500',
      color: '#1A1A1A'
    },
    metodoSubtitulo: {
      marginTop: 2,
      fontSize: 12,
      color: '#777777'
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
      shadowRadius: 5
    },
    agregarBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700'
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
      zIndex: 5
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center'
    },
    tabLabel: {
      fontSize: 11,
      color: '#9E9E9E',
      fontWeight: '500',
      marginTop: 3
    },
    tabLabelActive: {
      color: '#8b0000',
      fontWeight: '700'
    },
    // Estilo para el estado vacío
    vacioContainer: {
      marginTop: 150,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60
    },
    vacioTexto: {
      fontSize: 15,
      color: '#9E9E9E',
      fontWeight: '500',
      textAlign: 'center'
    }
  });
