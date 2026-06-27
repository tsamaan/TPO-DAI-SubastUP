/*
Intro: ConfiguracionScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/tabs/ConfiguracionScreen.js.
Endpoints: no llama endpoints directamente.
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useState, useRef } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, TouchableOpacity, StyleSheet, Switch, Animated, Image,
  Alert,
  ScrollView } from
'react-native'; // Explica: importa dependencias desde 'react-native-safe-area-context'.
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde '../../store/authStore'.
import useAuthStore from '../../store/authStore'; // Explica: importa dependencias desde '../../store/settingsStore'.
import useSettingsStore from '../../store/settingsStore'; // Explica: importa dependencias desde '../../constants/colors'.
import { DARK_COLORS, COLORS } from '../../constants/colors'; // Explica: importa dependencias desde '../../context/ThemeContext'.
import { useAppTheme } from '../../context/ThemeContext'; // Explica: define USER_AVATAR usando el resultado de require.

const USER_AVATAR = require('../../assets/images/avatar.jpeg'); // reemplazá con tu ruta

// ─────────────────────────────────────────────
//  Tarjeta de acción simple (con flecha)
// ─────────────────────────────────────────────
// Explica: declara la funcion ActionCard que concentra una parte del flujo.
function ActionCard({ icon, label, sublabel, onPress, danger = false }) {// Explica: define scale para usarlo en este archivo.
  const scale = useRef(new Animated.Value(1)).current; // Explica: define onPressIn para usarlo en este archivo.
  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start(); // Explica: define onPressOut para usarlo en este archivo.
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start(); // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (// UI: renderiza el componente componente.
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity style={[styles.card, danger && styles.cardDanger]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}>
        
        <View style={[styles.cardIconWrap, danger && styles.cardIconWrapDanger]}>
          <Ionicons name={icon} size={26} color="#8b0000" />
        </View>
        <View style={styles.cardTextWrap}>
          <Text style={[styles.cardLabel, danger && styles.cardLabelDanger]}>{label}</Text>
          {sublabel ? // UI: muestra texto visible en la pantalla.
          <Text style={styles.cardSublabel}>{sublabel}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={danger ? '#8b0000' : '#C0A898'} />
      </TouchableOpacity>
    </Animated.View>);}

// ─────────────────────────────────────────────
//  Grupo colapsable (ej: Sistema)
// ─────────────────────────────────────────────
// Explica: declara la funcion CollapsibleGroup que concentra una parte del flujo.
function CollapsibleGroup({ icon, title, children }) {// Estado: crea el estado valores desestructurados y su actualizador.
  const [open, setOpen] = useState(true); // Explica: define animHeight para usarlo en este archivo.
  const animHeight = useRef(new Animated.Value(1)).current; // Explica: define animRotate para usarlo en este archivo.
  const animRotate = useRef(new Animated.Value(1)).current; // Explica: define toggle para usarlo en este archivo.
  const toggle = () => {// Explica: define toValue para usarlo en este archivo.
    const toValue = open ? 0 : 1; // Explica: ejecuta start como parte del flujo.
    Animated.parallel([
    Animated.spring(animHeight, { toValue, useNativeDriver: false, speed: 18, bounciness: 2 }),
    Animated.spring(animRotate, { toValue, useNativeDriver: true, speed: 18, bounciness: 2 })]
    ).start(); // Estado: actualiza un valor usado por la interfaz.
    setOpen(!open);
  }; // Explica: define rotate usando el resultado de animRotate.interpolate.

  const rotate = animRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  }); // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (// UI: renderiza el componente View.
    <View style={styles.groupWrap}>
      {/* Header del grupo */}
      <TouchableOpacity style={styles.groupHeader} onPress={toggle} activeOpacity={0.75}>
        <View style={styles.groupHeaderLeft}>
          <Ionicons name={icon} size={22} color="#8b0000" style={{ marginRight: 10 }} />
          <Text style={styles.groupTitle}>{title}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={22} color="#8b0000" />
        </Animated.View>
      </TouchableOpacity>

      {/* Contenido animado */}
      {open && // UI: renderiza el componente View.
      <View style={styles.groupContent}>
          {children}
        </View>}
    </View>);} // ─────────────────────────────────────────────
//  Fila de opción dentro de un grupo
// ─────────────────────────────────────────────
// Explica: declara la funcion GroupRow que concentra una parte del flujo.
function GroupRow({ icon, label, onPress, rightElement }) {// Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza un control presionable para el usuario.
    <TouchableOpacity style={styles.groupRow} onPress={onPress} activeOpacity={0.6}>
      {icon ? // UI: renderiza el componente Ionicons.
      <Ionicons name={icon} size={22} color="#6B4A3A" style={styles.groupRowIcon} /> : // UI: renderiza el componente View.
      <View style={styles.groupRowIcon} />}
      <Text style={styles.groupRowLabel}>{label}</Text>
      <View style={styles.groupRowRight}>
        {rightElement ?? // UI: renderiza el componente Ionicons.
        <Ionicons name="chevron-forward" size={20} color="#C0A898" />}
      </View>
    </TouchableOpacity>);}
// ─────────────────────────────────────────────
//  Separador dentro de grupo
// ─────────────────────────────────────────────
// Explica: declara la funcion GroupDivider que concentra una parte del flujo.
function GroupDivider() {// Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente View.
    <View style={styles.groupDivider} />);}
// ─────────────────────────────────────────────
//  Pantalla principal
// ─────────────────────────────────────────────
// Explica: exporta este modulo para que otras partes de la app lo usen.
export default // Explica: declara la funcion ConfiguracionScreen que concentra una parte del flujo.
function ConfiguracionScreen({ navigation }) {// Explica: define insets usando el resultado de useSafeAreaInsets.
  const insets = useSafeAreaInsets(); // Explica: define logout usando el resultado de useAuthStore.
  const logout = useAuthStore((state) => state.logout); // Explica: define darkTheme usando el resultado de useSettingsStore.
  const darkTheme = useSettingsStore((s) => s.darkTheme); // Explica: define notificaciones usando el resultado de useSettingsStore.
  const notificaciones = useSettingsStore((s) => s.notificaciones); // Explica: define moneda usando el resultado de useSettingsStore.
  const moneda = useSettingsStore((s) => s.moneda); // Explica: define idioma usando el resultado de useSettingsStore.
  const idioma = useSettingsStore((s) => s.idioma); // Explica: define setDarkTheme usando el resultado de useSettingsStore.
  const setDarkTheme = useSettingsStore((s) => s.setDarkTheme); // Explica: define setNotificaciones usando el resultado de useSettingsStore.
  const setNotificaciones = useSettingsStore((s) => s.setNotificaciones); // Explica: define setMoneda usando el resultado de useSettingsStore.
  const setMoneda = useSettingsStore((s) => s.setMoneda); // Explica: define setIdioma usando el resultado de useSettingsStore.
  const setIdioma = useSettingsStore((s) => s.setIdioma); // Explica: define theme para usarlo en este archivo.
  const theme = darkTheme ? DARK_COLORS : COLORS; // Explica: define objeto desestructurado usando el resultado de useAppTheme.
  const { isDark } = useAppTheme(); // @TASK: Obtiene los datos del usuario autenticado desde el estado global.
  // Explica: define user usando el resultado de useAuthStore.
  const user = useAuthStore((s) => s.user); // @MOCK: const email = useAuthStore((s) => s.token ? (user?.email ?? 'usuario@subastup.com') : 'usuario@subastup.com');
  // Explica: define handleEliminarCuenta para usarlo en este archivo.
  const handleEliminarCuenta = () => {// Explica: ejecuta Alert.alert como parte del flujo.
    Alert.alert('Eliminar cuenta',
    '¿Estás seguro? Esta acción no se puede deshacer.',
    [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => console.log('Eliminar cuenta') }]

    );
  }; // Explica: define handleCerrarSesion para usarlo en este archivo.

  const handleCerrarSesion = () => {// Explica: ejecuta Alert.alert como parte del flujo.
    Alert.alert(
      'Cerrar sesión',
      '¿Querés cerrar sesión?',
      [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() }]

    );
  }; // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (// UI: renderiza el componente View.
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.white }]}>

      {/* ── Top Bar ─────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Configuracion</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={[styles.scroll, { backgroundColor: theme.white }]} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false}>

        {/* ── Hero del usuario ─────────────────── */}
        <View style={styles.heroCard}>
          {/* Fondo decorativo */}
          <View style={styles.heroBg} />
          <View style={styles.heroInner}>
            <View style={styles.avatarWrap}>
              <Image source={USER_AVATAR} style={styles.avatar} />
              <View style={styles.avatarBadge}>
                <Ionicons name="pencil" size={10} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.heroText}>
              {/* @MOCK: <Text style={styles.heroName}>usuario</Text> */}
              <Text style={styles.heroName}>{user?.name}</Text>
              {/* @MOCK: <Text style={styles.heroEmail}>subastup.com</Text> */}
              <Text style={styles.heroEmail}>{user?.email}</Text>
            </View>
            <View style={styles.heroPill}>
              <Ionicons name="star" size={12} color="#8b0000" />
              <Text style={styles.heroPillText}>Activo</Text>
            </View>
          </View>
        </View>

        {/* ── Sección: Cuenta ──────────────────── */}
        <Text style={styles.sectionLabel}>CUENTA</Text>

        <ActionCard icon="person-outline" label="Editar perfil" sublabel="Nombre, foto y datos personales" onPress={() => navigation.navigate('MiCuenta')} />
        <ActionCard icon="card-outline" label="Metodos de pago" sublabel="Tarjetas y cuentas vinculadas" onPress={() => navigation.navigate('AgregarMetodoPago')} />
        <ActionCard icon="hammer-outline" label="Mis subastas" sublabel="Historial y activas" // @TASK: La pantalla MisSubastas no existe todavía en el navigator.
          onPress={() => Alert.alert('Próximamente', 'Esta funcionalidad estará disponible pronto.')} />
        <ActionCard icon="receipt-outline" label="Historial de pujas" sublabel="Tus pujas recientes, ganadas y perdidas" onPress={() => navigation.navigate('HistorialPujas')} />

        {/* ── Sección: Sistema ─────────────────── */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>SISTEMA</Text>

        <CollapsibleGroup icon="settings-outline" title="Sistema">
          <GroupRow icon="moon-outline" label="Modo Oscuro" rightElement={// UI: renderiza el componente Switch.
            <Switch
              value={darkTheme}
              onValueChange={setDarkTheme}
              thumbColor="#FFFFFF"
              trackColor={{ false: '#D0C0B8', true: '#8b0000' }}
              ios_backgroundColor="#D0C0B8" />

            } />
          
          <GroupDivider />
          <GroupRow icon="notifications-outline" label="Notificaciones"
            rightElement={// UI: renderiza el componente Switch.
            <Switch
              value={notificaciones}
              onValueChange={setNotificaciones}
              thumbColor="#FFFFFF"
              trackColor={{ false: '#D0C0B8', true: '#8b0000' }}
              ios_backgroundColor="#D0C0B8" />

            } />
          
          <GroupDivider />
          <GroupRow icon="cash-outline" label="Moneda de preferencia"
            rightElement={// UI: muestra texto visible en la pantalla.
            <Text style={{ fontSize: 14, color: '#8b0000', fontWeight: '600' }}>{moneda}</Text>} onPress={() =>
            Alert.alert('Moneda de preferencia', 'Seleccioná tu moneda', [
            { text: 'ARS — Peso Argentino', onPress: () => setMoneda('ARS') },
            { text: 'USD — Dólar', onPress: () => setMoneda('USD') },
            { text: 'Cancelar', style: 'cancel' }]
            )
            } />
          
          <GroupDivider />
          <GroupRow icon="shield-checkmark-outline" label="Privacidad y seguridad"
            onPress={() =>
            Alert.alert(
              'Privacidad y seguridad',
              'Tus datos están protegidos bajo nuestra política de privacidad. ' +
              'No compartimos tu información personal con terceros.',
              [{ text: 'Entendido' }]
            )
            } />
          
        </CollapsibleGroup>

        {/* ── Sección: Soporte ─────────────────── */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>SOPORTE</Text>

        <ActionCard icon="help-circle-outline" label="Ayuda y soporte"
          sublabel="Centro de ayuda y contacto"
          onPress={() => navigation.navigate('Ayuda')} />
        

        {/* ── Sección: Zona de peligro ─────────── */}
        <Text style={[styles.sectionLabel, { marginTop: 28, color: '#8b0000' }]}>SESIÓN</Text>

        <ActionCard icon="log-out-outline" label="Cerrar sesión"
          onPress={handleCerrarSesion} />
        
        <ActionCard icon="trash-outline"
        label="Eliminar cuenta"
        sublabel="Esta acción es irreversible"
        onPress={handleEliminarCuenta}
        danger />
        

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>SubastUp v1.0.0</Text>
        </View>

      </ScrollView>
    </View>);}

// ─────────────────────────────────────────────
//  Estilos
// ─────────────────────────────────────────────
// Explica: define styles usando el resultado de StyleSheet.create.
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: COLORS.white }, // fondo blanco

    // Top bar
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
      shadowRadius: 6
    },
    backBtn: { padding: 4 },
    topBarTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', letterSpacing: 0.3 },

    // Contenido (no scrolleable)
    scroll: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },

    // ── Hero ────────────────────────────────────
    heroCard: {
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 28,
      backgroundColor: '#FFFFFF',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      borderWidth: 1,
      borderColor: '#F0E8E0'
    },
    heroBg: { display: 'none' },
    heroInner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 20,
      gap: 14,
      backgroundColor: '#FFFFFF'
    },
    avatarWrap: { position: 'relative' },
    avatar: {
      width: 68,
      height: 68,
      borderRadius: 34,
      borderWidth: 2,
      borderColor: '#E0D0C8',
      backgroundColor: '#F0D8CC'
    },
    avatarBadge: {
      position: 'absolute',
      bottom: 0, right: 0,
      width: 22, height: 22,
      borderRadius: 11,
      backgroundColor: '#8b0000',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: '#FFFFFF'
    },
    heroText: { flex: 1 },
    heroName: { fontSize: 19, fontWeight: '800', color: '#1A1A1A', marginBottom: 3 },
    heroEmail: { fontSize: 14, color: '#9A8880', fontWeight: '400' },
    heroPill: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: '#FFF5EC', borderRadius: 20,
      paddingHorizontal: 10, paddingVertical: 4,
      gap: 4, borderWidth: 1, borderColor: '#F0D8C8'
    },
    heroPillText: { fontSize: 12, fontWeight: '700', color: '#8b0000' },

    // ── Etiquetas de sección ─────────────────────
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: '#B09080',
      letterSpacing: 1.8,
      marginBottom: 10,
      marginLeft: 4
    },

    // ── ActionCard ───────────────────────────────
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 16,
      marginBottom: 10,
      gap: 14,
      elevation: 2,
      shadowColor: '#8b0000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      borderWidth: 1,
      borderColor: '#F5EDE8'
    },
    cardDanger: {
      backgroundColor: '#FFF8F6',
      borderColor: '#F5E0DC'
    },
    cardIconWrap: {
      width: 50, height: 50,
      borderRadius: 14,
      backgroundColor: '#FFF5EC',
      alignItems: 'center', justifyContent: 'center'
    },
    cardIconWrapDanger: { backgroundColor: '#FFE8E4' },
    cardTextWrap: { flex: 1 },
    cardLabel: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
    cardLabelDanger: { color: '#8b0000' },
    cardSublabel: { fontSize: 13, color: '#A09088', marginTop: 3 },

    // ── CollapsibleGroup ─────────────────────────
    groupWrap: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      marginBottom: 10,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: '#8b0000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      borderWidth: 1,
      borderColor: '#F5EDE8'
    },
    groupHeader: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 18,
      backgroundColor: '#FFFFFF'
    },
    groupHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
    groupTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
    groupContent: { borderTopWidth: 1, borderTopColor: '#F5EDE8' },

    groupRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 16
    },
    groupRowIcon: { width: 28, marginRight: 14 },
    groupRowLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: '#2A1A1A' },
    groupRowRight: { alignItems: 'center', justifyContent: 'center' },
    groupDivider: { height: 1, backgroundColor: '#F5EDE8', marginLeft: 58 },

    // Footer
    footer: { marginTop: 20, alignItems: 'center' },
    footerText: { fontSize: 11, color: '#C0B0A8', letterSpacing: 0.5 }
  });
