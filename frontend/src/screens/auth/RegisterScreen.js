import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';


import { COLORS, SPACING, RADIUS, FONTS } from '../../constants/colors';
import useRegisterStore from '../../store/registerStore';

// Logo de la app
const LOGO = require('../../assets/images/banner_principal.jpeg');

/**
 * RegisterScreen - Paso 1
 *
 * Pantalla de registro - Paso 1. Permite al usuario ingresar datos personales
 * (nombre, apellido, DNI, teléfono, email) antes de pasar al paso 2.
 *
 * Navegación disponible:
 *   - Login   → pantalla de inicio de sesión
 *   - Paso 2  → siguiente paso del registro
 */
export default function RegisterScreen({ navigation }) {
  // Estado para controlar la pestaña activa
  const [activeTab, setActiveTab] = useState('register');

  // Estado para visibilidad de passwords
  const [showPassword,  setShowPassword]  = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);

  // Store de registro
  const step1Data = useRegisterStore((state) => state.step1Data);
  const setStep1Data = useRegisterStore((state) => state.setStep1Data);

  // react-hook-form: control, errores y handleSubmit
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: step1Data,
  });

  // Cargar datos del store cuando la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      reset(step1Data);
    }, [step1Data, reset])
  );

  // Se ejecuta cuando el formulario es válido
  const onSubmit = async (data) => {
    // Guardar datos en el store (incluye password)
    setStep1Data(data);
    // Navegar al Paso 2
    navigation.navigate('RegisterStep2');
  };

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
        {/* Botón de volver */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('HomeUnauth')}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>

        {/* Logo + Título */}
        <View style={styles.headerContainer}>
          <Image source={LOGO} style={styles.logo} />
        </View>
        

        {/* Tabs: Iniciar sesión / Registrarse */}
        <View style={styles.tabContainer}>
          <View style={[styles.tabIndicator, activeTab === 'login' && styles.indicatorLeft, activeTab === 'register' && styles.indicatorRight]} />
          <TouchableOpacity 
            style={styles.tab}
            onPress={() => {
              setActiveTab('login');
              navigation.navigate('Login');
            }}
          >
            <Text style={styles.tabText}>Iniciar sesión</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.tab}
            onPress={() => setActiveTab('register')}
          >
            <Text style={styles.tabText}>Registrarse</Text>
          </TouchableOpacity>
        </View>

        {/* Indicador de pasos - CLICKEABLE */}
        <View style={styles.stepsContainer}>
          {/* Paso 1 (activo) */}
          <View style={styles.stepItem}>
            <Text style={[styles.stepText, styles.stepActive]}>Paso 1</Text>
            <View style={[styles.stepBar, styles.stepBarActive]} />
          </View>

          {/* Paso 2 - CLICKEABLE (inactivo) */}
          <TouchableOpacity 
            style={styles.stepItem}
            onPress={() => {
              handleSubmit((data) => {
                setStep1Data(data);
                navigation.navigate('RegisterStep2');
              })();
            }}
          >
            <Text style={styles.stepText}>Paso 2</Text>
            <View style={styles.stepBar} />
          </TouchableOpacity>
        </View>

        {/* Campo: Nombre */}
        <Text style={styles.label}>Nombre</Text>
        <Controller
          control={control}
          name="nombre"
          rules={{ required: 'El nombre es obligatorio' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.nombre && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder=""
              placeholderTextColor={COLORS.white}
            />
          )}
        />
        {errors.nombre && <Text style={styles.fieldError}>{errors.nombre.message}</Text>}

        {/* Campo: Apellido */}
        <Text style={styles.label}>Apellido</Text>
        <Controller
          control={control}
          name="apellido"
          rules={{ required: 'El apellido es obligatorio' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.apellido && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder=""
              placeholderTextColor={COLORS.white}
            />
          )}
        />
        {errors.apellido && <Text style={styles.fieldError}>{errors.apellido.message}</Text>}

        {/* Campo: DNI */}
        <Text style={styles.label}>DNI</Text>
        <Controller
          control={control}
          name="dni"
          rules={{ required: 'El DNI es obligatorio' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.dni && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder=""
              placeholderTextColor={COLORS.white}
              keyboardType="numeric"
            />
          )}
        />
        {errors.dni && <Text style={styles.fieldError}>{errors.dni.message}</Text>}

        {/* Campo: Teléfono */}
        <Text style={styles.label}>Teléfono</Text>
        <Controller
          control={control}
          name="telefono"
          rules={{ required: 'El teléfono es obligatorio' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.telefono && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder=""
              placeholderTextColor={COLORS.white}
              keyboardType="phone-pad"
            />
          )}
        />
        {errors.telefono && <Text style={styles.fieldError}>{errors.telefono.message}</Text>}

        {/* Campo: Email */}
        <Text style={styles.label}>Email</Text>
        <Controller
          control={control}
          name="email"
          rules={{ 
            required: 'El email es obligatorio',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'El email no es válido'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder=""
              placeholderTextColor={COLORS.white}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        />
        {errors.email && <Text style={styles.fieldError}>{errors.email.message}</Text>}

        {/* Campo: Contraseña */}
        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.passwordWrapper}>
          <Controller
            control={control}
            name="password"
            rules={{
              required: 'La contraseña es obligatoria',
              minLength: { value: 6, message: 'Mínimo 6 caracteres' },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.passwordInput}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder=""
                placeholderTextColor={COLORS.white}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            )}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.fieldError}>{errors.password.message}</Text>}

        {/* Campo: Confirmar Contraseña */}
        <Text style={styles.label}>Repetir Contraseña</Text>
        <View style={styles.passwordWrapper}>
          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              required: 'Confirmá tu contraseña',
              validate: (val) =>
                val === watch('password') || 'Las contraseñas no coinciden',
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.passwordInput}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder=""
                placeholderTextColor={COLORS.white}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
            )}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
            <Ionicons
              name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && <Text style={styles.fieldError}>{errors.confirmPassword.message}</Text>}

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Botón: Siguiente */}
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.nextButtonText}>Siguiente  »</Text>
        </TouchableOpacity>
      </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ─── Estilos ────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.white },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.lg,
  },

  // Logo + Título
  headerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logo: { width: '90%', height: undefined, aspectRatio: 2.5 },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  appSubtitle: {
    fontSize: 10,
    color: '#888888',
    letterSpacing: 1.2,
    marginTop: 2,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#757575',
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
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
  indicatorLeft: {
    width: '50%',
    left: 0,
  },
  indicatorRight: {
    width: '50%',
    left: '50%',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  tabText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.white,
    fontWeight: '600',
  },

  // Steps Indicator
  stepsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.xxl,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepText: {
    fontSize: FONTS.sizes.sm,
    color: '#AAAAAA',
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  stepActive: {
    color: '#9B1C1C',
  },
  stepBar: {
    width: '100%',
    height: 3,
    backgroundColor: '#CCCCCC',
    borderRadius: 1.5,
  },
  stepBarActive: {
    backgroundColor: '#9B1C1C',
  },

  // Labels
  label: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.lg,
  },

  // Inputs
  input: {
    height: 48,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.white,
    marginBottom: SPACING.lg,
  },
  inputError: { borderColor: COLORS.error },

  // Password wrapper (input + eye icon)
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
  passwordInput: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.white,
  },
  eyeBtn: { padding: 4 },

  fieldError: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.error,
    marginTop: -12,
    marginBottom: SPACING.md,
  },

  // Spacer
  spacer: {
    flex: 1,
  },

  // Next Button
  nextButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-end',
    marginTop: SPACING.lg,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  nextButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },

  // Back Button
  backButton: {
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

