/*
Intro: ArticulosEnSubastasScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/auction/ArticulosEnSubastasScreen.js.
Endpoints: MY_AUCTIONS (/api/users/me/auctions: listar articulos/subastas del usuario).
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useCallback, useState } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator,
  SafeAreaView } from
'react-native'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde '@react-navigation/native'.
import { useFocusEffect } from '@react-navigation/native'; // Explica: importa dependencias desde '../../services/api'.
import api from '../../services/api'; // Explica: importa dependencias desde '../../constants/api'.
import { ENDPOINTS } from '../../constants/api'; // Explica: importa dependencias desde '../../utils/images'.
import { imageSourceFromBase64 } from '../../utils/images'; // Explica: define COLORS para usarlo en este archivo.

const COLORS = {
  primary: '#8B0000',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#1A1A1A',
  muted: '#777777',
  border: '#E0E0E0',
  success: '#2E7D32',
  warning: '#B26A00',
  danger: '#8B0000',
  neutral: '#555555'
}; // Explica: define ESTADO_CONFIG para usarlo en este archivo.

const ESTADO_CONFIG = {
  pendiente: { label: 'Pendiente', color: COLORS.warning },
  aprobado: { label: 'Aprobado', color: COLORS.success },
  en_inspeccion: { label: 'Artículo en revisión', color: COLORS.warning },
  esperando_usuario: { label: 'Esperando confirmación final', color: COLORS.success },
  confirmado: { label: 'Aceptado', color: COLORS.success },
  rechazado: { label: 'Rechazado', color: COLORS.danger },
  devuelto: { label: 'Propuesta rechazada', color: COLORS.danger }
}; // Explica: define formatFecha para usarlo en este archivo.

const formatFecha = (fecha) => {// Control: evalua una condicion para decidir el siguiente paso.
  if (!fecha) // Render: devuelve el resultado que consume React o la funcion llamadora.
    return ''; // Explica: define d para usarlo en este archivo.
  const d = new Date(fecha); // Control: evalua una condicion para decidir el siguiente paso.
  if (Number.isNaN(d.getTime())) // Render: devuelve el resultado que consume React o la funcion llamadora.
    return ''; // Render: devuelve el resultado que consume React o la funcion llamadora.
  return d.toLocaleDateString('es-AR');}; // Explica: exporta este modulo para que otras partes de la app lo usen.
export default // Explica: declara la funcion ArticulosEnSubastasScreen que concentra una parte del flujo.
function ArticulosEnSubastasScreen({ navigation }) {// Estado: crea el estado valores desestructurados y su actualizador.
  const [articulos, setArticulos] = useState([]); // Estado: crea el estado valores desestructurados y su actualizador.
  const [loading, setLoading] = useState(true); // Estado: crea el estado valores desestructurados y su actualizador.
  const [error, setError] = useState(null); // Evento: memoiza el callback cargarArticulos.
  const cargarArticulos = useCallback(async () => {// Control: intenta una operacion y maneja errores si falla.
    try {// Estado: actualiza un valor usado por la interfaz.
      setLoading(true); // Estado: actualiza un valor usado por la interfaz.
      setError(null); // Explica: define data para usarlo en este archivo.
      const data = await api.get(ENDPOINTS.MY_AUCTIONS); // Estado: actualiza un valor usado por la interfaz.
      const lista = data?.productos || data?.articulos || [];
      setArticulos(Array.isArray(lista) ? lista : []);
    } catch (err) {// Estado: actualiza un valor usado por la interfaz.
      setError('No se pudieron cargar tus artículos. Intentá de nuevo.'); // Estado: actualiza un valor usado por la interfaz.
      setArticulos([]);
    } finally {// Estado: actualiza un valor usado por la interfaz.
      setLoading(false);
    }
  }, []); // Explica: ejecuta useFocusEffect como parte del flujo.

  useFocusEffect(
    useCallback(() => {// Explica: ejecuta cargarArticulos como parte del flujo.
      cargarArticulos();
    }, [cargarArticulos])
  ); // Explica: define renderItem para usarlo en este archivo.

  const renderItem = ({ item }) => {// Explica: define estado para usarlo en este archivo.
    const estado = ESTADO_CONFIG[item.estado] || { label: item.estado || 'Pendiente', color: COLORS.neutral }; // Render: devuelve el resultado que consume React o la funcion llamadora.

    return (// UI: renderiza un control presionable para el usuario.
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('ArticuloEnSubastaDetalle', {
          productoId: item.productoId || item.identificador,
          productoResumen: item
        })}>
        
        {item.portada ? // UI: muestra una imagen o recurso visual.
        <Image source={imageSourceFromBase64(item.portada)} style={styles.image} /> : // UI: renderiza el componente View.

        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="cube-outline" size={28} color={COLORS.border} />
          </View>}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.nombre}</Text>
          <Text style={styles.date}>Enviado {formatFecha(item.fecha) || 'recientemente'}</Text>
          <View style={[styles.badge, { backgroundColor: `${estado.color}18` }]}>
            <Text style={[styles.badgeText, { color: estado.color }]}>{estado.label}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
      </TouchableOpacity>);}; // Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente SafeAreaView.
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Tus artículos en subasta</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? // UI: renderiza el componente View.
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        </View> : error ? // UI: renderiza el componente View.
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.primary} />
        <Text style={styles.emptyText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={cargarArticulos}>
          <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View> : // UI: organiza contenido desplazable.
      <FlatList data={articulos} keyExtractor={(item) => String(item.productoId || item.identificador)} renderItem={renderItem} contentContainerStyle={[styles.list, articulos.length === 0 && styles.emptyList]} showsVerticalScrollIndicator={false} ListEmptyComponent={// UI: renderiza el componente View.
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={48} color={COLORS.border} />
          <Text style={styles.emptyText}>Todavía no cargaste artículos para subastar.</Text>
            </View>} />}
    </SafeAreaView>);} // Explica: define styles usando el resultado de StyleSheet.create.
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: COLORS.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: COLORS.white,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border
    },
    backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, fontWeight: '800', color: COLORS.text },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
    list: { padding: 16 },
    emptyList: { flexGrow: 1 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.white,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: 12,
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4
    },
    image: { width: 62, height: 62, borderRadius: 10, marginRight: 12, backgroundColor: COLORS.border },
    imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
    info: { flex: 1, gap: 4 },
    name: { fontSize: 15, color: COLORS.text, fontWeight: '800' },
    date: { fontSize: 12, color: COLORS.muted },
    badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
    badgeText: { fontSize: 12, fontWeight: '800' },
    emptyText: { fontSize: 15, color: COLORS.muted, textAlign: 'center', lineHeight: 22 },
    retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
    retryText: { color: COLORS.white, fontSize: 14, fontWeight: '800' }
  });
