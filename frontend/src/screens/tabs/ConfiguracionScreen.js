import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Animated,
  Image,
  Alert,
  ScrollView, 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';
import { DARK_COLORS, COLORS } from '../../constants/colors';
import { useAppTheme } from '../../context/ThemeContext';

const USER_AVATAR = require('../../assets/images/avatar.jpeg'); // reemplazá con tu ruta

// ─────────────────────────────────────────────
//  Tarjeta de acción simple (con flecha)
// ─────────────────────────────────────────────
function ActionCard({ icon, label, sublabel, onPress, danger = false }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.card, danger && styles.cardDanger]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={[styles.cardIconWrap, danger && styles.cardIconWrapDanger]}>
          <Ionicons name={icon} size={26} color="#8b0000" />
        </View>
        <View style={styles.cardTextWrap}>
          <Text style={[styles.cardLabel, danger && styles.cardLabelDanger]}>{label}</Text>
          {sublabel ? <Text style={styles.cardSublabel}>{sublabel}</Text> : null}
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={danger ? '#8b0000' : '#C0A898'}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
//  Grupo colapsable (ej: Sistema)
// ─────────────────────────────────────────────
function CollapsibleGroup({ icon, title, children }) {
  const [open, setOpen]       = useState(true);
  const animHeight             = useRef(new Animated.Value(1)).current;
  const animRotate             = useRef(new Animated.Value(1)).current;

  const toggle = () => {
    const toValue = open ? 0 : 1;
    Animated.parallel([
      Animated.spring(animHeight,  { toValue, useNativeDriver: false, speed: 18, bounciness: 2 }),
      Animated.spring(animRotate,  { toValue, useNativeDriver: true,  speed: 18, bounciness: 2 }),
    ]).start();
    setOpen(!open);
  };

  const rotate = animRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
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
      {open && (
        <View style={styles.groupContent}>
          {children}
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
//  Fila de opción dentro de un grupo
// ─────────────────────────────────────────────
function GroupRow({ icon, label, onPress, rightElement }) {
  return (
    <TouchableOpacity style={styles.groupRow} onPress={onPress} activeOpacity={0.6}>
      {icon ? (
        <Ionicons name={icon} size={22} color="#6B4A3A" style={styles.groupRowIcon} />
      ) : (
        <View style={styles.groupRowIcon} />
      )}
      <Text style={styles.groupRowLabel}>{label}</Text>
      <View style={styles.groupRowRight}>
        {rightElement ?? <Ionicons name="chevron-forward" size={20} color="#C0A898" />}
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────
//  Separador dentro de grupo
// ─────────────────────────────────────────────
function GroupDivider() {
  return <View style={styles.groupDivider} />;
}

// ─────────────────────────────────────────────
//  Pantalla principal
// ─────────────────────────────────────────────
export default function ConfiguracionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((state) => state.logout);
  const darkTheme         = useSettingsStore((s) => s.darkTheme);
  const notificaciones     = useSettingsStore((s) => s.notificaciones);
  const moneda             = useSettingsStore((s) => s.moneda);
  const idioma             = useSettingsStore((s) => s.idioma);
  const setDarkTheme       = useSettingsStore((s) => s.setDarkTheme);
  const setNotificaciones  = useSettingsStore((s) => s.setNotificaciones);
  const setMoneda          = useSettingsStore((s) => s.setMoneda);
  const setIdioma          = useSettingsStore((s) => s.setIdioma);
  const theme              = darkTheme ? DARK_COLORS : COLORS;
  const { isDark }         = useAppTheme();
  // @TASK: Obtiene los datos del usuario autenticado desde el estado global.
  const user               = useAuthStore((s) => s.user);
  // @MOCK: const email = useAuthStore((s) => s.token ? (user?.email ?? 'usuario@subastup.com') : 'usuario@subastup.com');

  const handleEliminarCuenta = () => {
    Alert.alert(
      'Eliminar cuenta',
      '¿Estás seguro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => console.log('Eliminar cuenta') },
      ]
    );
  };

  const handleCerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Querés cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.white }]}>

      {/* ── Top Bar ─────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Configuracion</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={[styles.scroll, { backgroundColor: theme.white }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >

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

        <ActionCard
          icon="person-outline"
          label="Editar perfil"
          sublabel="Nombre, foto y datos personales"
          onPress={() => navigation.navigate('MiCuenta')}
        />
        <ActionCard
          icon="card-outline"
          label="Metodos de pago"
          sublabel="Tarjetas y cuentas vinculadas"
          onPress={() => navigation.navigate('AgregarMetodoPago')}
        />
        <ActionCard
          icon="hammer-outline"
          label="Mis subastas"
          sublabel="Historial y activas"
          // @TASK: La pantalla MisSubastas no existe todavía en el navigator.
          onPress={() => Alert.alert('Próximamente', 'Esta funcionalidad estará disponible pronto.')}
        />
        <ActionCard
          icon="receipt-outline"
          label="Historial de pujas"
          sublabel="Tus pujas recientes, ganadas y perdidas"
          onPress={() => navigation.navigate('HistorialPujas')}
        />

        {/* ── Sección: Sistema ─────────────────── */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>SISTEMA</Text>

        <CollapsibleGroup icon="settings-outline" title="Sistema">
          <GroupRow
            icon="moon-outline"
            label="Modo Oscuro"
            rightElement={
              <Switch
                value={darkTheme}
                onValueChange={setDarkTheme}
                thumbColor="#FFFFFF"
                trackColor={{ false: '#D0C0B8', true: '#8b0000' }}
                ios_backgroundColor="#D0C0B8"
              />
            }
          />
          <GroupDivider />
          <GroupRow
            icon="notifications-outline"
            label="Notificaciones"
            rightElement={
              <Switch
                value={notificaciones}
                onValueChange={setNotificaciones}
                thumbColor="#FFFFFF"
                trackColor={{ false: '#D0C0B8', true: '#8b0000' }}
                ios_backgroundColor="#D0C0B8"
              />
            }
          />
          <GroupDivider />
          <GroupRow
            icon="cash-outline"
            label="Moneda de preferencia"
            rightElement={<Text style={{ fontSize: 14, color: '#8b0000', fontWeight: '600' }}>{moneda}</Text>}
            onPress={() =>
              Alert.alert('Moneda de preferencia', 'Seleccioná tu moneda', [
                { text: 'ARS — Peso Argentino', onPress: () => setMoneda('ARS') },
                { text: 'USD — Dólar',          onPress: () => setMoneda('USD') },
                { text: 'Cancelar', style: 'cancel' },
              ])
            }
          />
          <GroupDivider />
          <GroupRow
            icon="shield-checkmark-outline"
            label="Privacidad y seguridad"
            onPress={() =>
              Alert.alert(
                'Privacidad y seguridad',
                'Tus datos están protegidos bajo nuestra política de privacidad. ' +
                'No compartimos tu información personal con terceros.',
                [{ text: 'Entendido' }]
              )
            }
          />
        </CollapsibleGroup>

        {/* ── Sección: Soporte ─────────────────── */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>SOPORTE</Text>

        <ActionCard
          icon="help-circle-outline"
          label="Ayuda y soporte"
          sublabel="Centro de ayuda y contacto"
          onPress={() => navigation.navigate('Ayuda')}
        />

        {/* ── Sección: Zona de peligro ─────────── */}
        <Text style={[styles.sectionLabel, { marginTop: 28, color: '#8b0000' }]}>SESIÓN</Text>

        <ActionCard
          icon="log-out-outline"
          label="Cerrar sesión"
          onPress={handleCerrarSesion}
        />
        <ActionCard
          icon="trash-outline"
          label="Eliminar cuenta"
          sublabel="Esta acción es irreversible"
          onPress={handleEliminarCuenta}
          danger
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>SubastUp v1.0.0</Text>
        </View>

      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────
//  Estilos
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white }, // fondo blanco

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
    shadowRadius: 6,
  },
  backBtn:     { padding: 4 },
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
    borderColor: '#F0E8E0',
  },
  heroBg: { display: 'none' },
  heroInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 14,
    backgroundColor: '#FFFFFF',
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#E0D0C8',
    backgroundColor: '#F0D8CC',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: 22, height: 22,
    borderRadius: 11,
    backgroundColor: '#8b0000',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  heroText:  { flex: 1 },
  heroName:  { fontSize: 19, fontWeight: '800', color: '#1A1A1A', marginBottom: 3 },
  heroEmail: { fontSize: 14, color: '#9A8880', fontWeight: '400' },
  heroPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF5EC', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    gap: 4, borderWidth: 1, borderColor: '#F0D8C8',
  },
  heroPillText: { fontSize: 12, fontWeight: '700', color: '#8b0000' },

  // ── Etiquetas de sección ─────────────────────
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B09080',
    letterSpacing: 1.8,
    marginBottom: 10,
    marginLeft: 4,
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
    borderColor: '#F5EDE8',
  },
  cardDanger: {
    backgroundColor: '#FFF8F6',
    borderColor: '#F5E0DC',
  },
  cardIconWrap: {
    width: 50, height: 50,
    borderRadius: 14,
    backgroundColor: '#FFF5EC',
    alignItems: 'center', justifyContent: 'center',
  },
  cardIconWrapDanger: { backgroundColor: '#FFE8E4' },
  cardTextWrap:       { flex: 1 },
  cardLabel:          { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  cardLabelDanger:    { color: '#8b0000' },
  cardSublabel:       { fontSize: 13, color: '#A09088', marginTop: 3 },

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
    borderColor: '#F5EDE8',
  },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 18,
    backgroundColor: '#FFFFFF',
  },
  groupHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  groupTitle:      { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  groupContent:    { borderTopWidth: 1, borderTopColor: '#F5EDE8' },

  groupRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
  },
  groupRowIcon:  { width: 28, marginRight: 14 },
  groupRowLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: '#2A1A1A' },
  groupRowRight: { alignItems: 'center', justifyContent: 'center' },
  groupDivider:  { height: 1, backgroundColor: '#F5EDE8', marginLeft: 58 },

  // Footer
  footer:     { marginTop: 20, alignItems: 'center' },
  footerText: { fontSize: 11, color: '#C0B0A8', letterSpacing: 0.5 },
});
