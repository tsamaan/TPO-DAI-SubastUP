/*
Intro: CargarProductoScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/auction/CargarProductoScreen.js.
Endpoints: PRODUCTS (/api/products: cargar un producto para subastar).
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useState, useRef } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image,
  Animated,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Alert } from
'react-native'; // Explica: importa dependencias desde 'react-native-safe-area-context'.
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde 'expo-document-picker'.
import * as DocumentPicker from 'expo-document-picker'; // Explica: importa dependencias desde 'expo-image-picker'.
import * as ImagePicker from 'expo-image-picker'; // Explica: importa dependencias desde '../../context/ThemeContext'.
import { useAppTheme } from '../../context/ThemeContext'; // Explica: importa dependencias desde '../../services/api'.
import api from '../../services/api'; // Explica: importa dependencias desde '../../constants/api'.
import { ENDPOINTS } from '../../constants/api'; // Explica: importa dependencias desde '../../utils/images'.
import { imagePayloadFromPicked, normalizePickedImage } from '../../utils/images'; // Explica: define objeto desestructurado usando el resultado de Dimensions.get.

const { width: SCREEN_WIDTH } = Dimensions.get('window'); // Explica: define MIN_IMAGES para usarlo en este archivo.
const MIN_IMAGES = 6; // mínimo requerido
// Explica: define THUMB_SIZE para usarlo en este archivo.
const THUMB_SIZE = (SCREEN_WIDTH - 48 - 8 * 2) / 3; // 3 por fila
// ─────────────────────────────────────────────
//  Indicador de pasos
// ─────────────────────────────────────────────
// Explica: declara la funcion StepIndicator que concentra una parte del flujo.
function StepIndicator({ currentStep }) {// Explica: define objeto desestructurado usando el resultado de useAppTheme.
  const { theme } = useAppTheme(); // Explica: define steps para usarlo en este archivo.
  const steps = [{ number: 1, label: 'DETALLES' },
  { number: 2, label: 'MEDIA' }]; // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (// UI: renderiza el componente View.
    <View style={indicator.row}>
      {steps.map((step, i) => {// Explica: define active para usarlo en este archivo.
        const active = currentStep === step.number; // Explica: define done para usarlo en este archivo.
        const done = currentStep > step.number; // Render: devuelve el resultado que consume React o la funcion llamadora.
        return (// UI: renderiza el componente componente.
          <React.Fragment key={step.number}>
            <View style={indicator.stepWrap}>
              <View style={[indicator.circle, active && indicator.circleActive, done && indicator.circleDone, (active || done) && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                {done ? // UI: renderiza el componente Ionicons.
                <Ionicons name="checkmark" size={18} color={theme.white} /> : // UI: muestra texto visible en la pantalla.
                <Text style={[indicator.circleText, (active || done) && indicator.circleTextActive, (active || done) && { color: theme.white }]}>
                      {step.number}
                    </Text>}
              </View>
              <Text style={[indicator.label, active && indicator.labelActive, active && { color: theme.primary }]}>
                {step.label}
              </Text>
            </View>
            {i < steps.length - 1 && // UI: renderiza el componente View.
            <View style={[indicator.line, done && indicator.lineDone, done && { backgroundColor: theme.primary }]} />}
          </React.Fragment>);
      })}
    </View>);

} // Explica: define indicator usando el resultado de StyleSheet.create.

const indicator = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  stepWrap: { alignItems: 'center' },
  circle: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#CCCCCC', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  circleActive: { backgroundColor: '#8b0000', borderColor: '#8b0000' },
  circleDone: { backgroundColor: '#8b0000', borderColor: '#8b0000' },
  circleText: { fontSize: 16, fontWeight: '700', color: '#AAAAAA' },
  circleTextActive: { color: '#FFFFFF' },
  label: { fontSize: 10, fontWeight: '700', color: '#AAAAAA', marginTop: 4 },
  labelActive: { color: '#8b0000' },
  line: { flex: 1, height: 2, backgroundColor: '#CCCCCC', marginHorizontal: 8, marginBottom: 18 },
  lineDone: { backgroundColor: '#8b0000' }
});

// ─────────────────────────────────────────────
//  Campo de texto reutilizable
// ─────────────────────────────────────────────
// Explica: declara la funcion Field que concentra una parte del flujo.
function Field({ label, value, onChangeText, multiline = false, placeholder = '' }) {// Explica: define objeto desestructurado usando el resultado de useAppTheme.
  const { theme } = useAppTheme(); // Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente View.
    <View style={field.wrap}>
      <Text style={[field.label, { color: theme.placeholder }]}>{label}</Text>
      <TextInput style={[field.input, multiline && field.inputMulti, { color: theme.secondary }]} value={value} onChangeText={onChangeText}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        placeholder={placeholder}
        placeholderTextColor="#C0B0A8"
        autoCapitalize="sentences" />
      
    </View>);

} // Explica: define field usando el resultado de StyleSheet.create.

const field = StyleSheet.create({
  wrap: { marginBottom: 20 },
  label: { fontSize: 13, color: '#888888', marginBottom: 6 },
  input: { height: 48, borderWidth: 1, borderColor: '#E0D0C8', borderRadius: 10, paddingHorizontal: 12, fontSize: 14, color: '#1A1A1A', backgroundColor: '#FAFAFA' },
  inputMulti: { height: 100, paddingTop: 10, paddingBottom: 10 }
});

// ─────────────────────────────────────────────
//  Pantalla principal
// ─────────────────────────────────────────────
// Explica: exporta este modulo para que otras partes de la app lo usen.
export default // Explica: declara la funcion CargarBienScreen que concentra una parte del flujo.
function CargarBienScreen({ navigation }) {// Explica: define objeto desestructurado usando el resultado de useAppTheme.
  const { theme, isDark } = useAppTheme(); // Explica: define insets usando el resultado de useSafeAreaInsets.
  const insets = useSafeAreaInsets(); // Estado: crea el estado valores desestructurados y su actualizador.
  const [step, setStep] = useState(1);
  // Paso 1
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [nombre, setNombre] = useState(''); // Estado: crea el estado valores desestructurados y su actualizador.
  const [descripcion, setDescripcion] = useState(''); // Estado: crea el estado valores desestructurados y su actualizador.
  const [pdfFile, setPdfFile] = useState(null); // { name, uri, size }
  // Paso 2
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [images, setImages] = useState([]); // array de { uri, base64 }
  // Modal
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [modalVisible, setModalVisible] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [submitting, setSubmitting] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [submitError, setSubmitError] = useState(null); // null = éxito
  // Explica: define modalScale para usarlo en este archivo.
  const modalScale = useRef(new Animated.Value(0.8)).current; // Explica: define modalOpacity para usarlo en este archivo.
  const modalOpacity = useRef(new Animated.Value(0)).current; // ── Navegación entre pasos ───────────────────
  // Explica: define goToStep2 para usarlo en este archivo.
  const goToStep2 = () => setStep(2); // Explica: define goToStep1 para usarlo en este archivo.
  const goToStep1 = () => setStep(1);
  // ── Reset completo del formulario ────────────
  // Explica: define resetForm para usarlo en este archivo.
  const resetForm = () => {// Estado: actualiza un valor usado por la interfaz.
    setStep(1); // Estado: actualiza un valor usado por la interfaz.
    setNombre(''); // Estado: actualiza un valor usado por la interfaz.
    setDescripcion(''); // Estado: actualiza un valor usado por la interfaz.
    setPdfFile(null); // Estado: actualiza un valor usado por la interfaz.
    setImages([]);};

  // ── Modal ────────────────────────────────────
  // Explica: define openModal para usarlo en este archivo.
  const openModal = () => {// Estado: actualiza un valor usado por la interfaz.
    setModalVisible(true); // Explica: ejecuta start como parte del flujo.
    Animated.parallel([Animated.spring(modalScale, { toValue: 1, useNativeDriver: true, bounciness: 6, speed: 14 }),
      Animated.timing(modalOpacity, { toValue: 1, duration: 250, useNativeDriver: true })]
    ).start();
  };

  // Cierra modal: solo navega/resetea si fue exitoso
  // Explica: define closeModal para usarlo en este archivo.
  const closeModal = () => {// Explica: ejecuta start como parte del flujo.
    Animated.parallel([Animated.timing(modalScale, { toValue: 0.8, duration: 200, useNativeDriver: true }),
      Animated.timing(modalOpacity, { toValue: 0, duration: 200, useNativeDriver: true })]
    ).start(() => {// Estado: actualiza un valor usado por la interfaz.
      setModalVisible(false); // Control: evalua una condicion para decidir el siguiente paso.
      if (!submitError) {// Explica: ejecuta resetForm como parte del flujo.
        resetForm();
        navigation?.navigate('Main');
      }
    });
  };

  // Envío real con try-catch
  // Explica: define handleFinalize para usarlo en este archivo.
  const handleFinalize = async () => {// Control: evalua una condicion para decidir el siguiente paso.
    if (submitting) // Render: devuelve el resultado que consume React o la funcion llamadora.
      return; // Estado: actualiza un valor usado por la interfaz.
    setSubmitting(true); // Estado: actualiza un valor usado por la interfaz.
    setSubmitError(null); // Control: intenta una operacion y maneja errores si falla.
    try {// ── CONEXIÓN BACKEND — crear producto ────────────────────────────
      // POST /api/products
      // El backend espera: { nombre, descripcionCompleta, fotos: [{ base64, mimeType }] }
      // Nota: El PDF de ficha técnica aún no es procesado por el backend en esta versión,
      // pero lo dejamos preparado en el frontend.
      // Explica: define payload para usarlo en este archivo.
      const payload = { nombre: nombre, descripcionCompleta: descripcion,
        fotos: images.map(imagePayloadFromPicked).filter((img) => img.base64)
      }; // API: llama POST /api/products para cargar un producto para subastar.

      await api.post(ENDPOINTS.PRODUCTS, payload);
      // ─────────────────────────────────────────────────────────────────
      // Estado: actualiza un valor usado por la interfaz.
      setSubmitError(null);
    } catch (e) {// Explica: define msg para usarlo en este archivo.
      const msg = e?.response?.data?.message || e?.message || 'Ocurrió un error inesperado.'; // Estado: actualiza un valor usado por la interfaz.
      setSubmitError(msg);
    } finally {// Estado: actualiza un valor usado por la interfaz.
      setSubmitting(false); // Explica: ejecuta openModal como parte del flujo.
      openModal();
    }
  };

  // ── PDF picker ───────────────────────────────
  // Explica: define handlePickPdf para usarlo en este archivo.
  const handlePickPdf = async () => {// Control: intenta una operacion y maneja errores si falla.
    try {// Explica: define result para usarlo en este archivo.
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf',
          copyToCacheDirectory: true
        }); // Control: evalua una condicion para decidir el siguiente paso.
      if (!result.canceled && result.assets?.length > 0) {// Explica: define file para usarlo en este archivo.
        const file = result.assets[0]; // Estado: actualiza un valor usado por la interfaz.
        setPdfFile({ name: file.name, uri: file.uri, size: file.size });
      }
    } catch (e) {// Explica: ejecuta Alert.alert como parte del flujo.
      Alert.alert('Error', 'No se pudo abrir el selector de archivos.');
    }
  }; // Explica: define handleRemovePdf para usarlo en este archivo.

  const handleRemovePdf = () => setPdfFile(null);

  // ── Image picker ─────────────────────────────
  // Explica: define handleAddImage para usarlo en este archivo.
  const handleAddImage = async () => {// Explica: define objeto desestructurado para usarlo en este archivo.
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync(); // Control: evalua una condicion para decidir el siguiente paso.
    if (status !== 'granted') {// Explica: ejecuta Alert.alert como parte del flujo.
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir fotos.'); // Render: devuelve el resultado que consume React o la funcion llamadora.
      return;} // Explica: define result para usarlo en este archivo.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.65,
      base64: true
    }); // Control: evalua una condicion para decidir el siguiente paso.
    if (!result.canceled && result.assets?.length > 0) {// Estado: actualiza un valor usado por la interfaz.
      setImages((prev) => [...prev, ...result.assets.map(normalizePickedImage)]);
    }
  }; // Explica: define handleRemoveImage para usarlo en este archivo.

  const handleRemoveImage = (index) => {// Estado: actualiza un valor usado por la interfaz.
    setImages((prev) => prev.filter((_, i) => i !== index));
  }; // Explica: define canFinalize para usarlo en este archivo.

  const canFinalize = images.length >= MIN_IMAGES; // Explica: define formatSize para usarlo en este archivo.

  const formatSize = (bytes) => {// Control: evalua una condicion para decidir el siguiente paso.
    if (!bytes) // Render: devuelve el resultado que consume React o la funcion llamadora.
      return ''; // Render: devuelve el resultado que consume React o la funcion llamadora.
    return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` :
    `${(bytes / 1024).toFixed(0)} KB`;
  };

  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────
  // Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente View.
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.white }]}>

      {/* ── Top Bar ─────────────────────────────── */}
      <View style={[styles.topBar, { backgroundColor: theme.white }]}>
        <TouchableOpacity style={styles.backBtn} onPress={step === 2 ? goToStep1 : () => navigation?.goBack()}>
          <Ionicons name="chevron-back" size={26} color={theme.secondary} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: theme.secondary }]}>Cargar Bien</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        <StepIndicator currentStep={step} />

        {/* ══════════════════════════════════════════
             PASO 1 — Detalles
          ══════════════════════════════════════════ */}
        {step === 1 && // UI: renderiza el componente View.
        <View>
          <Text style={[styles.sectionTitle, { color: theme.secondary }]}>Informacion del lote</Text>

            {/* Nombre */}
          <Field label="Nombre del producto" value={nombre} onChangeText={setNombre}
            placeholder="Ej: Mesa de madera vintage" />
          

            {/* Descripción breve */}
          <Field label="Descripcion breve"
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          placeholder="Resumí el bien en pocas líneas..." />
          

            {/* ── Carga de PDF ── */}
          <Text style={[styles.fieldLabel, { color: theme.placeholder }]}>Ficha técnica del bien (PDF)</Text>

            {!pdfFile ? // UI: renderiza un control presionable para el usuario.
          <TouchableOpacity style={styles.pdfUploadZone} onPress={handlePickPdf} activeOpacity={0.8}>
            <View style={styles.pdfIconWrap}>
              <Ionicons name="document-attach-outline" size={28} color={theme.primary} />
                </View>
            <Text style={[styles.pdfUploadTitle, { color: theme.secondary }]}>Adjuntar archivo PDF</Text>
            <Text style={styles.pdfUploadSub}>Tocá para seleccionar desde tu dispositivo</Text>
              </TouchableOpacity> : // UI: renderiza el componente View.
          <View style={styles.pdfFileCard}>
            <View style={styles.pdfFileIconWrap}>
              <Ionicons name="document-text" size={26} color={theme.primary} />
                </View>
            <View style={styles.pdfFileInfo}>
              <Text style={[styles.pdfFileName, { color: theme.secondary }]} numberOfLines={1}>{pdfFile.name}</Text>
                  {pdfFile.size ? // UI: muestra texto visible en la pantalla.
              <Text style={styles.pdfFileSize}>{formatSize(pdfFile.size)}</Text> : null}
                </View>
            <TouchableOpacity onPress={handleRemovePdf} style={styles.pdfRemoveBtn}>
              <Ionicons name="close-circle" size={22} color="#C08080" />
                </TouchableOpacity>
              </View>}

            {/* Nota informativa sobre el PDF */}
          <View style={styles.pdfHintBox}>
            <Ionicons name="information-circle-outline" size={16} color={theme.primary} style={{ marginTop: 1 }} />
            <Text style={styles.pdfHintText}>
                El PDF debe incluir: descripción detallada del bien, estado de conservación, dimensiones o peso, documentación de origen o autenticidad, y cualquier dato relevante para los postores. Máximo recomendado: 10 MB.
              </Text>
            </View>

            {/* Botón Siguiente */}
          <TouchableOpacity style={[styles.btnPrimary, styles.btnRight, { backgroundColor: theme.primary }]} onPress={goToStep2} activeOpacity={0.85}>
            <Text style={[styles.btnPrimaryText, { color: theme.white }]}>Siguiente  »</Text>
            </TouchableOpacity>
          </View>}

        {/* ══════════════════════════════════════════
             PASO 2 — Media
          ══════════════════════════════════════════ */}
        {step === 2 && // UI: renderiza el componente View.
        <View>
            {/* Título + contador */}
          <View style={styles.mediaTitleRow}>
            <Text style={[styles.sectionTitle, { color: theme.secondary }]}>Galeria de Imagenes</Text>
            <View style={[styles.counterPill, canFinalize && styles.counterPillOk]}>
              <Text style={[styles.counterText, canFinalize && styles.counterTextOk]}>
                  {images.length} / mín. {MIN_IMAGES}
                </Text>
              </View>
            </View>

            {/* Zona de carga */}
          <TouchableOpacity style={styles.uploadZone} onPress={handleAddImage} activeOpacity={0.8}>
            <View style={styles.cameraIconWrap}>
              <Ionicons name="camera-outline" size={30} color={theme.primary} />
              </View>
            <Text style={[styles.uploadTitle, { color: theme.secondary }]}>Subir fotos del bien</Text>
            <Text style={styles.uploadSub}>
                Mínimo {MIN_IMAGES} fotos · Sin límite máximo
              </Text>
            <View style={[styles.btnPrimary, { backgroundColor: theme.primary }]}>
              <Text style={[styles.btnPrimaryText, { color: theme.white }]}>Agregar imágenes</Text>
              </View>
            </TouchableOpacity>

            {/* Grid de miniaturas */}
            {images.length > 0 && // UI: renderiza el componente View.
          <View style={styles.thumbGrid}>
                {images.map((img, i) => // UI: renderiza el componente View.
              <View key={i} style={styles.thumbSlot}>
                <Image source={{ uri: img.uri }} style={styles.thumbImage} />
                <TouchableOpacity style={styles.thumbRemove} onPress={() => handleRemoveImage(i)}>
                  <Ionicons name="close-circle" size={20} color={theme.primary} />
                    </TouchableOpacity>
                  </View>)}
              </View>}

            {/* Aviso si no se llegó al mínimo */}
            {!canFinalize && // UI: renderiza el componente View.
          <View style={styles.warnBox}>
            <Ionicons name="alert-circle-outline" size={16} color={theme.primary} style={{ marginTop: 1 }} />
            <Text style={styles.warnText}>
                  Necesitás al menos {MIN_IMAGES} fotos para publicar. Llevás {images.length}.
                </Text>
              </View>}

            {/* Botón Finalizar */}
          <TouchableOpacity style={[styles.btnPrimary, styles.btnRight, { marginTop: 16, backgroundColor: theme.primary }, (!canFinalize || submitting) && styles.btnDisabled]} onPress={canFinalize && !submitting ? handleFinalize : null} activeOpacity={canFinalize && !submitting ? 0.85 : 1}>
            <Text style={[styles.btnPrimaryText, { color: theme.white }]}>
                {submitting ? 'Enviando...' : 'Finalizar'}
              </Text>
            </TouchableOpacity>
          </View>}
      </ScrollView>

      {/* ══════════════════════════════════════════
           MODAL — Guardado y finalizado
        ══════════════════════════════════════════ */}
      <Modal transparent visible={modalVisible} animationType="none" onRequestClose={closeModal}>
        
        <TouchableWithoutFeedback onPress={submitError ? closeModal : undefined}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.modalCard, { opacity: modalOpacity, transform: [{ scale: modalScale }] }]}>
                
                {submitError ?
                // ── ERROR ──
                <>
                  <View style={[styles.checkCircle, { backgroundColor: '#C0392B' }]}>
                    <Ionicons name="close" size={28} color={theme.white} />
                    </View>
                  <Text style={[styles.modalTitle, { color: theme.secondary }]}>Error al enviar</Text>
                  <Text style={[styles.modalMessage, { color: theme.placeholder }]}>{submitError}</Text>
                  <TouchableOpacity style={[styles.btnPrimary, { marginTop: 24, alignSelf: 'stretch', backgroundColor: '#C0392B' }]} onPress={closeModal} activeOpacity={0.85}>
                    <Text style={[styles.btnPrimaryText, { textAlign: 'center', color: theme.white }]}>
                        Cerrar y reintentar
                      </Text>
                    </TouchableOpacity>
                  </> : // ── ÉXITO ──
                <>
                  <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                    <Ionicons name="checkmark" size={28} color={theme.white} />
                    </View>
                  <Text style={[styles.modalTitle, { color: theme.secondary }]}>Guardado y finalizado</Text>
                  <Text style={[styles.modalMessage, { color: theme.placeholder }]}>
                      Tu producto fue enviado correctamente y ya está en revisión, te contactaremos pronto.
                    </Text>
                  <TouchableOpacity style={[styles.btnPrimary, { marginTop: 24, alignSelf: 'stretch', backgroundColor: theme.primary }]} onPress={closeModal} activeOpacity={0.85}>
                    <Text style={[styles.btnPrimaryText, { textAlign: 'center', color: theme.white }]}>
                        Ir al inicio
                      </Text>
                    </TouchableOpacity>
                  </>}
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>);
}

// ─────────────────────────────────────────────
//  Estilos
// ─────────────────────────────────────────────
// Explica: define styles usando el resultado de StyleSheet.create.
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#FFFFFF' },

    topBar: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4
    },
    backBtn: { padding: 4 },
    topBarTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 24 },

    sectionTitle: {
      fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 24
    },

    fieldLabel: {
      fontSize: 13, color: '#888888', marginBottom: 8
    },

    // ── PDF ─────────────────────────────────────
    pdfUploadZone: {
      borderWidth: 1.5,
      borderColor: '#E0D0C8',
      borderStyle: 'dashed',
      borderRadius: 14,
      paddingVertical: 28,
      paddingHorizontal: 20,
      alignItems: 'center',
      backgroundColor: '#FDFAF8',
      gap: 8,
      marginBottom: 12
    },
    pdfIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: '#FFE8D6',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4
    },
    pdfUploadTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
    pdfUploadSub: { fontSize: 12, color: '#A09088', textAlign: 'center' },

    pdfFileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF5EC',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#F0D8C8',
      padding: 14,
      gap: 12,
      marginBottom: 12
    },
    pdfFileIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: '#FFE8D6',
      alignItems: 'center',
      justifyContent: 'center'
    },
    pdfFileInfo: { flex: 1 },
    pdfFileName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
    pdfFileSize: { fontSize: 11, color: '#A09088', marginTop: 2 },
    pdfRemoveBtn: { padding: 4 },

    pdfHintBox: {
      flexDirection: 'row',
      gap: 8,
      backgroundColor: '#FFF5EC',
      borderRadius: 10,
      borderLeftWidth: 3,
      borderLeftColor: '#8b0000',
      padding: 12,
      marginBottom: 28
    },
    pdfHintText: {
      flex: 1,
      fontSize: 12,
      color: '#6B4A3A',
      lineHeight: 18
    },

    // ── Botones ──────────────────────────────────
    btnPrimary: {
      backgroundColor: '#8b0000',
      borderRadius: 10,
      paddingHorizontal: 24,
      paddingVertical: 14,
      elevation: 4,
      shadowColor: '#8b0000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6
    },
    btnPrimaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    btnRight: { alignSelf: 'flex-end', marginTop: 8 },
    btnDisabled: { backgroundColor: '#C8A8A8', shadowOpacity: 0, elevation: 0 },

    // ── Paso 2: Media ────────────────────────────
    mediaTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20
    },
    counterPill: {
      backgroundColor: '#F5E8DC',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: '#E0D0C8',
      marginBottom: 24
    },
    counterPillOk: { backgroundColor: '#F0FFE8', borderColor: '#8b0000' },
    counterText: { fontSize: 11, fontWeight: '700', color: '#A09088' },
    counterTextOk: { color: '#8b0000' },

    uploadZone: {
      borderWidth: 1.5,
      borderColor: '#E0D0C8',
      borderStyle: 'dashed',
      borderRadius: 14,
      padding: 32,
      alignItems: 'center',
      backgroundColor: '#FDFAF8',
      marginBottom: 24,
      gap: 10
    },
    cameraIconWrap: {
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: '#FFE8D6',
      alignItems: 'center', justifyContent: 'center'
    },
    uploadTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
    uploadSub: { fontSize: 12, color: '#A09088', marginBottom: 6 },

    // Grid 3 columnas
    thumbGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8
    },
    thumbSlot: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: 10,
      overflow: 'hidden',
      position: 'relative'
    },
    thumbImage: {
      width: '100%', height: '100%', resizeMode: 'cover'
    },
    thumbRemove: {
      position: 'absolute', top: 4, right: 4,
      backgroundColor: 'rgba(255,255,255,0.85)',
      borderRadius: 10
    },

    warnBox: {
      flexDirection: 'row',
      gap: 8,
      backgroundColor: '#FFF5EC',
      borderRadius: 10,
      borderLeftWidth: 3,
      borderLeftColor: '#8b0000',
      padding: 12,
      marginTop: 4
    },
    warnText: {
      flex: 1, fontSize: 12, color: '#6B4A3A', lineHeight: 18
    },

    // ── Modal ────────────────────────────────────
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32
    },
    modalCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      paddingHorizontal: 28,
      paddingTop: 32,
      paddingBottom: 28,
      alignItems: 'center',
      width: '100%',
      elevation: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 20
    },
    checkCircle: {
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: '#8b0000',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 16
    },
    modalTitle: {
      fontSize: 18, fontWeight: '700', color: '#1A1A1A',
      textAlign: 'center', marginBottom: 12
    },
    modalMessage: {
      fontSize: 13, color: '#888888', textAlign: 'center', lineHeight: 20
    }
  });
