/*
Intro: LoginScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/auth/LoginScreen.js.
Endpoints: FORGOT_PASSWORD (/api/auth/forgot-password: solicitar recuperacion de password).
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useState } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Switch,
  Modal,
  Alert } from
'react-native'; // Explica: importa dependencias desde 'react-native'.
import { SafeAreaView } from 'react-native'; // Explica: importa dependencias desde 'react-hook-form'.
import { useForm, Controller } from 'react-hook-form'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde '../../store/authStore'.

import useAuthStore from '../../store/authStore'; // Explica: importa dependencias desde '../../constants/colors'.
import { COLORS, SPACING, RADIUS, FONTS } from '../../constants/colors'; // Explica: importa dependencias desde '../../services/api'.
import api from '../../services/api'; // Explica: importa dependencias desde '../../constants/api'.
import { ENDPOINTS } from '../../constants/api'; // Explica: define LOGO usando el resultado de require.

const LOGO = require('../../assets/images/banner_principal.jpeg'); // Explica: exporta este modulo para que otras partes de la app lo usen.

export default // Explica: declara la funcion LoginScreen que concentra una parte del flujo.
function LoginScreen({ navigation }) {// Estado: crea el estado valores desestructurados y su actualizador.
  const [showPassword, setShowPassword] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [rememberMe, setRememberMe] = useState(true); // Estado: crea el estado valores desestructurados y su actualizador.
  const [activeTab, setActiveTab] = useState('login');
  // Modal "Olvidé mi contraseña"
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [forgotVisible, setForgotVisible] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [forgotEmail, setForgotEmail] = useState(''); // Estado: crea el estado valores desestructurados y su actualizador.
  const [forgotLoading, setForgotLoading] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [forgotError, setForgotError] = useState(''); // Explica: define objeto desestructurado usando el resultado de useAuthStore.
  const { login, isLoading, error, clearError } = useAuthStore(); // Explica: define objeto desestructurado usando el resultado de useForm.

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: { email: '', password: '' }
  });

  // ── Login ──────────────────────────────────────────────────
  // Explica: define onSubmit para usarlo en este archivo.
  const onSubmit = async ({ email, password }) => {// Explica: ejecuta clearError como parte del flujo.
    clearError();await login(email, password);
  };

  // ── Forgot password ────────────────────────────────────────
  // Explica: define handleForgotPassword para usarlo en este archivo.
  const handleForgotPassword = async () => {// Explica: define emailRegex para usarlo en este archivo.
    const emailRegex = /\S+@\S+\.\S+/; // Control: evalua una condicion para decidir el siguiente paso.
    if (!forgotEmail.trim()) {// Estado: actualiza un valor usado por la interfaz.
      setForgotError('Ingresá tu correo electrónico.'); // Render: devuelve el resultado que consume React o la funcion llamadora.
      return;
    } // Control: evalua una condicion para decidir el siguiente paso.
    if (!emailRegex.test(forgotEmail)) {// Estado: actualiza un valor usado por la interfaz.
      setForgotError('El formato del mail no es válido.'); // Render: devuelve el resultado que consume React o la funcion llamadora.
      return;
    } // Estado: actualiza un valor usado por la interfaz.

    setForgotLoading(true); // Estado: actualiza un valor usado por la interfaz.
    setForgotError(''); // Control: intenta una operacion y maneja errores si falla.

    try {
      // El backend siempre devuelve ok: true (no revela si el mail existe)
      // API: llama POST /api/auth/forgot-password para solicitar recuperacion de password.
      await api.post(ENDPOINTS.FORGOT_PASSWORD, { email: forgotEmail }); // Estado: actualiza un valor usado por la interfaz.
      setForgotLoading(false); // Estado: actualiza un valor usado por la interfaz.
      setForgotVisible(false); // Estado: actualiza un valor usado por la interfaz.
      setForgotEmail(''); // Navegacion: cambia de pantalla o ajusta opciones de navegacion.
      navigation.navigate('VerifyCode', { email: forgotEmail });

    } catch (err) {// Estado: actualiza un valor usado por la interfaz.
      setForgotLoading(false); // Estado: actualiza un valor usado por la interfaz.
      setForgotError('No se pudo enviar el código. Verificá tu conexión e intentá de nuevo.');
    }
  };

  // ── Render ─────────────────────────────────────────────────
  // Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente KeyboardAvoidingView.
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'height' : 'height'}
    style={styles.flex}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          

          {/* Volver */}
          <TouchableOpacity style={styles.backButton}
          onPress={() => navigation.navigate('HomeUnauth')}>
            
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.headerContainer}>
            <Image source={LOGO} style={styles.logo} />
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <View style={[styles.tabIndicator, activeTab === 'login' && styles.indicatorLeft, activeTab === 'register' && styles.indicatorRight]} />
            <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('login')}>
              <Text style={styles.tabText}>Iniciar sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab} onPress={() => {// Estado: actualiza un valor usado por la interfaz.
                setActiveTab('register'); // Navegacion: cambia de pantalla o ajusta opciones de navegacion.
                navigation.navigate('Register');}}>
              <Text style={styles.tabText}>Registrarse</Text>
            </TouchableOpacity>
          </View>

          {/* Error banner del login */}
          {error && // UI: renderiza el componente View.
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
            </View>}

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <Controller control={control} name="email" rules={{ required: 'El email es obligatorio' }} render={({ field: { onChange, onBlur, value } }) => // UI: permite ingresar o editar texto.
            <TextInput style={[styles.input, errors.email && styles.inputError]} onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              keyboardType="email-address"
              autoCapitalize="none" />

            } />
          
          {errors.email && // UI: muestra texto visible en la pantalla.
          <Text style={styles.fieldError}>{errors.email.message}</Text>}

          {/* Contraseña */}
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.passwordWrapper}>
            <Controller control={control} name="password" rules={{ required: 'La contraseña es obligatoria' }} render={({ field: { onChange, onBlur, value } }) => // UI: permite ingresar o editar texto.
              <TextInput
                style={styles.passwordInput}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry={!showPassword} />

              } />
            
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#ffffff" />
              
            </TouchableOpacity>
          </View>
          {errors.password && // UI: muestra texto visible en la pantalla.
          <Text style={styles.fieldError}>{errors.password.message}</Text>}

          {/* Ingresar */}
          <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleSubmit(onSubmit)}
            disabled={isLoading}>
            
            {isLoading ? // UI: renderiza el componente ActivityIndicator.
            <ActivityIndicator color={COLORS.white} /> : // UI: muestra texto visible en la pantalla.
            <Text style={styles.buttonText}>Ingresar</Text>
            }
          </TouchableOpacity>

          {/* Recordar usuario */}
          <View style={styles.rememberMeRow}>
            <Switch value={rememberMe} onValueChange={setRememberMe}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={rememberMe ? COLORS.white : COLORS.placeholder} />
            
            <Text style={styles.rememberMeText}>Recordar Usuario</Text>
          </View>

          <View style={styles.spacer} />

          {/* Olvidé mi contraseña */}
          <TouchableOpacity style={styles.forgotWrapperBottom} onPress={() => {// Estado: actualiza un valor usado por la interfaz.
              setForgotEmail(''); // Estado: actualiza un valor usado por la interfaz.
              setForgotError(''); // Estado: actualiza un valor usado por la interfaz.
              setForgotVisible(true);}}>
            <Text style={styles.forgotText}>Olvide mi contraseña</Text>
          </TouchableOpacity>

        </ScrollView>

        {/* ── Modal: Olvidé mi contraseña ── */}
        <Modal transparent visible={forgotVisible} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>

              <TouchableOpacity style={styles.modalClose} onPress={() => setForgotVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>

              <Text style={styles.modalTitulo}>Ingresa tu mail</Text>

              <TextInput style={[styles.modalInput, forgotError ? styles.modalInputError : null]} value={forgotEmail} onChangeText={(t) => {// Estado: actualiza un valor usado por la interfaz.
                  setForgotEmail(t); // Estado: actualiza un valor usado por la interfaz.
                  setForgotError('');}} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />

              {forgotError ? // UI: muestra texto visible en la pantalla.
              <Text style={styles.modalError}>{forgotError}</Text> : null}

              <TouchableOpacity style={[styles.modalBtn, forgotLoading && styles.buttonDisabled]} onPress={handleForgotPassword}
                disabled={forgotLoading}>
                
                {forgotLoading ? // UI: renderiza el componente ActivityIndicator.
                <ActivityIndicator color="#FFFFFF" /> : // UI: muestra texto visible en la pantalla.
                <Text style={styles.modalBtnText}>Enviar</Text>
                }
              </TouchableOpacity>

              <Text style={styles.modalSubtexto}>
                Te enviaremos un mail con un codigo de verificacion
              </Text>

            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </KeyboardAvoidingView>);
} // Explica: define styles usando el resultado de StyleSheet.create.

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.white },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.lg
  },

  // Logo
  headerContainer: { alignItems: 'center', marginBottom: SPACING.lg },
  logo: { width: '90%', height: undefined, aspectRatio: 2.5 },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#7B7B7B',
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xxl,
    height: 44,
    overflow: 'hidden',
    position: 'relative'
  },
  tabIndicator: {
    position: 'absolute',
    backgroundColor: '#8B0000',
    height: 44,
    borderRadius: RADIUS.md,
    zIndex: 0
  },
  indicatorLeft: { width: '50%', left: 0 },
  indicatorRight: { width: '50%', left: '50%' },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 1
  },
  tabText: { fontSize: FONTS.sizes.md, color: COLORS.white, fontWeight: '600' },

  // Error banner
  errorBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error
  },
  errorBannerText: { color: COLORS.error, fontSize: FONTS.sizes.sm },

  // Labels e inputs
  label: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.lg
  },
  input: {
    height: 48,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
    marginBottom: SPACING.lg
  },
  inputError: { borderColor: COLORS.error },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg
  },
  passwordInput: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.secondary },
  fieldError: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.error,
    marginTop: -12,
    marginBottom: SPACING.md
  },

  // Botón login
  button: {
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' },

  // Recordar usuario
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg
  },
  rememberMeText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
    marginLeft: SPACING.sm,
    fontWeight: '600'
  },

  spacer: { flex: 1 },

  // Back button
  backButton: { marginBottom: SPACING.md, paddingVertical: SPACING.sm },
  backButtonText: { fontSize: FONTS.sizes.md, color: COLORS.primary, fontWeight: '600' },

  // Forgot
  forgotWrapperBottom: { alignItems: 'center', marginTop: SPACING.xxl },
  forgotText: { fontSize: FONTS.sizes.md, color: COLORS.error, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  modalClose: { position: 'absolute', top: 14, right: 16 },
  modalCloseText: { fontSize: 18, color: '#555555' },
  modalTitulo: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  modalInput: { width: '100%', height: 48, backgroundColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 14, fontSize: 15, marginBottom: 12 },
  modalInputError: { borderWidth: 1.5, borderColor: '#C62828' },
  modalError: { fontSize: 12, color: '#C62828', marginBottom: 8, textAlign: 'center' },
  modalBtn: { backgroundColor: '#8b0000', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 40, marginBottom: 12, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 },
  modalBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  modalSubtexto: { fontSize: 13, color: '#555555', textAlign: 'center', lineHeight: 20 }
});
