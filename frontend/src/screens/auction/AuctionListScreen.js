/*
Intro: AuctionListScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/auction/AuctionListScreen.js.
Endpoints: AUCTIONS (/api/auctions: listar subastas con filtros).
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useState, useEffect } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, StyleSheet,
  Image,
  Dimensions,
  Alert } from
'react-native'; // Explica: importa dependencias desde 'react-native-safe-area-context'.
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde '../../services/api'.
import api from '../../services/api'; // Explica: importa dependencias desde '../../constants/api'.
import { ENDPOINTS } from '../../constants/api'; // Explica: importa dependencias desde '../../utils/auctionState'.
import { formatearFechaHoraSubasta, normalizarEstadoSubasta } from '../../utils/auctionState'; // Explica: importa dependencias desde '../../utils/images'.
import { imageSourceFromBase64 } from '../../utils/images'; // Explica: define LOGO usando el resultado de require.

const LOGO = require('../../assets/images/texto_appbar.jpeg'); // Explica: define objeto desestructurado usando el resultado de Dimensions.get.
const { width } = Dimensions.get('window'); // Explica: define CARD_WIDTH para usarlo en este archivo.
const CARD_WIDTH = (width - 16 * 2 - 12) / 2; // Explica: define CARD_HEIGHT para usarlo en este archivo.
const CARD_HEIGHT = CARD_WIDTH * 1.4; // Explica: define CATEGORIAS para usarlo en este archivo.

const CATEGORIAS = {
  especial: ['Especial', 'Plata', 'Oro', 'Platino'],
  comun: ['Comun', 'Especial', 'Plata', 'Oro', 'Platino']
};

// const PRODUCTOS_MOCK = [
//   { id: '1', titulo: 'Cuadro de rosas',  moneda: 'U$D', proximamente: false, color: '#C9B99A' },
//   { id: '2', titulo: 'Silla de oficina', moneda: 'U$D', proximamente: true,  fecha: 'Martes 18, 15:00', color: '#B0BEC5' },
//   { id: '3', titulo: 'Lampara de pared', moneda: 'AR$', proximamente: false, color: '#A5C4A8' },
//   { id: '4', titulo: 'Auto antiguo',     moneda: 'AR$', proximamente: false, color: '#C4A58A' },
// ];
// Explica: exporta este modulo para que otras partes de la app lo usen.
export default // Explica: declara la funcion AuctionListScreen que concentra una parte del flujo.
function AuctionListScreen({ navigation, route }) {// Explica: define insets usando el resultado de useSafeAreaInsets.
  const insets = useSafeAreaInsets(); // Explica: define auctionType para usarlo en este archivo.
  const auctionType = route?.params?.auctionType ?? 'comun'; // Explica: define categorias para usarlo en este archivo.
  const categorias = CATEGORIAS[auctionType] ?? CATEGORIAS.comun; // Estado: crea el estado valores desestructurados y su actualizador.
  const [search, setSearch] = useState(''); // Estado: crea el estado valores desestructurados y su actualizador.
  const [selected, setSelected] = useState(categorias[0]); // Estado: crea el estado valores desestructurados y su actualizador.
  const [productos, setProductos] = useState([]); // Estado: crea el estado valores desestructurados y su actualizador.
  const [loading, setLoading] = useState(false);

  // const productosFiltrados = PRODUCTOS_MOCK.filter(() => true);

  // ── CONEXIÓN BACKEND — listado de subastas ───────────────────────────
  // Efecto: ejecuta logica cuando cambia el ciclo de vida o sus dependencias.
  useEffect(() => {// Explica: define cargarProductos para usarlo en este archivo.
      const cargarProductos = async () => {// Control: intenta una operacion y maneja errores si falla.
        try {// Estado: actualiza un valor usado por la interfaz.
          setLoading(true); // GET /api/auctions?category=CATEGORIA&search=TEXTO
          // Filtra por categoría seleccionada y texto de búsqueda
          // Explica: define data para usarlo en este archivo.
          const data = await api.get(ENDPOINTS.AUCTIONS, { params: {
                tipo: auctionType,
                category: selected.toLowerCase(), // ej: 'oro', 'platino', 'comun'
                search: search || undefined // solo enviar si hay texto
              }
            });
          // @API: El backend devuelve { ok, subastas }; adaptar al formato de las tarjetas.
          // Explica: define subastas para usarlo en este archivo.
          const subastas = Array.isArray(data?.subastas) ? data.subastas :
          Array.isArray(data?.resultados) ?
          data.resultados :
          []; // Estado: actualiza un valor usado por la interfaz.
          setProductos(subastas.map((subasta) => ({
            id: subasta.itemId ? `${subasta.subastaId}-${subasta.itemId}` : String(subasta.subastaId),
            subastaId: subasta.subastaId,
            itemId: subasta.itemId,
            productoId: subasta.productoId,
            titulo: subasta.nombreArticulo || 'Subasta',
            descripcion: subasta.descripcionArticulo || '',
            moneda: subasta.moneda || 'ARS',
            proximamente: normalizarEstadoSubasta(subasta.estado, subasta.cerrado) === 'proximamente',
            finalizado: normalizarEstadoSubasta(subasta.estado, subasta.cerrado) === 'finalizado',
            fecha: subasta.fecha,
            fechaTexto: formatearFechaHoraSubasta(subasta.fecha, subasta.hora),
            estado: subasta.estado,
            portada: subasta.portada
          })));
        } catch (error) {
          // Si falla el backend dejar lista vacía
          // Explica: ejecuta console.log como parte del flujo.
          console.log('[AuctionList] Error al cargar:', error); // Estado: actualiza un valor usado por la interfaz.
          setProductos([]);} finally {// Estado: actualiza un valor usado por la interfaz.
          setLoading(false);
        }
      }; // Explica: ejecuta cargarProductos como parte del flujo.
      cargarProductos();
    }, [selected, search]); // Re-corre cuando cambia el filtro o la búsqueda

  // Usar los productos del estado (backend) en lugar del mock
  // Explica: define productosFiltrados para usarlo en este archivo.
  const productosFiltrados = productos; // ─────────────────────────────────────────────────────────────────────
  // Explica: define pedirLoginRecordatorio para usarlo en este archivo.
  const pedirLoginRecordatorio = (event) => {
    event?.stopPropagation?.(); // Explica: ejecuta Alert.alert como parte del flujo.
    Alert.alert(
      'Recordatorio',
      'Iniciá sesión para agregar recordatorios de subastas.',
      [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Iniciar sesión', onPress: () => navigation.navigate('Auth') }]

    );
  }; // Explica: define renderCard para usarlo en este archivo.

  const renderCard = ({ item, index }) => // UI: renderiza un control presionable para el usuario.
  <TouchableOpacity
    style={[styles.card, index % 2 === 0 ? { marginRight: 6 } : { marginLeft: 6 }]}
    activeOpacity={0.85}
    onPress={() => navigation.navigate('AuctionDetail', { productId: item.subastaId, itemId: item.itemId })}>
    
      {item.portada ? // UI: muestra una imagen o recurso visual.
    <Image
      source={imageSourceFromBase64(item.portada)}
      style={styles.cardImage}
      resizeMode="cover" /> : // UI: renderiza el componente View.


    <View style={[styles.cardImage, { backgroundColor: item.color || '#C9B99A' }]} />
    }

    <View style={styles.badge}>
      <Text style={styles.badgeText}>{item.moneda}</Text>
      </View>

      {item.proximamente && // UI: renderiza el componente View.
    <View style={styles.proximamenteOverlay}>
      <Ionicons name="notifications-outline" size={22} color="#1A1A1A" />
      <Text style={styles.proximamenteTitulo}>Proximamente</Text>
      <Text style={styles.proximamenteFecha}>{item.fechaTexto}</Text>
      <TouchableOpacity style={styles.recordatorioMiniBtn} onPress={pedirLoginRecordatorio}>
        <Text style={styles.recordatorioMiniText}>Agregar recordatorio</Text>
          </TouchableOpacity>
        </View>}

      {item.finalizado && // UI: renderiza el componente View.
    <View style={styles.finalizadoOverlay}>
      <Ionicons name="checkmark-done-outline" size={24} color="#FFFFFF" />
      <Text style={styles.finalizadoTitulo}>FINALIZADA</Text>
        </View>}

    <View style={styles.cardFooter}>
      <Text style={styles.cardTitulo} numberOfLines={1}>{item.titulo}</Text>
        {!!item.descripcion && // UI: muestra texto visible en la pantalla.
      <Text style={styles.cardDesc} numberOfLines={1}>{item.descripcion}</Text>}
      </View>
    </TouchableOpacity>; // Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente View.
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#1A1A1A" />
        </TouchableOpacity>

        <Image source={LOGO} style={styles.logo} resizeMode="contain" />

        <View style={styles.backBtn} />
      </View>

      {/* ── Búsqueda y chips FIJOS ── */}
      <View style={styles.fixedHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9E9E9E" style={styles.searchIcon} />
          <TextInput style={styles.searchInput} placeholder="Buscar" placeholderTextColor="#9E9E9E" value={search} onChangeText={setSearch} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
          {categorias.map((cat) => // UI: renderiza un control presionable para el usuario.
            <TouchableOpacity key={cat} style={[styles.chip, selected === cat && styles.chipSelected]} onPress={() => setSelected(cat)}>
              <Text style={[styles.chipText, selected === cat && styles.chipTextSelected]}>
                {cat}
              </Text>
            </TouchableOpacity>)}
        </ScrollView>
      </View>

      {/* ── Grid SCROLLEABLE ── */}
      <FlatList data={productosFiltrados}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      renderItem={renderCard}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false} />
      

    </View>);

} // Explica: define styles usando el resultado de StyleSheet.create.

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#F0F0F0'
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  logo: { flex: 1, height: 32 },

  fixedHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginTop: 16,
    marginBottom: 12
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#1A1A1A' },

  chipsScroll: { marginBottom: 8 },
  chipsContent: { gap: 8, paddingRight: 8 },
  chip: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#8b0000',
    justifyContent: 'center',
    alignItems: 'center'
  },
  chipSelected: { backgroundColor: '#8b0000' },
  chipText: { fontSize: 14, color: '#8b0000', fontWeight: '600' },
  chipTextSelected: { color: '#FFFFFF' },

  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },

  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    backgroundColor: '#F5F5F5'
  },
  cardImage: { width: '100%', height: '100%', position: 'absolute' },

  badge: {
    position: 'absolute',
    top: 8, right: 8,
    backgroundColor: '#FFFFFFCC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },

  proximamenteOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffffcc'
  },
  proximamenteTitulo: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginTop: 4 },
  proximamenteFecha: { fontSize: 11, color: '#555555', marginTop: 2 },
  finalizadoOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000088'
  },
  finalizadoTitulo: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', marginTop: 4, letterSpacing: 1 },
  recordatorioMiniBtn: {
    marginTop: 8,
    backgroundColor: '#8b0000',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  recordatorioMiniText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },

  cardFooter: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    minHeight: 48,
    backgroundColor: '#8b0000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 5
  },
  cardTitulo: { fontSize: 13, color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
  cardDesc: { fontSize: 10, color: '#F7EAEA', textAlign: 'center', marginTop: 1 }
});
