import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import { dataUriFromBase64 } from '../../utils/images';

// ─── Modal Confirmacion ──────────────────────────────────────────────────────
const SaveConfirmModal = ({ visible, variant, title, message, onAccept }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onAccept}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalIconCircle}>
            <Ionicons
              name={variant === 'success' ? 'checkmark-circle' : 'information-circle-outline'}
              size={56}
              color={variant === 'success' ? '#2E8B57' : '#1a1a1a'}
            />
          </View>
          <Text style={styles.modalTitulo}>{title}</Text>
          <Text style={styles.modalCuerpo}>{message}</Text>
          <TouchableOpacity
            style={styles.btnAceptarModal}
            activeOpacity={0.85}
            onPress={onAccept}
          >
            <Text style={styles.btnAceptarModalText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Componentes de UI comunes ────────────────────────────────────────────────
const Campo = ({ label, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry = false, maxLength, style }) => (
  <View style={[styles.campoWrapper, style]}>
    <Text style={styles.campoLabel}>{label}</Text>
    <View style={styles.campoInput}>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#888888"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
      />
    </View>
  </View>
);

// ─── Pantalla Principal ───────────────────────────────────────────────────────
export default function AgregarMetodoPagoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('tarjeta'); // 'tarjeta' | 'banco' | 'cheque'

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ variant: 'success', title: '', message: '' });
  // @TASK: Evita envíos duplicados mientras el backend procesa el método.
  const [guardando, setGuardando] = useState(false);

  // Tarjeta State
  const [titular, setTitular] = useState('');
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [codSeguridad, setCodSeguridad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [piso, setPiso] = useState('');
  const [localidad, setLocalidad] = useState('');

  // Banco State
  const [cbu, setCbu] = useState('');
  const [alias, setAlias] = useState('');
  const [titularBanco, setTitularBanco] = useState('');

  // Cheque State
  const [bancoCheque, setBancoCheque] = useState('');
  const [fechaPago, setFechaPago] = useState('');
  const [sucursal, setSucursal] = useState('');
  const [numeroCheque, setNumeroCheque] = useState('');
  const [fotoCheque, setFotoCheque] = useState(null);

  // Handlers Tarjeta
  const handleNumeroTarjetaChange = (text) => {
    let cleanText = text.replace(/\D/g, '');
    let formattedText = cleanText.replace(/(.{4})/g, '$1 ').trim();
    setNumeroTarjeta(formattedText);
  };
  const handleFechaVencimientoChange = (text) => {
    let cleanText = text.replace(/\D/g, '');
    if (cleanText.length >= 3) {
      cleanText = `${cleanText.slice(0, 2)}/${cleanText.slice(2, 4)}`;
    }
    setFechaVencimiento(cleanText);
  };

  // Handlers Cheque
  const handleFechaPagoChange = (text) => {
    let cleanText = text.replace(/\D/g, '');
    if (cleanText.length >= 5) {
      cleanText = `${cleanText.slice(0, 2)}/${cleanText.slice(2, 4)}/${cleanText.slice(4, 8)}`;
    } else if (cleanText.length >= 3) {
      cleanText = `${cleanText.slice(0, 2)}/${cleanText.slice(2, 4)}`;
    }
    setFechaPago(cleanText);
  };

  const handleTomarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Se requieren permisos para usar la cámara');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
      // @TASK: Obtiene la imagen en base64 para enviarla al endpoint de cheques.
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      // @TASK: Conserva la URI para la vista previa y base64 para persistir el cheque.
      setFotoCheque({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
    }
  };

  // Validación
  let isValid = false;
  if (activeTab === 'tarjeta') {
    isValid = titular.trim().length > 0 && numeroTarjeta.trim().length === 19 && fechaVencimiento.trim().length === 5 && codSeguridad.trim().length >= 3 && direccion.trim().length > 0 && codigoPostal.trim().length > 0 && piso.trim().length > 0 && localidad.trim().length > 0;
  } else if (activeTab === 'banco') {
    isValid = cbu.trim().length === 22 && alias.trim().length > 0 && titularBanco.trim().length > 0;
  } else if (activeTab === 'cheque') {
    isValid = bancoCheque.trim().length > 0 && fechaPago.trim().length === 10 && sucursal.trim().length > 0 && numeroCheque.trim().length > 0 && fotoCheque !== null;
  }

  // @API: Envía el formulario al endpoint correspondiente según el tipo seleccionado.
  const handleFinalizar = async () => {
    if (!isValid) return;
    try {
      setGuardando(true);

      if (activeTab === 'tarjeta') {
        const [mesVencimiento, anioCorto] = fechaVencimiento.split('/');
        // @API: POST /api/settings/payment-methods/card usa el contrato de tarjetas del backend.
        await api.post(ENDPOINTS.PAYMENT_CARD, {
          titular,
          numeroTarjeta: numeroTarjeta.replace(/\s/g, ''),
          mesVencimiento,
          anioVencimiento: `20${anioCorto}`,
          codigoSeguridad: codSeguridad,
          direccion,
          codigoPostal,
          localidad,
        });
        setModalConfig({
          variant: 'success',
          title: 'Datos guardados correctamente',
          message: 'Tus datos de la tarjeta fueron guardados de forma segura.',
        });
      } else if (activeTab === 'banco') {
        // @API: POST /api/settings/payment-methods/bank guarda una cuenta bancaria.
        await api.post(ENDPOINTS.PAYMENT_BANK, {
          cbu,
          alias,
          titular: titularBanco,
        });
        setModalConfig({
          variant: 'review',
          title: 'Datos guardados y en revision',
          message: 'El banco verificará la cuenta antes de habilitarla.',
        });
      } else {
        const [dia, mes, anio] = fechaPago.split('/');
        // @API: POST /api/settings/payment-methods/check recibe la fecha en formato ISO.
        await api.post(ENDPOINTS.PAYMENT_CHECK, {
          nombreBanco: bancoCheque,
          fechaPago: `${anio}-${mes}-${dia}`,
          numeroSucursal: sucursal,
          numeroCheque,
          imagen: dataUriFromBase64(fotoCheque?.base64) || undefined,
        });
        setModalConfig({
          variant: 'review',
          title: 'Datos guardados y en revision',
          message: 'Revisaremos la información de tu cheque antes de habilitarlo.',
        });
      }

      setModalVisible(true);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'No se pudo guardar el método de pago.');
    } finally {
      setGuardando(false);
    }
  };

  const handleModalAccept = () => {
    setModalVisible(false);
    navigation.navigate('MetodosDePago');
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity style={[styles.tabButton, activeTab === 'tarjeta' && styles.tabButtonActive]} onPress={() => setActiveTab('tarjeta')}>
        <Ionicons name="card-outline" size={24} color={activeTab === 'tarjeta' ? '#FFFFFF' : '#555555'} />
        <Text style={[styles.tabText, activeTab === 'tarjeta' && styles.tabTextActive]}>Tarjeta</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tabButton, activeTab === 'banco' && styles.tabButtonActive]} onPress={() => setActiveTab('banco')}>
        <Ionicons name="business-outline" size={24} color={activeTab === 'banco' ? '#FFFFFF' : '#555555'} />
        <Text style={[styles.tabText, activeTab === 'banco' && styles.tabTextActive]}>Banco</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tabButton, activeTab === 'cheque' && styles.tabButtonActive]} onPress={() => setActiveTab('cheque')}>
        <Ionicons name="document-text-outline" size={24} color={activeTab === 'cheque' ? '#FFFFFF' : '#555555'} />
        <Text style={[styles.tabText, activeTab === 'cheque' && styles.tabTextActive]}>Cheque</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agregar Metodo de Pago</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderTabs()}

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'tarjeta' && (
          <>
            <View style={styles.cardSection}>
              <Text style={styles.sectionTitle}>Datos de la tarjeta</Text>
              <Campo label="Titular" value={titular} onChangeText={setTitular} placeholder="Ej. Juan Perez" />
              <Campo label="Numero de tarjeta" value={numeroTarjeta} onChangeText={handleNumeroTarjetaChange} placeholder="0000 0000 0000 0000" keyboardType="numeric" maxLength={19} />
              <View style={styles.filaDoble}>
                <Campo style={{ flex: 1, marginRight: 6 }} label="Fecha de vencimiento" value={fechaVencimiento} onChangeText={handleFechaVencimientoChange} placeholder="MM/AA" keyboardType="numeric" maxLength={5} />
                <Campo style={{ flex: 1, marginLeft: 6 }} label="Cod. Seguridad" value={codSeguridad} onChangeText={setCodSeguridad} placeholder="123" keyboardType="numeric" secureTextEntry maxLength={4} />
              </View>
            </View>

            <View style={styles.cardSection}>
              <Text style={styles.sectionTitle}>Informacion de Entrega</Text>
              <View style={styles.filaDoble}>
                <Campo style={{ flex: 1, marginRight: 6 }} label="Direccion" value={direccion} onChangeText={setDireccion} placeholder="Av. Siempre Viva 123" />
                <Campo style={{ flex: 1, marginLeft: 6 }} label="Codigo Postal" value={codigoPostal} onChangeText={setCodigoPostal} placeholder="1234" keyboardType="numeric" />
              </View>
              <View style={styles.filaDoble}>
                <Campo style={{ flex: 1, marginRight: 6 }} label="Piso" value={piso} onChangeText={setPiso} placeholder="3A" />
                <Campo style={{ flex: 1, marginLeft: 6 }} label="Localidad" value={localidad} onChangeText={setLocalidad} placeholder="CABA" />
              </View>
            </View>
          </>
        )}

        {activeTab === 'banco' && (
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Datos del Banco</Text>
            <Campo label="CBU" value={cbu} onChangeText={(text) => setCbu(text.replace(/\D/g, ''))} placeholder="22 digitos" keyboardType="numeric" maxLength={22} />
            <Campo label="Alias" value={alias} onChangeText={setAlias} placeholder="mi.alias.banco" />
            <Campo label="Nombre del titular" value={titularBanco} onChangeText={setTitularBanco} placeholder="Ej. Juan Perez" />
          </View>
        )}

        {activeTab === 'cheque' && (
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Datos del Cheque</Text>
            <Campo label="Nombre del banco" value={bancoCheque} onChangeText={setBancoCheque} placeholder="Ej. Banco Nacion" />
            <View style={styles.filaDoble}>
              <Campo style={{ flex: 1, marginRight: 6 }} label="Fecha de pago" value={fechaPago} onChangeText={handleFechaPagoChange} placeholder="DD/MM/AAAA" keyboardType="numeric" maxLength={10} />
              <Campo style={{ flex: 1, marginLeft: 6 }} label="Numero de sucursal" value={sucursal} onChangeText={setSucursal} placeholder="Ej. 001" keyboardType="numeric" />
            </View>
            <Campo label="Numero de cheque" value={numeroCheque} onChangeText={(text) => setNumeroCheque(text.replace(/\D/g, ''))} placeholder="Ej. 12345678" keyboardType="numeric" />

            <View style={styles.campoWrapper}>
              <Text style={styles.campoLabel}>Cargar imagen de cheque</Text>
              <TouchableOpacity style={styles.uploadCaja} onPress={handleTomarFoto} activeOpacity={0.8}>
                {fotoCheque ? (
                   <Image source={{ uri: fotoCheque.uri }} style={styles.imagenPreview} />
                ) : (
                  <>
                    <View style={styles.uploadIconoCircular}>
                      <Ionicons name="camera-outline" size={28} color="#1a1a1a" />
                    </View>
                    <Text style={styles.uploadTexto}>Cargar imagen de cheque</Text>
                    <View style={styles.uploadBtn}>
                      <Text style={styles.uploadBtnTexto}>Abrir camara</Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.btnFinalizarContainer}>
          <TouchableOpacity
            style={[styles.btnFinalizar, !isValid && styles.btnFinalizarDisabled]}
            disabled={!isValid || guardando}
            onPress={handleFinalizar}
            activeOpacity={0.85}
          >
            {guardando ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnFinalizarText}>Finalizar</Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>

      <SaveConfirmModal
        visible={modalVisible}
        variant={modalConfig.variant}
        title={modalConfig.title}
        message={modalConfig.message}
        onAccept={handleModalAccept}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerIcon: { padding: 4, width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  tabButtonActive: {
    backgroundColor: '#8b0000',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555555',
    marginTop: 6,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60 },

  cardSection: {
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  
  campoWrapper: { marginBottom: 14 },
  campoLabel: {
    fontSize: 13,
    color: '#555555',
    fontWeight: '500',
    marginBottom: 6,
  },
  campoInput: {
    backgroundColor: '#D6D6D6',
    borderRadius: 8,
    paddingVertical: 0,
    paddingHorizontal: 12,
    justifyContent: 'center',
    height: 46,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  filaDoble: {
    flexDirection: 'row',
  },

  uploadCaja: {
    borderWidth: 2,
    borderColor: '#D6D6D6',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconoCircular: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D6D6D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadTexto: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
    marginBottom: 16,
  },
  uploadBtn: {
    backgroundColor: '#8b0000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  uploadBtnTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  imagenPreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    resizeMode: 'cover',
  },

  btnFinalizarContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  btnFinalizar: {
    backgroundColor: '#8b0000',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 40,
    alignItems: 'center',
    minWidth: 140,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  btnFinalizarDisabled: {
    backgroundColor: '#C0C0C0',
    elevation: 0,
    shadowOpacity: 0,
  },
  btnFinalizarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalIconCircle: {
    marginBottom: 16,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalCuerpo: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  btnAceptarModal: {
    backgroundColor: '#8b0000',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 40,
    alignItems: 'center',
    minWidth: 140,
  },
  btnAceptarModalText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
