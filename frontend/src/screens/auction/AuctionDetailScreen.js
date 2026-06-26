import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import { formatearFechaHoraSubasta, normalizarEstadoSubasta } from '../../utils/auctionState';
import { dataUriFromBase64 } from '../../utils/images';

const LOGO  = require('../../assets/images/texto_appbar.jpeg');
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

export default function AuctionDetailScreen({ navigation, route }) {
  const insets    = useSafeAreaInsets();
  const productId = route?.params?.productId;
  const itemIdParam = route?.params?.itemId ? Number(route.params.itemId) : null;
  // const producto  = PRODUCTO_MOCK; // ← reemplazar con fetch por productId

  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── CONEXIÓN BACKEND — detalle de subasta ───────────────────────────
  useEffect(() => {
    const cargarProducto = async () => {
      if (!productId) return;
      try {
        setLoading(true);
        // GET /api/auctions/:id devuelve { ok, subasta: { articulos: [] } }.
        // Esta pantalla muestra el artículo seleccionado de la subasta sin habilitar pujas.
        const data = await api.get(ENDPOINTS.AUCTION_BY_ID(productId));
        const subasta = data?.subasta;
        const articulo = itemIdParam
          ? subasta?.articulos?.find((item) => Number(item.itemId) === itemIdParam)
          : subasta?.articulos?.[0];

        if (!subasta || !articulo?.itemId) {
          throw new Error('La subasta no contiene un artículo disponible.');
        }

        const estadoPuja = await api.get(ENDPOINTS.BID_STATUS(articulo.itemId));
        const estadoNormalizado = normalizarEstadoSubasta(subasta.estado, estadoPuja?.cerrado);
        const imagenes = (estadoPuja?.fotos || []).map((foto) =>
          dataUriFromBase64(foto?.foto, foto?.mimeType)
        );

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
          articulosIncluidos: subasta.articulos?.map((item) => item.nombre) || [],
        });
      } catch (error) {
        console.log('[AuctionDetail] Error al cargar:', error);
        // Si falla el backend el producto queda null y la pantalla muestra vacío
      } finally {
        setLoading(false);
      }
    };
    cargarProducto();
  }, [productId, itemIdParam]);
  // ─────────────────────────────────────────────────────────────────────

  const [activeSlide, setActiveSlide] = useState(0);

  const onSlideChange = (e) => {
    const slide = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveSlide(slide);
  };

  if (loading || !producto) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#8b0000" />
    </View>
  );

  return (
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Carrusel de imágenes */}
        <View style={styles.carouselContainer}>
          <FlatList
            data={producto.imagenes || [null]}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onSlideChange}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => (
              item ? (
                <Image
                  source={{ uri: item }}
                  style={styles.carouselImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.carouselImage, { backgroundColor: producto.coloresPlaceholder?.[index % 3] || '#C9B99A' }]} />
              )
            )}
          />

          {/* Dots indicadores */}
          <View style={styles.dotsRow}>
            {(producto.imagenes || [null]).map((_, i) => (
              <View key={i} style={[styles.dot, i === activeSlide && styles.dotActive]} />
            ))}
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

        {producto.estado === 'proximamente' && (
          <View style={styles.proximamenteBox}>
            <Ionicons name="notifications-outline" size={28} color="#8b0000" />
            <Text style={styles.proximamenteTitulo}>Proximamente</Text>
            <Text style={styles.proximamenteFecha}>{producto.fechaProximamente}</Text>
          </View>
        )}

        {/* Bloque inferior: no puede pujar + login */}
        <View style={styles.actionsContainer}>

          {/* Cartel gris deshabilitado */}
          <View style={styles.btnNoPuede}>
            <Text style={styles.btnNoPuedeText}>No podés participar{'\n'}de la puja sin registrarte</Text>
          </View>

          {/* Botón Iniciar sesión */}
          <TouchableOpacity
            style={styles.btnLogin}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Auth')}
          >
            <Ionicons
              name={producto.estado === 'proximamente' ? 'notifications-outline' : 'log-in-outline'}
              size={32}
              color="#FFFFFF"
              style={styles.btnLoginIcon}
            />
            <Text style={styles.btnLoginText}>
              {producto.estado === 'proximamente' ? 'Iniciar sesion para agregar recordatorio' : 'Iniciar sesion'}
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Top Bar
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#F0F0F0',
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  logo:    { flex: 1, height: 32 },

  // Scroll
  scrollContent: { paddingBottom: 40 },

  // Carrusel
  carouselContainer: { 
    marginBottom: 20, 
    marginTop: 15,
  },
  carouselImage: {
    width,
    height: 260,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D0D0',
  },
  dotActive: { backgroundColor: '#8b0000', width: 20 },

  // Texto
  titulo: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    fontFamily: 'monospace',
    marginBottom: 4,
    paddingHorizontal: 24,
  },
  idText: {
    fontSize: 13,
    color: '#555555',
    fontFamily: 'monospace',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  descLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'monospace',
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  separator: {
    height: 1.5,
    backgroundColor: '#BBBBBB',
    marginHorizontal: 24,
    marginBottom: 10,
  },
  descTexto: {
    fontSize: 14,
    color: '#444444',
    lineHeight: 22,
    paddingHorizontal: 24,
    marginBottom: 32,
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
    alignItems: 'center',
  },
  proximamenteTitulo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 6,
  },
  proximamenteFecha: {
    fontSize: 14,
    color: '#6B4A3A',
    marginTop: 4,
    textAlign: 'center',
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
    shadowRadius: 4,
  },
  btnNoPuedeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
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
    shadowRadius: 6,
  },
  btnLoginIcon: { marginRight: 8 },
  btnLoginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
