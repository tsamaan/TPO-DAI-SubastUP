/*
Intro: MetodoDePagoDetalleScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/payments/MetodoDePagoDetalleScreen.js.
Endpoints: PAYMENT_BY_ID (/api/settings/payment-methods/:id: eliminar o consultar un metodo de pago).
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useState } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert } from
'react-native'; // Explica: importa dependencias desde 'react-native-safe-area-context'.
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde '../../services/api'.
import api from '../../services/api'; // Explica: importa dependencias desde '../../constants/api'.
import { ENDPOINTS } from '../../constants/api';

// ─── Pantalla de detalle de un método de pago ────────────────────────────────
//
// Props que llegan por navigation.navigate('MetodoDePagoDetalle', { metodo })
// donde `metodo` tiene la forma: { id: string, nombre: string, ... }
//
// TODO BACKEND: ajustar el shape de `metodo` según la respuesta real de la API.
// Explica: exporta este modulo para que otras partes de la app lo usen.
export default // Explica: declara la funcion MetodoDePagoDetalleScreen que concentra una parte del flujo.
function MetodoDePagoDetalleScreen({ navigation, route }) {// Explica: define insets usando el resultado de useSafeAreaInsets.
  const insets = useSafeAreaInsets();
  // ── Datos del método de pago ─────────────────
  // TODO BACKEND: reemplazar por datos reales provenientes de route.params.metodo
  //   const metodo = route.params?.metodo ?? {};
  // Explica: define metodo para usarlo en este archivo.
  const metodo = route?.params?.metodo ?? { id: '3',
    nombre: 'Metodo de Pago 3',
    titular: 'PEPITO GIMENEZ',
    numeroTarjeta: '1111 5544 1223 9114',
    mesVencimiento: '11',
    anioVencimiento: '2031',
    codSeguridad: '445'
  };

  // ── Estado del modal de confirmación ─────────
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [modalVisible, setModalVisible] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [eliminando, setEliminando] = useState(false);
  // ── Eliminar método de pago ──────────────────
  // Explica: define handleEliminar para usarlo en este archivo.
  const handleEliminar = async () => {// Estado: actualiza un valor usado por la interfaz.
    setEliminando(true); // Control: intenta una operacion y maneja errores si falla.
    try {// @MOCK: await new Promise((resolve) => setTimeout(resolve, 800));
      // @API: DELETE /api/settings/payment-methods/:id desactiva el método del usuario.
      // API: llama DELETE /api/settings/payment-methods/:id para eliminar o consultar un metodo de pago.
      await api.delete(ENDPOINTS.PAYMENT_BY_ID(metodo.id)); // Estado: actualiza un valor usado por la interfaz.
      setModalVisible(false);
      // Volver a la lista y refrescar
      // TODO BACKEND: si usás una lista en estado local, pasá un callback para
      //   actualizar la lista tras eliminar:
      //   navigation.navigate('MetodosDePago', { eliminadoId: metodo.id });
      navigation.goBack();} catch (error) {// Estado: actualiza un valor usado por la interfaz.
      setEliminando(false); // Estado: actualiza un valor usado por la interfaz.
      setModalVisible(false); // Explica: ejecuta Alert.alert como parte del flujo.
      Alert.alert('Error', error?.response?.data?.message || 'No se pudo eliminar el método de pago. Intentá de nuevo.');
    }
  };

  // ── Campos de detalle (read-only) ────────────
  // TODO BACKEND: los valores de cada campo vienen de `metodo` (enmascarados
  //   por el backend, ej. "•••• •••• •••• 4242")
  // Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente View.
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Header ──────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle Metodo de Pago</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Nombre del método ───────────────────── */}
      <Text style={styles.nombreMetodo}>{metodo.nombre}</Text>

      {/* ── Tarjeta de detalle ──────────────────── */}
      <View style={styles.tarjeta}>

        {/* Campos Titular y Numero de tarjeta */}
        <View style={styles.campoWrapper}>
          <Text style={styles.campoLabel}>Titular</Text>
          <View style={styles.campoInput}>
            <Text style={styles.campoValor}>
              {metodo.titular ? metodo.titular : '••••••••••••••••'}
            </Text>
          </View>
        </View>

        <View style={styles.campoWrapper}>
          <Text style={styles.campoLabel}>Numero de tarjeta</Text>
          <View style={styles.campoInput}>
            <Text style={styles.campoValor}>
              {metodo.numeroTarjeta ? metodo.numeroTarjeta : '•••• •••• •••• ••••'}
            </Text>
          </View>
        </View>

        {/* Fila: Fecha de caducidad + Cod. Seguridad */}
        <View style={styles.filaDoble}>
          <View style={styles.campoWrapperMitad}>
            <Text style={styles.campoLabel}>Fecha de caducidad</Text>
            <View style={styles.filaFecha}>
              <View style={[styles.campoInputPequeno, { flex: 1.5, marginRight: 6 }]}>
                <Text style={styles.campoValorCentrado}>
                  {metodo.mesVencimiento ? metodo.mesVencimiento : '--'}
                </Text>
              </View>
              <View style={[styles.campoInputPequeno, { flex: 2 }]}>
                <Text style={styles.campoValorCentrado}>
                  {metodo.anioVencimiento ? metodo.anioVencimiento : '----'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.campoWrapperMitad}>
            <Text style={styles.campoLabel}>Cod. Seguridad</Text>
            <View style={[styles.campoInput, { flex: 1 }]}>
              <Text style={styles.campoValorCentrado}>
                {metodo.codSeguridad ? metodo.codSeguridad : ''}
              </Text>
            </View>
          </View>
        </View>

      </View>

      {/* ── Botón eliminar (flotante, abajo a la derecha) ── */}
      <TouchableOpacity style={[styles.btnEliminar, { bottom: insets.bottom + 32 }]} activeOpacity={0.85} onPress={() => setModalVisible(true)}>
        <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ══════════════════════════════════════════
           MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
        ══════════════════════════════════════════ */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => !eliminando && setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>

            {/* Botón cerrar (X) */}
            {!eliminando && // UI: renderiza un control presionable para el usuario.
            <TouchableOpacity style={styles.modalCerrar} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#1a1a1a" />
              </TouchableOpacity>}

            {/* Ícono de aviso */}
            <View style={styles.modalIconCircle}>
              <Ionicons name="information-circle-outline" size={38} color="#1a1a1a" />
            </View>

            <Text style={styles.modalTitulo}>Aviso</Text>

            <Text style={styles.modalCuerpo}>
              ¿Estás seguro de que querés eliminar este método de pago? Esta acción no se puede deshacer.
            </Text>

            {/* Botón Eliminar */}
            <TouchableOpacity style={[styles.btnEliminarModal, eliminando && { opacity: 0.7 }]} activeOpacity={0.85} onPress={handleEliminar} disabled={eliminando}>
              {eliminando ? // UI: renderiza el componente ActivityIndicator.
              <ActivityIndicator color="#FFFFFF" size="small" /> : // UI: muestra texto visible en la pantalla.
              <Text style={styles.btnEliminarModalText}>Eliminar</Text>}
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>);} // ─── Estilos ──────────────────────────────────────────────────────────────────
// Explica: define styles usando el resultado de StyleSheet.create.
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#FFFFFF' }, // ── Header ────────────────────────────────────
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }, headerIcon: { padding: 4, width: 40 }, headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },

    // ── Nombre del método ──────────────────────────
    nombreMetodo: {
      fontSize: 24,
      fontWeight: '700',
      color: '#1a1a1a',
      marginTop: 28,
      marginBottom: 20,
      paddingHorizontal: 20
    },

    // ── Tarjeta de detalle ─────────────────────────
    tarjeta: {
      marginHorizontal: 16,
      backgroundColor: '#F0F0F0',
      borderRadius: 16,
      padding: 18
    },

    campoWrapper: {
      marginBottom: 14
    },
    campoWrapperMitad: {
      flex: 1
    },
    campoLabel: {
      fontSize: 13,
      color: '#555555',
      fontWeight: '500',
      marginBottom: 6
    },
    campoInput: {
      backgroundColor: '#D6D6D6',
      borderRadius: 8,
      paddingVertical: 13,
      paddingHorizontal: 12,
      justifyContent: 'center'
    },
    campoInputPequeno: {
      backgroundColor: '#D6D6D6',
      borderRadius: 8,
      paddingVertical: 13,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center'
    },
    campoValor: {
      fontSize: 14,
      color: '#1A1A1A',
      fontWeight: '500'
      // Eliminado flex: 1 para evitar el colapso horizontal del componente Text continuo
    },
    campoValorCentrado: {
      fontSize: 14,
      color: '#1A1A1A',
      fontWeight: '500',
      textAlign: 'center'
    },

    // Fila fecha + cod seguridad
    filaDoble: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 2
    },
    filaFecha: {
      flexDirection: 'row'
    },

    // ── Botón eliminar flotante ────────────────────
    btnEliminar: {
      position: 'absolute',
      right: 20,
      backgroundColor: '#8b0000',
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 5
    },

    // ── Modal ──────────────────────────────────────
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 28
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
      shadowRadius: 10
    },
    modalCerrar: {
      position: 'absolute',
      top: 14,
      right: 14,
      padding: 4
    },
    modalIconCircle: {
      marginBottom: 10
    },
    modalTitulo: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1a1a1a',
      marginBottom: 10
    },
    modalCuerpo: {
      fontSize: 14,
      color: '#555555',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24
    },
    btnEliminarModal: {
      backgroundColor: '#8b0000',
      borderRadius: 10,
      paddingVertical: 13,
      paddingHorizontal: 40,
      alignItems: 'center',
      minWidth: 140
    },
    btnEliminarModalText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700'
    }
  });
