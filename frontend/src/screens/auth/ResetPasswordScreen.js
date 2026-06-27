/*
Intro: ResetPasswordScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/auth/ResetPasswordScreen.js.
Endpoints: RESET_PASSWORD (/api/auth/reset-password: guardar el nuevo password).
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useState } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert } from
'react-native'; // Explica: importa dependencias desde 'react-native-safe-area-context'.
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde 'react-hook-form'.
import { useForm, Controller } from 'react-hook-form'; // Explica: importa dependencias desde '../../constants/colors'.
import { COLORS, SPACING, RADIUS, FONTS } from '../../constants/colors'; // Explica: importa dependencias desde '../../services/api'.
import api from '../../services/api'; // Explica: importa dependencias desde '../../constants/api'.
import { ENDPOINTS } from '../../constants/api'; // Explica: importa dependencias desde '../../context/ThemeContext'.
import { useAppTheme } from '../../context/ThemeContext'; // Explica: define LOGO usando el resultado de require.

const LOGO = require('../../assets/images/banner_principal.jpeg'); // Explica: exporta este modulo para que otras partes de la app lo usen.

export default // Explica: declara la funcion ResetPasswordScreen que concentra una parte del flujo.
function ResetPasswordScreen({ navigation, route }) {// Explica: define insets usando el resultado de useSafeAreaInsets.
  const insets = useSafeAreaInsets(); // Explica: define objeto desestructurado usando el resultado de useAppTheme.
  const { theme } = useAppTheme(); // resetToken viene de VerifyCodeScreen, que lo recibió del backend
  // Explica: define resetToken para usarlo en este archivo.
  const resetToken = route?.params?.resetToken ?? ''; // Explica: define returnTo para usarlo en este archivo.
  const returnTo = route?.params?.returnTo; // Estado: crea el estado valores desestructurados y su actualizador.
  const [showPass1, setShowPass1] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [showPass2, setShowPass2] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [loading, setLoading] = useState(false); // Explica: define objeto desestructurado usando el resultado de useForm.

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: { nuevaPassword: '', confirmarPassword: '' }
  }); // Explica: define onSubmit para usarlo en este archivo.

  const onSubmit = async ({ nuevaPassword, confirmarPassword }) => {// Control: evalua una condicion para decidir el siguiente paso.
    if (nuevaPassword !== confirmarPassword) {// Explica: ejecuta Alert.alert como parte del flujo.
      Alert.alert('Error', 'Las contraseñas no coinciden.'); // Render: devuelve el resultado que consume React o la funcion llamadora.
      return;
    } // Estado: actualiza un valor usado por la interfaz.

    setLoading(true); // Control: intenta una operacion y maneja errores si falla.
    try {
      // El backend espera: { resetToken, newPassword, confirmPassword }
      // API: llama POST /api/auth/reset-password para guardar el nuevo password.
      await api.post(ENDPOINTS.RESET_PASSWORD, { resetToken,
          newPassword: nuevaPassword,
          confirmPassword: confirmarPassword
        }); // Estado: actualiza un valor usado por la interfaz.

      setLoading(false); // Explica: ejecuta Alert.alert como parte del flujo.
      Alert.alert(
        'Contraseña actualizada',
        returnTo ? 'Tu contraseña fue guardada correctamente.' : 'Tu contraseña fue guardada correctamente. Podés iniciar sesión.',
        [{ text: returnTo ? 'Volver' : 'Ir al login', onPress: () => navigation.navigate(returnTo || 'Login') }]
      );
    } catch (err) {// Estado: actualiza un valor usado por la interfaz.
      setLoading(false); // Explica: define msg para usarlo en este archivo.
      const msg = err.response?.data?.message || 'No se pudo actualizar la contraseña. Intentá de nuevo.'; // Explica: ejecuta Alert.alert como parte del flujo.
      Alert.alert('Error', msg);
    }
  }; // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (// UI: renderiza el componente KeyboardAvoidingView.
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}>
      
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.white }]}>

        {/* Volver */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate(returnTo || 'Login')}>
          
          <Ionicons name="arrow-back" size={22} color={theme.primary} />
          <Text style={[styles.backText, { color: theme.primary }]}>{returnTo ? 'Volver' : 'Volver al login'}</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </View>

          {/* Nueva contraseña */}
          <Text style={[styles.label, { color: theme.secondary }]}>Nueva Contraseña</Text>
          <View style={[styles.passwordWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Controller control={control} name="nuevaPassword" rules={{ required: 'La contraseña es obligatoria', minLength: { value: 6, message: 'Mínimo 6 caracteres' }
              }}
              render={({ field: { onChange, onBlur, value } }) => // UI: permite ingresar o editar texto.
              <TextInput
                style={[styles.passwordInput, { color: theme.secondary }]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry={!showPass1}
                autoCapitalize="none" />

              } />
            
            <TouchableOpacity onPress={() => setShowPass1(!showPass1)} style={styles.eyeBtn}>
              <Ionicons name={showPass1 ? 'eye-off-outline' : 'eye-outline'} size={22}
                color={theme.white} />
              
            </TouchableOpacity>
          </View>
          {errors.nuevaPassword && // UI: muestra texto visible en la pantalla.
          <Text style={[styles.fieldError, { color: theme.error }]}>{errors.nuevaPassword.message}</Text>
          }

          {/* Repetir contraseña */}
          <Text style={[styles.label, { color: theme.secondary }]}>Repita la Contraseña</Text>
          <View style={[styles.passwordWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Controller control={control} name="confirmarPassword" rules={{
                required: 'Confirmá tu contraseña',
                validate: (val) =>
                val === watch('nuevaPassword') || 'Las contraseñas no coinciden'
              }}
              render={({ field: { onChange, onBlur, value } }) => // UI: permite ingresar o editar texto.
              <TextInput
                style={[styles.passwordInput, { color: theme.secondary }]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry={!showPass2}
                autoCapitalize="none" />

              } />
            
            <TouchableOpacity onPress={() => setShowPass2(!showPass2)} style={styles.eyeBtn}>
              <Ionicons name={showPass2 ? 'eye-off-outline' : 'eye-outline'} size={22}
                color={theme.white} />
              
            </TouchableOpacity>
          </View>
          {errors.confirmarPassword && // UI: muestra texto visible en la pantalla.
          <Text style={[styles.fieldError, { color: theme.error }]}>{errors.confirmarPassword.message}</Text>
          }

          {/* Guardar */}
          <TouchableOpacity style={[styles.btnGuardar, { backgroundColor: theme.primary }, loading && styles.btnDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          activeOpacity={0.85}>
            
            {loading ? // UI: renderiza el componente ActivityIndicator.
            <ActivityIndicator color={theme.white} /> : // UI: muestra texto visible en la pantalla.
            <Text style={[styles.btnGuardarText, { color: theme.white }]}>Guardar</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>);

} // Explica: define styles usando el resultado de StyleSheet.create.

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 32,
    paddingTop: 12,
    paddingBottom: 4
  },
  backText: { color: '#8b0000', fontSize: 14, fontWeight: '600' },

  scroll: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 40
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 48
  },
  logo: { width: '90%', height: undefined, aspectRatio: 2.5 },

  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    marginBottom: 20
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.secondary
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 6
  },

  eyeBtn: { padding: 4 },

  fieldError: {
    fontSize: 12,
    color: '#C62828',
    marginTop: -14,
    marginBottom: 12
  },

  btnGuardar: {
    height: 50,
    backgroundColor: '#8b0000',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6
  },
  btnDisabled: { opacity: 0.6 },
  btnGuardarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});
