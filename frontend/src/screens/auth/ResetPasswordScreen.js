import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { COLORS, SPACING, RADIUS, FONTS } from '../../constants/colors';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import { useAppTheme } from '../../context/ThemeContext';

const LOGO = require('../../assets/images/banner_principal.jpeg');

export default function ResetPasswordScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  // resetToken viene de VerifyCodeScreen, que lo recibió del backend
  const resetToken = route?.params?.resetToken ?? '';
  const returnTo = route?.params?.returnTo;

  const [showPass1,  setShowPass1]  = useState(false);
  const [showPass2,  setShowPass2]  = useState(false);
  const [loading,    setLoading]    = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { nuevaPassword: '', confirmarPassword: '' },
  });

  const onSubmit = async ({ nuevaPassword, confirmarPassword }) => {
    if (nuevaPassword !== confirmarPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      // El backend espera: { resetToken, newPassword, confirmPassword }
      await api.post(ENDPOINTS.RESET_PASSWORD, {
        resetToken,
        newPassword:     nuevaPassword,
        confirmPassword: confirmarPassword,
      });

      setLoading(false);
      Alert.alert(
        'Contraseña actualizada',
        returnTo ? 'Tu contraseña fue guardada correctamente.' : 'Tu contraseña fue guardada correctamente. Podés iniciar sesión.',
        [{ text: returnTo ? 'Volver' : 'Ir al login', onPress: () => navigation.navigate(returnTo || 'Login') }]
      );
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || 'No se pudo actualizar la contraseña. Intentá de nuevo.';
      Alert.alert('Error', msg);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.white }]}>

        {/* Volver */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate(returnTo || 'Login')}
        >
          <Ionicons name="arrow-back" size={22} color={theme.primary} />
          <Text style={[styles.backText, { color: theme.primary }]}>{returnTo ? 'Volver' : 'Volver al login'}</Text>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </View>

          {/* Nueva contraseña */}
          <Text style={[styles.label, { color: theme.secondary }]}>Nueva Contraseña</Text>
          <View style={[styles.passwordWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Controller
              control={control}
              name="nuevaPassword"
              rules={{
                required: 'La contraseña es obligatoria',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.passwordInput, { color: theme.secondary }]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry={!showPass1}
                  autoCapitalize="none"
                />
              )}
            />
            <TouchableOpacity onPress={() => setShowPass1(!showPass1)} style={styles.eyeBtn}>
              <Ionicons
                name={showPass1 ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={theme.white}
              />
            </TouchableOpacity>
          </View>
          {errors.nuevaPassword && (
            <Text style={[styles.fieldError, { color: theme.error }]}>{errors.nuevaPassword.message}</Text>
          )}

          {/* Repetir contraseña */}
          <Text style={[styles.label, { color: theme.secondary }]}>Repita la Contraseña</Text>
          <View style={[styles.passwordWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Controller
              control={control}
              name="confirmarPassword"
              rules={{
                required: 'Confirmá tu contraseña',
                validate: (val) =>
                  val === watch('nuevaPassword') || 'Las contraseñas no coinciden',
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.passwordInput, { color: theme.secondary }]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry={!showPass2}
                  autoCapitalize="none"
                />
              )}
            />
            <TouchableOpacity onPress={() => setShowPass2(!showPass2)} style={styles.eyeBtn}>
              <Ionicons
                name={showPass2 ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={theme.white}
              />
            </TouchableOpacity>
          </View>
          {errors.confirmarPassword && (
            <Text style={[styles.fieldError, { color: theme.error }]}>{errors.confirmarPassword.message}</Text>
          )}

          {/* Guardar */}
          <TouchableOpacity
            style={[styles.btnGuardar, { backgroundColor: theme.primary }, loading && styles.btnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={theme.white} />
              : <Text style={[styles.btnGuardarText, { color: theme.white }]}>Guardar</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 32,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backText: { color: '#8b0000', fontSize: 14, fontWeight: '600' },

  scroll: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 40,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
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
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.secondary,             
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,             
    marginBottom: 6,
  },
  
  eyeBtn: { padding: 4 },

  fieldError: {
    fontSize: 12,
    color: '#C62828',
    marginTop: -14,
    marginBottom: 12,
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
    shadowRadius: 6,
  },
  btnDisabled:    { opacity: 0.6 },
  btnGuardarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
