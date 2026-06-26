import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Animated,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import { imagePayloadFromPicked, normalizePickedImage } from '../../utils/images';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MIN_IMAGES = 6; // mínimo requerido
const THUMB_SIZE = (SCREEN_WIDTH - 48 - 8 * 2) / 3; // 3 por fila

// ─────────────────────────────────────────────
//  Indicador de pasos
// ─────────────────────────────────────────────
function StepIndicator({ currentStep }) {
  const { theme } = useAppTheme();
  const steps = [
    { number: 1, label: 'DETALLES' },
    { number: 2, label: 'MEDIA' },
  ];
  return (
    <View style={indicator.row}>
      {steps.map((step, i) => {
        const active = currentStep === step.number;
        const done   = currentStep > step.number;
        return (
          <React.Fragment key={step.number}>
            <View style={indicator.stepWrap}>
              <View style={[indicator.circle, active && indicator.circleActive, done && indicator.circleDone, (active || done) && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                {done
                  ? <Ionicons name="checkmark" size={18} color={theme.white} />
                  : <Text style={[indicator.circleText, (active || done) && indicator.circleTextActive, (active || done) && { color: theme.white }]}>
                      {step.number}
                    </Text>
                }
              </View>
              <Text style={[indicator.label, active && indicator.labelActive, active && { color: theme.primary }]}>
                {step.label}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View style={[indicator.line, done && indicator.lineDone, done && { backgroundColor: theme.primary }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const indicator = StyleSheet.create({
  row:             { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  stepWrap:        { alignItems: 'center' },
  circle:          { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#CCCCCC', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  circleActive:    { backgroundColor: '#8b0000', borderColor: '#8b0000' },
  circleDone:      { backgroundColor: '#8b0000', borderColor: '#8b0000' },
  circleText:      { fontSize: 16, fontWeight: '700', color: '#AAAAAA' },
  circleTextActive:{ color: '#FFFFFF' },
  label:           { fontSize: 10, fontWeight: '700', color: '#AAAAAA', marginTop: 4 },
  labelActive:     { color: '#8b0000' },
  line:            { flex: 1, height: 2, backgroundColor: '#CCCCCC', marginHorizontal: 8, marginBottom: 18 },
  lineDone:        { backgroundColor: '#8b0000' },
});

// ─────────────────────────────────────────────
//  Campo de texto reutilizable
// ─────────────────────────────────────────────
function Field({ label, value, onChangeText, multiline = false, placeholder = '' }) {
  const { theme } = useAppTheme();
  return (
    <View style={field.wrap}>
      <Text style={[field.label, { color: theme.placeholder }]}>{label}</Text>
      <TextInput
        style={[field.input, multiline && field.inputMulti, { color: theme.secondary }]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        placeholder={placeholder}
        placeholderTextColor="#C0B0A8"
        autoCapitalize="sentences"
      />
    </View>
  );
}

const field = StyleSheet.create({
  wrap:       { marginBottom: 20 },
  label:      { fontSize: 13, color: '#888888', marginBottom: 6 },
  input:      { height: 48, borderWidth: 1, borderColor: '#E0D0C8', borderRadius: 10, paddingHorizontal: 12, fontSize: 14, color: '#1A1A1A', backgroundColor: '#FAFAFA' },
  inputMulti: { height: 100, paddingTop: 10, paddingBottom: 10 },
});

// ─────────────────────────────────────────────
//  Pantalla principal
// ─────────────────────────────────────────────
export default function CargarBienScreen({ navigation }) {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [step,        setStep]        = useState(1);

  // Paso 1
  const [nombre,      setNombre]      = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [pdfFile,     setPdfFile]     = useState(null); // { name, uri, size }

  // Paso 2
  const [images,      setImages]      = useState([]); // array de { uri, base64 }

  // Modal
  const [modalVisible,  setModalVisible]  = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [submitError,   setSubmitError]   = useState(null); // null = éxito
  const modalScale     = useRef(new Animated.Value(0.8)).current;
  const modalOpacity   = useRef(new Animated.Value(0)).current;

  // ── Navegación entre pasos ───────────────────
  const goToStep2 = () => setStep(2);
  const goToStep1 = () => setStep(1);

  // ── Reset completo del formulario ────────────
  const resetForm = () => {
    setStep(1);
    setNombre('');
    setDescripcion('');
    setPdfFile(null);
    setImages([]);
  };

  // ── Modal ────────────────────────────────────
  const openModal = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.spring(modalScale,   { toValue: 1, useNativeDriver: true, bounciness: 6, speed: 14 }),
      Animated.timing(modalOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  // Cierra modal: solo navega/resetea si fue exitoso
  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalScale,   { toValue: 0.8, duration: 200, useNativeDriver: true }),
      Animated.timing(modalOpacity, { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setModalVisible(false);
      if (!submitError) {
        resetForm();
        navigation?.navigate('Main');
      }
    });
  };

  // Envío real con try-catch
  const handleFinalize = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      // ── CONEXIÓN BACKEND — crear producto ────────────────────────────
      // POST /api/products
      // El backend espera: { nombre, descripcionCompleta, fotos: [{ base64, mimeType }] }
      // Nota: El PDF de ficha técnica aún no es procesado por el backend en esta versión,
      // pero lo dejamos preparado en el frontend.
      const payload = {
        nombre: nombre,
        descripcionCompleta: descripcion,
        fotos: images.map(imagePayloadFromPicked).filter((img) => img.base64),
      };

      await api.post(ENDPOINTS.PRODUCTS, payload);
      // ─────────────────────────────────────────────────────────────────

      setSubmitError(null);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Ocurrió un error inesperado.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
      openModal();
    }
  };

  // ── PDF picker ───────────────────────────────
  const handlePickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];
        setPdfFile({ name: file.name, uri: file.uri, size: file.size });
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo abrir el selector de archivos.');
    }
  };

  const handleRemovePdf = () => setPdfFile(null);

  // ── Image picker ─────────────────────────────
  const handleAddImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.65,
      base64: true,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setImages(prev => [...prev, ...result.assets.map(normalizePickedImage)]);
    }
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const canFinalize = images.length >= MIN_IMAGES;

  const formatSize = (bytes) => {
    if (!bytes) return '';
    return bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${(bytes / 1024).toFixed(0)} KB`;
  };

  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.white }]}>

      {/* ── Top Bar ─────────────────────────────── */}
      <View style={[styles.topBar, { backgroundColor: theme.white }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={step === 2 ? goToStep1 : () => navigation?.goBack()}
        >
          <Ionicons name="chevron-back" size={26} color={theme.secondary} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: theme.secondary }]}>Cargar Bien</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StepIndicator currentStep={step} />

        {/* ══════════════════════════════════════════
            PASO 1 — Detalles
        ══════════════════════════════════════════ */}
        {step === 1 && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.secondary }]}>Informacion del lote</Text>

            {/* Nombre */}
            <Field
              label="Nombre del producto"
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej: Mesa de madera vintage"
            />

            {/* Descripción breve */}
            <Field
              label="Descripcion breve"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              placeholder="Resumí el bien en pocas líneas..."
            />

            {/* ── Carga de PDF ── */}
            <Text style={[styles.fieldLabel, { color: theme.placeholder }]}>Ficha técnica del bien (PDF)</Text>

            {!pdfFile ? (
              <TouchableOpacity style={styles.pdfUploadZone} onPress={handlePickPdf} activeOpacity={0.8}>
                <View style={styles.pdfIconWrap}>
                  <Ionicons name="document-attach-outline" size={28} color={theme.primary} />
                </View>
                <Text style={[styles.pdfUploadTitle, { color: theme.secondary }]}>Adjuntar archivo PDF</Text>
                <Text style={styles.pdfUploadSub}>Tocá para seleccionar desde tu dispositivo</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.pdfFileCard}>
                <View style={styles.pdfFileIconWrap}>
                  <Ionicons name="document-text" size={26} color={theme.primary} />
                </View>
                <View style={styles.pdfFileInfo}>
                  <Text style={[styles.pdfFileName, { color: theme.secondary }]} numberOfLines={1}>{pdfFile.name}</Text>
                  {pdfFile.size ? (
                    <Text style={styles.pdfFileSize}>{formatSize(pdfFile.size)}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={handleRemovePdf} style={styles.pdfRemoveBtn}>
                  <Ionicons name="close-circle" size={22} color="#C08080" />
                </TouchableOpacity>
              </View>
            )}

            {/* Nota informativa sobre el PDF */}
            <View style={styles.pdfHintBox}>
              <Ionicons name="information-circle-outline" size={16} color={theme.primary} style={{ marginTop: 1 }} />
              <Text style={styles.pdfHintText}>
                El PDF debe incluir: descripción detallada del bien, estado de conservación, dimensiones o peso, documentación de origen o autenticidad, y cualquier dato relevante para los postores. Máximo recomendado: 10 MB.
              </Text>
            </View>

            {/* Botón Siguiente */}
            <TouchableOpacity
              style={[styles.btnPrimary, styles.btnRight, { backgroundColor: theme.primary }]}
              onPress={goToStep2}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnPrimaryText, { color: theme.white }]}>Siguiente  »</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ══════════════════════════════════════════
            PASO 2 — Media
        ══════════════════════════════════════════ */}
        {step === 2 && (
          <View>
            {/* Título + contador */}
            <View style={styles.mediaTitleRow}>
              <Text style={[styles.sectionTitle, { color: theme.secondary }]}>Galeria de Imagenes</Text>
              <View style={[
                styles.counterPill,
                canFinalize && styles.counterPillOk,
              ]}>
                <Text style={[styles.counterText, canFinalize && styles.counterTextOk]}>
                  {images.length} / mín. {MIN_IMAGES}
                </Text>
              </View>
            </View>

            {/* Zona de carga */}
            <TouchableOpacity
              style={styles.uploadZone}
              onPress={handleAddImage}
              activeOpacity={0.8}
            >
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
            {images.length > 0 && (
              <View style={styles.thumbGrid}>
                {images.map((img, i) => (
                  <View key={i} style={styles.thumbSlot}>
                    <Image source={{ uri: img.uri }} style={styles.thumbImage} />
                    <TouchableOpacity
                      style={styles.thumbRemove}
                      onPress={() => handleRemoveImage(i)}
                    >
                      <Ionicons name="close-circle" size={20} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Aviso si no se llegó al mínimo */}
            {!canFinalize && (
              <View style={styles.warnBox}>
                <Ionicons name="alert-circle-outline" size={16} color={theme.primary} style={{ marginTop: 1 }} />
                <Text style={styles.warnText}>
                  Necesitás al menos {MIN_IMAGES} fotos para publicar. Llevás {images.length}.
                </Text>
              </View>
            )}

            {/* Botón Finalizar */}
            <TouchableOpacity
              style={[
                styles.btnPrimary,
                styles.btnRight,
                { marginTop: 16, backgroundColor: theme.primary },
                (!canFinalize || submitting) && styles.btnDisabled,
              ]}
              onPress={canFinalize && !submitting ? handleFinalize : null}
              activeOpacity={canFinalize && !submitting ? 0.85 : 1}
            >
              <Text style={[styles.btnPrimaryText, { color: theme.white }]}>
                {submitting ? 'Enviando...' : 'Finalizar'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ══════════════════════════════════════════
          MODAL — Guardado y finalizado
      ══════════════════════════════════════════ */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="none"
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={submitError ? closeModal : undefined}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.modalCard,
                  { opacity: modalOpacity, transform: [{ scale: modalScale }] },
                ]}
              >
                {submitError ? (
                  // ── ERROR ──
                  <>
                    <View style={[styles.checkCircle, { backgroundColor: '#C0392B' }]}>
                      <Ionicons name="close" size={28} color={theme.white} />
                    </View>
                    <Text style={[styles.modalTitle, { color: theme.secondary }]}>Error al enviar</Text>
                    <Text style={[styles.modalMessage, { color: theme.placeholder }]}>{submitError}</Text>
                    <TouchableOpacity
                      style={[styles.btnPrimary, { marginTop: 24, alignSelf: 'stretch', backgroundColor: '#C0392B' }]}
                      onPress={closeModal}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.btnPrimaryText, { textAlign: 'center', color: theme.white }]}>
                        Cerrar y reintentar
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  // ── ÉXITO ──
                  <>
                    <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                      <Ionicons name="checkmark" size={28} color={theme.white} />
                    </View>
                    <Text style={[styles.modalTitle, { color: theme.secondary }]}>Guardado y finalizado</Text>
                    <Text style={[styles.modalMessage, { color: theme.placeholder }]}>
                      Tu producto fue enviado correctamente y ya está en revisión, te contactaremos pronto.
                    </Text>
                    <TouchableOpacity
                      style={[styles.btnPrimary, { marginTop: 24, alignSelf: 'stretch', backgroundColor: theme.primary }]}
                      onPress={closeModal}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.btnPrimaryText, { textAlign: 'center', color: theme.white }]}>
                        Ir al inicio
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}

// ─────────────────────────────────────────────
//  Estilos
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#FFFFFF' },

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
    shadowRadius: 4,
  },
  backBtn:      { padding: 4 },
  topBarTitle:  { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24 },

  sectionTitle: {
    fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 24,
  },

  fieldLabel: {
    fontSize: 13, color: '#888888', marginBottom: 8,
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
    marginBottom: 12,
  },
  pdfIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFE8D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  pdfUploadTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  pdfUploadSub:   { fontSize: 12, color: '#A09088', textAlign: 'center' },

  pdfFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5EC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0D8C8',
    padding: 14,
    gap: 12,
    marginBottom: 12,
  },
  pdfFileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFE8D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfFileInfo:  { flex: 1 },
  pdfFileName:  { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  pdfFileSize:  { fontSize: 11, color: '#A09088', marginTop: 2 },
  pdfRemoveBtn: { padding: 4 },

  pdfHintBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFF5EC',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#8b0000',
    padding: 12,
    marginBottom: 28,
  },
  pdfHintText: {
    flex: 1,
    fontSize: 12,
    color: '#6B4A3A',
    lineHeight: 18,
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
    shadowRadius: 6,
  },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  btnRight:       { alignSelf: 'flex-end', marginTop: 8 },
  btnDisabled:    { backgroundColor: '#C8A8A8', shadowOpacity: 0, elevation: 0 },

  // ── Paso 2: Media ────────────────────────────
  mediaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  counterPill: {
    backgroundColor: '#F5E8DC',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E0D0C8',
    marginBottom: 24,
  },
  counterPillOk:  { backgroundColor: '#F0FFE8', borderColor: '#8b0000' },
  counterText:    { fontSize: 11, fontWeight: '700', color: '#A09088' },
  counterTextOk:  { color: '#8b0000' },

  uploadZone: {
    borderWidth: 1.5,
    borderColor: '#E0D0C8',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#FDFAF8',
    marginBottom: 24,
    gap: 10,
  },
  cameraIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#FFE8D6',
    alignItems: 'center', justifyContent: 'center',
  },
  uploadTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  uploadSub:   { fontSize: 12, color: '#A09088', marginBottom: 6 },

  // Grid 3 columnas
  thumbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  thumbSlot: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImage: {
    width: '100%', height: '100%', resizeMode: 'cover',
  },
  thumbRemove: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 10,
  },

  warnBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFF5EC',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#8b0000',
    padding: 12,
    marginTop: 4,
  },
  warnText: {
    flex: 1, fontSize: 12, color: '#6B4A3A', lineHeight: 18,
  },

  // ── Modal ────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
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
    shadowRadius: 20,
  },
  checkCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#8b0000',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18, fontWeight: '700', color: '#1A1A1A',
    textAlign: 'center', marginBottom: 12,
  },
  modalMessage: {
    fontSize: 13, color: '#888888', textAlign: 'center', lineHeight: 20,
  },
});
