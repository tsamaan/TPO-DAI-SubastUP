/*
Intro: AuctionListAuthScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/auction/AuctionListAuthScreen.js.
Endpoints: AUCTIONS (/api/auctions: listar subastas con filtros); AUCTION_CATEGORIES (endpoint dinamico: operacion del backend); NOTIF_SUB (/api/notifications/subscribe/:auctionId: suscribirse a recordatorios de una subasta).
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useState, useRef, useEffect, useCallback } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, StyleSheet,
  Image,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  Switch,
  Alert } from
'react-native'; // Explica: importa dependencias desde 'react-native-safe-area-context'.
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde '../../context/ThemeContext'.
import { useAppTheme } from '../../context/ThemeContext'; // Explica: importa dependencias desde '../../services/api'.
import api from '../../services/api'; // Explica: importa dependencias desde '../../constants/api'.
import { ENDPOINTS } from '../../constants/api'; // Explica: importa dependencias desde '../../store/authStore'.
import useAuthStore from '../../store/authStore'; // Explica: importa dependencias desde '../../utils/auctionState'.
import { formatearFechaHoraSubasta, normalizarEstadoSubasta } from '../../utils/auctionState'; // Explica: importa dependencias desde '../../utils/images'.
import { imageSourceFromBase64 } from '../../utils/images'; // Explica: define LOGO usando el resultado de require.

const LOGO = require('../../assets/images/texto_appbar.jpeg'); // Explica: define objeto desestructurado usando el resultado de Dimensions.get.

const { width: SCREEN_WIDTH } = Dimensions.get('window'); // Explica: define DRAWER_WIDTH para usarlo en este archivo.
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78; // Explica: define CARD_WIDTH para usarlo en este archivo.
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2; // Explica: define CARD_HEIGHT para usarlo en este archivo.
const CARD_HEIGHT = CARD_WIDTH * 1.4;

// ─── Barra de navegación inferior ────────────────────────────────────────────
// Explica: define BOTTOM_NAV_TABS para usarlo en este archivo.
const BOTTOM_NAV_TABS = [{ name: 'Main', label: 'Inicio', icon: 'home-outline' },
{ name: 'Chats', label: 'Mensajes', icon: 'mail-outline' },
{ name: 'CargarProducto', label: 'Publicar', icon: 'add-circle-outline' },
{ name: 'PujarAuth', label: 'Pujar', icon: 'flag-outline' }];


// ─── Mismos datos que HomeAuthenticatedScreen ────────────────────────────────
// Explica: define DRAWER_GROUPS para usarlo en este archivo.
const DRAWER_GROUPS = [[
{ label: 'Mi cuenta', icon: 'person-circle-outline', nav: 'MiCuenta' },
{ label: 'Configuracion', icon: 'settings-outline', nav: 'Configuracion' },
{ label: 'Ayuda', icon: 'help-circle-outline', nav: 'Ayuda' }],

[
{ label: 'Pujar', icon: 'pricetag-outline', nav: 'AuctionListAuth', navParams: { auctionType: 'comun' } },
{ label: 'Cargar producto', icon: 'add-square-outline', nav: null },
{ label: 'Mensajes', icon: 'mail-outline', nav: 'Chats' }],

[
{ label: 'Cerrar sesion', icon: 'log-out-outline', nav: null, isLogout: true }]]; // Explica: define NOTIFICATIONS para usarlo en este archivo.



const NOTIFICATIONS = [];

// ─── MOCK — BACKEND INTEGRATION ──────────────────────────────────────────────
// TODO BACKEND: eliminar CATEGORIAS_MOCK y PRODUCTOS_MOCK por completo.
//
// CATEGORÍAS:
//   Reemplazar con: const { data: categorias } = await api.get(ENDPOINTS.AUCTION_CATEGORIES)
//   El array debe tener la forma: string[]  → ['Comun', 'Especial', 'Plata', 'Oro', 'Platino']
//   El filtro por auctionType ('comun' | 'especial') lo resuelve el backend
//   pasando el tipo como query param: api.get(`${ENDPOINTS.AUCTION_CATEGORIES}?tipo=${auctionType}`)
//
// PRODUCTOS:
//   Reemplazar con: const { data: productos } = await api.get(ENDPOINTS.AUCTIONS, {
//     params: { tipo: auctionType, categoria: selected, q: search }
//   })
//   Cada producto debe tener la forma:
//   {
//     id:           string
//     titulo:       string
//     moneda:       'AR$' | 'U$D'
//     imagenUrl:    string        → URL de Cloudinary (reemplaza el campo 'color' del mock)
//     proximamente: boolean
//     fecha:        string | null → solo si proximamente === true
//     estado:       'vivo' | 'proximamente' | 'finalizado'
//   }
//   Las subastas con estado 'finalizado' NO deben incluirse en la respuesta del backend.
//
// BÚSQUEDA EN TIEMPO REAL:
//   Implementar debounce de ~400ms sobre el campo `search` antes de llamar al endpoint
//   para no saturar el servidor con cada keystroke. Ejemplo con lodash:
//   const debouncedSearch = useCallback(_.debounce((q) => cargarProductos(q), 400), [])

// const CATEGORIAS_MOCK = {
//   especial: ['Oro', 'Platino'],
//   comun:    ['Comun', 'Especial', 'Plata', 'Oro', 'Platino'],
// };
// 
// const PRODUCTOS_MOCK = [
//   { id: '1', titulo: 'Cuadro de rosas',  moneda: 'U$D', proximamente: false, color: '#C9B99A', estado: 'vivo' },
//   { id: '2', titulo: 'Silla de oficina', moneda: 'U$D', proximamente: true,  fecha: 'Martes 18, 15:00', color: '#B0BEC5', estado: 'proximamente' },
//   { id: '3', titulo: 'Lampara de pared', moneda: 'AR$', proximamente: false, color: '#A5C4A8', estado: 'vivo' },
//   { id: '4', titulo: 'Auto antiguo',     moneda: 'AR$', proximamente: false, color: '#C4A58A', estado: 'vivo' },
// ];

// Backend de la materia no implementa categorias dinamicas por ahora
// Explica: define CATEGORIAS_LOCAL para usarlo en este archivo.
const CATEGORIAS_LOCAL = { especial: ['Especial', 'Plata', 'Oro', 'Platino'],
  comun: ['Comun', 'Especial', 'Plata', 'Oro', 'Platino']
}; // Explica: define obtenerNombreUsuario para usarlo en este archivo.

const obtenerNombreUsuario = (user) =>
user?.name || user?.nombre || user?.email || 'Usuario'; // Explica: define obtenerIniciales para usarlo en este archivo.

const obtenerIniciales = (nombre = '') => {// Explica: define partes usando el resultado de filter.
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean); // Explica: define letras para usarlo en este archivo.
  const letras = partes.length > 1 ?
  `${partes[0][0]}${partes[1][0]}` :
  String(nombre).slice(0, 2); // Render: devuelve el resultado que consume React o la funcion llamadora.
  return letras.toUpperCase() || 'US';
};

// ─── Pantalla ────────────────────────────────────────────────────────────────
// Explica: exporta este modulo para que otras partes de la app lo usen.
export default // Explica: declara la funcion AuctionListAuthScreen que concentra una parte del flujo.
function AuctionListAuthScreen({ navigation, route }) {// Explica: define objeto desestructurado usando el resultado de useAppTheme.
  const { theme, isDark } = useAppTheme(); // Explica: define insets usando el resultado de useSafeAreaInsets.
  const insets = useSafeAreaInsets(); // Explica: define auctionType para usarlo en este archivo.
  const auctionType = route?.params?.auctionType ?? 'comun'; // Explica: define user usando el resultado de useAuthStore.
  const user = useAuthStore((state) => state.user); // Explica: define userName usando el resultado de obtenerNombreUsuario.
  const userName = obtenerNombreUsuario(user); // Explica: define userInitials usando el resultado de obtenerIniciales.
  const userInitials = obtenerIniciales(userName); // TODO BACKEND: reemplazar CATEGORIAS_MOCK[auctionType] por el resultado de
  // api.get(`${ENDPOINTS.AUCTION_CATEGORIES}?tipo=${auctionType}`)
  // Explica: define categorias para usarlo en este archivo.
  const categorias = CATEGORIAS_LOCAL[auctionType] ?? CATEGORIAS_LOCAL.comun; // Estado: crea el estado valores desestructurados y su actualizador.
  const [search, setSearch] = useState(''); // Estado: crea el estado valores desestructurados y su actualizador.
  const [selected, setSelected] = useState(categorias[0]);

  // ── Estado de datos ───────────────────────────
  // TODO BACKEND: estos estados se usan igual con datos reales, no hay que cambiarlos.
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [productos, setProductos] = useState([]); // Estado: crea el estado valores desestructurados y su actualizador.
  const [loading, setLoading] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [error, setError] = useState(null);
  // ── Carga de productos ────────────────────────
  // Evento: memoiza el callback cargarProductos.
  const cargarProductos = useCallback(async () => {// Estado: actualiza un valor usado por la interfaz.
      setLoading(true); // Estado: actualiza un valor usado por la interfaz.
      setError(null); // Control: intenta una operacion y maneja errores si falla.
      try {// TODO BACKEND: eliminar el bloque mock de abajo (líneas marcadas con [MOCK])
        // y descomentar la llamada real a la API:
        //
        // const { data } = await api.get(ENDPOINTS.AUCTIONS, {
        //   params: { tipo: auctionType, categoria: selected, q: search }
        // });
        // setProductos(data);

        // ── CONEXIÓN BACKEND ─────────────────────────────────────────────────────
        // Explica: define data para usarlo en este archivo.
        const data = await api.get(ENDPOINTS.AUCTIONS, { params: { tipo: auctionType, category: selected?.toLowerCase(), search: search || undefined }
          });
        // @API: El backend devuelve { ok, subastas }; adaptar al formato de las tarjetas.
        // Explica: define subastas para usarlo en este archivo.
        const subastas = Array.isArray(data?.subastas) ? data.subastas :
        Array.isArray(data?.resultados) ?
        data.resultados :
        []; // Estado: actualiza un valor usado por la interfaz.
        setProductos(subastas.map((subasta) => ({
          id: subasta.itemId ? `${subasta.subastaId}-${subasta.itemId}` : String(subasta.subastaId),
          subastaId: subasta.subastaId,
          itemId: subasta.itemId,
          productoId: subasta.productoId,
          titulo: subasta.nombreArticulo || 'Subasta',
          descripcion: subasta.descripcionArticulo || '',
          moneda: subasta.moneda || 'ARS',
          proximamente: normalizarEstadoSubasta(subasta.estado, subasta.cerrado) === 'proximamente',
          finalizado: normalizarEstadoSubasta(subasta.estado, subasta.cerrado) === 'finalizado',
          fecha: subasta.fecha,
          fechaTexto: formatearFechaHoraSubasta(subasta.fecha, subasta.hora),
          estado: subasta.estado,
          portada: subasta.portada
        })));

        // [MOCK] — eliminar cuando conectes el backend ──────────────────────────
        // await new Promise((r) => setTimeout(r, 300)); // simula latencia de red
        // const filtrados = PRODUCTOS_MOCK.filter((p) => {
        //   const matchSearch = p.titulo.toLowerCase().includes(search.toLowerCase());
        //   // el filtro por categoría lo haría el backend; acá lo omitimos por simplicidad
        //   return matchSearch;
        // });
        // setProductos(filtrados);
        // ──────────────────────────────────────────────────────────────────────

      } catch (e) {// Estado: actualiza un valor usado por la interfaz.
        setError('No se pudieron cargar las subastas. Intentá de nuevo.'); // Explica: ejecuta console.error como parte del flujo.
        console.error('[AuctionListAuth] Error al cargar productos:', e);
      } finally {// Estado: actualiza un valor usado por la interfaz.
        setLoading(false);
      }
    }, [auctionType, selected, search]);

  // Cargar al montar y cuando cambian los filtros
  // Efecto: ejecuta logica cuando cambia el ciclo de vida o sus dependencias.
  useEffect(() => {// Explica: ejecuta cargarProductos como parte del flujo.
      cargarProductos();}, [cargarProductos]);

  // ── Drawer state ─────────────────────────────
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [menuOpen, setMenuOpen] = useState(false); // Explica: define translateX para usarlo en este archivo.
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current; // Explica: define overlayOpacity para usarlo en este archivo.
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  // ── Notif state ──────────────────────────────
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [notifOpen, setNotifOpen] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [notifsExpanded, setNotifsExpanded] = useState(true); // Estado: crea el estado valores desestructurados y su actualizador.
  const [configExpanded, setConfigExpanded] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [darkTheme, setDarkTheme] = useState(true); // Explica: define notifAnim para usarlo en este archivo.
  const notifAnim = useRef(new Animated.Value(0)).current; // Explica: define notifOverlay para usarlo en este archivo.
  const notifOverlay = useRef(new Animated.Value(0)).current;
  // ── Drawer helpers ───────────────────────────
  // Explica: define openMenu para usarlo en este archivo.
  const openMenu = () => {// Estado: actualiza un valor usado por la interfaz.
    setMenuOpen(true); // Explica: ejecuta start como parte del flujo.
    Animated.parallel([Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 2, speed: 16 }),
      Animated.timing(overlayOpacity, { toValue: 1, duration: 260, useNativeDriver: true })]
    ).start();
  }; // Explica: define closeMenu para usarlo en este archivo.

  const closeMenu = () => {// Explica: ejecuta start como parte del flujo.
    Animated.parallel([
    Animated.timing(translateX, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
    Animated.timing(overlayOpacity, { toValue: 0, duration: 220, useNativeDriver: true })]
    ).start(() => setMenuOpen(false));
  }; // Explica: define handleItemPress para usarlo en este archivo.

  const handleItemPress = (item) => {// Explica: ejecuta closeMenu como parte del flujo.
    closeMenu(); // Control: evalua una condicion para decidir el siguiente paso.
    if (!item.nav) // Render: devuelve el resultado que consume React o la funcion llamadora.
      return; // Explica: define TABS para usarlo en este archivo.
    const TABS = ['Home', 'Calendar', 'Chats', 'Profile']; // Control: evalua una condicion para decidir el siguiente paso.
    if (TABS.includes(item.nav)) {// Navegacion: cambia de pantalla o ajusta opciones de navegacion.
      navigation.navigate(item.nav);} else {// Navegacion: cambia de pantalla o ajusta opciones de navegacion.
      navigation.navigate(item.nav, item.navParams);
    }
  };

  // ── Notif helpers ────────────────────────────
  // Explica: define openNotif para usarlo en este archivo.
  const openNotif = () => {// Estado: actualiza un valor usado por la interfaz.
    setNotifOpen(true); // Explica: ejecuta start como parte del flujo.
    Animated.parallel([Animated.spring(notifAnim, { toValue: 1, useNativeDriver: true, bounciness: 3, speed: 14 }),
      Animated.timing(notifOverlay, { toValue: 1, duration: 260, useNativeDriver: true })]
    ).start();
  }; // Explica: define closeNotif para usarlo en este archivo.

  const closeNotif = () => {// Explica: ejecuta start como parte del flujo.
    Animated.parallel([
    Animated.timing(notifAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    Animated.timing(notifOverlay, { toValue: 0, duration: 220, useNativeDriver: true })]
    ).start(() => setNotifOpen(false));
  }; // Explica: define panelTranslateY usando el resultado de notifAnim.interpolate.

  const panelTranslateY = notifAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }); // Explica: define panelScale usando el resultado de notifAnim.interpolate.
  const panelScale = notifAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }); // Explica: define panelOpacity usando el resultado de notifAnim.interpolate.
  const panelOpacity = notifAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  // ── Bottom nav handler ───────────────────────
  // Explica: define handleBottomNav para usarlo en este archivo.
  const handleBottomNav = (tabName) => {// Control: evalua una condicion para decidir el siguiente paso.
    if (tabName === 'Main') {// Navegacion: cambia de pantalla o ajusta opciones de navegacion.
      navigation.navigate('Main');} else // Control: evalua una condicion para decidir el siguiente paso.
      if (tabName === 'Chats') {// Navegacion: cambia de pantalla o ajusta opciones de navegacion.
        navigation.navigate('Chats');} else // Control: evalua una condicion para decidir el siguiente paso.
        if (tabName === 'CargarProducto') {// Navegacion: cambia de pantalla o ajusta opciones de navegacion.
          navigation.navigate('CargarProducto');} else // Control: evalua una condicion para decidir el siguiente paso.
          if (tabName === 'PujarAuth') {
            // Ya estamos en la pantalla de pujar, no hacemos nada
          }}; // Explica: define agregarRecordatorioDesdeCard para usarlo en este archivo.

  const agregarRecordatorioDesdeCard = async (event, item) => {
    event?.stopPropagation?.(); // Control: evalua una condicion para decidir el siguiente paso.
    if (!item?.subastaId) // Render: devuelve el resultado que consume React o la funcion llamadora.
      return; // Control: intenta una operacion y maneja errores si falla.
    try {// Explica: define respuesta para usarlo en este archivo.
      const respuesta = await api.post(ENDPOINTS.NOTIF_SUB(item.subastaId)); // Explica: ejecuta Alert.alert como parte del flujo.
      Alert.alert('Recordatorio', respuesta?.message || `Recordatorio de ${item.titulo} agregado correctamente.`);} catch (error) {// Explica: ejecuta Alert.alert como parte del flujo.
      Alert.alert('Recordatorio', error?.response?.data?.message || 'No se pudo agregar el recordatorio.');
    }
  };

  // ── Cards ────────────────────────────────────
  // TODO BACKEND: el campo `item.color` desaparece cuando llegue `item.imagenUrl` de Cloudinary.
  // En renderCard, reemplazar el <View style={cardImage} /> por:
  //   <Image source={{ uri: item.imagenUrl }} style={styles.cardImage} resizeMode="cover" />
  // Explica: define renderCard para usarlo en este archivo.
  const renderCard = ({ item, index }) => // UI: renderiza un control presionable para el usuario.
  <TouchableOpacity style={[styles.card, index % 2 === 0 ? { marginRight: 6 } : { marginLeft: 6 }, { backgroundColor: theme.surface }]}
  activeOpacity={0.85}
  onPress={() => navigation.navigate('AuctionDetailAuth', { productId: item.subastaId, itemId: item.itemId })}>
    
      {item.portada ? // UI: muestra una imagen o recurso visual.
    <Image
      source={imageSourceFromBase64(item.portada)}
      style={styles.cardImage}
      resizeMode="cover" /> : // UI: renderiza el componente View.


    <View style={[styles.cardImage, { backgroundColor: item.color || '#C9B99A' }]} />
    }

    <View style={styles.badge}>
      <Text style={[styles.badgeText, { color: theme.secondary }]}>{item.moneda}</Text>
      </View>

      {item.proximamente && // UI: renderiza el componente View.
    <View style={styles.proximamenteOverlay}>
      <Ionicons name="notifications-outline" size={22} color={theme.secondary} />
      <Text style={[styles.proximamenteTitulo, { color: theme.secondary }]}>Proximamente</Text>
      <Text style={styles.proximamenteFecha}>{item.fechaTexto}</Text>
      <TouchableOpacity style={[styles.recordatorioMiniBtn, { backgroundColor: theme.primary }]} onPress={(event) => agregarRecordatorioDesdeCard(event, item)}>
        <Text style={styles.recordatorioMiniText}>Agregar recordatorio</Text>
          </TouchableOpacity>
        </View>}

      {item.finalizado && // UI: renderiza el componente View.
    <View style={styles.finalizadoOverlay}>
      <Ionicons name="checkmark-done-outline" size={24} color="#FFFFFF" />
      <Text style={styles.finalizadoTitulo}>FINALIZADA</Text>
        </View>}

    <View style={[styles.cardFooter, { backgroundColor: theme.primary }]}>
      <Text style={[styles.cardTitulo, { color: theme.white }]} numberOfLines={1}>{item.titulo}</Text>
        {!!item.descripcion && // UI: muestra texto visible en la pantalla.
      <Text style={styles.cardDesc} numberOfLines={1}>{item.descripcion}</Text>}
      </View>
    </TouchableOpacity>; // Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente View.
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.white }]}>

      {/* ── Header autenticado ───────────────────── */}
      <View style={[styles.header, { backgroundColor: theme.white }]}>
        <TouchableOpacity style={styles.headerIcon} onPress={openMenu}>
          <Ionicons name="menu" size={28} color={theme.secondary} />
        </TouchableOpacity>

        <Image source={LOGO} style={styles.logo} resizeMode="contain" />

        <TouchableOpacity style={styles.headerIcon} onPress={openNotif}>
          <Ionicons name="notifications-outline" size={26} color={theme.secondary} />
        </TouchableOpacity>
      </View>

      {/* ── Búsqueda y chips FIJOS ───────────────── */}
      <View style={[styles.fixedHeader, { backgroundColor: theme.white }]}>
        <View style={[styles.searchContainer, { borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={20} color={theme.placeholder} style={styles.searchIcon} />
          <TextInput style={[styles.searchInput, { color: theme.secondary }]} placeholder="Buscar" placeholderTextColor={theme.placeholder} value={search} onChangeText={setSearch} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
          {categorias.map((cat) => // UI: renderiza un control presionable para el usuario.
            <TouchableOpacity key={cat} style={[styles.chip, selected === cat && styles.chipSelected, { borderColor: theme.primary }, selected === cat && { backgroundColor: theme.primary }]} onPress={() => setSelected(cat)}>
              <Text style={[styles.chipText, selected === cat && styles.chipTextSelected, { color: theme.primary }, selected === cat && { color: theme.white }]}>
                {cat}
              </Text>
            </TouchableOpacity>)}
        </ScrollView>
      </View>

      {/* ── Grid ────────────────────────────────── */}
      {loading && // TODO BACKEND: podés reemplazar este Text por un <ActivityIndicator /> de react-native
      // para una experiencia más prolija durante la carga inicial
      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackText}>Cargando subastas...</Text>
        </View>}
      {!loading && error && // UI: renderiza el componente View.
      <View style={styles.feedbackContainer}>
        <Ionicons name="wifi-outline" size={40} color="#D0D0D0" />
        <Text style={styles.feedbackText}>{error}</Text>
        <TouchableOpacity style={[styles.reintentarBtn, { backgroundColor: theme.primary }]} onPress={cargarProductos}>
          <Text style={[styles.reintentarText, { color: theme.white }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>}
      {!loading && !error && // UI: organiza contenido desplazable.
      <FlatList data={productos} keyExtractor={(item) => String(item.id)} numColumns={2} renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={// UI: renderiza el componente View.
        <View style={styles.feedbackContainer}>
          <Ionicons name="search-outline" size={40} color="#D0D0D0" />
          <Text style={styles.feedbackText}>No hay subastas disponibles</Text>
            </View>} />
      }

      {/* ══════════════════════════════════════════
           BARRA DE NAVEGACIÓN INFERIOR
        ══════════════════════════════════════════ */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 8 }]}>
        {BOTTOM_NAV_TABS.map((tab, i) => {// "Pujar" (PujarAuth) está activo porque estamos en esta pantalla
            // Explica: define isActive para usarlo en este archivo.
            const isActive = tab.name === 'PujarAuth'; // Render: devuelve el resultado que consume React o la funcion llamadora.
            return (// UI: renderiza un control presionable para el usuario.
              <TouchableOpacity key={i}
              style={styles.tabItem}
              onPress={() => handleBottomNav(tab.name)}
              activeOpacity={0.7}>
                
                <Ionicons name={tab.icon}
                size={26}
                color={isActive ? theme.primary : theme.placeholder} />
                
                <Text style={[styles.tabLabel, { color: theme.placeholder }, isActive && styles.tabLabelActive, isActive && { color: theme.primary }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>);
          })}
      </View>

      {/* ══════════════════════════════════════════
           OVERLAY + PANEL DE NOTIFICACIONES
        ══════════════════════════════════════════ */}
      {notifOpen &&
      <>
        <TouchableWithoutFeedback onPress={closeNotif}>
          <Animated.View style={[styles.overlay, { opacity: notifOverlay }]} />
          </TouchableWithoutFeedback>

        <Animated.View style={[styles.notifPanel, {
            top: insets.top + 56,
            opacity: panelOpacity,
            transform: [{ translateY: panelTranslateY }, { scale: panelScale }]
          }]
          }>
          
            {/* Notificaciones */}
          <TouchableOpacity style={styles.notifSectionHeader}
          onPress={() => setNotifsExpanded((v) => !v)}
          activeOpacity={0.7}>
            
            <Ionicons name="notifications-outline" size={20} color={theme.secondary} style={{ marginRight: 8 }} />
            <Text style={[styles.notifSectionTitle, { color: theme.secondary }]}>Notificaciones</Text>
            <Ionicons name={notifsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.secondary} />
            </TouchableOpacity>

            {notifsExpanded && // UI: renderiza el componente View.
          <View style={styles.notifContent}>
                {NOTIFICATIONS.length === 0 ? // UI: muestra texto visible en la pantalla.
            <Text style={styles.notifEmpty}>{'<<No hay notificaciones>>'}</Text> : NOTIFICATIONS.map((n, i) => // UI: muestra texto visible en la pantalla.
              <Text key={i} style={[styles.notifItem, { color: theme.secondary }]}>{n}</Text>)}
              </View>}

          <View style={styles.notifDivider} />

            {/* Configuracion */}
          <TouchableOpacity style={styles.notifSectionHeader} onPress={() => setConfigExpanded((v) => !v)}
            activeOpacity={0.7}>
            
            <Ionicons name="settings-outline" size={20} color={theme.secondary} style={{ marginRight: 8 }} />
            <Text style={[styles.notifSectionTitle, { color: theme.secondary }]}>Configuracion</Text>
            <Ionicons name={configExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.secondary} />
            </TouchableOpacity>

            {configExpanded && // UI: renderiza el componente View.
          <View style={styles.configContent}>
            <View style={styles.themeRow}>
              <Ionicons name="moon-outline" size={20} color={theme.secondary} style={{ marginRight: 10 }} />
              <Text style={[styles.themeLabel, { color: theme.secondary }]}>Tema</Text>
              <Switch value={darkTheme} onValueChange={setDarkTheme} thumbColor={theme.white} trackColor={{ false: '#C0B0A8', true: theme.primary }} style={{ marginLeft: 'auto' }} />
                </View>
              </View>}
          </Animated.View>
        </>
      }

      {/* ══════════════════════════════════════════
           OVERLAY + DRAWER HAMBURGUESA
        ══════════════════════════════════════════ */}
      {menuOpen && // UI: renderiza el componente TouchableWithoutFeedback.
      <TouchableWithoutFeedback onPress={closeMenu}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
        </TouchableWithoutFeedback>}

      <Animated.View style={[
      styles.drawer,
      {
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 16,
        transform: [{ translateX }]
      }]
      }>
        
        <TouchableOpacity style={styles.closeBtn} onPress={closeMenu}>
          <Ionicons name="chevron-back" size={22} color={theme.secondary} />
        </TouchableOpacity>

        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{userInitials}</Text>
          </View>
          <Text style={[styles.userName, { color: theme.secondary }]}>{userName}</Text>
        </View>

        <ScrollView style={styles.drawerScroll} showsVerticalScrollIndicator={false}>
          {DRAWER_GROUPS.map((group, gi) => // UI: renderiza el componente View.
            <View key={gi}>
              {gi > 0 && // UI: renderiza el componente View.
              <View style={styles.separator} />}
              {group.map((item, ii) => // UI: renderiza un control presionable para el usuario.
                <TouchableOpacity key={ii} style={styles.drawerItem} onPress={() => handleItemPress(item)} activeOpacity={0.6}>
                  <Ionicons name={item.icon} size={22} color={theme.secondary} style={styles.drawerItemIcon} />
                  <Text style={[styles.drawerItemLabel, { color: theme.secondary }]}>{item.label}</Text>
                </TouchableOpacity>)}
            </View>)}
        </ScrollView>
      </Animated.View>

    </View>);}
// ─── Estilos ─────────────────────────────────────────────────────────────────
// Explica: define styles usando el resultado de StyleSheet.create.
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#FFFFFF' },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: '#FFFFFF',
      borderBottomColor: '#F0F0F0'
    },
    headerIcon: { padding: 4, width: 40 },
    logo: { width: '45%', height: 32, alignSelf: 'center' },

    // Búsqueda y chips
    fixedHeader: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0'
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: '#E0E0E0',
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 48,
      marginTop: 16,
      marginBottom: 12
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16, color: '#1A1A1A' },

    chipsScroll: { marginBottom: 8 },
    chipsContent: { gap: 8, paddingRight: 8 },
    chip: {
      height: 40,
      paddingHorizontal: 20,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: '#8b0000',
      justifyContent: 'center',
      alignItems: 'center'
    },
    chipSelected: { backgroundColor: '#8b0000' },
    chipText: { fontSize: 14, color: '#8b0000', fontWeight: '600' },
    chipTextSelected: { color: '#FFFFFF' },

    // Grid
    listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120 },

    // Estados de carga / error / vacío
    feedbackContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
      gap: 14
    },
    feedbackText: {
      fontSize: 14,
      color: '#AAAAAA',
      textAlign: 'center',
      paddingHorizontal: 32
    },
    reintentarBtn: {
      marginTop: 4,
      backgroundColor: '#8b0000',
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 10
    },
    reintentarText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600'
    },
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
      backgroundColor: '#F5F5F5'
    },
    cardImage: { width: '100%', height: '100%', position: 'absolute' },
    badge: {
      position: 'absolute',
      top: 8, right: 8,
      backgroundColor: '#FFFFFFCC',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4
    },
    badgeText: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },
    proximamenteOverlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 40,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#ffffffcc'
    },
    proximamenteTitulo: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginTop: 4 },
    proximamenteFecha: { fontSize: 11, color: '#555555', marginTop: 2 },
    finalizadoOverlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 40,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#00000088'
    },
    finalizadoTitulo: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', marginTop: 4, letterSpacing: 1 },
    recordatorioMiniBtn: {
      marginTop: 8,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5
    },
    recordatorioMiniText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
    cardFooter: {
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      minHeight: 48,
      backgroundColor: '#8b0000',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 5
    },
    cardTitulo: { fontSize: 13, color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
    cardDesc: { fontSize: 10, color: '#F7EAEA', textAlign: 'center', marginTop: 1 },

    // Overlay compartido
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.35)',
      zIndex: 10
    },

    // Panel notificaciones
    notifPanel: {
      position: 'absolute',
      right: 12,
      width: SCREEN_WIDTH - 48,
      backgroundColor: '#FFF5EC',
      borderRadius: 16,
      zIndex: 30,
      elevation: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 14,
      overflow: 'hidden'
    },
    notifSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 14
    },
    notifSectionTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
    notifContent: {
      backgroundColor: '#F5E8DC',
      marginHorizontal: 14,
      marginBottom: 12,
      borderRadius: 10,
      minHeight: 80,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      paddingHorizontal: 16
    },
    notifEmpty: { fontSize: 13, color: '#888', fontStyle: 'italic' },
    notifItem: { fontSize: 14, color: '#1a1a1a', paddingVertical: 4 },
    notifDivider: {
      height: 1,
      backgroundColor: '#E8D5C8',
      marginHorizontal: 14,
      marginBottom: 4
    },
    configContent: { paddingHorizontal: 18, paddingBottom: 16 },
    themeRow: { flexDirection: 'row', alignItems: 'center' },
    themeLabel: { fontSize: 15, fontWeight: '500', color: '#1a1a1a' },

    // Drawer
    drawer: {
      position: 'absolute',
      top: 0, left: 0, bottom: 0,
      width: DRAWER_WIDTH,
      backgroundColor: '#FFF5EC',
      zIndex: 20,
      elevation: 20,
      shadowColor: '#000',
      shadowOffset: { width: 6, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      borderTopRightRadius: 20,
      borderBottomRightRadius: 20
    },
    closeBtn: { alignSelf: 'flex-end', marginRight: 16, marginBottom: 8, padding: 4 },
    profileSection: { paddingHorizontal: 24, paddingBottom: 20 },
    avatar: {
      width: 72, height: 72, borderRadius: 36,
      marginBottom: 12,
      borderWidth: 2.5,
      borderColor: '#D4A598',
      backgroundColor: '#F0D8CC',
      alignItems: 'center',
      justifyContent: 'center'
    },
    avatarInitials: { fontSize: 24, fontWeight: '800', color: '#8b0000' },
    userName: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
    drawerScroll: { flex: 1 },
    separator: {
      height: 1,
      backgroundColor: '#E8D5C8',
      marginHorizontal: 24,
      marginVertical: 6
    },
    drawerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 15
    },
    drawerItemIcon: { marginRight: 18, width: 24 },
    drawerItemLabel: { fontSize: 16, fontWeight: '500', color: '#1a1a1a' },

    // ── Barra de navegación inferior ─────────────
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
    }
  });
