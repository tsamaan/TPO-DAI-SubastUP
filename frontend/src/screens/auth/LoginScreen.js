import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Switch,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';

import useAuthStore from '../../store/authStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../constants/colors';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

const LOGO = require('../../assets/images/banner_principal.jpeg');

export default function LoginScreen({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe,   setRememberMe]   = useState(true);
  const [activeTab,    setActiveTab]    = useState('login');

  // Modal "Olvidé mi contraseña"
  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail,   setForgotEmail]   = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError,   setForgotError]   = useState('');

  const { login, isLoading, error, clearError } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '', password: '' },
  });

  // ── Login ──────────────────────────────────────────────────
  const onSubmit = async ({ email, password }) => {
    clearError();
    await login(email, password);
  };

  // ── Forgot password ────────────────────────────────────────
  const handleForgotPassword = async () => {
    const emailRegex = /\S+@\S+\.\S+/;

    if (!forgotEmail.trim()) {
      setForgotError('Ingresá tu correo electrónico.');
      return;
    }
    if (!emailRegex.test(forgotEmail)) {
      setForgotError('El formato del mail no es válido.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');

    try {
      // El backend siempre devuelve ok: true (no revela si el mail existe)
      await api.post(ENDPOINTS.FORGOT_PASSWORD, { email: forgotEmail });

      setForgotLoading(false);
      setForgotVisible(false);
      setForgotEmail('');
      navigation.navigate('VerifyCode', { email: forgotEmail });

    } catch (err) {
      setForgotLoading(false);
      setForgotError('No se pudo enviar el código. Verificá tu conexión e intentá de nuevo.');
    }
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'height' : 'height'}
      style={styles.flex}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <SafeAreaView style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >

          {/* Volver */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('HomeUnauth')}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.headerContainer}>
            <Image source={LOGO} style={styles.logo} />
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <View style={[
              styles.tabIndicator,
              activeTab === 'login'    && styles.indicatorLeft,
              activeTab === 'register' && styles.indicatorRight,
            ]} />
            <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('login')}>
              <Text style={styles.tabText}>Iniciar sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => { setActiveTab('register'); navigation.navigate('Register'); }}
            >
              <Text style={styles.tabText}>Registrarse</Text>
            </TouchableOpacity>
          </View>

          {/* Error banner del login */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <Controller
            control={control}
            name="email"
            rules={{ required: 'El email es obligatorio' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          {errors.email && <Text style={styles.fieldError}>{errors.email.message}</Text>}

          {/* Contraseña */}
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.passwordWrapper}>
            <Controller
              control={control}
              name="password"
              rules={{ required: 'La contraseña es obligatoria' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.passwordInput}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry={!showPassword}
                />
              )}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#ffffff"
              />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.fieldError}>{errors.password.message}</Text>}

          {/* Ingresar */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.buttonText}>Ingresar</Text>
            }
          </TouchableOpacity>

          {/* Recordar usuario */}
          <View style={styles.rememberMeRow}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={rememberMe ? COLORS.white : COLORS.placeholder}
            />
            <Text style={styles.rememberMeText}>Recordar Usuario</Text>
          </View>

          <View style={styles.spacer} />

          {/* Olvidé mi contraseña */}
          <TouchableOpacity
            style={styles.forgotWrapperBottom}
            onPress={() => { setForgotEmail(''); setForgotError(''); setForgotVisible(true); }}
          >
            <Text style={styles.forgotText}>Olvide mi contraseña</Text>
          </TouchableOpacity>

        </ScrollView>

        {/* ── Modal: Olvidé mi contraseña ── */}
        <Modal transparent visible={forgotVisible} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>

              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setForgotVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>

              <Text style={styles.modalTitulo}>Ingresa tu mail</Text>

              <TextInput
                style={[styles.modalInput, forgotError ? styles.modalInputError : null]}
                value={forgotEmail}
                onChangeText={(t) => { setForgotEmail(t); setForgotError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {forgotError
                ? <Text style={styles.modalError}>{forgotError}</Text>
                : null
              }

              <TouchableOpacity
                style={[styles.modalBtn, forgotLoading && styles.buttonDisabled]}
                onPress={handleForgotPassword}
                disabled={forgotLoading}
              >
                {forgotLoading
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.modalBtnText}>Enviar</Text>
                }
              </TouchableOpacity>

              <Text style={styles.modalSubtexto}>
                Te enviaremos un mail con un codigo de verificacion
              </Text>

            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.white },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.lg,
  },

  // Logo
  headerContainer: { alignItems: 'center', marginBottom: SPACING.lg },
  logo:            { width: '90%', height: undefined, aspectRatio: 2.5 },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#7B7B7B',
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xxl,
    height: 44,
    overflow: 'hidden',
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    backgroundColor: '#8B0000',
    height: 44,
    borderRadius: RADIUS.md,
    zIndex: 0,
  },
  indicatorLeft:  { width: '50%', left: 0 },
  indicatorRight: { width: '50%', left: '50%' },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  tabText: { fontSize: FONTS.sizes.md, color: COLORS.white, fontWeight: '600' },

  // Error banner
  errorBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  errorBannerText: { color: COLORS.error, fontSize: FONTS.sizes.sm },

  // Labels e inputs
  label: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.lg,
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
    marginBottom: SPACING.lg,
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
    marginBottom: SPACING.lg,
  },
  passwordInput: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.secondary },
  fieldError: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.error,
    marginTop: -12,
    marginBottom: SPACING.md,
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
    shadowRadius: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' },

  // Recordar usuario
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  rememberMeText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.secondary,
    marginLeft: SPACING.sm,
    fontWeight: '600',
  },

  spacer: { flex: 1 },

  // Back button
  backButton:     { marginBottom: SPACING.md, paddingVertical: SPACING.sm },
  backButtonText: { fontSize: FONTS.sizes.md, color: COLORS.primary, fontWeight: '600' },

  // Forgot
  forgotWrapperBottom: { alignItems: 'center', marginTop: SPACING.xxl },
  forgotText: { fontSize: FONTS.sizes.md, color: COLORS.error, fontWeight: '600' },

  // Modal
  modalOverlay:    { flex:1, backgroundColor:'#00000066', justifyContent:'center', alignItems:'center', paddingHorizontal:32 },
  modalCard:       { backgroundColor:'#FFFFFF', borderRadius:20, padding:24, width:'100%', alignItems:'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  modalClose:      { position:'absolute', top:14, right:16 },
  modalCloseText:  { fontSize:18, color:'#555555' },
  modalTitulo:     { fontSize:20, fontWeight:'700', color:'#1A1A1A', marginBottom:16 },
  modalInput:      { width:'100%', height:48, backgroundColor:'#E0E0E0', borderRadius:10, paddingHorizontal:14, fontSize:15, marginBottom:12 },
  modalInputError: { borderWidth:1.5, borderColor:'#C62828' },
  modalError:      { fontSize:12, color:'#C62828', marginBottom:8, textAlign:'center' },
  modalBtn:        { backgroundColor:'#8b0000', borderRadius:10, paddingVertical:12, paddingHorizontal:40, marginBottom:12, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 },
  modalBtnText:    { color:'#FFFFFF', fontWeight:'700', fontSize:15 },
  modalSubtexto:   { fontSize:13, color:'#555555', textAlign:'center', lineHeight:20 },
});