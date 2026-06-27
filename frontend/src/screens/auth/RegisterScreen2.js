/*
Intro: RegisterScreen2 es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/auth/RegisterScreen2.js.
Endpoints: REGISTER (/api/auth/register: crear una cuenta nueva).
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useState, useEffect } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal } from
'react-native'; // Explica: importa dependencias desde '@react-navigation/native'.
import { useFocusEffect } from '@react-navigation/native'; // Explica: importa dependencias desde 'react-hook-form'.
import { useForm, Controller } from 'react-hook-form'; // Explica: importa dependencias desde 'expo-image-picker'.
import * as ImagePicker from 'expo-image-picker'; // Explica: importa dependencias desde '../../constants/colors'.

import { COLORS, SPACING, RADIUS, FONTS } from '../../constants/colors'; // Explica: importa dependencias desde '../../store/registerStore'.
import useRegisterStore from '../../store/registerStore'; // Explica: importa dependencias desde '../../services/api'.
import api from '../../services/api'; // Explica: importa dependencias desde '../../constants/api'.
import { ENDPOINTS } from '../../constants/api';

// Logo de la app
// Explica: define LOGO usando el resultado de require.
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
 */ // Explica: exporta este modulo para que otras partes de la app lo usen.
export default // Explica: declara la funcion RegisterScreen2 que concentra una parte del flujo.
function RegisterScreen2({ navigation, route }) {// Store de registro
  // Explica: define step1Data usando el resultado de useRegisterStore.
  const step1Data = useRegisterStore((state) => state.step1Data); // Explica: define step2Data usando el resultado de useRegisterStore.
  const step2Data = useRegisterStore((state) => state.step2Data); // Explica: define setStep2Data usando el resultado de useRegisterStore.
  const setStep2Data = useRegisterStore((state) => state.setStep2Data); // Explica: define fotos usando el resultado de useRegisterStore.
  const fotos = useRegisterStore((state) => state.fotos); // Explica: define setFotos usando el resultado de useRegisterStore.
  const setFotos = useRegisterStore((state) => state.setFotos); // Explica: define clearRegistration usando el resultado de useRegisterStore.
  const clearRegistration = useRegisterStore((state) => state.clearRegistration);
  // Estado para controlar la pestaña activa
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [activeTab, setActiveTab] = useState('register');
  // Estado para el modal de aviso post-registro
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [modalVisible, setModalVisible] = useState(false);
  // react-hook-form: control, errores y handleSubmit
  // Explica: define objeto desestructurado usando el resultado de useForm.
  const { control, handleSubmit, formState: { errors }, reset } = useForm({ defaultValues: step2Data });
  // Cargar datos del store cuando la pantalla recibe foco
  // Explica: ejecuta useFocusEffect como parte del flujo.
  useFocusEffect(React.useCallback(() => {// Explica: ejecuta reset como parte del flujo.
    reset(step2Data);
  }, [step2Data, reset])
  );

  // Se ejecuta cuando el formulario es válido
  // Explica: define onSubmit para usarlo en este archivo.
  const onSubmit = async (data) => {// Control: intenta una operacion y maneja errores si falla.
    try {// Estado: actualiza un valor usado por la interfaz.
      setStep2Data(data); // Explica: define foto1Base64 para usarlo en este archivo.
      const foto1Base64 = fotos.foto1?.base64 || null; // Explica: define foto2Base64 para usarlo en este archivo.
      const foto2Base64 = fotos.foto2?.base64 || null;

      // Armar payload con todos los campos
      // Explica: define payload para usarlo en este archivo.
      const payload = { ...step1Data,
        ...data,
        foto1Base64,
        foto2Base64
      }; // API: llama POST /api/auth/register para crear una cuenta nueva.

      await api.post(ENDPOINTS.REGISTER, payload); // Explica: ejecuta reset como parte del flujo.

      reset(); // Explica: ejecuta clearRegistration como parte del flujo.
      clearRegistration(); // Estado: actualiza un valor usado por la interfaz.
      setFotos({ foto1: null, foto2: null }); // Estado: actualiza un valor usado por la interfaz.
      setModalVisible(true);

    } catch (err) {// Explica: ejecuta Alert.alert como parte del flujo.
      Alert.alert(
        'Error',
        err.response?.data?.message || 'No se pudo completar el registro.'
      );
    }
  }; // Explica: define handleFotoPress para usarlo en este archivo.

  const handleFotoPress = async (fotoKey) => {// Explica: define objeto desestructurado para usarlo en este archivo.
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync(); // Control: evalua una condicion para decidir el siguiente paso.
    if (status !== 'granted') {// Explica: ejecuta Alert.alert como parte del flujo.
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería'); // Render: devuelve el resultado que consume React o la funcion llamadora.
      return;
    } // Explica: define result para usarlo en este archivo.

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true
    }); // Control: evalua una condicion para decidir el siguiente paso.

    if (!result.canceled && result.assets[0]) {// Estado: actualiza un valor usado por la interfaz.
      setFotos({ ...fotos, [fotoKey]: {
          uri: result.assets[0].uri,
          base64: result.assets[0].base64
        } });
    }
  }; // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (// UI: renderiza el componente KeyboardAvoidingView.
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'height' : 'height'}
      style={styles.flex}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          
        {/* Botón de volver */}
          <TouchableOpacity style={styles.backButton}
          onPress={() => navigation.navigate('HomeUnauth')}>
            
            <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>

        {/* Logo + Título */}
          <View style={styles.headerContainer}>
            <Image source={LOGO} style={styles.logo} />
        </View>

        {/* Tabs: Iniciar sesión / Registrarse */}
          <View style={styles.tabContainer}>
            <View style={[styles.tabIndicator, activeTab === 'login' && styles.indicatorLeft, activeTab === 'register' && styles.indicatorRight]} />
            <TouchableOpacity style={styles.tab} onPress={() => {// Estado: actualiza un valor usado por la interfaz.
                setActiveTab('login'); // Navegacion: cambia de pantalla o ajusta opciones de navegacion.
                navigation.navigate('Login');}}>
              <Text style={styles.tabText}>Iniciar sesión</Text>
          </TouchableOpacity>
            <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('register')}>
              <Text style={styles.tabText}>Registrarse</Text>
          </TouchableOpacity>
        </View>

        {/* Indicador de pasos - CLICKEABLE */}
          <View style={styles.stepsContainer}>
          {/* Paso 1 - CLICKEABLE (inactivo) */}
            <TouchableOpacity style={styles.stepItem} onPress={() => {// Explica: ejecuta una accion como parte del flujo.
                handleSubmit((data) => {// Estado: actualiza un valor usado por la interfaz.
                    setStep2Data(data); // Navegacion: cambia de pantalla o ajusta opciones de navegacion.
                    navigation.navigate('Register');})();}}>
              
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
            <TouchableOpacity style={styles.fotoBox} onPress={() => !fotos.foto1?.uri && handleFotoPress('foto1')}>
            {fotos.foto1?.uri ? <>
                <Image source={{ uri: fotos.foto1?.uri }} style={styles.fotoImage} />
                <TouchableOpacity style={styles.fotoDeleteBtn} onPress={() => setFotos({ ...fotos, foto1: null })}>
                  <Text style={styles.fotoDeleteText}>✕</Text>
                </TouchableOpacity>
              </> : // UI: muestra texto visible en la pantalla.
              <Text style={styles.fotoPlaceholder}>+</Text>}
          </TouchableOpacity>

            <TouchableOpacity style={styles.fotoBox} onPress={() => !fotos.foto2?.uri && handleFotoPress('foto2')}>
            {fotos.foto2?.uri ?
              <>
                <Image source={{ uri: fotos.foto2?.uri }} style={styles.fotoImage} />
                <TouchableOpacity style={styles.fotoDeleteBtn} onPress={() => setFotos({ ...fotos, foto2: null })}>
                  
                  <Text style={styles.fotoDeleteText}>✕</Text>
                </TouchableOpacity>
              </> : // UI: muestra texto visible en la pantalla.
              <Text style={styles.fotoPlaceholder}>+</Text>
              }
          </TouchableOpacity>
        </View>

        {/* Dirección + Número */}
          <View style={styles.rowContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dirección</Text>
              <Controller control={control} name="direccion" rules={{ required: 'La dirección es obligatoria' }} render={({ field: { onChange, onBlur, value } }) => // UI: permite ingresar o editar texto.
                <TextInput
                  style={[styles.input, errors.direccion && styles.inputError]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder=""
                  placeholderTextColor={COLORS.white} />

                } />
              
            {errors.direccion && // UI: muestra texto visible en la pantalla.
              <Text style={styles.fieldError}>{errors.direccion.message}</Text>}
          </View>

            <View style={styles.inputGroupSmall}>
              <Text style={styles.label}>Número</Text>
              <Controller control={control} name="numero" rules={{ required: 'El número es obligatorio' }} render={({ field: { onChange, onBlur, value } }) => // UI: permite ingresar o editar texto.
                <TextInput
                  style={[styles.input, errors.numero && styles.inputError]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder=""
                  placeholderTextColor={COLORS.white}
                  keyboardType="numeric" />

                } />
              
            {errors.numero && // UI: muestra texto visible en la pantalla.
              <Text style={styles.fieldError}>{errors.numero.message}</Text>}
          </View>
        </View>

        {/* País */}
          <Text style={styles.label}>País</Text>
          <Controller control={control} name="pais" rules={{ required: 'El país es obligatorio' }}
            render={({ field: { onChange, onBlur, value } }) => // UI: permite ingresar o editar texto.
            <TextInput
              style={[styles.input, errors.pais && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder=""
              placeholderTextColor={COLORS.white} />

            } />
          
        {errors.pais && // UI: muestra texto visible en la pantalla.
          <Text style={styles.fieldError}>{errors.pais.message}</Text>}

        {/* Ciudad */}
          <Text style={styles.label}>Ciudad</Text>
          <Controller control={control} name="ciudad" rules={{ required: 'La ciudad es obligatoria' }}
            render={({ field: { onChange, onBlur, value } }) => // UI: permite ingresar o editar texto.
            <TextInput
              style={[styles.input, errors.ciudad && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder=""
              placeholderTextColor={COLORS.white} />

            } />
          
        {errors.ciudad && // UI: muestra texto visible en la pantalla.
          <Text style={styles.fieldError}>{errors.ciudad.message}</Text>}

        {/* Código postal */}
          <Text style={styles.label}>Código postal</Text>
          <Controller control={control} name="codigoPostal" rules={{ required: 'El código postal es obligatorio' }}
            render={({ field: { onChange, onBlur, value } }) => // UI: permite ingresar o editar texto.
            <TextInput
              style={[styles.input, errors.codigoPostal && styles.inputError]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder=""
              placeholderTextColor={COLORS.white}
              keyboardType="numeric" />

            } />
          
        {errors.codigoPostal && // UI: muestra texto visible en la pantalla.
          <Text style={styles.fieldError}>{errors.codigoPostal.message}</Text>}

        {/* Spacer */}
          <View style={styles.spacer} />

        {/* Botón: Finalizar */}
          <TouchableOpacity style={styles.finalButton} onPress={handleSubmit(onSubmit)}>
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
              <TouchableOpacity style={styles.modalBtn} onPress={() => {// Estado: actualiza un valor usado por la interfaz.
                  setModalVisible(false); // Navegacion: cambia de pantalla o ajusta opciones de navegacion.
                  navigation.navigate('HomeUnauth');}}>
                <Text style={styles.modalBtnText}>Siguiente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>);} // ─── Estilos ────────────────────────────────────────────────────────────────
// Explica: define styles usando el resultado de StyleSheet.create.
const styles = StyleSheet.create({ flex: { flex: 1, backgroundColor: COLORS.white }, scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.xxl, paddingBottom: SPACING.lg
    },

    // Logo + Título
    headerContainer: {
      alignItems: 'center',
      marginBottom: SPACING.lg
    },
    logo: { width: '90%', height: undefined, aspectRatio: 2.5 },
    titleContainer: {
      alignItems: 'center',
      marginBottom: SPACING.xxl
    },
    appTitle: {
      fontSize: 26,
      fontWeight: '700',
      color: COLORS.secondary
    },
    appSubtitle: {
      fontSize: 10,
      color: '#888888',
      letterSpacing: 1.2,
      marginTop: 2
    },

    // Tabs
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: '#757575',
      borderRadius: RADIUS.md,
      marginBottom: SPACING.lg,
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
    indicatorLeft: {
      width: '50%',
      left: 0
    },
    indicatorRight: {
      width: '50%',
      left: '50%'
    },
    tab: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
      zIndex: 1
    },
    tabText: {
      fontSize: FONTS.sizes.md,
      color: COLORS.white,
      fontWeight: '600'
    },

    // Steps Indicator
    stepsContainer: {
      flexDirection: 'row',
      marginBottom: SPACING.xxl
    },
    stepItem: {
      flex: 1,
      alignItems: 'center'
    },
    stepText: {
      fontSize: FONTS.sizes.sm,
      color: '#AAAAAA',
      fontWeight: '700',
      marginBottom: SPACING.xs
    },
    stepActive: {
      color: '#9B1C1C'
    },
    stepBar: {
      width: '100%',
      height: 3,
      backgroundColor: '#CCCCCC',
      borderRadius: 1.5
    },
    stepBarActive: {
      backgroundColor: '#9B1C1C'
    },

    // Fotos
    label: {
      fontSize: FONTS.sizes.md,
      fontWeight: '600',
      color: COLORS.secondary,
      marginBottom: SPACING.xs,
      marginTop: SPACING.lg
    },

    fotosContainer: {
      flexDirection: 'row',
      marginBottom: SPACING.lg,
      gap: SPACING.md
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
      shadowRadius: 4
    },
    fotoImage: {
      width: '100%',
      height: '100%',
      borderRadius: RADIUS.md
    },
    fotoPlaceholder: {
      fontSize: 32,
      color: COLORS.white,
      fontWeight: '700'
    },
    fotoDeleteBtn: {
      position: 'absolute', top: 4, right: 4,
      backgroundColor: '#8b0000', borderRadius: 10,
      width: 22, height: 22,
      justifyContent: 'center', alignItems: 'center',
      zIndex: 10
    },
    fotoDeleteText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

    // Inputs row
    rowContainer: {
      flexDirection: 'row',
      gap: SPACING.md
    },
    inputGroup: {
      flex: 1.6
    },
    inputGroupSmall: {
      flex: 1
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
      marginBottom: SPACING.lg
    },
    inputError: { borderColor: COLORS.error },

    fieldError: {
      fontSize: FONTS.sizes.xs,
      color: COLORS.error,
      marginTop: -12,
      marginBottom: SPACING.md
    },

    // Spacer
    spacer: {
      flex: 1
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
      shadowRadius: 6
    },
    finalButtonText: {
      color: COLORS.white,
      fontSize: FONTS.sizes.md,
      fontWeight: '700'
    },

    // Back Button
    backButton: {
      marginBottom: SPACING.md,
      paddingVertical: SPACING.sm
    },
    backButtonText: {
      fontSize: FONTS.sizes.md,
      color: COLORS.primary,
      fontWeight: '600'
    },

    // Modal
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
    modalIcon: {
      marginBottom: 8,
      marginTop: 8
    },
    modalIconText: {
      fontSize: 40,
      color: '#1A1A1A'
    },
    modalTitulo: {
      fontSize: 20,
      fontWeight: '700',
      color: '#1A1A1A',
      marginBottom: 12
    },
    modalMensaje: {
      fontSize: 14,
      color: '#555555',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24
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
      shadowRadius: 6
    },
    modalBtnText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15
    }
  });
