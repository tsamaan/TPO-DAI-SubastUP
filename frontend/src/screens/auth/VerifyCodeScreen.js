/*
Intro: VerifyCodeScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/auth/VerifyCodeScreen.js.
Endpoints: FORGOT_PASSWORD (/api/auth/forgot-password: solicitar recuperacion de password); VERIFY_CODE (/api/auth/verify-code: validar el codigo enviado al email).
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useState } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert,
  ActivityIndicator } from
'react-native'; // Explica: importa dependencias desde 'react-native-safe-area-context'.
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde '../../services/api'.
import api from '../../services/api'; // Explica: importa dependencias desde '../../constants/api'.
import { ENDPOINTS } from '../../constants/api'; // Explica: importa dependencias desde '../../context/ThemeContext'.
import { useAppTheme } from '../../context/ThemeContext'; // Explica: define LOGO usando el resultado de require.

const LOGO = require('../../assets/images/banner_principal.jpeg'); // Explica: exporta este modulo para que otras partes de la app lo usen.

export default // Explica: declara la funcion VerifyCodeScreen que concentra una parte del flujo.
function VerifyCodeScreen({ navigation, route }) {// Explica: define insets usando el resultado de useSafeAreaInsets.
  const insets = useSafeAreaInsets(); // Explica: define objeto desestructurado usando el resultado de useAppTheme.
  const { theme } = useAppTheme(); // Explica: define email para usarlo en este archivo.
  const email = route?.params?.email ?? ''; // Explica: define returnTo para usarlo en este archivo.
  const returnTo = route?.params?.returnTo; // Estado: crea el estado valores desestructurados y su actualizador.
  const [codigo, setCodigo] = useState(''); // Estado: crea el estado valores desestructurados y su actualizador.
  const [loading, setLoading] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [error, setError] = useState(''); // Estado: crea el estado valores desestructurados y su actualizador.
  const [reenviando, setReenviando] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [reenviado, setReenviado] = useState(false); // Explica: define handleValidar para usarlo en este archivo.

  const handleValidar = async () => {// Control: evalua una condicion para decidir el siguiente paso.
    if (!codigo.trim()) {// Estado: actualiza un valor usado por la interfaz.
      setError('Ingresá el código que recibiste por mail.'); // Render: devuelve el resultado que consume React o la funcion llamadora.
      return;
    } // Control: evalua una condicion para decidir el siguiente paso.
    if (codigo.trim().length < 4) {// Estado: actualiza un valor usado por la interfaz.
      setError('El código debe tener al menos 4 dígitos.'); // Render: devuelve el resultado que consume React o la funcion llamadora.
      return;
    } // Estado: actualiza un valor usado por la interfaz.

    setLoading(true); // Estado: actualiza un valor usado por la interfaz.
    setError(''); // Control: intenta una operacion y maneja errores si falla.

    try {// Explica: define response para usarlo en este archivo.
      const response = await api.post(ENDPOINTS.VERIFY_CODE, { email, code: codigo }); // Estado: actualiza un valor usado por la interfaz.
      setLoading(false);
      // El backend devuelve { ok: true, message, resetToken }
      navigation.navigate('ResetPassword', { resetToken: response.resetToken, returnTo });} catch (err) {// Estado: actualiza un valor usado por la interfaz.
      setLoading(false); // Explica: define msg para usarlo en este archivo.
      const msg = err.response?.data?.message || 'El código ingresado no es válido. Revisá tu mail e intentá de nuevo.'; // Estado: actualiza un valor usado por la interfaz.
      setError(msg);
    }
  }; // Explica: define handleReenviar para usarlo en este archivo.

  const handleReenviar = async () => {// Estado: actualiza un valor usado por la interfaz.
    setReenviando(true); // Control: intenta una operacion y maneja errores si falla.
    try {// API: llama POST /api/auth/forgot-password para solicitar recuperacion de password.
      await api.post(ENDPOINTS.FORGOT_PASSWORD, { email }); // Estado: actualiza un valor usado por la interfaz.
      setReenviado(true); // Estado: actualiza un valor usado por la interfaz.
      setTimeout(() => setReenviado(false), 30000);
    } catch {} finally
    {// Estado: actualiza un valor usado por la interfaz.
      setReenviando(false);}}; // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (// UI: renderiza el componente View.
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.white }]}>

      {/* ── Btn volver ── */}
      <TouchableOpacity style={styles.backBtn}
      onPress={() => navigation.navigate(returnTo || 'Login')}>
        
        <Ionicons name="arrow-back" size={22} color={theme.primary} />
        <Text style={[styles.backText, { color: theme.primary }]}>{returnTo ? 'Volver' : 'Volver al login'}</Text>
      </TouchableOpacity>

      {/* ── Logo ── */}
      <View style={styles.logoContainer}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      </View>

      {/* ── Instrucción ── */}
      <Text style={[styles.instruccion, { color: theme.secondary }]}>
        Ingresá el código de verificación que recibiste por mail
      </Text>

      {/* ── Input código ── */}
      <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.secondary }, error ? [styles.inputError, { borderColor: theme.error }] : null]} value={codigo} onChangeText={(t) => {// Estado: actualiza un valor usado por la interfaz.
          setCodigo(t); // Estado: actualiza un valor usado por la interfaz.
          setError('');}} keyboardType="numeric" textAlign="center" maxLength={8} placeholder="- - - - - -" placeholderTextColor={theme.placeholder} />
      

      {error ? // UI: muestra texto visible en la pantalla.
      <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text> : null}

      {/* ── Btn Validar ── */}
      <TouchableOpacity style={[styles.btnValidar, { backgroundColor: theme.primary }, loading && styles.btnDisabled]} onPress={handleValidar}
        disabled={loading}
        activeOpacity={0.85}>
        
        {loading ? // UI: renderiza el componente ActivityIndicator.
        <ActivityIndicator color={theme.white} /> : // UI: muestra texto visible en la pantalla.
        <Text style={[styles.btnValidarText, { color: theme.white }]}>Validar</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={handleReenviar}
      disabled={reenviando || reenviado}
      style={{ marginTop: 16, alignItems: 'center' }}>
        
        <Text style={{ color: reenviado ? theme.placeholder : theme.primary, fontSize: 13, fontWeight: '600' }}>
          {reenviando ? 'Enviando...' : reenviado ? 'Código reenviado ✓' : 'Reenviar código'}
        </Text>
      </TouchableOpacity>

      {/* ── Spacer ── */}
      <View style={{ flex: 1 }} />

      {/* ── Texto al pie ── */}
      <Text style={[styles.footerText, { marginBottom: insets.bottom + 24, color: theme.placeholder }]}>
        Una vez validado el código, podrás reescribir tu contraseña
      </Text>

    </View>);} // Explica: define styles usando el resultado de StyleSheet.create.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    justifyContent: 'center'
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    paddingBottom: 4
  },
  backText: {
    color: '#8b0000',
    fontSize: 14,
    fontWeight: '600'
  },

  logoContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40
  },
  logo: {
    width: '90%',
    height: undefined,
    aspectRatio: 2.5
  },

  instruccion: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 26,
    marginBottom: 24
  },

  input: {
    height: 56,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 8,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent'
  },
  inputError: {
    borderColor: '#C62828'
  },
  errorText: {
    fontSize: 13,
    color: '#C62828',
    marginBottom: 16,
    textAlign: 'center'
  },

  btnValidar: {
    backgroundColor: '#8b0000',
    borderRadius: 10,
    height: 46,
    alignSelf: 'center',
    paddingHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginTop: 8
  },
  btnDisabled: { opacity: 0.7 },
  btnValidarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },

  footerText: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20
  }
});
