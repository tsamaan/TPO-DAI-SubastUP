import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import { imageSourceFromBase64 } from '../../utils/images';

const COLORS = {
  primary: '#8B0000',
  white: '#FFFFFF',
  background: '#F5F5F5',
  card: '#FFFFFF',
  text: '#1A1A1A',
  muted: '#777777',
  border: '#E0E0E0',
  success: '#2E7D32',
  warning: '#B26A00',
  danger: '#8B0000',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ESTADOS = {
  pendiente: {
    label: 'Pendiente',
    color: COLORS.warning,
    texto: 'Tu producto fue enviado y todavía no fue revisado por un asesor.',
  },
  aprobado: {
    label: 'Aprobado',
    color: COLORS.success,
    texto: 'Tu producto fue aprobado por el equipo de SubastUP.',
  },
  en_inspeccion: {
    label: 'Aprobado · artículo en revisión',
    color: COLORS.warning,
    texto: 'El asesor aceptó avanzar y el artículo está en revisión física.',
  },
  esperando_usuario: {
    label: 'Aprobado · esperando confirmación final',
    color: COLORS.success,
    texto: 'El tasador hizo una propuesta. Revisala y confirmá si querés avanzar.',
  },
  confirmado: {
    label: 'Aceptado',
    color: COLORS.success,
    texto: 'Aceptaste la propuesta. El artículo queda listo para avanzar a subasta.',
  },
  rechazado: {
    label: 'Rechazado',
    color: COLORS.danger,
    texto: 'El artículo fue rechazado por el equipo de revisión.',
  },
  devuelto: {
    label: 'Propuesta rechazada',
    color: COLORS.danger,
    texto: 'Rechazaste la propuesta y el circuito quedó cerrado.',
  },
};

const formatearMonto = (valor, moneda = 'ARS') => {
  const numero = Number(valor || 0);
  return `${moneda} ${numero.toLocaleString('es-AR')}`;
};

export default function ArticuloEnSubastaDetalleScreen({ navigation, route }) {
  const productoId = route?.params?.productoId;
  const productoResumen = route?.params?.productoResumen;
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [respondiendo, setRespondiendo] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [errorDetalle, setErrorDetalle] = useState(null);

  const cargarDetalle = useCallback(async () => {
    if (!productoId) return;
    try {
      setLoading(true);
      setErrorDetalle(null);
      const data = await api.get(ENDPOINTS.PRODUCT_BY_ID(productoId));
      setProducto(data?.producto || null);
    } catch (err) {
      setErrorDetalle(err?.response?.data?.message || 'No se pudo cargar el detalle completo del artículo.');
      if (productoResumen) {
        setProducto({
          identificador: productoResumen.productoId || productoResumen.identificador,
          nombre: productoResumen.nombre,
          estado: productoResumen.estado || 'pendiente',
          fecha: productoResumen.fecha,
          descripcionCompleta: productoResumen.descripcionCompleta || 'Sin descripción disponible.',
          fotos: productoResumen.portada ? [{ id: 'portada', foto: productoResumen.portada }] : [],
          propuesta: productoResumen.propuesta || {
            itemId: productoResumen.itemId,
            subastaId: productoResumen.subastaId,
            precioBase: productoResumen.precioBase,
            moneda: productoResumen.moneda,
            fechaSubasta: productoResumen.fechaSubasta,
            horaSubasta: productoResumen.horaSubasta,
            lugarSubasta: productoResumen.lugarSubasta,
          },
        });
      }
    } finally {
      setLoading(false);
    }
  }, [productoId]);

  useFocusEffect(
    useCallback(() => {
      cargarDetalle();
    }, [cargarDetalle])
  );

  const responder = (action) => {
    const acepta = action === 'ACCEPT';
    Alert.alert(
      acepta ? 'Aceptar propuesta' : 'Rechazar propuesta',
      acepta
        ? '¿Querés aceptar la propuesta para que el artículo avance a subasta?'
        : '¿Querés rechazar la propuesta y cerrar el circuito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: acepta ? 'Aceptar' : 'Rechazar',
          style: acepta ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setRespondiendo(true);
              const data = await api.put(ENDPOINTS.PRODUCT_RESPOND(productoId), { action });
              Alert.alert('Listo', data?.message || 'Respuesta registrada.');
              cargarDetalle();
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || 'No se pudo registrar tu respuesta.');
            } finally {
              setRespondiendo(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!producto) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle del artículo</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No se encontró el artículo.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const estadoConfig = ESTADOS[producto.estado] || ESTADOS.pendiente;
  const fotos = Array.isArray(producto.fotos) ? producto.fotos : [];
  const propuesta = producto.propuesta;
  const mostrarAcciones = producto.estado === 'esperando_usuario' && propuesta;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del artículo</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.carouselBox}>
          {fotos.length > 0 ? (
            <>
              <FlatList
                data={fotos}
                keyExtractor={(foto, index) => String(foto.id || index)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(event) => {
                  const slide = Math.round(event.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
                  setActiveSlide(slide);
                }}
                scrollEventThrottle={16}
                renderItem={({ item: foto }) => (
                  <Image
                    source={imageSourceFromBase64(foto.foto, foto.mimeType)}
                    style={styles.carouselImage}
                    resizeMode="cover"
                  />
                )}
              />
              <View style={styles.dotsRow}>
                {fotos.map((foto, index) => (
                  <View key={String(foto.id || index)} style={[styles.dot, index === activeSlide && styles.dotActive]} />
                ))}
              </View>
            </>
          ) : (
            <View style={[styles.carouselImage, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={28} color={COLORS.border} />
            </View>
          )}
        </View>

        <Text style={styles.title}>{producto.nombre}</Text>
        <Text style={styles.date}>ID #{producto.identificador}</Text>

        {errorDetalle ? (
          <View style={styles.warningBox}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.warning} />
            <Text style={styles.warningText}>{errorDetalle}</Text>
          </View>
        ) : null}

        <View style={[styles.statusBox, { borderLeftColor: estadoConfig.color }]}>
          <Text style={[styles.statusLabel, { color: estadoConfig.color }]}>{estadoConfig.label}</Text>
          <Text style={styles.statusText}>{producto.textoEstado || estadoConfig.texto}</Text>
        </View>

        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.description}>{producto.descripcionCompleta || 'Sin descripción disponible.'}</Text>

        {producto.direccionEnvio ? (
          <>
            <Text style={styles.sectionTitle}>Dirección / envío</Text>
            <Text style={styles.description}>{producto.direccionEnvio}</Text>
          </>
        ) : null}

        {producto.motivoRechazo ? (
          <>
            <Text style={styles.sectionTitle}>Motivo</Text>
            <Text style={styles.description}>{producto.motivoRechazo}</Text>
          </>
        ) : null}

        {propuesta ? (
          <View style={styles.propuestaCard}>
            <Text style={styles.propuestaTitle}>Propuesta de SubastUP</Text>
            <View style={styles.propuestaRow}>
              <Text style={styles.propuestaLabel}>Precio base</Text>
              <Text style={styles.propuestaValue}>
                {formatearMonto(propuesta.precioBase, propuesta.moneda)}
              </Text>
            </View>
            {propuesta.lugarSubasta ? (
              <View style={styles.propuestaRow}>
                <Text style={styles.propuestaLabel}>Lugar</Text>
                <Text style={styles.propuestaValue}>{propuesta.lugarSubasta}</Text>
              </View>
            ) : null}
            {propuesta.fechaSubasta ? (
              <View style={styles.propuestaRow}>
                <Text style={styles.propuestaLabel}>Fecha</Text>
                <Text style={styles.propuestaValue}>
                  {new Date(propuesta.fechaSubasta).toLocaleDateString('es-AR')}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {mostrarAcciones ? (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => responder('REJECT')}
              disabled={respondiendo}
            >
              <Text style={styles.rejectText}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => responder('ACCEPT')}
              disabled={respondiendo}
            >
              {respondiendo ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.acceptText}>Aceptar</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={[styles.estadoFinalBox, { borderColor: estadoConfig.color }]}>
          <Text style={[styles.estadoFinalTitle, { color: estadoConfig.color }]}>Estado del artículo</Text>
          <Text style={styles.estadoFinalText}>{estadoConfig.label}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: COLORS.muted, fontSize: 15, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 36 },
  carouselBox: { marginBottom: 16 },
  carouselImage: {
    width: SCREEN_WIDTH - 32,
    height: 260,
    borderRadius: 16,
    backgroundColor: COLORS.border,
  },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { width: 22, backgroundColor: COLORS.primary },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  date: { fontSize: 12, color: COLORS.muted, marginBottom: 16 },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF8E8',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  warningText: { flex: 1, color: COLORS.warning, fontSize: 12, fontWeight: '700' },
  statusBox: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderLeftWidth: 5,
    padding: 14,
    marginBottom: 18,
  },
  statusLabel: { fontSize: 15, fontWeight: '900', marginBottom: 6 },
  statusText: { fontSize: 14, color: COLORS.muted, lineHeight: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: COLORS.text, marginBottom: 8, marginTop: 10 },
  description: { fontSize: 14, color: COLORS.muted, lineHeight: 21, marginBottom: 10 },
  propuestaCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginTop: 12,
  },
  propuestaTitle: { fontSize: 16, fontWeight: '900', color: COLORS.primary, marginBottom: 10 },
  propuestaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  propuestaLabel: { fontSize: 13, color: COLORS.muted, fontWeight: '700' },
  propuestaValue: { flex: 1, textAlign: 'right', fontSize: 13, color: COLORS.text, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  actionBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  rejectBtn: { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.primary },
  acceptBtn: { backgroundColor: COLORS.primary },
  rejectText: { color: COLORS.primary, fontWeight: '900', fontSize: 15 },
  acceptText: { color: COLORS.white, fontWeight: '900', fontSize: 15 },
  estadoFinalBox: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginTop: 18,
  },
  estadoFinalTitle: { fontSize: 13, fontWeight: '900', marginBottom: 6 },
  estadoFinalText: { fontSize: 16, fontWeight: '900', color: COLORS.text },
});
