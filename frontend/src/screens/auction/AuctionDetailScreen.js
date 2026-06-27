/*
Intro: AuctionDetailScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/auction/AuctionDetailScreen.js.
Endpoints: AUCTION_BY_ID (/api/auctions/:id: consultar el detalle de una subasta); BID_STATUS (/api/bids/:itemId/status: consultar el estado de puja de un item).
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useState, useRef, useEffect } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, StyleSheet,
  Dimensions } from
'react-native'; // Explica: importa dependencias desde 'react-native-safe-area-context'.
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde 'react-native'.
import { ActivityIndicator } from 'react-native'; // Explica: importa dependencias desde '../../services/api'.
import api from '../../services/api'; // Explica: importa dependencias desde '../../constants/api'.
import { ENDPOINTS } from '../../constants/api'; // Explica: importa dependencias desde '../../utils/auctionState'.
import { formatearFechaHoraSubasta, normalizarEstadoSubasta } from '../../utils/auctionState'; // Explica: importa dependencias desde '../../utils/images'.
import { dataUriFromBase64 } from '../../utils/images'; // Explica: define LOGO usando el resultado de require.

const LOGO = require('../../assets/images/texto_appbar.jpeg'); // Explica: define objeto desestructurado usando el resultado de Dimensions.get.
const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// ESTRUCTURA DE DATOS QUE VIENE DE LA API
// {
//   id:          string
//   titulo:      string
//   descripcion: string
//   imagenes:    string[]   → array de URLs (Cloudinary)
//   moneda:      'ARS' | 'USD'
//   precioBase:  number
//   categoria:   string
//   estado:      'activo' | 'proximamente' | 'finalizado'
// }
// ─────────────────────────────────────────────────────────────

// MOCK — se reemplaza con api.get(ENDPOINTS.AUCTION_BY_ID(productId))
// const PRODUCTO_MOCK = {
//   id: 'ART-00142',
//   titulo: 'Cuadro de rosas',
//   descripcion: 'Hermoso cuadro pintado a mano con técnica al óleo. Dimensiones 80x60cm. Firmado por el artista. En excelente estado de conservación.',
//   imagenes: [null, null, null], // null = placeholder; con API serán URLs
//   moneda: 'USD',
//   precioBase: 500,
//   categoria: 'oro',
//   estado: 'activo',
//   coloresPlaceholder: ['#C9B99A', '#B0BEC5', '#A5C4A8'],
// };
// Explica: exporta este modulo para que otras partes de la app lo usen.
export default // Explica: declara la funcion AuctionDetailScreen que concentra una parte del flujo.
function AuctionDetailScreen({ navigation, route }) {// Explica: define insets usando el resultado de useSafeAreaInsets.
  const insets = useSafeAreaInsets(); // Explica: define productId para usarlo en este archivo.
  const productId = route?.params?.productId; // Explica: define itemIdParam para usarlo en este archivo.
  const itemIdParam = route?.params?.itemId ? Number(route.params.itemId) : null; // const producto  = PRODUCTO_MOCK; // ← reemplazar con fetch por productId
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [producto, setProducto] = useState(null); // Estado: crea el estado valores desestructurados y su actualizador.
  const [loading, setLoading] = useState(true);

  // ── CONEXIÓN BACKEND — detalle de subasta ───────────────────────────
  // Efecto: ejecuta logica cuando cambia el ciclo de vida o sus dependencias.
  useEffect(() => {// Explica: define cargarProducto para usarlo en este archivo.
      const cargarProducto = async () => {// Control: evalua una condicion para decidir el siguiente paso.
        if (!productId) // Render: devuelve el resultado que consume React o la funcion llamadora.
          return; // Control: intenta una operacion y maneja errores si falla.
        try {// Estado: actualiza un valor usado por la interfaz.
          setLoading(true); // GET /api/auctions/:id devuelve { ok, subasta: { articulos: [] } }.
          // Esta pantalla muestra el artículo seleccionado de la subasta sin habilitar pujas.
          // Explica: define data para usarlo en este archivo.
          const data = await api.get(ENDPOINTS.AUCTION_BY_ID(productId)); // Explica: define subasta para usarlo en este archivo.
          const subasta = data?.subasta; // Explica: define articulo para usarlo en este archivo.
          const articulo = itemIdParam ? subasta?.articulos?.find((item) => Number(item.itemId) === itemIdParam) : subasta?.articulos?.[0]; // Control: evalua una condicion para decidir el siguiente paso.

          if (!subasta || !articulo?.itemId) {
            throw new Error('La subasta no contiene un artículo disponible.');
          } // Explica: define estadoPuja para usarlo en este archivo.

          const estadoPuja = await api.get(ENDPOINTS.BID_STATUS(articulo.itemId)); // Explica: define estadoNormalizado usando el resultado de normalizarEstadoSubasta.
          const estadoNormalizado = normalizarEstadoSubasta(subasta.estado, estadoPuja?.cerrado); // Explica: define imagenes usando el resultado de map.
          const imagenes = (estadoPuja?.fotos || []).map((foto) =>
          dataUriFromBase64(foto?.foto, foto?.mimeType)
          ); // Estado: actualiza un valor usado por la interfaz.

          setProducto({
            id: subasta.subastaId,
            itemId: articulo.itemId,
            titulo: estadoPuja?.nombre || articulo.nombre || subasta.nombreArticulo || 'Producto',
            descripcion: estadoPuja?.descripcion || 'Sin descripción disponible.',
            imagenes: imagenes.length > 0 ? imagenes : [null],
            moneda: estadoPuja?.moneda || articulo.moneda || 'ARS',
            precioBase: articulo.precioBase ?? estadoPuja?.precioBase ?? 0,
            categoria: estadoPuja?.categoria || subasta.categoria || 'comun',
            estado: estadoNormalizado,
            fechaProximamente: formatearFechaHoraSubasta(subasta.fecha, subasta.hora),
            coloresPlaceholder: ['#C9B99A', '#B0BEC5', '#A5C4A8'],
            articulosIncluidos: subasta.articulos?.map((item) => item.nombre) || []
          });
        } catch (error) {// Explica: ejecuta console.log como parte del flujo.
          console.log('[AuctionDetail] Error al cargar:', error);
          // Si falla el backend el producto queda null y la pantalla muestra vacío
        } finally {// Estado: actualiza un valor usado por la interfaz.
          setLoading(false);
        }
      }; // Explica: ejecuta cargarProducto como parte del flujo.
      cargarProducto();
    }, [productId, itemIdParam]);
  // ─────────────────────────────────────────────────────────────────────
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [activeSlide, setActiveSlide] = useState(0); // Explica: define onSlideChange para usarlo en este archivo.

  const onSlideChange = (e) => {// Explica: define slide usando el resultado de Math.round.
    const slide = Math.round(e.nativeEvent.contentOffset.x / width); // Estado: actualiza un valor usado por la interfaz.
    setActiveSlide(slide);
  }; // Control: evalua una condicion para decidir el siguiente paso.

  if (loading || !producto) // Render: devuelve el resultado que consume React o la funcion llamadora.
    return (// UI: renderiza el componente View.
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8b0000" />
    </View>); // Render: devuelve el resultado que consume React o la funcion llamadora.
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

      {/* ── Contenido scrolleable ── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Carrusel de imágenes */}
        <View style={styles.carouselContainer}>
          <FlatList data={producto.imagenes || [null]} keyExtractor={(_, i) => String(i)} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onScroll={onSlideChange}
            scrollEventThrottle={16}
            renderItem={({ item, index }) =>
            item ? // UI: muestra una imagen o recurso visual.
            <Image
              source={{ uri: item }}
              style={styles.carouselImage}
              resizeMode="cover" /> : // UI: renderiza el componente View.


            <View style={[styles.carouselImage, { backgroundColor: producto.coloresPlaceholder?.[index % 3] || '#C9B99A' }]} />

            } />
          

          {/* Dots indicadores */}
          <View style={styles.dotsRow}>
            {(producto.imagenes || [null]).map((_, i) => // UI: renderiza el componente View.
              <View key={i} style={[styles.dot, i === activeSlide && styles.dotActive]} />)}
          </View>
        </View>

        {/* Nombre */}
        <Text style={styles.titulo}>{producto.titulo}</Text>

        {/* ID */}
        <Text style={styles.idText}>ID: {producto.id}</Text>

        {/* Descripción */}
        <Text style={styles.descLabel}>Descripcion</Text>
        <View style={styles.separator} />
        <Text style={styles.descTexto}>{producto.descripcion}</Text>

        {producto.estado === 'proximamente' && // UI: renderiza el componente View.
        <View style={styles.proximamenteBox}>
          <Ionicons name="notifications-outline" size={28} color="#8b0000" />
          <Text style={styles.proximamenteTitulo}>Proximamente</Text>
          <Text style={styles.proximamenteFecha}>{producto.fechaProximamente}</Text>
          </View>}

        {/* Bloque inferior: no puede pujar + login */}
        <View style={styles.actionsContainer}>

          {/* Cartel gris deshabilitado */}
          <View style={styles.btnNoPuede}>
            <Text style={styles.btnNoPuedeText}>No podés participar{'\n'}de la puja sin registrarte</Text>
          </View>

          {/* Botón Iniciar sesión */}
          <TouchableOpacity style={styles.btnLogin} activeOpacity={0.85} onPress={() => navigation.navigate('Auth')}>
            <Ionicons name={producto.estado === 'proximamente' ? 'notifications-outline' : 'log-in-outline'} size={32} color="#FFFFFF" style={styles.btnLoginIcon} />
            <Text style={styles.btnLoginText}>
              {producto.estado === 'proximamente' ? 'Iniciar sesion para agregar recordatorio' : 'Iniciar sesion'}
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

    </View>);} // Explica: define styles usando el resultado de StyleSheet.create.
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#FFFFFF' },

    // Top Bar
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

    // Scroll
    scrollContent: { paddingBottom: 40 },

    // Carrusel
    carouselContainer: {
      marginBottom: 20,
      marginTop: 15
    },
    carouselImage: {
      width,
      height: 260
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 10,
      gap: 6
    },
    dot: {
      width: 8, height: 8,
      borderRadius: 4,
      backgroundColor: '#D0D0D0'
    },
    dotActive: { backgroundColor: '#8b0000', width: 20 },

    // Texto
    titulo: {
      fontSize: 20,
      fontWeight: '800',
      color: '#1A1A1A',
      fontFamily: 'monospace',
      marginBottom: 4,
      paddingHorizontal: 24
    },
    idText: {
      fontSize: 13,
      color: '#555555',
      fontFamily: 'monospace',
      marginBottom: 12,
      paddingHorizontal: 24
    },
    descLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: '#1A1A1A',
      fontFamily: 'monospace',
      marginBottom: 8,
      paddingHorizontal: 24
    },
    separator: {
      height: 1.5,
      backgroundColor: '#BBBBBB',
      marginHorizontal: 24,
      marginBottom: 10
    },
    descTexto: {
      fontSize: 14,
      color: '#444444',
      lineHeight: 22,
      paddingHorizontal: 24,
      marginBottom: 32
    },
    proximamenteBox: {
      marginHorizontal: 24,
      marginBottom: 18,
      backgroundColor: '#FFF5EC',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#F0D8C8',
      paddingVertical: 18,
      paddingHorizontal: 16,
      alignItems: 'center'
    },
    proximamenteTitulo: {
      fontSize: 18,
      fontWeight: '800',
      color: '#1A1A1A',
      marginTop: 6
    },
    proximamenteFecha: {
      fontSize: 14,
      color: '#6B4A3A',
      marginTop: 4,
      textAlign: 'center'
    },

    // Acciones
    actionsContainer: { paddingHorizontal: 24, gap: 12 },

    btnNoPuede: {
      height: 100,
      backgroundColor: '#6e6e6e',
      justifyContent: 'center',
      alignItems: 'center',
      width: '200%',
      alignSelf: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4
    },
    btnNoPuedeText: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: 22
    },

    btnLogin: {
      height: 58,
      backgroundColor: '#8b0000',
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
      width: '90%',
      alignSelf: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6
    },
    btnLoginIcon: { marginRight: 8 },
    btnLoginText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700'
    }
  });
