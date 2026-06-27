/*
Intro: MiCuentaScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/profile/MiCuentaScreen.js.
Endpoints: FORGOT_PASSWORD (/api/auth/forgot-password: solicitar recuperacion de password); ME (/api/users/me: consultar o actualizar el perfil autenticado).
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useEffect, useState } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Modal } from
'react-native'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde '../../context/ThemeContext'.
import { useAppTheme } from '../../context/ThemeContext'; // Explica: importa dependencias desde '../../services/api'.
import api from '../../services/api'; // Explica: importa dependencias desde '../../constants/api'.
import { ENDPOINTS } from '../../constants/api'; // Explica: importa dependencias desde '../../store/authStore'.
import useAuthStore from '../../store/authStore'; // Explica: importa dependencias desde '../../utils/images'.
import { dataUriFromBase64 } from '../../utils/images';

// ─── Componente de campo (vista + edición unificados) ────────────────────────
// Explica: define Campo para usarlo en este archivo.
const Campo = ({ label, value, onChange, editing, censurable, secureEntry, bloqueado, keyboardType, multiline }) => {// Explica: define objeto desestructurado usando el resultado de useAppTheme.
  const { theme } = useAppTheme(); // Estado: crea el estado valores desestructurados y su actualizador.
  const [visible, setVisible] = useState(!secureEntry); // Explica: define censurar para usarlo en este archivo.
  const censurar = (texto) => {// Control: evalua una condicion para decidir el siguiente paso.
    if (!texto) // Render: devuelve el resultado que consume React o la funcion llamadora.
      return ''; // Render: devuelve el resultado que consume React o la funcion llamadora.
    return '•'.repeat(Math.min(texto.length, 16));}; // Explica: define valorMostrado para usarlo en este archivo.

  const valorMostrado = censurable && !visible ? censurar(value) : value; // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (// UI: renderiza el componente View.
    <View style={styles.campoContainer}>
      <Text style={[styles.campoLabel, { color: theme.secondary }]}>{label}</Text>
      <View style={[styles.campoFila, editing && !bloqueado && styles.campoFilaActiva]}>
        {editing && !bloqueado ? // UI: permite ingresar o editar texto.
        <TextInput style={[styles.campoInput, { color: theme.secondary }]} value={value}
          onChangeText={onChange}
          keyboardType={keyboardType ?? 'default'}
          secureTextEntry={secureEntry && !visible}
          multiline={multiline}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#BDBDBD" /> : // UI: muestra texto visible en la pantalla.


        <Text style={[styles.campoValor, { color: theme.secondary }, bloqueado && styles.campoValorBloqueado]} numberOfLines={1}>
            {valorMostrado}
          </Text>
        }
        {censurable && // UI: renderiza un control presionable para el usuario.
        <TouchableOpacity
          onPress={() => setVisible((v) => !v)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          
          <Ionicons name={visible ? 'eye-outline' : 'eye-off-outline'}
          size={20}
          color="#9E9E9E" />
          
          </TouchableOpacity>
        }
      </View>
      <View style={[styles.separador, { backgroundColor: theme.border }]} />
    </View>);
};

// ─── Pantalla principal ──────────────────────────────────────────────────────
// Explica: exporta este modulo para que otras partes de la app lo usen.
export default // Explica: declara la funcion MiCuentaScreen que concentra una parte del flujo.
function MiCuentaScreen({ navigation }) {// Explica: define objeto desestructurado usando el resultado de useAppTheme.
  const { theme, isDark } = useAppTheme(); // En Avance 03: reemplazar con useAuthStore()
  // const usuarioInicial = {
  //   nombre: 'Juan Perez',
  //   avatar: null,
  //   correo: 'val********************com',
  //   contrasena: '******************',
  //   telefono: '1137567037',
  //   documento: '***************',
  //   idUsuario: 'q3tm894j',
  // };
  // ── CONEXIÓN BACKEND — perfil ─────────────────────────────────────────
  // Obtener datos reales del usuario desde authStore (guardados al hacer login)
  // Explica: define user usando el resultado de useAuthStore.
  const user = useAuthStore((s) => s.user); // Explica: define setUser usando el resultado de useAuthStore.
  const setUser = useAuthStore((s) => s.setUser);
  // Estado inicial del form usando datos del store (mientras carga la API)
  // Explica: define usuarioInicial para usarlo en este archivo.
  const usuarioInicial = { nombre: user?.name ?? 'Usuario',
    avatar: user?.avatarUrl ?? null,
    correo: user?.email ?? '',
    contrasena: 'Protegida por seguridad',
    telefono: user?.telefono ?? '',
    documento: user?.documento ?? '',
    direccion: user?.direccion ?? '',
    idUsuario: String(user?.id ?? '')
  };
  // ─────────────────────────────────────────────────────────────────────

  // @TASK: Mantiene la pantalla en carga hasta obtener el perfil autenticado.
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [loadingPerfil, setLoadingPerfil] = useState(true); // Estado: crea el estado valores desestructurados y su actualizador.
  const [editing, setEditing] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [form, setForm] = useState({ ...usuarioInicial });
  // @TASK: Conserva el último perfil obtenido para restaurarlo al cancelar la edición.
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [formInicial, setFormInicial] = useState({ ...usuarioInicial }); // Estado: crea el estado valores desestructurados y su actualizador.
  const [saving, setSaving] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [passwordModalVisible, setPasswordModalVisible] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [forgotEmail, setForgotEmail] = useState(usuarioInicial.correo); // Estado: crea el estado valores desestructurados y su actualizador.
  const [forgotLoading, setForgotLoading] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [forgotError, setForgotError] = useState('');
  // @API: Obtiene el perfil real del usuario autenticado al montar la pantalla.
  // Efecto: ejecuta logica cuando cambia el ciclo de vida o sus dependencias.
  useEffect(() => {// @TASK: Evita actualizar el estado si la pantalla se desmonta durante la petición.
      // Explica: define activo para usarlo en este archivo.
      let activo = true;
      // @API: GET /api/users/me retorna los datos dentro de data.perfil.
      // Explica: define cargarPerfil para usarlo en este archivo.
      const cargarPerfil = async () => {// Control: intenta una operacion y maneja errores si falla.
        try {// Explica: define data para usarlo en este archivo.
          const data = await api.get(ENDPOINTS.ME); // Explica: define perfil para usarlo en este archivo.
          const perfil = data?.perfil; // Control: evalua una condicion para decidir el siguiente paso.
          if (!perfil || !activo) // Render: devuelve el resultado que consume React o la funcion llamadora.
            return;
          // @TASK: Adapta el contrato del backend a los campos usados por el formulario.
          // Explica: define perfilForm para usarlo en este archivo.
          const perfilForm = { nombre: perfil.nombre ?? '',
            avatar: dataUriFromBase64(perfil.foto),
            correo: perfil.email ?? '',
            contrasena: 'Protegida por seguridad',
            telefono: perfil.telefono ?? '',
            documento: perfil.documento ?? '',
            direccion: perfil.direccion ?? '',
            idUsuario: String(perfil.registroId ?? perfil.personaId ?? '')
          }; // Estado: actualiza un valor usado por la interfaz.
          setForm(perfilForm); // Estado: actualiza un valor usado por la interfaz.
          setFormInicial(perfilForm); // Estado: actualiza un valor usado por la interfaz.
          setForgotEmail(perfilForm.correo);
        } catch (error) {// Control: evalua una condicion para decidir el siguiente paso.
          if (activo) {// Explica: ejecuta Alert.alert como parte del flujo.
            Alert.alert('Error', error?.response?.data?.message || 'No se pudo obtener tu perfil.');
          }
        } finally {// Control: evalua una condicion para decidir el siguiente paso.
          if (activo) // Estado: actualiza un valor usado por la interfaz.
            setLoadingPerfil(false);}
      }; // Explica: ejecuta cargarPerfil como parte del flujo.

      cargarPerfil(); // Render: devuelve el resultado que consume React o la funcion llamadora.

      return () => {// Estado: asigna un nuevo valor para mantener sincronizado el flujo.
        activo = false;
      };
    }, []); // Explica: define set para usarlo en este archivo.

  const set = (campo) => (valor) => setForm((prev) => ({ ...prev, [campo]: valor })); // Explica: define iniciales usando el resultado de slice.

  const iniciales = form.nombre.
  split(' ').
  map((n) => n[0]).
  join('').
  toUpperCase().
  slice(0, 2); // Explica: define handlePasswordRecovery para usarlo en este archivo.

  const handlePasswordRecovery = async () => {// Explica: define emailRegex para usarlo en este archivo.
    const emailRegex = /\S+@\S+\.\S+/; // Explica: define email usando el resultado de forgotEmail.trim.
    const email = forgotEmail.trim(); // Control: evalua una condicion para decidir el siguiente paso.

    if (!email) {// Estado: actualiza un valor usado por la interfaz.
      setForgotError('Ingresá tu correo electrónico.'); // Render: devuelve el resultado que consume React o la funcion llamadora.
      return;
    } // Control: evalua una condicion para decidir el siguiente paso.
    if (!emailRegex.test(email)) {// Estado: actualiza un valor usado por la interfaz.
      setForgotError('El formato del mail no es válido.'); // Render: devuelve el resultado que consume React o la funcion llamadora.
      return;
    } // Estado: actualiza un valor usado por la interfaz.

    setForgotLoading(true); // Estado: actualiza un valor usado por la interfaz.
    setForgotError(''); // Control: intenta una operacion y maneja errores si falla.

    try {// API: llama POST /api/auth/forgot-password para solicitar recuperacion de password.
      await api.post(ENDPOINTS.FORGOT_PASSWORD, { email }); // Estado: actualiza un valor usado por la interfaz.
      setForgotLoading(false); // Estado: actualiza un valor usado por la interfaz.
      setPasswordModalVisible(false); // Navegacion: cambia de pantalla o ajusta opciones de navegacion.
      navigation.navigate('VerifyCode', { email, returnTo: 'MiCuenta' });
    } catch (err) {// Estado: actualiza un valor usado por la interfaz.
      setForgotLoading(false); // Estado: actualiza un valor usado por la interfaz.
      setForgotError('No se pudo enviar el código. Verificá tu conexión e intentá de nuevo.');
    }
  }; // Explica: define abrirModalPassword para usarlo en este archivo.

  const abrirModalPassword = () => {// Estado: actualiza un valor usado por la interfaz.
    setForgotEmail(form.correo || user?.email || ''); // Estado: actualiza un valor usado por la interfaz.
    setForgotError(''); // Estado: actualiza un valor usado por la interfaz.
    setPasswordModalVisible(true);
  }; // Explica: define handleFAB para usarlo en este archivo.

  const handleFAB = () => {// Control: evalua una condicion para decidir el siguiente paso.
    if (!editing) {// Estado: actualiza un valor usado por la interfaz.
      setEditing(true); // Render: devuelve el resultado que consume React o la funcion llamadora.
      return;
    }
    // Modo edición → confirmar cambios
    // Explica: ejecuta Alert.alert como parte del flujo.
    Alert.alert('Confirmar cambios',
    '¿Querés guardar los cambios en tu cuenta?',
    [
    {
      text: 'Cancelar',
      style: 'cancel',
      onPress: () => {
        // @TASK: Restaura los datos reales cargados, sin conservar contraseñas ingresadas.
        // Estado: actualiza un valor usado por la interfaz.
        setForm({ ...formInicial }); // Estado: actualiza un valor usado por la interfaz.
        setEditing(false);}
    },
    {
      text: 'Guardar',
      onPress: async () => {
        // // TODO Avance 03: authStore.updateUser(form) → PATCH /users/me
        // console.log('[MiCuenta] Guardar:', form);
        // setEditing(false);

        // ── CONEXIÓN BACKEND — guardar perfil ──────────────────────────
        // @API: PUT /api/users/me actualiza los campos que admite el backend.
        // Control: intenta una operacion y maneja errores si falla.
        try {// Estado: actualiza un valor usado por la interfaz.
          setSaving(true); // API: llama PUT /api/users/me para consultar o actualizar el perfil autenticado.
          await api.put(ENDPOINTS.ME, { nombre: form.nombre,
              telefono: form.telefono,
              email: form.correo,
              documento: form.documento,
              direccion: form.direccion
            }); // Explica: define formGuardado para usarlo en este archivo.

          const formGuardado = { ...form, contrasena: 'Protegida por seguridad' }; // Estado: actualiza un valor usado por la interfaz.
          setForm(formGuardado); // Estado: actualiza un valor usado por la interfaz.
          setFormInicial(formGuardado);
          await setUser({
            ...user,
            name: formGuardado.nombre,
            email: formGuardado.correo,
            telefono: formGuardado.telefono,
            documento: formGuardado.documento,
            direccion: formGuardado.direccion
          }); // Estado: actualiza un valor usado por la interfaz.
          setEditing(false); // Explica: ejecuta Alert.alert como parte del flujo.
          Alert.alert('Listo', 'Tu perfil fue actualizado correctamente.');
        } catch (err) {// Explica: ejecuta Alert.alert como parte del flujo.
          Alert.alert(
            'Error',
            err?.response?.data?.message || 'No se pudo guardar. Intentá de nuevo.'
          );
        } finally {// Estado: actualiza un valor usado por la interfaz.
          setSaving(false);
        }
        // ──────────────────────────────────────────────────────────────
      }
    }]

    );
  }; // Control: evalua una condicion para decidir el siguiente paso.

  if (loadingPerfil) {// Render: devuelve el resultado que consume React o la funcion llamadora.
    return (// UI: renderiza el componente SafeAreaView.
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.white }]}>
        {/* @TASK: Indica que el perfil real todavía se está cargando. */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
        </View>
      </SafeAreaView>);} // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (// UI: renderiza el componente SafeAreaView.
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.white }]}>
      {/* ── Top Bar ─────────────────────────────── */}
      <View style={[styles.topBar, { backgroundColor: theme.white, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          
          <Ionicons name="chevron-back" size={26} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: theme.secondary }]}>Mi cuenta</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* ── Avatar ──────────────────────────────── */}
        <View style={styles.avatarWrapper}>
          {form.avatar ? // UI: muestra una imagen o recurso visual.
          <Image source={{ uri: form.avatar }} style={styles.avatar} /> : // UI: renderiza el componente View.
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarIniciales}>{iniciales}</Text>
            </View>}
          {/* Botón cámara visible solo en modo edición */}
          {editing && // UI: renderiza un control presionable para el usuario.
          <TouchableOpacity
            style={styles.avatarEditBtn}
            onPress={() => console.log('[MiCuenta] Cambiar foto — integrar expo-image-picker')}>
            
            <Ionicons name="camera" size={14} color="#FFFFFF" />
            </TouchableOpacity>}
        </View>

        {/* ── Nombre ──────────────────────────────── */}
        {editing ? // UI: permite ingresar o editar texto.
        <TextInput
          style={styles.nombreInput}
          value={form.nombre}
          onChangeText={set('nombre')}
          autoCapitalize="words"
          autoCorrect={false} /> : // UI: muestra texto visible en la pantalla.


        <Text style={[styles.nombre, { color: theme.secondary }]}>{form.nombre}</Text>
        }

        {/* ── Campos ──────────────────────────────── */}
        <View style={styles.camposContainer}>
          <Campo label="Correo electronico" value={form.correo}
            onChange={set('correo')}
            editing={editing}
            censurable={true}
            keyboardType="email-address" />
          
          <Campo label="Contraseña"
          value={form.contrasena}
          onChange={() => {}}
          editing={false}
          censurable={false}
          bloqueado={true} />
          
          {editing && // UI: renderiza un control presionable para el usuario.
          <TouchableOpacity style={styles.passwordChangeBtn} onPress={abrirModalPassword} activeOpacity={0.85}>
            <Ionicons name="key-outline" size={18} color="#FFFFFF" />
            <Text style={styles.passwordChangeBtnText}>Cambiar contraseña</Text>
            </TouchableOpacity>}
          <Campo label="Numero de telefono" value={form.telefono}
            onChange={set('telefono')}
            editing={editing}
            censurable={false}
            keyboardType="phone-pad" />
          
          <Campo label="Documento de identificacion"
          value={form.documento}
          onChange={set('documento')}
          editing={editing}
          censurable={true}
          keyboardType="numeric" />
          
          <Campo label="Dirección"
          value={form.direccion}
          onChange={set('direccion')}
          editing={editing}
          censurable={false}
          multiline />
          
          {/* ID de usuario: nunca editable */}
          <Campo label="Id usuario"
          value={form.idUsuario}
          onChange={() => {}}
          editing={false}
          censurable={true}
          bloqueado={true} />
          
        </View>
      </ScrollView>

      {/* ── FAB: lápiz en vista, tilde en edición ── */}
      <TouchableOpacity style={[styles.fab, saving && styles.fabDisabled]}
      onPress={handleFAB}
      activeOpacity={0.85}
      disabled={saving}>
        
        {saving ? // UI: renderiza el componente ActivityIndicator.
        <ActivityIndicator color="#FFFFFF" /> : // UI: renderiza el componente Ionicons.

        <Ionicons
          name={editing ? 'checkmark' : 'pencil'}
          size={editing ? 26 : 22}
          color="#FFFFFF" />

        }
      </TouchableOpacity>

      <Modal transparent visible={passwordModalVisible} animationType="fade" onRequestClose={() => setPasswordModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setPasswordModalVisible(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitulo}>Cambiar contraseña</Text>
            <Text style={styles.modalSubtextoTop}>
              Te enviaremos un código para validar tu identidad.
            </Text>

            <TextInput style={[styles.modalInput, forgotError ? styles.modalInputError : null]} value={forgotEmail} onChangeText={(t) => {// Estado: actualiza un valor usado por la interfaz.
                setForgotEmail(t); // Estado: actualiza un valor usado por la interfaz.
                setForgotError('');}} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="Tu correo electrónico"
              placeholderTextColor="#777" />
            

            {forgotError ? // UI: muestra texto visible en la pantalla.
            <Text style={styles.modalError}>{forgotError}</Text> : null}

            <TouchableOpacity style={[styles.modalBtn, forgotLoading && styles.fabDisabled]} onPress={handlePasswordRecovery}
              disabled={forgotLoading}>
              
              {forgotLoading ? // UI: renderiza el componente ActivityIndicator.
              <ActivityIndicator color="#FFFFFF" /> : // UI: muestra texto visible en la pantalla.
              <Text style={styles.modalBtnText}>Enviar</Text>
              }
            </TouchableOpacity>

            <Text style={styles.modalSubtexto}>
              Después vas a poder escribir tu nueva contraseña.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>);
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
// Explica: define styles usando el resultado de StyleSheet.create.
const styles = StyleSheet.create({ safeArea: {
      flex: 1,
      backgroundColor: '#FFFFFF'
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center'
    },

    // Top Bar
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

    // Scroll
    scroll: {
      paddingBottom: 100,
      alignItems: 'center'
    },

    // Avatar
    avatarWrapper: {
      marginTop: 24,
      marginBottom: 12,
      position: 'relative'
    },
    avatar: {
      width: 90,
      height: 90,
      borderRadius: 45
    },
    avatarPlaceholder: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: '#D32F2F',
      justifyContent: 'center',
      alignItems: 'center'
    },
    avatarIniciales: {
      color: '#FFFFFF',
      fontSize: 32,
      fontWeight: '700'
    },
    avatarEditBtn: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#8B0000',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF'
    },

    // Nombre
    nombre: {
      fontSize: 18,
      fontWeight: '600',
      color: '#1A1A1A',
      marginBottom: 24
    },
    nombreInput: {
      fontSize: 18,
      fontWeight: '600',
      color: '#1A1A1A',
      textAlign: 'center',
      borderBottomWidth: 1.5,
      borderBottomColor: '#8B0000',
      paddingBottom: 4,
      marginBottom: 24,
      minWidth: 160
    },

    // Campos
    camposContainer: {
      width: '100%',
      paddingHorizontal: 24
    },
    campoContainer: {
      marginBottom: 4
    },
    campoLabel: {
      fontSize: 13,
      color: '#1A1A1A',
      fontWeight: '500',
      marginBottom: 4,
      marginTop: 12
    },
    campoFila: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 8
    },
    campoFilaActiva: {
      borderBottomWidth: 1,
      borderBottomColor: '#8B0000',
      paddingBottom: 2
    },
    campoValor: {
      flex: 1,
      fontSize: 15,
      color: '#1A1A1A',
      marginRight: 8
    },
    campoValorBloqueado: {
      color: '#9E9E9E'
    },
    campoInput: {
      flex: 1,
      fontSize: 15,
      color: '#1A1A1A',
      paddingVertical: 2,
      marginRight: 8
    },
    separador: {
      height: 1,
      backgroundColor: '#E0E0E0'
    },
    passwordChangeBtn: {
      marginTop: 8,
      marginBottom: 8,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#8B0000',
      borderRadius: 12,
      paddingVertical: 11,
      paddingHorizontal: 16,
      gap: 8,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 4
    },
    passwordChangeBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800'
    },

    // FAB
    fab: {
      position: 'absolute',
      bottom: 32,
      right: 24,
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: '#8B0000',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6
    },
    fabDisabled: {
      opacity: 0.65
    },

    // Modal cambio de contraseña
    modalOverlay: {
      flex: 1,
      backgroundColor: '#00000066',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32
    },
    modalCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 24,
      width: '100%',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8
    },
    modalClose: {
      position: 'absolute',
      top: 14,
      right: 16
    },
    modalCloseText: {
      fontSize: 18,
      color: '#555555'
    },
    modalTitulo: {
      fontSize: 20,
      fontWeight: '800',
      color: '#1A1A1A',
      marginBottom: 8
    },
    modalSubtextoTop: {
      fontSize: 13,
      color: '#555555',
      textAlign: 'center',
      lineHeight: 19,
      marginBottom: 16
    },
    modalInput: {
      width: '100%',
      height: 48,
      backgroundColor: '#E0E0E0',
      borderRadius: 10,
      paddingHorizontal: 14,
      fontSize: 15,
      marginBottom: 12,
      color: '#1A1A1A'
    },
    modalInputError: {
      borderWidth: 1.5,
      borderColor: '#C62828'
    },
    modalError: {
      fontSize: 12,
      color: '#C62828',
      marginBottom: 8,
      textAlign: 'center'
    },
    modalBtn: {
      backgroundColor: '#8b0000',
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 40,
      marginBottom: 12,
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6
    },
    modalBtnText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 15
    },
    modalSubtexto: {
      fontSize: 13,
      color: '#555555',
      textAlign: 'center',
      lineHeight: 20
    }
  });
