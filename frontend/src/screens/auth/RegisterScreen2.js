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
  Alert,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';

import { COLORS, SPACING, RADIUS, FONTS } from '../../constants/colors';
import useRegisterStore from '../../store/registerStore';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';

// Logo de la app
const LOGO = require('../../assets/images/banner_principal.jpeg');

/**
 * RegisterScreen2 - Paso 2
 *
 * Pantalla de registro - Paso 2. Permite al usuario ingresar datos de domicilio,
 * cargar fotos y completar el registro.
 *
 * Recibe los datos del Paso 1 como parámetros de ruta.
 *
 * Navegación disponible:
 *   - Login    → pantalla de inicio de sesión
 *   - Register → volver al paso 1
 */
export default function RegisterScreen2({ navigation, route }) {
  // Store de registro
  const step1Data = useRegisterStore((state) => state.step1Data);
  const step2Data = useRegisterStore((state) => state.step2Data);
  const setStep2Data = useRegisterStore((state) => state.setStep2Data);
  const fotos = useRegisterStore((state) => state.fotos);
  const setFotos = useRegisterStore((state) => state.setFotos);
  const clearRegistration = useRegisterStore((state) => state.clearRegistration);

  // Estado para controlar la pestaña activa
  const [activeTab, setActiveTab] = useState('register');

  // Estado para el modal de aviso post-registro
  const [modalVisible, setModalVisible] = useState(false);

  // react-hook-form: control, errores y handleSubmit
  const { control, handleSubmit, formState: { errors }, reset,} = useForm({defaultValues: step2Data,});

  // Cargar datos del store cuando la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      reset(step2Data);
    }, [step2Data, reset])
  );

  // Se ejecuta cuando el formulario es válido
  const onSubmit = async (data) => {
    try {
      setStep2Data(data);

      const foto1Base64 = fotos.foto1?.base64 || null;
      const foto2Base64 = fotos.foto2?.base64 || null;

      // Armar payload con todos los campos
      const payload = {
        ...step1Data,
        ...data,
        foto1Base64,
        foto2Base64,
      };

      await api.post(ENDPOINTS.REGISTER, payload);

      reset();
      clearRegistration();
      setFotos({ foto1: null, foto2: null });
      setModalVisible(true);

    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'No se pudo completar el registro.'
      );
    }
  };

  const handleFotoPress = async (fotoKey) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setFotos({ ...fotos, [fotoKey]: {
        uri: result.assets[0].uri,
        base64: result.assets[0].base64,
      }});
    }
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
          {/* Paso 1 - CLICKEABLE (inactivo) */}
          <TouchableOpacity 
            style={styles.stepItem}
            onPress={() => {
              handleSubmit((data) => {
                setStep2Data(data);
                navigation.navigate('Register');
              })();
            }}
          >
            <Text style={styles.stepText}>Paso 1</Text>
            <View style={styles.stepBar} />
          </TouchableOpacity>

          {/* Paso 2 (activo) */}
          <View style={styles.stepItem}>
            <Text style={[styles.stepText, styles.stepActive]}>Paso 2</Text>
            <View style={[styles.stepBar, styles.stepBarActive]} />
          </View>
        </View>

        {/* Cargar fotos */}
        <Text style={styles.label}>Cargar fotos</Text>
        <View style={styles.fotosContainer}>
          <TouchableOpacity
            style={styles.fotoBox}
            onPress={() => !fotos.foto1?.uri && handleFotoPress('foto1')}
          >
            {fotos.foto1?.uri ? (
              <>
                <Image source={{ uri: fotos.foto1?.uri }} style={styles.fotoImage} />
                <TouchableOpacity
                  style={styles.fotoDeleteBtn}
                  onPress={() => setFotos({ ...fotos, foto1: null })}
                >
                  <Text style={styles.fotoDeleteText}>✕</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.fotoPlaceholder}>+</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fotoBox}
            onPress={() => !fotos.foto2?.uri && handleFotoPress('foto2')}
          >
            {fotos.foto2?.uri ? (
              <>
                <Image source={{ uri: fotos.foto2?.uri }} style={styles.fotoImage} />
                <TouchableOpacity
                  style={styles.fotoDeleteBtn}
                  onPress={() => setFotos({ ...fotos, foto2: null })}
                >
                  <Text style={styles.fotoDeleteText}>✕</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.fotoPlaceholder}>+</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Dirección + Número */}
        <View style={styles.rowContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dirección</Text>
            <Controller
              control={control}
              name="direccion"
              rules={{ required: 'La dirección es obligatoria' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.direccion && styles.inputError]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder=""
                  placeholderTextColor={COLORS.white}
                />
              )}
            />
            {errors.direccion && <Text style={styles.fieldError}>{errors.direccion.message}</Text>}
          </View>

          <View style={styles.inputGroupSmall}>
            <Text style={styles.label}>Número</Text>
            <Controller
              control={control}
              name="numero"
              rules={{ required: 'El número es obligatorio' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.numero && styles.inputError]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder=""
                  placeholderTextColor={COLORS.white}
                  keyboardType="numeric"
                />
              )}
            />
            {errors.numero && <Text style={styles.fieldError}>{errors.numero.message}</Text>}
          </View>
        </View>

        {/* País */}
        <Text style={styles.label}>País</Text>
        <Controller
          control={control}
          name="pais"
          rules={{ required: 'El país es obligatorio' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.pais && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder=""
              placeholderTextColor={COLORS.white}
            />
          )}
        />
        {errors.pais && <Text style={styles.fieldError}>{errors.pais.message}</Text>}

        {/* Ciudad */}
        <Text style={styles.label}>Ciudad</Text>
        <Controller
          control={control}
          name="ciudad"
          rules={{ required: 'La ciudad es obligatoria' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.ciudad && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder=""
              placeholderTextColor={COLORS.white}
            />
          )}
        />
        {errors.ciudad && <Text style={styles.fieldError}>{errors.ciudad.message}</Text>}

        {/* Código postal */}
        <Text style={styles.label}>Código postal</Text>
        <Controller
          control={control}
          name="codigoPostal"
          rules={{ required: 'El código postal es obligatorio' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.codigoPostal && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder=""
              placeholderTextColor={COLORS.white}
              keyboardType="numeric"
            />
          )}
        />
        {errors.codigoPostal && <Text style={styles.fieldError}>{errors.codigoPostal.message}</Text>}

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Botón: Finalizar */}
        <TouchableOpacity 
          style={styles.finalButton}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.finalButtonText}>Finalizar</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.modalIcon}>
              <Text style={styles.modalIconText}>ⓘ</Text>
            </View>
            <Text style={styles.modalTitulo}>Aviso</Text>
            <Text style={styles.modalMensaje}>
              Tu registro fue enviado correctamente. Un administrador revisará tus datos y habilitará tu cuenta.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => { setModalVisible(false); navigation.navigate('HomeUnauth'); }}
            >
              <Text style={styles.modalBtnText}>Siguiente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────

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

  // Fotos
  label: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.lg,
  },

  fotosContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  fotoBox: {
    flex: 1,
    height: 80,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fotoImage: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.md,
  },
  fotoPlaceholder: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: '700',
  },
  fotoDeleteBtn: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: '#8b0000', borderRadius: 10,
    width: 22, height: 22,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 10,
  },
  fotoDeleteText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  // Inputs row
  rowContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  inputGroup: {
    flex: 1.6,
  },
  inputGroupSmall: {
    flex: 1,
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

  // Final Button
  finalButton: {
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
  finalButtonText: {
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
    shadowRadius: 8,
  },
  modalClose: {
    position: 'absolute',
    top: 14,
    right: 16,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#555555',
  },
  modalIcon: {
    marginBottom: 8,
    marginTop: 8,
  },
  modalIconText: {
    fontSize: 40,
    color: '#1A1A1A',
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  modalMensaje: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalBtn: {
    backgroundColor: '#8b0000',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 40,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
