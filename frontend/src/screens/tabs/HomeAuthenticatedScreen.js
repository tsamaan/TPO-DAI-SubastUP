/*
Intro: HomeAuthenticatedScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/tabs/HomeAuthenticatedScreen.js.
Endpoints: NOTIFICATIONS (/api/notifications: listar o administrar notificaciones); NOTIF_DELETE (/api/notifications/:id: eliminar una notificacion); NOTIF_READ_ALL (/api/notifications/read-all: marcar todas las notificaciones como leidas).
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useState, useRef, useCallback } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Switch,
  Alert,
  PanResponder } from
'react-native'; // Explica: importa dependencias desde 'react-native-safe-area-context'.
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde '@react-navigation/native'.
import { useFocusEffect } from '@react-navigation/native'; // Explica: importa dependencias desde '../../store/authStore'.
import useAuthStore from '../../store/authStore'; // Explica: importa dependencias desde '../../context/ThemeContext'.
import { useAppTheme } from '../../context/ThemeContext'; // Explica: importa dependencias desde '../../services/api'.
import api from '../../services/api'; // Explica: importa dependencias desde '../../constants/api'.
import { ENDPOINTS } from '../../constants/api'; // Explica: define LOGO usando el resultado de require.

const LOGO = require('../../assets/images/texto_appbar.jpeg'); // Explica: define IMG_PLACEHOLDER1 usando el resultado de require.
const IMG_PLACEHOLDER1 = require('../../assets/images/imagen_menu1.jpeg'); // Explica: define IMG_PLACEHOLDER2 usando el resultado de require.
const IMG_PLACEHOLDER2 = require('../../assets/images/imagen_menu2.jpeg'); // Explica: define objeto desestructurado usando el resultado de Dimensions.get.
const { width: SCREEN_WIDTH } = Dimensions.get('window'); // Explica: define DRAWER_WIDTH para usarlo en este archivo.
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78; // Explica: define MENU_BUTTONS para usarlo en este archivo.

const MENU_BUTTONS = [
{ label: 'Metodos de Pago', icon: 'card-outline', nav: 'MetodosDePago' },
{ label: 'Informacion', icon: 'information-circle-outline', nav: 'Informacion' },
{ label: 'Calendario', icon: 'calendar-outline', nav: 'Calendar' }]; // Explica: define DRAWER_GROUPS para usarlo en este archivo.


const DRAWER_GROUPS = [
[
{ label: 'Cuenta', icon: 'person-circle-outline', nav: 'MiCuenta' },
{ label: 'Configuracion', icon: 'settings-outline', nav: 'Configuracion' },
{ label: 'Ayuda', icon: 'help-circle-outline', nav: 'Ayuda' }],

[
{ label: 'Pujar', icon: 'flag-outline', nav: 'PujarAuth', navParams: { auctionType: 'comun' } },
{ label: 'Cargar producto', icon: 'add-circle-outline', nav: 'CargarProducto' },
{ label: 'Mensajes', icon: 'mail-outline', nav: 'Chats' }],

[
{ label: 'Cerrar sesion', icon: 'log-out-outline', nav: null, isLogout: true }]];



// Notificaciones de ejemplo (vacío = muestra el placeholder)
// const NOTIFICATIONS = [];
// Explica: define obtenerNombreUsuario para usarlo en este archivo.
const obtenerNombreUsuario = (user) => user?.name || user?.nombre || user?.email || 'Usuario'; // Explica: define obtenerIniciales para usarlo en este archivo.

const obtenerIniciales = (nombre = '') => {// Explica: define partes usando el resultado de filter.
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean); // Explica: define letras para usarlo en este archivo.
  const letras = partes.length > 1 ?
  `${partes[0][0]}${partes[1][0]}` :
  String(nombre).slice(0, 2); // Render: devuelve el resultado que consume React o la funcion llamadora.
  return letras.toUpperCase() || 'US';
}; // Explica: declara la funcion NotificationSwipeItem que concentra una parte del flujo.

function NotificationSwipeItem({ item, theme, onDelete }) {// Explica: define translateX para usarlo en este archivo.
  const translateX = useRef(new Animated.Value(0)).current; // Explica: define panResponder para usarlo en este archivo.

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {// Explica: ejecuta translateX.setValue como parte del flujo.
        translateX.setValue(Math.max(-120, Math.min(120, gestureState.dx)));
      },
      onPanResponderRelease: (_, gestureState) => {// Control: evalua una condicion para decidir el siguiente paso.
        if (Math.abs(gestureState.dx) > 85) {// Explica: ejecuta start como parte del flujo.
          Animated.timing(translateX, {
            toValue: gestureState.dx > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
            duration: 180,
            useNativeDriver: true
          }).start(() => onDelete(item.identificador));
        } else {// Explica: ejecuta start como parte del flujo.
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
            speed: 18
          }).start();
        }
      }
    })
  ).current; // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (// UI: renderiza el componente View.
    <View style={styles.notifSwipeWrap}>
      <View style={styles.notifDeleteBg}>
        <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
        <Text style={styles.notifDeleteText}>Eliminar</Text>
      </View>
      <Animated.View {...panResponder.panHandlers} style={[styles.notifItemCard, { backgroundColor: theme.surface, transform: [{ translateX }] }]
        }>
        
        <Text style={[styles.notifItemTitle, { color: theme.secondary }]} numberOfLines={1}>
          {item.titulo}
        </Text>
        <Text style={[styles.notifItemMessage, { color: theme.placeholder }]} numberOfLines={3}>
          {item.mensaje}
        </Text>
      </Animated.View>
    </View>);} // Explica: exporta este modulo para que otras partes de la app lo usen.

export default // Explica: declara la funcion HomeAuthenticatedScreen que concentra una parte del flujo.
function HomeAuthenticatedScreen({ navigation }) {// Explica: define objeto desestructurado usando el resultado de useAppTheme.
  const { theme, isDark } = useAppTheme(); // Explica: define insets usando el resultado de useSafeAreaInsets.
  const insets = useSafeAreaInsets(); // Estado: crea el estado valores desestructurados y su actualizador.
  const [activeTab, setActiveTab] = useState(0); // Explica: define logout usando el resultado de useAuthStore.
  const logout = useAuthStore((state) => state.logout); // Explica: define user usando el resultado de useAuthStore.
  const user = useAuthStore((state) => state.user); // Explica: define userName usando el resultado de obtenerNombreUsuario.
  const userName = obtenerNombreUsuario(user); // Explica: define userInitials usando el resultado de obtenerIniciales.
  const userInitials = obtenerIniciales(userName);
  // ── Hamburger menu state ─────────────────────
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [menuOpen, setMenuOpen] = useState(false); // Explica: define translateX para usarlo en este archivo.
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current; // Explica: define overlayOpacity para usarlo en este archivo.
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  // ── Notification panel state ─────────────────
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [notifOpen, setNotifOpen] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [notifsExpanded, setNotifsExpanded] = useState(true); // Estado: crea el estado valores desestructurados y su actualizador.
  const [configExpanded, setConfigExpanded] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [darkTheme, setDarkTheme] = useState(true); // Explica: define notifAnim para usarlo en este archivo.
  const notifAnim = useRef(new Animated.Value(0)).current; // Explica: define notifOverlay para usarlo en este archivo.
  const notifOverlay = useRef(new Animated.Value(0)).current;
  // ── Backend Notifications ────────────────────
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [notifications, setNotifications] = useState([]); // Evento: memoiza el callback fetchNotifs.
  const fetchNotifs = useCallback(async () => {// Control: intenta una operacion y maneja errores si falla.
    try {// Explica: define data para usarlo en este archivo.
      const data = await api.get(ENDPOINTS.NOTIFICATIONS); // Estado: actualiza un valor usado por la interfaz.
      setNotifications(Array.isArray(data?.notificaciones) ? data.notificaciones : []);
    } catch (err) {// Explica: ejecuta console.log como parte del flujo.
      console.log('Error fetching notifications:', err);
    }
  }, []); // Explica: ejecuta useFocusEffect como parte del flujo.

  useFocusEffect(
    useCallback(() => {// Explica: ejecuta fetchNotifs como parte del flujo.
      fetchNotifs();
    }, [fetchNotifs])
  ); // Explica: define notificacionesSinLeer para usarlo en este archivo.

  const notificacionesSinLeer = notifications.filter((notificacion) => !notificacion.leido).length; // Evento: memoiza el callback marcarNotificacionesComoLeidas.

  const marcarNotificacionesComoLeidas = useCallback(async () => {// Explica: define haySinLeer usando el resultado de notifications.some.
    const haySinLeer = notifications.some((notificacion) => !notificacion.leido); // Control: evalua una condicion para decidir el siguiente paso.
    if (!haySinLeer) // Render: devuelve el resultado que consume React o la funcion llamadora.
      return; // Estado: actualiza un valor usado por la interfaz.
    setNotifications((prev) => prev.map((notificacion) => ({ ...notificacion, leido: true }))); // Control: intenta una operacion y maneja errores si falla.
    try {// API: llama PATCH /api/notifications/read-all para marcar todas las notificaciones como leidas.
      await api.patch(ENDPOINTS.NOTIF_READ_ALL);} catch (err) {// Explica: ejecuta console.log como parte del flujo.
      console.log('Error marking notifications as read:', err); // Explica: ejecuta fetchNotifs como parte del flujo.
      fetchNotifs();
    }
  }, [fetchNotifs, notifications]); // Evento: memoiza el callback eliminarNotificacion.

  const eliminarNotificacion = useCallback(async (id) => {// Estado: actualiza un valor usado por la interfaz.
    setNotifications((prev) => prev.filter((notificacion) => notificacion.identificador !== id)); // Control: intenta una operacion y maneja errores si falla.
    try {// API: llama DELETE /api/notifications/:id para eliminar una notificacion.
      await api.delete(ENDPOINTS.NOTIF_DELETE(id));
    } catch (err) {// Explica: ejecuta console.log como parte del flujo.
      console.log('Error deleting notification:', err); // Explica: ejecuta fetchNotifs como parte del flujo.
      fetchNotifs();
    }
  }, [fetchNotifs]);

  // ── Hamburger helpers ────────────────────────
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
    if (item.isLogout) {// Explica: ejecuta Alert.alert como parte del flujo.
      Alert.alert(
        'Cerrar sesión',
        '¿Querés cerrar sesión?',
        [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() }]

      ); // Render: devuelve el resultado que consume React o la funcion llamadora.
      return;
    } // Control: evalua una condicion para decidir el siguiente paso.
    if (!item.nav) // Render: devuelve el resultado que consume React o la funcion llamadora.
      return; // Explica: define TABS para usarlo en este archivo.
    const TABS = ['Home', 'Calendar', 'Chats', 'Profile']; // Control: evalua una condicion para decidir el siguiente paso.
    if (TABS.includes(item.nav)) {// Navegacion: cambia de pantalla o ajusta opciones de navegacion.
      navigation.navigate(item.nav);} else {// Navegacion: cambia de pantalla o ajusta opciones de navegacion.
      navigation.navigate(item.nav, item.navParams);
    }
  };


  // ── Notification helpers ─────────────────────
  // Explica: define openNotif para usarlo en este archivo.
  const openNotif = () => {// Estado: actualiza un valor usado por la interfaz.
    setNotifOpen(true); // Explica: ejecuta marcarNotificacionesComoLeidas como parte del flujo.
    marcarNotificacionesComoLeidas(); // Explica: ejecuta start como parte del flujo.
    Animated.parallel([Animated.spring(notifAnim, { toValue: 1, useNativeDriver: true, bounciness: 3, speed: 14 }),
      Animated.timing(notifOverlay, { toValue: 1, duration: 260, useNativeDriver: true })]
    ).start();
  }; // Explica: define closeNotif para usarlo en este archivo.

  const closeNotif = () => {// Explica: ejecuta start como parte del flujo.
    Animated.parallel([
    Animated.timing(notifAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    Animated.timing(notifOverlay, { toValue: 0, duration: 220, useNativeDriver: true })]
    ).start(() => setNotifOpen(false));
  };

  // Panel slides down from top-right (translateY + scale)
  // Explica: define panelTranslateY usando el resultado de notifAnim.interpolate.
  const panelTranslateY = notifAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }); // Explica: define panelScale usando el resultado de notifAnim.interpolate.
  const panelScale = notifAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }); // Explica: define panelOpacity usando el resultado de notifAnim.interpolate.
  const panelOpacity = notifAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }); // Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente View.
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.white }]}>

      {/* ── Header ──────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: theme.white, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.headerIcon} onPress={openMenu}>
          <Ionicons name="menu" size={28} color={theme.secondary} />
        </TouchableOpacity>

        <Image source={LOGO} style={styles.logo} resizeMode="contain" />

        <TouchableOpacity style={styles.headerIcon} onPress={openNotif}>
          <Ionicons name="notifications-outline" size={26} color={theme.secondary} />
          {notificacionesSinLeer > 0 && // UI: renderiza el componente View.
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>{notificacionesSinLeer > 9 ? '9+' : notificacionesSinLeer}</Text>
            </View>}
        </TouchableOpacity>
      </View>

      {/* ── Contenido scrolleable ────────────────── */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: theme.secondary }]}>Subastas Especiales</Text>
        <View style={styles.auctionContainer}>
          <Image source={IMG_PLACEHOLDER1} style={styles.auctionImage} resizeMode="cover" />
          <TouchableOpacity style={styles.verMasButton} onPress={() => navigation.navigate('PujarAuth', { auctionType: 'especial' })}>
            <Text style={styles.verMasText}>Ver mas</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.secondary }]}>Subastas Comunes</Text>
        <View style={styles.auctionContainer}>
          <Image source={IMG_PLACEHOLDER2} style={styles.auctionImage} resizeMode="cover" />
          <TouchableOpacity style={styles.verMasButton} onPress={() => navigation.navigate('PujarAuth', { auctionType: 'comun' })}>
            <Text style={styles.verMasText}>Ver mas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuButtonsRow}>
          {MENU_BUTTONS.map((btn, i) => // UI: renderiza un control presionable para el usuario.
            <TouchableOpacity key={i} style={styles.menuButton} onPress={() => {// Control: evalua una condicion para decidir el siguiente paso.
                if (!btn.nav) // Render: devuelve el resultado que consume React o la funcion llamadora.
                  return; // Explica: define TABS para usarlo en este archivo.
                const TABS = ['Home', 'Calendar', 'Chats', 'Profile']; // Control: evalua una condicion para decidir el siguiente paso.
                if (TABS.includes(btn.nav)) {// Navegacion: cambia de pantalla o ajusta opciones de navegacion.
                  navigation.navigate(btn.nav);} else {// Navegacion: cambia de pantalla o ajusta opciones de navegacion.
                  navigation.navigate(btn.nav);}}}>
              <Ionicons name={btn.icon} size={32} color="#FFFFFF" />
              <Text style={styles.menuButtonLabel}>{btn.label}</Text>
            </TouchableOpacity>)}
        </View>
      </ScrollView>

      {/* ══════════════════════════════════════════
           OVERLAY + PANEL DE NOTIFICACIONES
        ══════════════════════════════════════════ */}
      {notifOpen && <>
          {/* Overlay que cierra el panel al tocar fuera */}
        <TouchableWithoutFeedback onPress={closeNotif}>
          <Animated.View style={[styles.overlay, { opacity: notifOverlay }]} />
          </TouchableWithoutFeedback>

          {/* Panel flotante */}
        <Animated.View style={[styles.notifPanel, { top: insets.top + 56, // justo debajo del header
            opacity: panelOpacity, transform: [
            { translateY: panelTranslateY },
            { scale: panelScale }],

            backgroundColor: theme.surface
          }]
          }>
          
            {/* ── Sección Notificaciones ── */}
          <TouchableOpacity style={styles.notifSectionHeader}
          onPress={() => setNotifsExpanded((v) => !v)}
          activeOpacity={0.7}>
            
            <Ionicons name="notifications-outline" size={20} color={theme.secondary} style={{ marginRight: 8 }} />
            <Text style={[styles.notifSectionTitle, { color: theme.secondary }]}>Notificaciones</Text>
            <Ionicons name={notifsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.secondary} />
            
            </TouchableOpacity>

            {notifsExpanded && // UI: renderiza el componente View.
          <View style={[styles.notifContent, { backgroundColor: theme.background }]}>
                {notifications.length === 0 ? // UI: muestra texto visible en la pantalla.
            <Text style={[styles.notifEmpty, { color: theme.placeholder }]}>{'<<No hay notificaciones>>'}</Text> :

            notifications.map((n) => // UI: renderiza el componente NotificationSwipeItem.
            <NotificationSwipeItem
              key={n.identificador}
              item={n}
              theme={theme}
              onDelete={eliminarNotificacion} />

            )
            }
              </View>
          }

            {/* Separador */}
          <View style={[styles.notifDivider, { backgroundColor: theme.border }]} />

            {/* ── Sección Configuracion ── */}
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
              <Switch value={darkTheme} onValueChange={setDarkTheme} thumbColor={darkTheme ? '#FFFFFF' : '#FFFFFF'} trackColor={{ false: '#C0B0A8', true: '#8b0000' }}
                style={{ marginLeft: 'auto' }} />
              
                </View>
              </View>
          }
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
        transform: [{ translateX }],
        backgroundColor: theme.surface
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
              <View style={[styles.separator, { backgroundColor: theme.border }]} />}
              {group.map((item, ii) => // UI: renderiza un control presionable para el usuario.
                <TouchableOpacity key={ii} style={styles.drawerItem} onPress={() => handleItemPress(item)} activeOpacity={0.6}>
                  <Ionicons name={item.icon} size={22} color={theme.secondary} style={styles.drawerItemIcon} />
                  <Text style={[styles.drawerItemLabel, { color: theme.secondary }]}>{item.label}</Text>
                </TouchableOpacity>)}
            </View>)}
        </ScrollView>
      </Animated.View>

    </View>);} // Explica: define styles usando el resultado de StyleSheet.create.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

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
  notificationBadge: {
    position: 'absolute', top: 2, right: 0, minWidth: 16, height: 16,
    borderRadius: 8, backgroundColor: '#8b0000', alignItems: 'center', justifyContent: 'center'
  },
  notificationBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  logo: { width: '45%', height: 32, alignSelf: 'center' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 },

  sectionTitle: {
    fontSize: 20, fontWeight: '800', color: '#1a1a1a',
    marginTop: 20, marginBottom: 10
  },
  auctionContainer: {
    position: 'relative', height: 190,
    borderRadius: 12, overflow: 'hidden', marginBottom: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  auctionImage: { width: '100%', height: '100%' },
  verMasButton: {
    position: 'absolute', bottom: 14, right: 14,
    paddingHorizontal: 18, paddingVertical: 8,
    backgroundColor: '#8b0000', borderRadius: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6
  },
  verMasText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  menuButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 10
  },
  menuButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#8b0000',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6
  },
  menuButtonLabel: {
    color: '#FFFFFF', fontSize: 11, fontWeight: '600',
    textAlign: 'center', marginTop: 6
  },

  // Overlay compartido
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 10
  },

  // ── Panel de notificaciones ──────────────────
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
  notifSectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a'
  },
  notifContent: {
    backgroundColor: '#F5E8DC',
    marginHorizontal: 14,
    marginBottom: 12,
    borderRadius: 10,
    minHeight: 80,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 8
  },
  notifEmpty: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic'
  },
  notifSwipeWrap: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 10
  },
  notifDeleteBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#8b0000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    gap: 6
  },
  notifDeleteText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  notifItemCard: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F0D8C8'
  },
  notifItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3
  },
  notifItemMessage: {
    fontSize: 13,
    lineHeight: 18
  },
  notifDivider: {
    height: 1,
    backgroundColor: '#E8D5C8',
    marginHorizontal: 14,
    marginBottom: 4
  },
  configContent: {
    paddingHorizontal: 18,
    paddingBottom: 16
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  themeLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a'
  },

  // ── Drawer hamburguesa ───────────────────────
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
  closeBtn: {
    alignSelf: 'flex-end',
    marginRight: 16,
    marginBottom: 8,
    padding: 4
  },
  profileSection: {
    paddingHorizontal: 24,
    paddingBottom: 20
  },
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
  userName: {
    fontSize: 17, fontWeight: '700', color: '#1a1a1a'
  },
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
  drawerItemLabel: {
    fontSize: 16, fontWeight: '500', color: '#1a1a1a'
  }
});
