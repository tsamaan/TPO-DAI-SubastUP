import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  Switch,
  Modal,
  TextInput,
  Clipboard,
  ToastAndroid,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import useAuthStore from '../../store/authStore';
import { formatearFechaHoraSubasta, normalizarEstadoSubasta } from '../../utils/auctionState';
import { dataUriFromBase64 } from '../../utils/images';

const LOGO        = require('../../assets/images/texto_appbar.jpeg');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

// ─── Bottom nav ───────────────────────────────────────────────────────────────
const BOTTOM_NAV_TABS = [
  { name: 'Main',     label: 'Inicio',   icon: 'home-outline' },
  { name: 'Chats',      label: 'Mensajes', icon: 'mail-outline' },
  { name: 'CargarProducto', label: 'Publicar', icon: 'add-circle-outline' },
  { name: 'PujarAuth',    label: 'Pujar',    icon: 'flag-outline' },
];

// ─── Drawer ───────────────────────────────────────────────────────────────────
const DRAWER_GROUPS = [
  [
    { label: 'Mi cuenta',     icon: 'person-circle-outline', nav: 'MiCuenta' },
    { label: 'Configuracion', icon: 'settings-outline',      nav: 'Configuracion' },
    { label: 'Ayuda',         icon: 'help-circle-outline',   nav: 'Ayuda' },
  ],
  [
    { label: 'Pujar',           icon: 'pricetag-outline',   nav: 'AuctionListAuth', navParams: { auctionType: 'comun' } },
    { label: 'Cargar producto', icon: 'add-square-outline', nav: null },
    { label: 'Mensajes',        icon: 'mail-outline',       nav: 'Chats' },
  ],
  [
    { label: 'Cerrar sesion', icon: 'log-out-outline', nav: null, isLogout: true },
  ],
];

const NOTIFICATIONS = [];

// ─── MOCK — BACKEND INTEGRATION ──────────────────────────────────────────────
// TODO BACKEND: Eliminar PRODUCTOS_MOCK y DURACION_SUBASTA_SEGUNDOS.
// Reemplazar la carga de datos por:
//   const { data: producto } = await api.get(ENDPOINTS.AUCTION_BY_ID(productId))
// El objeto debe tener la forma:
// {
//   id:                string
//   titulo:            string
//   descripcion:       string
//   imagenes:          string[]   → URLs de Cloudinary (ya no nulls)
//   moneda:            'AR$' | 'U$D'
//   ultimaPuja:        number     → precio de la última puja (actualizado en tiempo real)
//   estado:            'proximamente' | 'vivo' | 'finalizado'
//   fechaProximamente: string | null
//   enlace:            string | null  → URL de transmisión en vivo
//   articulosIncluidos: string[]
// }
// El campo "coloresPlaceholder" puede eliminarse una vez que lleguen URLs reales de Cloudinary.

const DURACION_SUBASTA_SEGUNDOS = 60; // TODO BACKEND: este valor debe venir del campo duracionSegundos del objeto subasta
const ORDEN_CATEGORIAS = ['comun', 'especial', 'plata', 'oro', 'platino'];

const categoriaAlcanza = (categoriaUsuario, categoriaSubasta) => {
  const idxUsuario = ORDEN_CATEGORIAS.indexOf(String(categoriaUsuario || 'comun').toLowerCase());
  const idxSubasta = ORDEN_CATEGORIAS.indexOf(String(categoriaSubasta || 'comun').toLowerCase());
  if (idxUsuario === -1 || idxSubasta === -1) return false;
  return idxUsuario >= idxSubasta;
};

const formatearCategoria = (categoria) =>
  String(categoria || 'comun').replace(/^./, (letra) => letra.toUpperCase());

const obtenerNombreUsuario = (usuario) =>
  usuario?.name || usuario?.nombre || usuario?.email || 'Usuario';

const obtenerIniciales = (nombre = '') => {
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean);
  const letras = partes.length > 1
    ? `${partes[0][0]}${partes[1][0]}`
    : String(nombre).slice(0, 2);
  return letras.toUpperCase() || 'US';
};

// const PRODUCTOS_MOCK = {
//   '1': {
//     id: 'ART-00142',
//     titulo: 'Cuadro de rosas',
//     descripcion: 'Hermoso cuadro pintado a mano con técnica al óleo. Dimensiones 80x60cm. Firmado por el artista. En excelente estado de conservación.',
//     imagenes: [null, null, null],           // TODO BACKEND: reemplazar nulls por URLs de Cloudinary
//     coloresPlaceholder: ['#C9B99A', '#B0BEC5', '#A5C4A8'], // TODO BACKEND: eliminar cuando lleguen imágenes reales
//     moneda: 'AR$',                          // TODO BACKEND: viene del objeto subasta
//     ultimaPuja: 2000,                       // TODO BACKEND: viene del objeto subasta (actualizar en tiempo real via WebSocket o polling)
//     estado: 'vivo',                         // TODO BACKEND: viene del objeto subasta
//     fechaProximamente: null,
//     enlace: 'https://stream.subastup.com/live/ART-00142', // TODO BACKEND: viene del objeto subasta
//     articulosIncluidos: ['Cuadro 80x60cm', 'Certificado de autenticidad'], // TODO BACKEND: viene del objeto subasta
//   },
//   '2': {
//     id: 'ART-00143',
//     titulo: 'Silla de oficina',
//     descripcion: 'Silla ergonómica en perfecto estado. Regulación de altura y apoyabrazos.',
//     imagenes: [null, null],
//     coloresPlaceholder: ['#B0BEC5', '#90A4AE'],
//     moneda: 'U$D',
//     ultimaPuja: 150,
//     estado: 'proximamente',
//     fechaProximamente: 'Lunes 2, 19:30',
//     enlace: null,
//     articulosIncluidos: [],
//   },
//   '3': {
//     id: 'ART-00144',
//     titulo: 'Lampara de pared',
//     descripcion: 'Lámpara vintage de pared, estilo industrial. Incluye bombilla LED.',
//     imagenes: [null, null],
//     coloresPlaceholder: ['#A5C4A8', '#80CBC4'],
//     moneda: 'AR$',
//     ultimaPuja: 800,
//     estado: 'vivo',
//     fechaProximamente: null,
//     enlace: 'https://stream.subastup.com/live/ART-00144',
//     articulosIncluidos: ['Lámpara de pared', 'Bombilla LED incluida', 'Cable de 1.5m'],
//   },
//   '4': {
//     id: 'ART-00145',
//     titulo: 'Auto antiguo',
//     descripcion: 'Volkswagen Escarabajo 1972 en excelente estado de conservación.',
//     imagenes: [null, null],
//     coloresPlaceholder: ['#C4A58A', '#BCAAA4'],
//     moneda: 'AR$',
//     ultimaPuja: 500000,
//     estado: 'vivo',
//     fechaProximamente: null,
//     enlace: 'https://stream.subastup.com/live/ART-00145',
//     articulosIncluidos: ['Volkswagen Escarabajo 1972'],
//   },
// };

// ─── Helper: mostrar toast (Android) o Alert (iOS) ───────────────────────────
const mostrarToast = (msg) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert('', msg);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
export default function AuctionDetailAuthScreen({ navigation, route }) {
  const insets    = useSafeAreaInsets();
  const productId = route?.params?.productId ?? '1';
  const itemIdParam = route?.params?.itemId ? Number(route.params.itemId) : null;
  // const producto  = PRODUCTOS_MOCK[productId] ?? PRODUCTOS_MOCK['1'];

  const user = useAuthStore((s) => s.user);
  const MI_USER_ID = String(user?.id ?? 'user-mock-123');
  const userName = obtenerNombreUsuario(user);
  const userInitials = obtenerIniciales(userName);

  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Datos en tiempo real ──────────────────────
  const [ultimaPujaLocal,    setUltimaPujaLocal]    = useState(0);
  const [ultimoPujadorId,    setUltimoPujadorId]    = useState(null); // TODO BACKEND: llega del WebSocket
  const [verificandoRequisitos, setVerificandoRequisitos] = useState(false);
  const [modalRestriccion, setModalRestriccion] = useState(false);
  const [mensajeRestriccion, setMensajeRestriccion] = useState('');
  const ultimaPujaAtRef = useRef(null);
  const [ultimaPujaAtState, setUltimaPujaAtState] = useState(null);

  // ── CONEXIÓN BACKEND — detalle de subasta ───────────────────────────
  useEffect(() => {
    const cargarProducto = async () => {
      if (!productId) return;
      try {
        setLoading(true);
        // GET /api/auctions/:id devuelve { ok, subasta: { articulos: [] } }.
        // La pantalla trabaja con un único ítem: usa el seleccionado desde la card.
        const data = await api.get(ENDPOINTS.AUCTION_BY_ID(productId));
        const subasta = data?.subasta;
        const articulo = itemIdParam
          ? subasta?.articulos?.find((item) => Number(item.itemId) === itemIdParam)
          : subasta?.articulos?.[0];

        if (!subasta || !articulo?.itemId) {
          throw new Error('La subasta no contiene un artículo disponible.');
        }

        // El estado de puja aporta precio actual, descripción y fotos del ítem.
        const estadoPuja = await api.get(ENDPOINTS.BID_STATUS(articulo.itemId));
        const estadoNormalizado = normalizarEstadoSubasta(subasta.estado, estadoPuja?.cerrado);
        const productoNormalizado = {
          id: subasta.subastaId,
          itemId: articulo.itemId,
          titulo: estadoPuja?.nombre || articulo.nombre || 'Producto',
          descripcion: estadoPuja?.descripcion || 'Sin descripción disponible.',
          imagenes: (estadoPuja?.fotos || []).map((foto) =>
            dataUriFromBase64(foto?.foto, foto?.mimeType)
          ),
          coloresPlaceholder: ['#C9B99A'],
          moneda: estadoPuja?.moneda || articulo.moneda || 'ARS',
          ultimaPuja: estadoPuja?.pujaActual ?? articulo.precioBase ?? 0,
          categoria: estadoPuja?.categoria || subasta.categoria || 'comun',
          duenioId: estadoPuja?.duenioId || null,
          estado: estadoNormalizado,
          fechaProximamente: formatearFechaHoraSubasta(subasta.fecha, subasta.hora),
          enlace: null,
          articulosIncluidos: subasta.articulos.map((item) => item.nombre),
        };

        setProducto(productoNormalizado);
        setUltimaPujaLocal(Number(productoNormalizado.ultimaPuja));
        ultimaPujaAtRef.current = estadoPuja?.ultimaPujaAt || null;
        setUltimaPujaAtState(estadoPuja?.ultimaPujaAt || null);
        setSegundosRestantes(estadoPuja?.ultimaPujaAt
          ? Number(estadoPuja?.tiempoRestante ?? DURACION_SUBASTA_SEGUNDOS)
          : DURACION_SUBASTA_SEGUNDOS
        );
      } catch (error) {
        console.log('[AuctionDetail] Error al cargar:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarProducto();
  }, [productId, itemIdParam]);
  // ─────────────────────────────────────────────────────────────────────

  // ── Contador regresivo ────────────────────────
  const [segundosRestantes,  setSegundosRestantes]  = useState(DURACION_SUBASTA_SEGUNDOS);
  const intervalRef = useRef(null);

  const resetContador = useCallback(() => {
    setSegundosRestantes(DURACION_SUBASTA_SEGUNDOS);
  }, []);

  const detenerContador = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  // ── Modales de fin de subasta ─────────────────
  const [modalGanador,   setModalGanador]   = useState(false);
  const [modalPerdedor,  setModalPerdedor]  = useState(false);
  const montadoRef = useRef(true); // evita disparar modales si el usuario ya navegó a otra pantalla
  const cierreProcesadoRef = useRef(false);

  useEffect(() => {
    montadoRef.current = true;
    return () => { montadoRef.current = false; };
  }, []);

  const manejarFinSubasta = useCallback(async () => {
    detenerContador();
    if (!montadoRef.current) return; // el usuario ya salió de la pantalla, no hacer nada
    try {
      const estado = await api.get(ENDPOINTS.BID_STATUS(producto.itemId));
      if (!estado?.cerrado) {
        if (estado?.ultimaPujaAt && estado.ultimaPujaAt !== ultimaPujaAtRef.current) {
          ultimaPujaAtRef.current = estado.ultimaPujaAt;
          setUltimaPujaAtState(estado.ultimaPujaAt);
          setSegundosRestantes(Number(estado?.tiempoRestante ?? DURACION_SUBASTA_SEGUNDOS));
        }
        return;
      }
      if (cierreProcesadoRef.current) return;
      cierreProcesadoRef.current = true;
      setProducto((actual) => ({ ...actual, estado: 'finalizado' }));
      if (String(estado.ganadorId) === String(MI_USER_ID)) {
        setModalGanador(true);
      } else {
        setModalPerdedor(true);
      }
    } catch (error) {
      console.log('[AuctionDetail] Error al confirmar cierre:', error);
    }
  }, [MI_USER_ID, detenerContador, producto?.itemId]);

  // El timer solo corre mientras esta pantalla tiene el foco.
  // Al navegar a otra pantalla se pausa; al volver se reanuda.
  // Así se evita que el modal aparezca en otra pantalla.
  useFocusEffect(
    useCallback(() => {
      if (!producto || producto.estado !== 'vivo' || !ultimaPujaAtState) return;
      intervalRef.current = setInterval(() => {
        setSegundosRestantes((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            manejarFinSubasta();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [producto?.estado, producto?.itemId, ultimaPujaAtState, manejarFinSubasta])
  );

  // El servidor es la fuente de verdad para el cierre y el ganador.
  useEffect(() => {
    if (!producto?.itemId || producto.estado !== 'vivo') return undefined;
    const refrescarEstado = async () => {
      try {
        const estado = await api.get(ENDPOINTS.BID_STATUS(producto.itemId));
        if (estado?.cerrado) {
          manejarFinSubasta();
          return;
        }
        setUltimaPujaLocal(Number(estado?.pujaActual ?? 0));
        if (estado?.ultimaPujaAt && estado.ultimaPujaAt !== ultimaPujaAtRef.current) {
          ultimaPujaAtRef.current = estado.ultimaPujaAt;
          setUltimaPujaAtState(estado.ultimaPujaAt);
          setSegundosRestantes(Number(estado?.tiempoRestante ?? DURACION_SUBASTA_SEGUNDOS));
        }
      } catch (error) {
        console.log('[AuctionDetail] Error al actualizar puja:', error);
      }
    };
    refrescarEstado();
    const intervalo = setInterval(refrescarEstado, 5000);
    return () => clearInterval(intervalo);
  }, [producto?.itemId, producto?.estado, manejarFinSubasta]);

  // Porcentaje para la barra visual
  const porcentajeTiempo = segundosRestantes / DURACION_SUBASTA_SEGUNDOS;

  // ── Carrusel ─────────────────────────────────
  const [activeSlide, setActiveSlide] = useState(0);
  const onSlideChange = (e) => {
    const slide = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveSlide(slide);
  };

  // ── Scroll automático al abrir teclado ───────
  const scrollRef = useRef(null);
  const pujaOffsetY = useRef(0); // posición Y del pujaBloque dentro del ScrollView

  // ── Modales ──────────────────────────────────
  const [modalEnlace,       setModalEnlace]       = useState(false);
  const [modalInfo,         setModalInfo]         = useState(false);
  const [modalRecordatorio, setModalRecordatorio] = useState(false);

  // ── Teclado numérico de puja ──────────────────
  const [tecladoVisible, setTecladoVisible] = useState(false);
  const [montoPuja,      setMontoPuja]      = useState('');

  // ── Método de pago ────────────────────────────
  const [modalSinMetodoPago, setModalSinMetodoPago] = useState(false);

  const abrirTecladoPuja = async () => {
    try {
      setVerificandoRequisitos(true);
      if (producto?.duenioId && String(producto.duenioId) === String(user?.id || user?.personaId)) {
        setMensajeRestriccion('No podés pujar por este artículo porque vos lo publicaste.');
        setModalRestriccion(true);
        return;
      }
      const categoriaUsuario = user?.categoria || 'comun';
      const categoriaSubasta = producto?.categoria || 'comun';
      if (!categoriaAlcanza(categoriaUsuario, categoriaSubasta)) {
        setMensajeRestriccion(
          `Tu categoría ${formatearCategoria(categoriaUsuario)} no te permite participar en subastas de categoría ${formatearCategoria(categoriaSubasta)}.`
        );
        setModalRestriccion(true);
        return;
      }
      const data = await api.get(ENDPOINTS.PAYMENT_METHODS);
      const metodos = Array.isArray(data?.metodos) ? data.metodos : [];
      if (!metodos.some((metodo) => metodo.verificado)) {
        setModalSinMetodoPago(true);
        return;
      }
      setTecladoVisible(true);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: pujaOffsetY.current - 20, animated: true });
      }, 50);
    } catch (error) {
      mostrarToast('No se pudo verificar tu método de pago. Intentá nuevamente.');
    } finally {
      setVerificandoRequisitos(false);
    }
  };

  const handleTecla = async (tecla) => {
    if (tecla === '←') {
      setMontoPuja((prev) => prev.slice(0, -1));
    } else if (tecla === 'Pujar') {
      const monto = Number(montoPuja.replace(',', '.'));
      if (!monto || monto <= ultimaPujaLocal) {
        // Monto inválido o menor/igual a la puja actual — no se permite
        mostrarToast(`La puja debe ser mayor a ${producto.moneda} ${ultimaPujaLocal.toLocaleString('es-AR')}`);
        return;
      }
      
      // ── CONEXIÓN BACKEND — enviar puja ──────────────────────────────────
      try {
        const respuestaPuja = await api.post(ENDPOINTS.BIDS, { auctionId: producto.itemId, amount: monto });
        console.log('[Puja] Monto:', monto, '| Ítem:', producto.itemId);
        setUltimaPujaLocal(monto);
        setUltimoPujadorId(MI_USER_ID); // mock local: en backend llega por WebSocket
        ultimaPujaAtRef.current = respuestaPuja?.ultimaPujaAt || new Date().toISOString();
        setUltimaPujaAtState(ultimaPujaAtRef.current);
        resetContador();
      } catch (error) {
        console.log('[AuctionDetail] Error al pujar:', error);
        const respuesta = error?.response?.data;
        if (respuesta?.codigo === 'METODO_PAGO_REQUERIDO') {
          setModalSinMetodoPago(true);
        } else if (respuesta?.codigo === 'CATEGORIA_INSUFICIENTE') {
          setMensajeRestriccion(respuesta.message);
          setModalRestriccion(true);
        } else {
          mostrarToast(respuesta?.message || 'Error al enviar puja');
        }
      }
      // ──────────────────────────────────────────────────────────────────
      setTecladoVisible(false);
      setMontoPuja('');
    } else {
      setMontoPuja((prev) => prev + tecla);
    }
  };

  const copiarEnlace = () => {
    Clipboard.setString(producto.enlace ?? '');
    mostrarToast('Enlace copiado');
  };

  const agregarRecordatorio = async () => {
    if (!producto?.id) return;
    try {
      const respuesta = await api.post(ENDPOINTS.NOTIF_SUB(producto.id));
      mostrarToast(respuesta?.message || `Recordatorio de ${producto.titulo} agregado correctamente.`);
      setModalRecordatorio(true);
    } catch (error) {
      const mensaje = error?.response?.data?.message || 'No se pudo agregar el recordatorio.';
      Alert.alert('Recordatorio', mensaje);
    }
  };

  // ── Drawer ───────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const translateX     = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const openMenu = () => {
    setMenuOpen(true);
    Animated.parallel([
      Animated.spring(translateX,     { toValue: 0, useNativeDriver: true, bounciness: 2, speed: 16 }),
      Animated.timing(overlayOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(translateX,     { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0,             duration: 220, useNativeDriver: true }),
    ]).start(() => setMenuOpen(false));
  };

  const handleItemPress = (item) => {
    closeMenu();
    if (!item.nav) return;
    const TABS = ['Main', 'Calendar', 'Chats', 'Profile'];
    if (TABS.includes(item.nav)) {
      navigation.navigate(item.nav);
    } else {
      navigation.navigate(item.nav, item.navParams);
    }
  };

  // ── Notif ────────────────────────────────────
  const [notifOpen,      setNotifOpen]      = useState(false);
  const [notifsExpanded, setNotifsExpanded] = useState(true);
  const [configExpanded, setConfigExpanded] = useState(false);
  const [darkTheme,      setDarkTheme]      = useState(true);
  const notifAnim    = useRef(new Animated.Value(0)).current;
  const notifOverlay = useRef(new Animated.Value(0)).current;

  const openNotif = () => {
    setNotifOpen(true);
    Animated.parallel([
      Animated.spring(notifAnim,    { toValue: 1, useNativeDriver: true, bounciness: 3, speed: 14 }),
      Animated.timing(notifOverlay, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  };

  const closeNotif = () => {
    Animated.parallel([
      Animated.timing(notifAnim,    { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(notifOverlay, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setNotifOpen(false));
  };

  const panelTranslateY = notifAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] });
  const panelScale      = notifAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  const panelOpacity    = notifAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const esProximamente = producto?.estado === 'proximamente';
  const esVivo         = producto?.estado === 'vivo';
  const esFinalizado   = producto?.estado === 'finalizado';

  if (loading || !producto) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8b0000" />
      </View>
    );
  }

  // ─────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Header autenticado ───────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={openMenu}>
          <Ionicons name="menu" size={28} color="#1a1a1a" />
        </TouchableOpacity>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        <TouchableOpacity style={styles.headerIcon} onPress={openNotif}>
          <Ionicons name="notifications-outline" size={26} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {/* ── Contenido scrolleable ─────────────────── */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 110 }]}
      >
        {/* Carrusel */}
        <View style={styles.carouselContainer}>
          <FlatList
            data={producto.imagenes || []}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onSlideChange}
            scrollEventThrottle={16}
            renderItem={({ item, index }) =>
              item ? (
                <Image source={{ uri: item }} style={styles.carouselImage} resizeMode="cover" />
              ) : (
                <View style={[styles.carouselImage, { backgroundColor: producto.coloresPlaceholder?.[index % 3] || '#CCC' }]} />
              )
            }
          />
          <View style={styles.dotsRow}>
            {(producto.imagenes || []).map((_, i) => (
              <View key={i} style={[styles.dot, i === activeSlide && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* Título e ID */}
        <Text style={styles.titulo}>{producto.titulo}</Text>
        <Text style={styles.idText}>ID: {producto.id}</Text>

        {/* Descripción — caja scrolleable de altura fija */}
        <Text style={styles.descLabel}>Descripcion</Text>
        <View style={styles.separadorLinea} />
        <ScrollView
          style={styles.descScroll}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.descTexto}>{producto.descripcion}</Text>
        </ScrollView>

        {/* ══ ESTADO: VIVO ══════════════════════════ */}
        {esVivo && (
          <>
            {/* Botones enlace e info */}
            <View style={styles.accionesRow}>
              <TouchableOpacity style={styles.btnAccion} onPress={() => setModalEnlace(true)}>
                <Ionicons name="link-outline" size={24} color="#1A1A1A" />
                <Text style={styles.btnAccionLabel}>Enlace</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnAccion} onPress={() => setModalInfo(true)}>
                <Ionicons name="information-circle-outline" size={24} color="#1A1A1A" />
                <Text style={styles.btnAccionLabel}>Informacion</Text>
              </TouchableOpacity>
            </View>

            {/* Barra de tiempo restante — más delgada */}
            {/* TODO BACKEND: segundosRestantes se resetea localmente al pujar.
                Para sincronizar entre usuarios usar WebSocket: evento 'timer_reset' con { segundos } */}
            <View style={styles.tiempoContainer}>
              <View style={styles.tiempoBarraRow}>
                <Text style={styles.tiempoLabel}>Tiempo restante</Text>
                <Text style={styles.tiempoSeg}>{segundosRestantes} seg</Text>
              </View>
              <View style={styles.tiempoBarra}>
                <View style={[styles.tiempoBarraFill, { width: `${porcentajeTiempo * 100}%` }]} />
              </View>
            </View>

            {/* Bloque de puja: precio actual llamativo + campo de nueva puja */}
            {/* TODO BACKEND: ultimaPujaLocal debe actualizarse en tiempo real via WebSocket
                evento 'nueva_puja': { monto, pujadorId } → setUltimaPujaLocal(monto) */}
            <View
              style={styles.pujaBloque}
              onLayout={(e) => { pujaOffsetY.current = e.nativeEvent.layout.y; }}
            >
              {/* Panel izquierdo: precio actual */}
              <View style={styles.precioActualPanel}>
                <Text style={styles.precioActualLabel}>Puja actual</Text>
                <Text style={styles.precioActualMoneda}>{producto.moneda}</Text>
                <Text style={styles.precioActualMonto}>
                  {ultimaPujaLocal.toLocaleString('es-AR')}
                </Text>
              </View>

              {/* Separador vertical */}
              <View style={styles.pujaSeparadorV} />

              {/* Panel derecho: campo de nueva puja */}
              <TouchableOpacity
                style={styles.nuevaPujaPanel}
                onPress={() => {
                  if (!verificandoRequisitos) abrirTecladoPuja();
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.nuevaPujaLabel}>{verificandoRequisitos ? 'Verificando...' : 'Tu puja'}</Text>
                <View style={styles.nuevaPujaInputRow}>
                  {montoPuja ? (
                    <Text style={styles.nuevaPujaMoneda}>{producto.moneda}</Text>
                  ) : null}
                  <Text style={[styles.nuevaPujaValor, !montoPuja && styles.nuevaPujaPlaceholder]}>
                    {montoPuja
                      ? Number(montoPuja.replace(',','.')).toLocaleString('es-AR')
                      : 'Ingresar'}
                  </Text>
                  <Ionicons name="chevron-up" size={16} color="#8b0000" />
                </View>
                {montoPuja ? (
                  <TouchableOpacity
                    style={styles.nuevaPujaBtnConfirmar}
                    onPress={() => handleTecla('Pujar')}
                  >
                    <Text style={styles.nuevaPujaBtnText}>Pujar</Text>
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ══ ESTADO: PROXIMAMENTE ══════════════════ */}
        {esProximamente && (
          <>
            <View style={styles.proximamenteBtn}>
              <Text style={styles.proximamenteBtnText}>Proximamente</Text>
            </View>
            <Text style={styles.proximamenteFecha}>{producto.fechaProximamente}</Text>

            <TouchableOpacity
              style={styles.recordatorioBtn}
              activeOpacity={0.85}
              onPress={agregarRecordatorio}
            >
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.recordatorioBtnText}>Agregar Recordatorio</Text>
            </TouchableOpacity>
          </>
        )}

        {esFinalizado && (
          <View style={styles.estadoFinalizadoBox}>
            <Ionicons name="lock-closed-outline" size={28} color="#8b0000" />
            <Text style={styles.estadoFinalizadoTitulo}>Subasta finalizada</Text>
            <Text style={styles.estadoFinalizadoTexto}>
              Este artículo ya no admite nuevas pujas.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ══════════════════════════════════════════════
          TECLADO NUMÉRICO (solo estado vivo)
      ══════════════════════════════════════════════ */}
      {tecladoVisible && (
        <TouchableWithoutFeedback onPress={() => setTecladoVisible(false)}>
          <View style={styles.tecladoOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.teclado}>

                {/* ── Banner puja actual (visible solo con teclado abierto) ── */}
                <View style={styles.tecladoPujaActualBanner}>
                  <View style={styles.tecladoPujaActualLeft}>
                    <Text style={styles.tecladoPujaActualLabel}>PUJA ACTUAL</Text>
                    <Text style={styles.tecladoPujaActualMonto}>
                      {producto.moneda}{'  '}
                      <Text style={styles.tecladoPujaActualMontoValor}>
                        {ultimaPujaLocal.toLocaleString('es-AR')}
                      </Text>
                    </Text>
                  </View>
                </View>

                {/* ── Display de monto ── */}
                <View style={styles.tecladoDisplay}>
                  <Text style={styles.tecladoDisplayText}>
                    {producto.moneda}{montoPuja ? `  ${montoPuja}` : '  0'}
                  </Text>
                  <TouchableOpacity
                    style={styles.tecladoPujarBtn}
                    onPress={() => handleTecla('Pujar')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.tecladoPujarText}>Pujar</Text>
                  </TouchableOpacity>
                </View>

                {/* ── Filas de teclas ── */}
                {[
                  ['1','2','3'],
                  ['4','5','6'],
                  ['7','8','9'],
                  [',','0','.'],
                ].map((fila, fi) => (
                  <View key={fi} style={styles.teclaMaFila}>
                    {fila.map((t) => (
                      <TouchableOpacity key={t} style={styles.tecla} onPress={() => handleTecla(t)}>
                        <Text style={styles.teclaText}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                    {fi === 3 && (
                      <TouchableOpacity
                        style={[styles.tecla, styles.teclaBorrar]}
                        onPress={() => handleTecla('←')}
                      >
                        <Ionicons name="backspace-outline" size={22} color="#8b0000" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* ══════════════════════════════════════════════
          MODAL SIN MÉTODO DE PAGO APROBADO
      ══════════════════════════════════════════════ */}
      <Modal visible={modalSinMetodoPago} transparent animationType="fade" onRequestClose={() => setModalSinMetodoPago(false)}>
        <TouchableWithoutFeedback onPress={() => setModalSinMetodoPago(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalCard, styles.modalSinPagoCard]}>
                <TouchableOpacity style={styles.modalCloseX} onPress={() => setModalSinMetodoPago(false)}>
                  <Ionicons name="close" size={22} color="#1A1A1A" />
                </TouchableOpacity>

                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderText}>Método de pago requerido</Text>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.sinPagoIconCircle}>
                    <Ionicons name="card-outline" size={44} color="#8b0000" />
                  </View>
                  <Text style={styles.sinPagoTitulo}>
                    Necesitás un método de pago aprobado para poder pujar.
                  </Text>
                  <Text style={styles.sinPagoSubtitulo}>
                    Agregá un medio de pago y esperá su verificación para participar en subastas.
                  </Text>
                  <TouchableOpacity
                    style={styles.sinPagoBtn}
                    activeOpacity={0.85}
                    onPress={() => {
                      setModalSinMetodoPago(false);
                      // TODO BACKEND: la pantalla MetodosDePago aún no existe.
                      // Cuando se cree, registrarla en AppNavigator con:
                      //   <Stack.Screen name="MetodosDePago" component={MetodosDePagoScreen} />
                      navigation.navigate('MetodosDePago');
                    }}
                  >
                    <Ionicons name="card-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.sinPagoBtnText}>Métodos de pago</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* La autorización de categoría se valida definitivamente en el backend. */}
      <Modal visible={modalRestriccion} transparent animationType="fade" onRequestClose={() => setModalRestriccion(false)}>
        <TouchableWithoutFeedback onPress={() => setModalRestriccion(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalCard, styles.modalSinPagoCard]}>
                <TouchableOpacity style={styles.modalCloseX} onPress={() => setModalRestriccion(false)}>
                  <Ionicons name="close" size={22} color="#1A1A1A" />
                </TouchableOpacity>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderText}>Categoría no habilitada</Text>
                </View>
                <View style={styles.modalBody}>
                  <View style={styles.sinPagoIconCircle}>
                    <Ionicons name="lock-closed-outline" size={44} color="#8b0000" />
                  </View>
                  <Text style={styles.sinPagoTitulo}>No podés participar en esta subasta.</Text>
                  <Text style={styles.sinPagoSubtitulo}>{mensajeRestriccion}</Text>
                  <TouchableOpacity style={styles.sinPagoBtn} onPress={() => setModalRestriccion(false)}>
                    <Text style={styles.sinPagoBtnText}>Entendido</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL ENLACE
      ══════════════════════════════════════════════ */}
      <Modal visible={modalEnlace} transparent animationType="fade" onRequestClose={() => setModalEnlace(false)}>
        <TouchableWithoutFeedback onPress={() => setModalEnlace(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                {/* Botón cerrar */}
                <TouchableOpacity style={styles.modalCloseX} onPress={() => setModalEnlace(false)}>
                  <Ionicons name="close" size={22} color="#1A1A1A" />
                </TouchableOpacity>

                {/* Header rojo */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderText}>Enlace a subasta en vivo</Text>
                </View>

                {/* Enlace + copiar */}
                <View style={styles.enlaceRow}>
                  <Text style={styles.enlaceTexto} numberOfLines={1}>{producto.enlace}</Text>
                  <TouchableOpacity onPress={copiarEnlace} style={styles.enlaceCopyBtn}>
                    <Ionicons name="copy-outline" size={20} color="#555" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL INFORMACIÓN
      ══════════════════════════════════════════════ */}
      <Modal visible={modalInfo} transparent animationType="fade" onRequestClose={() => setModalInfo(false)}>
        <TouchableWithoutFeedback onPress={() => setModalInfo(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                {/* Botón cerrar */}
                <TouchableOpacity style={styles.modalCloseX} onPress={() => setModalInfo(false)}>
                  <Ionicons name="close" size={22} color="#1A1A1A" />
                </TouchableOpacity>

                {/* Header rojo */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderText}>Detalles</Text>
                </View>

                {/* Contenido */}
                <View style={styles.modalBody}>
                  <Text style={styles.infoTitulo}>{producto.titulo}</Text>
                  <View style={styles.infoIdBadge}>
                    <Text style={styles.infoIdText}>Id: {producto.id}</Text>
                  </View>

                  <Text style={styles.infoSubtitulo}>Articulos incluidos</Text>
                  <View style={styles.infoArticulosBox}>
                    {(producto.articulosIncluidos || []).map((art, i) => (
                      <Text key={i} style={styles.infoArticuloItem}>{art}</Text>
                    ))}
                  </View>

                  <Text style={styles.infoPrecioBase}>-----</Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL RECORDATORIO (proximamente)
      ══════════════════════════════════════════════ */}
      <Modal visible={modalRecordatorio} transparent animationType="fade" onRequestClose={() => setModalRecordatorio(false)}>
        <TouchableWithoutFeedback onPress={() => setModalRecordatorio(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalCard, styles.modalRecordatorioCard]}>
                <View style={styles.recordatorioIconCircle}>
                  <Ionicons name="information-circle-outline" size={40} color="#1A1A1A" />
                </View>
                <Text style={styles.recordatorioTitulo}>Recordatorio agregado</Text>
                <Text style={styles.recordatorioBody}>
                  Tu recordatorio fue registrado correctamente. También lo vas a ver en la campanita.
                </Text>
                <TouchableOpacity
                  style={styles.recordatorioCerrarBtn}
                  onPress={() => setModalRecordatorio(false)}
                >
                  <Text style={styles.recordatorioCerrarText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL FIN DE SUBASTA — GANADOR
          TODO BACKEND: este modal debe abrirse al recibir evento WebSocket
          'subasta_finalizada' con { ganadorId } donde ganadorId === userId del authStore
          También enviar push notification al ganador con datos de envío
      ══════════════════════════════════════════════ */}
      <Modal visible={modalGanador} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>¡Ganaste la subasta!</Text>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.finIconRow}>
                <Ionicons name="trophy-outline" size={48} color="#8b0000" />
              </View>
              <Text style={styles.finTitulo}>¡Felicitaciones!</Text>
              <Text style={styles.finBody}>
                Sos el ganador de "{producto.titulo}".{'\n\n'}
                Te enviaremos un correo con los datos de envío y pago a la brevedad.
              </Text>
              <TouchableOpacity
                style={styles.finAceptarBtn}
                onPress={() => {
                  setModalGanador(false);
                  // TODO BACKEND: marcar la subasta como 'finalizado' en el store local
                  // para que desaparezca de los listados
                  navigation.navigate('Main');
                }}
              >
                <Text style={styles.finAceptarText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════
          MODAL FIN DE SUBASTA — PERDEDOR / ESPECTADOR
          TODO BACKEND: este modal debe abrirse al recibir evento WebSocket
          'subasta_finalizada' con { ganadorId } donde ganadorId !== userId del authStore
      ══════════════════════════════════════════════ */}
      <Modal visible={modalPerdedor} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>Subasta finalizada</Text>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.finIconRow}>
                <Ionicons name="flag-outline" size={48} color="#6e6e6e" />
              </View>
              <Text style={styles.finTitulo}>La subasta ha concluido</Text>
              <Text style={styles.finBody}>
                La subasta de "{producto.titulo}" finalizó.{'\n\n'}
                Seguí explorando más subastas disponibles.
              </Text>
              <TouchableOpacity
                style={styles.finAceptarBtn}
                onPress={() => {
                  setModalPerdedor(false);
                  // TODO BACKEND: marcar la subasta como 'finalizado' en el store local
                  // para que desaparezca de los listados
                  navigation.navigate('Main');
                }}
              >
                <Text style={styles.finAceptarText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════
          OVERLAY + PANEL NOTIFICACIONES
      ══════════════════════════════════════════════ */}
      {notifOpen && (
        <>
          <TouchableWithoutFeedback onPress={closeNotif}>
            <Animated.View style={[styles.overlay, { opacity: notifOverlay }]} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.notifPanel,
              {
                top: insets.top + 56,
                opacity:   panelOpacity,
                transform: [{ translateY: panelTranslateY }, { scale: panelScale }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.notifSectionHeader}
              onPress={() => setNotifsExpanded(v => !v)}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={20} color="#1a1a1a" style={{ marginRight: 8 }} />
              <Text style={styles.notifSectionTitle}>Notificaciones</Text>
              <Ionicons name={notifsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#1a1a1a" />
            </TouchableOpacity>

            {notifsExpanded && (
              <View style={styles.notifContent}>
                {NOTIFICATIONS.length === 0
                  ? <Text style={styles.notifEmpty}>{'<<No hay notificaciones>>'}</Text>
                  : NOTIFICATIONS.map((n, i) => <Text key={i} style={styles.notifItem}>{n}</Text>)
                }
              </View>
            )}

            <View style={styles.notifDivider} />

            <TouchableOpacity
              style={styles.notifSectionHeader}
              onPress={() => setConfigExpanded(v => !v)}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={20} color="#1a1a1a" style={{ marginRight: 8 }} />
              <Text style={styles.notifSectionTitle}>Configuracion</Text>
              <Ionicons name={configExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#1a1a1a" />
            </TouchableOpacity>

            {configExpanded && (
              <View style={styles.configContent}>
                <View style={styles.themeRow}>
                  <Ionicons name="moon-outline" size={20} color="#1a1a1a" style={{ marginRight: 10 }} />
                  <Text style={styles.themeLabel}>Tema</Text>
                  <Switch
                    value={darkTheme}
                    onValueChange={setDarkTheme}
                    thumbColor="#FFFFFF"
                    trackColor={{ false: '#C0B0A8', true: '#8b0000' }}
                    style={{ marginLeft: 'auto' }}
                  />
                </View>
              </View>
            )}
          </Animated.View>
        </>
      )}

      {/* ══════════════════════════════════════════════
          OVERLAY + DRAWER HAMBURGUESA
      ══════════════════════════════════════════════ */}
      {menuOpen && (
        <TouchableWithoutFeedback onPress={closeMenu}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
        </TouchableWithoutFeedback>
      )}

      <Animated.View
        style={[
          styles.drawer,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateX }],
          },
        ]}
      >
        <TouchableOpacity style={styles.closeBtn} onPress={closeMenu}>
          <Ionicons name="chevron-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>

        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{userInitials}</Text>
          </View>
          <Text style={styles.userName}>{userName}</Text>
        </View>

        <ScrollView style={styles.drawerScroll} showsVerticalScrollIndicator={false}>
          {DRAWER_GROUPS.map((group, gi) => (
            <View key={gi}>
              {gi > 0 && <View style={styles.separator} />}
              {group.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  style={styles.drawerItem}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.6}
                >
                  <Ionicons name={item.icon} size={22} color="#1a1a1a" style={styles.drawerItemIcon} />
                  <Text style={styles.drawerItemLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* ── Barra de navegación inferior ─────────── */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 8 }]}>
        {BOTTOM_NAV_TABS.map((tab, i) => {
          const isActive = false;
          return (
            <TouchableOpacity
              key={i}
              style={styles.tabItem}
              onPress={() => navigation.navigate(tab.name)}
            >
              <Ionicons
                name={tab.icon}
                size={24}
                color={isActive ? '#8b0000' : '#9E9E9E'}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  headerIcon: { padding: 4, width: 40 },
  logo:       { width: '45%', height: 32, alignSelf: 'center' },

  // Scroll
  scrollContent: { paddingBottom: 40 },

  // Carrusel
  carouselContainer: { marginBottom: 20, marginTop: 15 },
  carouselImage:     { width: SCREEN_WIDTH, height: 260 },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D0D0D0' },
  dotActive: { backgroundColor: '#8b0000', width: 20 },

  // Texto
  titulo: {
    fontSize: 20, fontWeight: '800', color: '#1A1A1A',
    fontFamily: 'monospace', marginBottom: 4, paddingHorizontal: 24,
  },
  idText: {
    fontSize: 13, color: '#555555',
    fontFamily: 'monospace', marginBottom: 16, paddingHorizontal: 24,
  },
  descLabel: {
    fontSize: 14, fontWeight: '700', color: '#1A1A1A',
    fontFamily: 'monospace', marginBottom: 8, paddingHorizontal: 24,
  },
  separadorLinea: {
    height: 1.5, backgroundColor: '#BBBBBB',
    marginHorizontal: 24, marginBottom: 10,
  },
  descTexto: {
    fontSize: 14, color: '#444444', lineHeight: 22,
    padding: 12,
  },
  descScroll: {
    maxHeight: 80,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },

  // ── Estado VIVO ──
  accionesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  btnAccion: {
    flex: 0.45,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    gap: 8,
  },
  btnAccionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  tiempoContainer: { paddingHorizontal: 24, marginBottom: 14 },
  tiempoBarraRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  tiempoLabel: { fontSize: 12, color: '#888', fontWeight: '500' },
  tiempoBarra: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  tiempoBarraFill: { height: '100%', backgroundColor: '#8b0000', borderRadius: 3 },
  tiempoSeg: { fontSize: 12, color: '#8b0000', fontWeight: '700' },

  // Bloque de puja: precio actual + nueva puja
  pujaBloque: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 100,
  },
  precioActualPanel: {
    flex: 1,
    backgroundColor: '#8b0000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 10,
    gap: 2,
  },
  precioActualLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  precioActualMoneda: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  precioActualMonto: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pujaSeparadorV: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  nuevaPujaPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
    gap: 6,
  },
  nuevaPujaLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  nuevaPujaInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nuevaPujaMoneda: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  nuevaPujaValor: {
    fontSize: 20,
    color: '#1A1A1A',
    fontWeight: '700',
  },
  nuevaPujaPlaceholder: {
    color: '#BDBDBD',
    fontSize: 16,
    fontWeight: '400',
  },
  nuevaPujaBtnConfirmar: {
    marginTop: 4,
    backgroundColor: '#8b0000',
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 8,
  },
  nuevaPujaBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Estado PROXIMAMENTE ──
  proximamenteBtn: {
    marginHorizontal: 24,
    height: 52,
    backgroundColor: '#6e6e6e',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  proximamenteBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  proximamenteFecha: {
    textAlign: 'center',
    fontSize: 14,
    color: '#444',
    marginBottom: 16,
  },
  estadoFinalizadoBox: {
    marginHorizontal: 24,
    marginTop: 10,
    backgroundColor: '#FFF5EC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0D8C8',
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  estadoFinalizadoTitulo: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 6,
  },
  estadoFinalizadoTexto: {
    color: '#6B4A3A',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  recordatorioBtn: {
    marginHorizontal: 24,
    height: 52,
    backgroundColor: '#8b0000',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  recordatorioBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  // ── Teclado numérico ──
  tecladoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.10)',
    justifyContent: 'flex-end',
    zIndex: 40,
  },
  teclado: {
    backgroundColor: '#ECEFF1',
    paddingBottom: 16,
    paddingTop: 8,
  },
  tecladoDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 8,
    gap: 12,
  },
  tecladoDisplayText: { flex: 1, fontSize: 18, color: '#6e6e6e', fontWeight: '600' },
  tecladoPujarBtn: {
    backgroundColor: '#8b0000',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tecladoPujarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  teclaMaFila: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  tecla: {
    flex: 1,
    marginHorizontal: 4,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  teclaBorrar: {
    backgroundColor: '#FFF0F0',
  },
  teclaText: { fontSize: 22, color: '#1A1A1A', fontWeight: '400' },

  // ── Modales compartidos ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 20,
  },
  modalCloseX: {
    position: 'absolute',
    top: 10, right: 12,
    zIndex: 10,
    padding: 4,
  },
  modalHeader: {
    backgroundColor: '#8b0000',
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalHeaderText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Modal enlace
  enlaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    margin: 16,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  enlaceTexto:   { flex: 1, fontSize: 14, color: '#555', fontFamily: 'monospace' },
  enlaceCopyBtn: { padding: 4 },

  // Modal info
  modalBody: { padding: 20 },
  infoTitulo: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  infoIdBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#8b0000',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
  },
  infoIdText:    { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  infoSubtitulo: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 10, textAlign: 'left' },
  infoArticulosBox: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    minHeight: 80,
    gap: 10,
  },
  infoArticuloItem: { fontSize: 14, color: '#555', fontFamily: 'monospace' },
  infoPrecioBase:   { fontSize: 14, color: '#555', fontFamily: 'monospace', textAlign: 'left' },

  // Modal recordatorio
  modalRecordatorioCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
  },
  recordatorioIconCircle: { marginBottom: 16 },
  recordatorioTitulo: {
    fontSize: 18, fontWeight: '700', color: '#1A1A1A',
    textAlign: 'center', marginBottom: 12,
  },
  recordatorioBody: {
    fontSize: 14, color: '#555', textAlign: 'center',
    lineHeight: 20, marginBottom: 24,
  },
  recordatorioCerrarBtn: {
    backgroundColor: '#8b0000',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  recordatorioCerrarText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  // Overlay compartido
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 10,
  },

  // Panel notificaciones
  notifPanel: {
    position: 'absolute',
    right: 12,
    width: SCREEN_WIDTH - 48,
    backgroundColor: '#FFF5EC',
    borderRadius: 16,
    zIndex: 30,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    overflow: 'hidden',
  },
  notifSectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14,
  },
  notifSectionTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  notifContent: {
    backgroundColor: '#F5E8DC',
    marginHorizontal: 14, marginBottom: 12,
    borderRadius: 10, minHeight: 80,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 20, paddingHorizontal: 16,
  },
  notifEmpty: { fontSize: 13, color: '#888', fontStyle: 'italic' },
  notifItem:  { fontSize: 14, color: '#1a1a1a', paddingVertical: 4 },
  notifDivider: {
    height: 1, backgroundColor: '#E8D5C8',
    marginHorizontal: 14, marginBottom: 4,
  },
  configContent: { paddingHorizontal: 18, paddingBottom: 16 },
  themeRow:      { flexDirection: 'row', alignItems: 'center' },
  themeLabel:    { fontSize: 15, fontWeight: '500', color: '#1a1a1a' },

  // Drawer
  drawer: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#FFF5EC',
    zIndex: 20, elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 16,
    borderTopRightRadius: 20, borderBottomRightRadius: 20,
  },
  closeBtn:       { alignSelf: 'flex-end', marginRight: 16, marginBottom: 8, padding: 4 },
  profileSection: { paddingHorizontal: 24, paddingBottom: 20 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, marginBottom: 12,
    borderWidth: 2.5, borderColor: '#D4A598', backgroundColor: '#F0D8CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 24, fontWeight: '800', color: '#8b0000' },
  userName:     { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  drawerScroll: { flex: 1 },
  separator: {
    height: 1, backgroundColor: '#E8D5C8',
    marginHorizontal: 24, marginVertical: 6,
  },
  drawerItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 15,
  },
  drawerItemIcon:  { marginRight: 18, width: 24 },
  drawerItemLabel: { fontSize: 16, fontWeight: '500', color: '#1a1a1a' },

  // Bottom nav
  bottomNav: {
    position: 'absolute',
    bottom: 16, left: 16, right: 16,
    flexDirection: 'row',
    backgroundColor: '#FFF5EC',
    borderRadius: 30,
    paddingTop: 10, paddingHorizontal: 8, paddingBottom: 3,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8,
    zIndex: 5,
  },
  tabItem:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel:      { fontSize: 11, color: '#9E9E9E', fontWeight: '500', marginTop: 3 },
  tabLabelActive:{ color: '#8b0000', fontWeight: '700' },

  // Modales fin de subasta
  finIconRow: {
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  finTitulo: {
    fontSize: 17, fontWeight: '800', color: '#1A1A1A',
    textAlign: 'center', marginBottom: 10,
  },
  finBody: {
    fontSize: 14, color: '#555', textAlign: 'center',
    lineHeight: 21, marginBottom: 20,
  },
  finAceptarBtn: {
    backgroundColor: '#8b0000',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 10,
    alignSelf: 'center',
    elevation: 3,
  },
  finAceptarText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  // ── Banner puja actual sobre teclado ──────────
  tecladoPujaActualBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5EC',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8D5C8',
  },
  tecladoPujaActualLeft: { flex: 1 },
  tecladoPujaActualLabel: {
    fontSize: 10,
    color: '#9E9E9E',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  tecladoPujaActualMonto: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  tecladoPujaActualMontoValor: {
    fontSize: 20,
    color: '#8b0000',
    fontWeight: '800',
  },
  tecladoPujaActualRight: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDE8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Modal sin método de pago ──────────────────
  modalSinPagoCard: {},
  sinPagoIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FDE8E8',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  sinPagoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  sinPagoSubtitulo: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  sinPagoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b0000',
    paddingVertical: 13,
    borderRadius: 10,
    elevation: 3,
  },
  sinPagoBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
