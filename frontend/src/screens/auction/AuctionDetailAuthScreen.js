/*
Intro: AuctionDetailAuthScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/auction/AuctionDetailAuthScreen.js.
Endpoints: AUCTION_BY_ID (/api/auctions/:id: consultar el detalle de una subasta); BIDS (/api/bids: registrar una puja); BID_STATUS (/api/bids/:itemId/status: consultar el estado de puja de un item); NOTIF_SUB (/api/notifications/subscribe/:auctionId: suscribirse a recordatorios de una subasta); PAYMENT_METHODS (/api/settings/payment-methods: listar metodos de pago).
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useState, useRef, useEffect, useCallback } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, StyleSheet,
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
  ActivityIndicator } from
'react-native'; // Explica: importa dependencias desde 'react-native-safe-area-context'.
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Explica: importa dependencias desde '@react-navigation/native'.
import { useFocusEffect } from '@react-navigation/native'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde '../../services/api'.
import api from '../../services/api'; // Explica: importa dependencias desde '../../constants/api'.
import { ENDPOINTS } from '../../constants/api'; // Explica: importa dependencias desde '../../store/authStore'.
import useAuthStore from '../../store/authStore'; // Explica: importa dependencias desde '../../utils/auctionState'.
import { formatearFechaHoraSubasta, normalizarEstadoSubasta } from '../../utils/auctionState'; // Explica: importa dependencias desde '../../utils/images'.
import { dataUriFromBase64 } from '../../utils/images'; // Explica: define LOGO usando el resultado de require.

const LOGO = require('../../assets/images/texto_appbar.jpeg'); // Explica: define objeto desestructurado usando el resultado de Dimensions.get.

const { width: SCREEN_WIDTH } = Dimensions.get('window'); // Explica: define DRAWER_WIDTH para usarlo en este archivo.
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

// ─── Bottom nav ───────────────────────────────────────────────────────────────
// Explica: define BOTTOM_NAV_TABS para usarlo en este archivo.
const BOTTOM_NAV_TABS = [{ name: 'Main', label: 'Inicio', icon: 'home-outline' },
{ name: 'Chats', label: 'Mensajes', icon: 'mail-outline' },
{ name: 'CargarProducto', label: 'Publicar', icon: 'add-circle-outline' },
{ name: 'PujarAuth', label: 'Pujar', icon: 'flag-outline' }];


// ─── Drawer ───────────────────────────────────────────────────────────────────
// Explica: define DRAWER_GROUPS para usarlo en este archivo.
const DRAWER_GROUPS = [[
{ label: 'Mi cuenta', icon: 'person-circle-outline', nav: 'MiCuenta' },
{ label: 'Configuracion', icon: 'settings-outline', nav: 'Configuracion' },
{ label: 'Ayuda', icon: 'help-circle-outline', nav: 'Ayuda' }],

[
{ label: 'Pujar', icon: 'pricetag-outline', nav: 'AuctionListAuth', navParams: { auctionType: 'comun' } },
{ label: 'Cargar producto', icon: 'add-square-outline', nav: null },
{ label: 'Mensajes', icon: 'mail-outline', nav: 'Chats' }],

[
{ label: 'Cerrar sesion', icon: 'log-out-outline', nav: null, isLogout: true }]]; // Explica: define NOTIFICATIONS para usarlo en este archivo.



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
// Explica: define DURACION_SUBASTA_SEGUNDOS para usarlo en este archivo.
const DURACION_SUBASTA_SEGUNDOS = 60; // TODO BACKEND: este valor debe venir del campo duracionSegundos del objeto subasta
// Explica: define ORDEN_CATEGORIAS para usarlo en este archivo.
const ORDEN_CATEGORIAS = ['comun', 'especial', 'plata', 'oro', 'platino']; // Explica: define categoriaAlcanza para usarlo en este archivo.
const categoriaAlcanza = (categoriaUsuario, categoriaSubasta) => {// Explica: define idxUsuario usando el resultado de ORDEN_CATEGORIAS.indexOf.
  const idxUsuario = ORDEN_CATEGORIAS.indexOf(String(categoriaUsuario || 'comun').toLowerCase()); // Explica: define idxSubasta usando el resultado de ORDEN_CATEGORIAS.indexOf.
  const idxSubasta = ORDEN_CATEGORIAS.indexOf(String(categoriaSubasta || 'comun').toLowerCase()); // Control: evalua una condicion para decidir el siguiente paso.
  if (idxUsuario === -1 || idxSubasta === -1) // Render: devuelve el resultado que consume React o la funcion llamadora.
    return false; // Render: devuelve el resultado que consume React o la funcion llamadora.
  return idxUsuario >= idxSubasta;}; // Explica: define formatearCategoria para usarlo en este archivo.

const formatearCategoria = (categoria) =>
String(categoria || 'comun').replace(/^./, (letra) => letra.toUpperCase()); // Explica: define obtenerNombreUsuario para usarlo en este archivo.

const obtenerNombreUsuario = (usuario) =>
usuario?.name || usuario?.nombre || usuario?.email || 'Usuario'; // Explica: define obtenerIniciales para usarlo en este archivo.

const obtenerIniciales = (nombre = '') => {// Explica: define partes usando el resultado de filter.
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean); // Explica: define letras para usarlo en este archivo.
  const letras = partes.length > 1 ?
  `${partes[0][0]}${partes[1][0]}` :
  String(nombre).slice(0, 2); // Render: devuelve el resultado que consume React o la funcion llamadora.
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
// Explica: define mostrarToast para usarlo en este archivo.
const mostrarToast = (msg) => {// Control: evalua una condicion para decidir el siguiente paso.
  if (Platform.OS === 'android') {// Explica: ejecuta ToastAndroid.show como parte del flujo.
    ToastAndroid.show(msg, ToastAndroid.SHORT);} else {// Explica: ejecuta Alert.alert como parte del flujo.
    Alert.alert('', msg);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Explica: exporta este modulo para que otras partes de la app lo usen.
export default // Explica: declara la funcion AuctionDetailAuthScreen que concentra una parte del flujo.
function AuctionDetailAuthScreen({ navigation, route }) {// Explica: define insets usando el resultado de useSafeAreaInsets.
  const insets = useSafeAreaInsets(); // Explica: define productId para usarlo en este archivo.
  const productId = route?.params?.productId ?? '1'; // Explica: define itemIdParam para usarlo en este archivo.
  const itemIdParam = route?.params?.itemId ? Number(route.params.itemId) : null; // const producto  = PRODUCTOS_MOCK[productId] ?? PRODUCTOS_MOCK['1'];
  // Explica: define user usando el resultado de useAuthStore.
  const user = useAuthStore((s) => s.user); // Explica: define MI_USER_ID usando el resultado de String.
  const MI_USER_ID = String(user?.id ?? 'user-mock-123'); // Explica: define userName usando el resultado de obtenerNombreUsuario.
  const userName = obtenerNombreUsuario(user); // Explica: define userInitials usando el resultado de obtenerIniciales.
  const userInitials = obtenerIniciales(userName); // Estado: crea el estado valores desestructurados y su actualizador.
  const [producto, setProducto] = useState(null); // Estado: crea el estado valores desestructurados y su actualizador.
  const [loading, setLoading] = useState(true);

  // ── Datos en tiempo real ──────────────────────
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [ultimaPujaLocal, setUltimaPujaLocal] = useState(0); // Estado: crea el estado valores desestructurados y su actualizador.
  const [ultimoPujadorId, setUltimoPujadorId] = useState(null); // TODO BACKEND: llega del WebSocket
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [verificandoRequisitos, setVerificandoRequisitos] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [modalRestriccion, setModalRestriccion] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [mensajeRestriccion, setMensajeRestriccion] = useState(''); // Estado: crea la referencia mutable ultimaPujaAtRef.
  const ultimaPujaAtRef = useRef(null); // Estado: crea el estado valores desestructurados y su actualizador.
  const [ultimaPujaAtState, setUltimaPujaAtState] = useState(null); // ── CONEXIÓN BACKEND — detalle de subasta ───────────────────────────
  // Efecto: ejecuta logica cuando cambia el ciclo de vida o sus dependencias.
  useEffect(() => {// Explica: define cargarProducto para usarlo en este archivo.
      const cargarProducto = async () => {// Control: evalua una condicion para decidir el siguiente paso.
        if (!productId) // Render: devuelve el resultado que consume React o la funcion llamadora.
          return; // Control: intenta una operacion y maneja errores si falla.
        try {// Estado: actualiza un valor usado por la interfaz.
          setLoading(true); // GET /api/auctions/:id devuelve { ok, subasta: { articulos: [] } }.
          // La pantalla trabaja con un único ítem: usa el seleccionado desde la card.
          // Explica: define data para usarlo en este archivo.
          const data = await api.get(ENDPOINTS.AUCTION_BY_ID(productId)); // Explica: define subasta para usarlo en este archivo.
          const subasta = data?.subasta; // Explica: define articulo para usarlo en este archivo.
          const articulo = itemIdParam ? subasta?.articulos?.find((item) => Number(item.itemId) === itemIdParam) : subasta?.articulos?.[0]; // Control: evalua una condicion para decidir el siguiente paso.

          if (!subasta || !articulo?.itemId) {
            throw new Error('La subasta no contiene un artículo disponible.');
          }

          // El estado de puja aporta precio actual, descripción y fotos del ítem.
          // Explica: define estadoPuja para usarlo en este archivo.
          const estadoPuja = await api.get(ENDPOINTS.BID_STATUS(articulo.itemId)); // Explica: define estadoNormalizado usando el resultado de normalizarEstadoSubasta.
          const estadoNormalizado = normalizarEstadoSubasta(subasta.estado, estadoPuja?.cerrado); // Explica: define productoNormalizado para usarlo en este archivo.
          const productoNormalizado = { id: subasta.subastaId,
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
            articulosIncluidos: subasta.articulos.map((item) => item.nombre)
          }; // Estado: actualiza un valor usado por la interfaz.

          setProducto(productoNormalizado); // Estado: actualiza un valor usado por la interfaz.
          setUltimaPujaLocal(Number(productoNormalizado.ultimaPuja)); // Estado: asigna un nuevo valor para mantener sincronizado el flujo.
          ultimaPujaAtRef.current = estadoPuja?.ultimaPujaAt || null; // Estado: actualiza un valor usado por la interfaz.
          setUltimaPujaAtState(estadoPuja?.ultimaPujaAt || null); // Estado: actualiza un valor usado por la interfaz.
          setSegundosRestantes(estadoPuja?.ultimaPujaAt ?
          Number(estadoPuja?.tiempoRestante ?? DURACION_SUBASTA_SEGUNDOS) :
          DURACION_SUBASTA_SEGUNDOS
          );
        } catch (error) {// Explica: ejecuta console.log como parte del flujo.
          console.log('[AuctionDetail] Error al cargar:', error);
        } finally {// Estado: actualiza un valor usado por la interfaz.
          setLoading(false);
        }
      }; // Explica: ejecuta cargarProducto como parte del flujo.
      cargarProducto();
    }, [productId, itemIdParam]);
  // ─────────────────────────────────────────────────────────────────────

  // ── Contador regresivo ────────────────────────
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [segundosRestantes, setSegundosRestantes] = useState(DURACION_SUBASTA_SEGUNDOS); // Estado: crea la referencia mutable intervalRef.
  const intervalRef = useRef(null); // Evento: memoiza el callback resetContador.
  const resetContador = useCallback(() => {// Estado: actualiza un valor usado por la interfaz.
    setSegundosRestantes(DURACION_SUBASTA_SEGUNDOS);
  }, []); // Evento: memoiza el callback detenerContador.

  const detenerContador = useCallback(() => {// Control: evalua una condicion para decidir el siguiente paso.
    if (intervalRef.current) // Explica: ejecuta clearInterval como parte del flujo.
      clearInterval(intervalRef.current);}, []);

  // ── Modales de fin de subasta ─────────────────
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [modalGanador, setModalGanador] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [modalPerdedor, setModalPerdedor] = useState(false); // Estado: crea la referencia mutable montadoRef.
  const montadoRef = useRef(true); // evita disparar modales si el usuario ya navegó a otra pantalla
  // Estado: crea la referencia mutable cierreProcesadoRef.
  const cierreProcesadoRef = useRef(false); // Efecto: ejecuta logica cuando cambia el ciclo de vida o sus dependencias.
  useEffect(() => {// Estado: asigna un nuevo valor para mantener sincronizado el flujo.
      montadoRef.current = true; // Render: devuelve el resultado que consume React o la funcion llamadora.
      return () => {// Estado: asigna un nuevo valor para mantener sincronizado el flujo.
        montadoRef.current = false;};}, []); // Evento: memoiza el callback manejarFinSubasta.
  const manejarFinSubasta = useCallback(async () => {// Explica: ejecuta detenerContador como parte del flujo.
    detenerContador(); // Control: evalua una condicion para decidir el siguiente paso.
    if (!montadoRef.current) // Render: devuelve el resultado que consume React o la funcion llamadora.
      return; // el usuario ya salió de la pantalla, no hacer nada
    // Control: intenta una operacion y maneja errores si falla.
    try {// Explica: define estado para usarlo en este archivo.
      const estado = await api.get(ENDPOINTS.BID_STATUS(producto.itemId)); // Control: evalua una condicion para decidir el siguiente paso.
      if (!estado?.cerrado) {// Control: evalua una condicion para decidir el siguiente paso.
        if (estado?.ultimaPujaAt && estado.ultimaPujaAt !== ultimaPujaAtRef.current) {// Estado: asigna un nuevo valor para mantener sincronizado el flujo.
          ultimaPujaAtRef.current = estado.ultimaPujaAt; // Estado: actualiza un valor usado por la interfaz.
          setUltimaPujaAtState(estado.ultimaPujaAt); // Estado: actualiza un valor usado por la interfaz.
          setSegundosRestantes(Number(estado?.tiempoRestante ?? DURACION_SUBASTA_SEGUNDOS));} // Render: devuelve el resultado que consume React o la funcion llamadora.
        return;} // Control: evalua una condicion para decidir el siguiente paso.
      if (cierreProcesadoRef.current) // Render: devuelve el resultado que consume React o la funcion llamadora.
        return; // Estado: asigna un nuevo valor para mantener sincronizado el flujo.
      cierreProcesadoRef.current = true; // Estado: actualiza un valor usado por la interfaz.
      setProducto((actual) => ({ ...actual, estado: 'finalizado' })); // Control: evalua una condicion para decidir el siguiente paso.
      if (String(estado.ganadorId) === String(MI_USER_ID)) {// Estado: actualiza un valor usado por la interfaz.
        setModalGanador(true);} else {// Estado: actualiza un valor usado por la interfaz.
        setModalPerdedor(true);
      }
    } catch (error) {// Explica: ejecuta console.log como parte del flujo.
      console.log('[AuctionDetail] Error al confirmar cierre:', error);
    }
  }, [MI_USER_ID, detenerContador, producto?.itemId]);

  // El timer solo corre mientras esta pantalla tiene el foco.
  // Al navegar a otra pantalla se pausa; al volver se reanuda.
  // Así se evita que el modal aparezca en otra pantalla.
  // Explica: ejecuta useFocusEffect como parte del flujo.
  useFocusEffect(useCallback(() => {// Control: evalua una condicion para decidir el siguiente paso.
    if (!producto || producto.estado !== 'vivo' || !ultimaPujaAtState) // Render: devuelve el resultado que consume React o la funcion llamadora.
      return; // Estado: asigna un nuevo valor para mantener sincronizado el flujo.
    intervalRef.current = setInterval(() => {// Estado: actualiza un valor usado por la interfaz.
        setSegundosRestantes((prev) => {// Control: evalua una condicion para decidir el siguiente paso.
            if (prev <= 1) {// Explica: ejecuta clearInterval como parte del flujo.
              clearInterval(intervalRef.current); // Explica: ejecuta manejarFinSubasta como parte del flujo.
              manejarFinSubasta(); // Render: devuelve el resultado que consume React o la funcion llamadora.
              return 0;} // Render: devuelve el resultado que consume React o la funcion llamadora.
            return prev - 1;
          });
      }, 1000); // Render: devuelve el resultado que consume React o la funcion llamadora.
    return () => {// Control: evalua una condicion para decidir el siguiente paso.
      if (intervalRef.current) // Explica: ejecuta clearInterval como parte del flujo.
        clearInterval(intervalRef.current);};
  }, [producto?.estado, producto?.itemId, ultimaPujaAtState, manejarFinSubasta])
  );

  // El servidor es la fuente de verdad para el cierre y el ganador.
  // Efecto: ejecuta logica cuando cambia el ciclo de vida o sus dependencias.
  useEffect(() => {// Control: evalua una condicion para decidir el siguiente paso.
      if (!producto?.itemId || producto.estado !== 'vivo') // Render: devuelve el resultado que consume React o la funcion llamadora.
        return undefined; // Explica: define refrescarEstado para usarlo en este archivo.
      const refrescarEstado = async () => {// Control: intenta una operacion y maneja errores si falla.
        try {// Explica: define estado para usarlo en este archivo.
          const estado = await api.get(ENDPOINTS.BID_STATUS(producto.itemId)); // Control: evalua una condicion para decidir el siguiente paso.
          if (estado?.cerrado) {// Explica: ejecuta manejarFinSubasta como parte del flujo.
            manejarFinSubasta(); // Render: devuelve el resultado que consume React o la funcion llamadora.
            return;} // Estado: actualiza un valor usado por la interfaz.
          setUltimaPujaLocal(Number(estado?.pujaActual ?? 0)); // Control: evalua una condicion para decidir el siguiente paso.
          if (estado?.ultimaPujaAt && estado.ultimaPujaAt !== ultimaPujaAtRef.current) {// Estado: asigna un nuevo valor para mantener sincronizado el flujo.
            ultimaPujaAtRef.current = estado.ultimaPujaAt; // Estado: actualiza un valor usado por la interfaz.
            setUltimaPujaAtState(estado.ultimaPujaAt); // Estado: actualiza un valor usado por la interfaz.
            setSegundosRestantes(Number(estado?.tiempoRestante ?? DURACION_SUBASTA_SEGUNDOS));}
        } catch (error) {// Explica: ejecuta console.log como parte del flujo.
          console.log('[AuctionDetail] Error al actualizar puja:', error);
        }
      }; // Explica: ejecuta refrescarEstado como parte del flujo.
      refrescarEstado(); // Explica: define intervalo usando el resultado de setInterval.
      const intervalo = setInterval(refrescarEstado, 5000); // Render: devuelve el resultado que consume React o la funcion llamadora.
      return () => clearInterval(intervalo);
    }, [producto?.itemId, producto?.estado, manejarFinSubasta]);

  // Porcentaje para la barra visual
  // Explica: define porcentajeTiempo para usarlo en este archivo.
  const porcentajeTiempo = segundosRestantes / DURACION_SUBASTA_SEGUNDOS;
  // ── Carrusel ─────────────────────────────────
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [activeSlide, setActiveSlide] = useState(0); // Explica: define onSlideChange para usarlo en este archivo.
  const onSlideChange = (e) => {// Explica: define slide usando el resultado de Math.round.
    const slide = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH); // Estado: actualiza un valor usado por la interfaz.
    setActiveSlide(slide);};

  // ── Scroll automático al abrir teclado ───────
  // Estado: crea la referencia mutable scrollRef.
  const scrollRef = useRef(null); // Estado: crea la referencia mutable pujaOffsetY.
  const pujaOffsetY = useRef(0); // posición Y del pujaBloque dentro del ScrollView
  // ── Modales ──────────────────────────────────
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [modalEnlace, setModalEnlace] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [modalInfo, setModalInfo] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [modalRecordatorio, setModalRecordatorio] = useState(false);
  // ── Teclado numérico de puja ──────────────────
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [tecladoVisible, setTecladoVisible] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [montoPuja, setMontoPuja] = useState('');
  // ── Método de pago ────────────────────────────
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [modalSinMetodoPago, setModalSinMetodoPago] = useState(false); // Explica: define abrirTecladoPuja para usarlo en este archivo.
  const abrirTecladoPuja = async () => {// Control: intenta una operacion y maneja errores si falla.
    try {// Estado: actualiza un valor usado por la interfaz.
      setVerificandoRequisitos(true); // Control: evalua una condicion para decidir el siguiente paso.
      if (producto?.duenioId && String(producto.duenioId) === String(user?.id || user?.personaId)) {// Estado: actualiza un valor usado por la interfaz.
        setMensajeRestriccion('No podés pujar por este artículo porque vos lo publicaste.'); // Estado: actualiza un valor usado por la interfaz.
        setModalRestriccion(true); // Render: devuelve el resultado que consume React o la funcion llamadora.
        return;
      } // Explica: define categoriaUsuario para usarlo en este archivo.
      const categoriaUsuario = user?.categoria || 'comun'; // Explica: define categoriaSubasta para usarlo en este archivo.
      const categoriaSubasta = producto?.categoria || 'comun'; // Control: evalua una condicion para decidir el siguiente paso.
      if (!categoriaAlcanza(categoriaUsuario, categoriaSubasta)) {// Estado: actualiza un valor usado por la interfaz.
        setMensajeRestriccion(
          `Tu categoría ${formatearCategoria(categoriaUsuario)} no te permite participar en subastas de categoría ${formatearCategoria(categoriaSubasta)}.`
        ); // Estado: actualiza un valor usado por la interfaz.
        setModalRestriccion(true); // Render: devuelve el resultado que consume React o la funcion llamadora.
        return;
      } // Explica: define data para usarlo en este archivo.
      const data = await api.get(ENDPOINTS.PAYMENT_METHODS); // Explica: define metodos para usarlo en este archivo.
      const metodos = Array.isArray(data?.metodos) ? data.metodos : []; // Control: evalua una condicion para decidir el siguiente paso.
      if (!metodos.some((metodo) => metodo.verificado)) {// Estado: actualiza un valor usado por la interfaz.
        setModalSinMetodoPago(true); // Render: devuelve el resultado que consume React o la funcion llamadora.
        return;
      } // Estado: actualiza un valor usado por la interfaz.
      setTecladoVisible(true); // Estado: actualiza un valor usado por la interfaz.
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: pujaOffsetY.current - 20, animated: true });
      }, 50);
    } catch (error) {// Explica: ejecuta mostrarToast como parte del flujo.
      mostrarToast('No se pudo verificar tu método de pago. Intentá nuevamente.');
    } finally {// Estado: actualiza un valor usado por la interfaz.
      setVerificandoRequisitos(false);
    }
  }; // Explica: define handleTecla para usarlo en este archivo.

  const handleTecla = async (tecla) => {// Control: evalua una condicion para decidir el siguiente paso.
    if (tecla === '←') {// Estado: actualiza un valor usado por la interfaz.
      setMontoPuja((prev) => prev.slice(0, -1));
    } else // Control: evalua una condicion para decidir el siguiente paso.
      if (tecla === 'Pujar') {// Explica: define monto usando el resultado de Number.
        const monto = Number(montoPuja.replace(',', '.')); // Control: evalua una condicion para decidir el siguiente paso.
        if (!monto || monto <= ultimaPujaLocal) {// Monto inválido o menor/igual a la puja actual — no se permite
          // Explica: ejecuta mostrarToast como parte del flujo.
          mostrarToast(`La puja debe ser mayor a ${producto.moneda} ${ultimaPujaLocal.toLocaleString('es-AR')}`); // Render: devuelve el resultado que consume React o la funcion llamadora.
          return;}

        // ── CONEXIÓN BACKEND — enviar puja ──────────────────────────────────
        // Control: intenta una operacion y maneja errores si falla.
        try {// Explica: define respuestaPuja para usarlo en este archivo.
          const respuestaPuja = await api.post(ENDPOINTS.BIDS, { auctionId: producto.itemId, amount: monto }); // Explica: ejecuta console.log como parte del flujo.
          console.log('[Puja] Monto:', monto, '| Ítem:', producto.itemId); // Estado: actualiza un valor usado por la interfaz.
          setUltimaPujaLocal(monto); // Estado: actualiza un valor usado por la interfaz.
          setUltimoPujadorId(MI_USER_ID); // mock local: en backend llega por WebSocket
          // Estado: asigna un nuevo valor para mantener sincronizado el flujo.
          ultimaPujaAtRef.current = respuestaPuja?.ultimaPujaAt || new Date().toISOString(); // Estado: actualiza un valor usado por la interfaz.
          setUltimaPujaAtState(ultimaPujaAtRef.current); // Explica: ejecuta resetContador como parte del flujo.
          resetContador();} catch (error) {// Explica: ejecuta console.log como parte del flujo.
          console.log('[AuctionDetail] Error al pujar:', error); // Explica: define respuesta para usarlo en este archivo.
          const respuesta = error?.response?.data; // Control: evalua una condicion para decidir el siguiente paso.
          if (respuesta?.codigo === 'METODO_PAGO_REQUERIDO') {// Estado: actualiza un valor usado por la interfaz.
            setModalSinMetodoPago(true);} else // Control: evalua una condicion para decidir el siguiente paso.
            if (respuesta?.codigo === 'CATEGORIA_INSUFICIENTE') {// Estado: actualiza un valor usado por la interfaz.
              setMensajeRestriccion(respuesta.message); // Estado: actualiza un valor usado por la interfaz.
              setModalRestriccion(true);} else {// Explica: ejecuta mostrarToast como parte del flujo.
              mostrarToast(respuesta?.message || 'Error al enviar puja');
            }
        }
        // ──────────────────────────────────────────────────────────────────
        // Estado: actualiza un valor usado por la interfaz.
        setTecladoVisible(false); // Estado: actualiza un valor usado por la interfaz.
        setMontoPuja('');} else {// Estado: actualiza un valor usado por la interfaz.
        setMontoPuja((prev) => prev + tecla);
      }
  }; // Explica: define copiarEnlace para usarlo en este archivo.

  const copiarEnlace = () => {// Explica: ejecuta Clipboard.setString como parte del flujo.
    Clipboard.setString(producto.enlace ?? ''); // Explica: ejecuta mostrarToast como parte del flujo.
    mostrarToast('Enlace copiado');
  }; // Explica: define agregarRecordatorio para usarlo en este archivo.

  const agregarRecordatorio = async () => {// Control: evalua una condicion para decidir el siguiente paso.
    if (!producto?.id) // Render: devuelve el resultado que consume React o la funcion llamadora.
      return; // Control: intenta una operacion y maneja errores si falla.
    try {// Explica: define respuesta para usarlo en este archivo.
      const respuesta = await api.post(ENDPOINTS.NOTIF_SUB(producto.id)); // Explica: ejecuta mostrarToast como parte del flujo.
      mostrarToast(respuesta?.message || `Recordatorio de ${producto.titulo} agregado correctamente.`); // Estado: actualiza un valor usado por la interfaz.
      setModalRecordatorio(true);} catch (error) {// Explica: define mensaje para usarlo en este archivo.
      const mensaje = error?.response?.data?.message || 'No se pudo agregar el recordatorio.'; // Explica: ejecuta Alert.alert como parte del flujo.
      Alert.alert('Recordatorio', mensaje);
    }
  };

  // ── Drawer ───────────────────────────────────
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [menuOpen, setMenuOpen] = useState(false); // Explica: define translateX para usarlo en este archivo.
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current; // Explica: define overlayOpacity para usarlo en este archivo.
  const overlayOpacity = useRef(new Animated.Value(0)).current; // Explica: define openMenu para usarlo en este archivo.
  const openMenu = () => {// Estado: actualiza un valor usado por la interfaz.
    setMenuOpen(true); // Explica: ejecuta start como parte del flujo.
    Animated.parallel([
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 2, speed: 16 }),
    Animated.timing(overlayOpacity, { toValue: 1, duration: 260, useNativeDriver: true })]
    ).start();
  }; // Explica: define closeMenu para usarlo en este archivo.

  const closeMenu = () => {// Explica: ejecuta start como parte del flujo.
    Animated.parallel([
    Animated.timing(translateX, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
    Animated.timing(overlayOpacity, { toValue: 0, duration: 220, useNativeDriver: true })]
    ).start(() => setMenuOpen(false));
  }; // Explica: define handleItemPress para usarlo en este archivo.

  const handleItemPress = (item) => {// Explica: ejecuta closeMenu como parte del flujo.
    closeMenu(); // Control: evalua una condicion para decidir el siguiente paso.
    if (!item.nav) // Render: devuelve el resultado que consume React o la funcion llamadora.
      return; // Explica: define TABS para usarlo en este archivo.
    const TABS = ['Main', 'Calendar', 'Chats', 'Profile']; // Control: evalua una condicion para decidir el siguiente paso.
    if (TABS.includes(item.nav)) {// Navegacion: cambia de pantalla o ajusta opciones de navegacion.
      navigation.navigate(item.nav);} else {// Navegacion: cambia de pantalla o ajusta opciones de navegacion.
      navigation.navigate(item.nav, item.navParams);
    }
  };

  // ── Notif ────────────────────────────────────
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [notifOpen, setNotifOpen] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [notifsExpanded, setNotifsExpanded] = useState(true); // Estado: crea el estado valores desestructurados y su actualizador.
  const [configExpanded, setConfigExpanded] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [darkTheme, setDarkTheme] = useState(true); // Explica: define notifAnim para usarlo en este archivo.
  const notifAnim = useRef(new Animated.Value(0)).current; // Explica: define notifOverlay para usarlo en este archivo.
  const notifOverlay = useRef(new Animated.Value(0)).current; // Explica: define openNotif para usarlo en este archivo.
  const openNotif = () => {// Estado: actualiza un valor usado por la interfaz.
    setNotifOpen(true); // Explica: ejecuta start como parte del flujo.
    Animated.parallel([
    Animated.spring(notifAnim, { toValue: 1, useNativeDriver: true, bounciness: 3, speed: 14 }),
    Animated.timing(notifOverlay, { toValue: 1, duration: 260, useNativeDriver: true })]
    ).start();
  }; // Explica: define closeNotif para usarlo en este archivo.

  const closeNotif = () => {// Explica: ejecuta start como parte del flujo.
    Animated.parallel([
    Animated.timing(notifAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    Animated.timing(notifOverlay, { toValue: 0, duration: 220, useNativeDriver: true })]
    ).start(() => setNotifOpen(false));
  }; // Explica: define panelTranslateY usando el resultado de notifAnim.interpolate.

  const panelTranslateY = notifAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }); // Explica: define panelScale usando el resultado de notifAnim.interpolate.
  const panelScale = notifAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }); // Explica: define panelOpacity usando el resultado de notifAnim.interpolate.
  const panelOpacity = notifAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }); // Explica: define esProximamente para usarlo en este archivo.

  const esProximamente = producto?.estado === 'proximamente'; // Explica: define esVivo para usarlo en este archivo.
  const esVivo = producto?.estado === 'vivo'; // Explica: define esFinalizado para usarlo en este archivo.
  const esFinalizado = producto?.estado === 'finalizado'; // Control: evalua una condicion para decidir el siguiente paso.

  if (loading || !producto) {// Render: devuelve el resultado que consume React o la funcion llamadora.
    return (// UI: renderiza el componente View.
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8b0000" />
      </View>);
  }

  // ─────────────────────────────────────────────
  // Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente View.
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
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 110 }]}>
        {/* Carrusel */}
        <View style={styles.carouselContainer}>
          <FlatList data={producto.imagenes || []} keyExtractor={(_, i) => String(i)} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onSlideChange}
            scrollEventThrottle={16}
            renderItem={({ item, index }) =>
            item ? // UI: muestra una imagen o recurso visual.
            <Image source={{ uri: item }} style={styles.carouselImage} resizeMode="cover" /> : // UI: renderiza el componente View.

            <View style={[styles.carouselImage, { backgroundColor: producto.coloresPlaceholder?.[index % 3] || '#CCC' }]} />

            } />
          
          <View style={styles.dotsRow}>
            {(producto.imagenes || []).map((_, i) => // UI: renderiza el componente View.
              <View key={i} style={[styles.dot, i === activeSlide && styles.dotActive]} />)}
          </View>
        </View>

        {/* Título e ID */}
        <Text style={styles.titulo}>{producto.titulo}</Text>
        <Text style={styles.idText}>ID: {producto.id}</Text>

        {/* Descripción — caja scrolleable de altura fija */}
        <Text style={styles.descLabel}>Descripcion</Text>
        <View style={styles.separadorLinea} />
        <ScrollView style={styles.descScroll} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
          <Text style={styles.descTexto}>{producto.descripcion}</Text>
        </ScrollView>

        {/* ══ ESTADO: VIVO ══════════════════════════ */}
        {esVivo && <>
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
          <View style={styles.pujaBloque} onLayout={(e) => {// Estado: asigna un nuevo valor para mantener sincronizado el flujo.
              pujaOffsetY.current = e.nativeEvent.layout.y;}}>
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
            <TouchableOpacity style={styles.nuevaPujaPanel} onPress={() => {// Control: evalua una condicion para decidir el siguiente paso.
                if (!verificandoRequisitos) // Explica: ejecuta abrirTecladoPuja como parte del flujo.
                  abrirTecladoPuja();}} activeOpacity={0.75}>
              <Text style={styles.nuevaPujaLabel}>{verificandoRequisitos ? 'Verificando...' : 'Tu puja'}</Text>
              <View style={styles.nuevaPujaInputRow}>
                  {montoPuja ? // UI: muestra texto visible en la pantalla.
                <Text style={styles.nuevaPujaMoneda}>{producto.moneda}</Text> : null}
                <Text style={[styles.nuevaPujaValor, !montoPuja && styles.nuevaPujaPlaceholder]}>
                    {montoPuja ? Number(montoPuja.replace(',', '.')).toLocaleString('es-AR') : 'Ingresar'}
                  </Text>
                <Ionicons name="chevron-up" size={16} color="#8b0000" />
                </View>
                {montoPuja ? // UI: renderiza un control presionable para el usuario.
              <TouchableOpacity style={styles.nuevaPujaBtnConfirmar} onPress={() => handleTecla('Pujar')}>
                <Text style={styles.nuevaPujaBtnText}>Pujar</Text>
                  </TouchableOpacity> : null}
              </TouchableOpacity>
            </View>
          </>}

        {/* ══ ESTADO: PROXIMAMENTE ══════════════════ */}
        {esProximamente && <>
          <View style={styles.proximamenteBtn}>
            <Text style={styles.proximamenteBtnText}>Proximamente</Text>
            </View>
          <Text style={styles.proximamenteFecha}>{producto.fechaProximamente}</Text>

          <TouchableOpacity style={styles.recordatorioBtn} activeOpacity={0.85} onPress={agregarRecordatorio}>
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.recordatorioBtnText}>Agregar Recordatorio</Text>
            </TouchableOpacity>
          </>}

        {esFinalizado && // UI: renderiza el componente View.
        <View style={styles.estadoFinalizadoBox}>
          <Ionicons name="lock-closed-outline" size={28} color="#8b0000" />
          <Text style={styles.estadoFinalizadoTitulo}>Subasta finalizada</Text>
          <Text style={styles.estadoFinalizadoTexto}>
              Este artículo ya no admite nuevas pujas.
            </Text>
          </View>}
      </ScrollView>

      {/* ══════════════════════════════════════════════
           TECLADO NUMÉRICO (solo estado vivo)
        ══════════════════════════════════════════════ */}
      {tecladoVisible && // UI: renderiza el componente TouchableWithoutFeedback.
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
                <TouchableOpacity style={styles.tecladoPujarBtn} onPress={() => handleTecla('Pujar')} activeOpacity={0.85}>
                  <Text style={styles.tecladoPujarText}>Pujar</Text>
                  </TouchableOpacity>
                </View>

                {/* ── Filas de teclas ── */}
                {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], [',', '0', '.']].map((fila, fi) => // UI: renderiza el componente View.
                <View key={fi} style={styles.teclaMaFila}>
                    {fila.map((t) => // UI: renderiza un control presionable para el usuario.
                    <TouchableOpacity key={t} style={styles.tecla} onPress={() => handleTecla(t)}>
                      <Text style={styles.teclaText}>{t}</Text>
                      </TouchableOpacity>)}
                    {fi === 3 && // UI: renderiza un control presionable para el usuario.
                  <TouchableOpacity style={[styles.tecla, styles.teclaBorrar]} onPress={() => handleTecla('←')}>
                    <Ionicons name="backspace-outline" size={22} color="#8b0000" />
                      </TouchableOpacity>}
                  </View>)}

              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>}

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
                  <TouchableOpacity style={styles.sinPagoBtn} activeOpacity={0.85} onPress={() => {// Estado: actualiza un valor usado por la interfaz.
                      setModalSinMetodoPago(false); // TODO BACKEND: la pantalla MetodosDePago aún no existe.
                      // Cuando se cree, registrarla en AppNavigator con:
                      //   <Stack.Screen name="MetodosDePago" component={MetodosDePagoScreen} />
                      navigation.navigate('MetodosDePago');}}>
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
                    {(producto.articulosIncluidos || []).map((art, i) => // UI: muestra texto visible en la pantalla.
                      <Text key={i} style={styles.infoArticuloItem}>{art}</Text>)}
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
                <TouchableOpacity style={styles.recordatorioCerrarBtn} onPress={() => setModalRecordatorio(false)}>
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
              <TouchableOpacity style={styles.finAceptarBtn} onPress={() => {// Estado: actualiza un valor usado por la interfaz.
                  setModalGanador(false); // TODO BACKEND: marcar la subasta como 'finalizado' en el store local
                  // para que desaparezca de los listados
                  navigation.navigate('Main');}}>
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
              <TouchableOpacity style={styles.finAceptarBtn} onPress={() => {// Estado: actualiza un valor usado por la interfaz.
                  setModalPerdedor(false); // TODO BACKEND: marcar la subasta como 'finalizado' en el store local
                  // para que desaparezca de los listados
                  navigation.navigate('Main');}}>
                <Text style={styles.finAceptarText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════
           OVERLAY + PANEL NOTIFICACIONES
        ══════════════════════════════════════════════ */}
      {notifOpen && <>
        <TouchableWithoutFeedback onPress={closeNotif}>
          <Animated.View style={[styles.overlay, { opacity: notifOverlay }]} />
          </TouchableWithoutFeedback>

        <Animated.View style={[styles.notifPanel, { top: insets.top + 56, opacity: panelOpacity, transform: [{ translateY: panelTranslateY }, { scale: panelScale }] }]}>
          <TouchableOpacity style={styles.notifSectionHeader} onPress={() => setNotifsExpanded((v) => !v)} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={20} color="#1a1a1a" style={{ marginRight: 8 }} />
            <Text style={styles.notifSectionTitle}>Notificaciones</Text>
            <Ionicons name={notifsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#1a1a1a" />
            </TouchableOpacity>

            {notifsExpanded && // UI: renderiza el componente View.
          <View style={styles.notifContent}>
                {NOTIFICATIONS.length === 0 ? // UI: muestra texto visible en la pantalla.
            <Text style={styles.notifEmpty}>{'<<No hay notificaciones>>'}</Text> : NOTIFICATIONS.map((n, i) => // UI: muestra texto visible en la pantalla.
              <Text key={i} style={styles.notifItem}>{n}</Text>)}
              </View>}

          <View style={styles.notifDivider} />

          <TouchableOpacity style={styles.notifSectionHeader} onPress={() => setConfigExpanded((v) => !v)} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={20} color="#1a1a1a" style={{ marginRight: 8 }} />
            <Text style={styles.notifSectionTitle}>Configuracion</Text>
            <Ionicons name={configExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#1a1a1a" />
            </TouchableOpacity>

            {configExpanded && // UI: renderiza el componente View.
          <View style={styles.configContent}>
            <View style={styles.themeRow}>
              <Ionicons name="moon-outline" size={20} color="#1a1a1a" style={{ marginRight: 10 }} />
              <Text style={styles.themeLabel}>Tema</Text>
              <Switch value={darkTheme} onValueChange={setDarkTheme} thumbColor="#FFFFFF" trackColor={{ false: '#C0B0A8', true: '#8b0000' }} style={{ marginLeft: 'auto' }} />
                </View>
              </View>}
          </Animated.View>
        </>}

      {/* ══════════════════════════════════════════════
           OVERLAY + DRAWER HAMBURGUESA
        ══════════════════════════════════════════════ */}
      {menuOpen && // UI: renderiza el componente TouchableWithoutFeedback.
      <TouchableWithoutFeedback onPress={closeMenu}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
        </TouchableWithoutFeedback>}

      <Animated.View style={[styles.drawer, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16, transform: [{ translateX }] }]}>
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
          {DRAWER_GROUPS.map((group, gi) => // UI: renderiza el componente View.
            <View key={gi}>
              {gi > 0 && // UI: renderiza el componente View.
              <View style={styles.separator} />}
              {group.map((item, ii) => // UI: renderiza un control presionable para el usuario.
                <TouchableOpacity key={ii} style={styles.drawerItem} onPress={() => handleItemPress(item)} activeOpacity={0.6}>
                  <Ionicons name={item.icon} size={22} color="#1a1a1a" style={styles.drawerItemIcon} />
                  <Text style={styles.drawerItemLabel}>{item.label}</Text>
                </TouchableOpacity>)}
            </View>)}
        </ScrollView>
      </Animated.View>

      {/* ── Barra de navegación inferior ─────────── */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 8 }]}>
        {BOTTOM_NAV_TABS.map((tab, i) => {// Explica: define isActive para usarlo en este archivo.
            const isActive = false; // Render: devuelve el resultado que consume React o la funcion llamadora.
            return (// UI: renderiza un control presionable para el usuario.
              <TouchableOpacity key={i} style={styles.tabItem} onPress={() => navigation.navigate(tab.name)}>
                <Ionicons name={tab.icon} size={24} color={isActive ? '#8b0000' : '#9E9E9E'} />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>);})}
      </View>

    </View>);} // ─── Estilos ─────────────────────────────────────────────────────────────────
// Explica: define styles usando el resultado de StyleSheet.create.
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#FFFFFF' }, // Header
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF' }, headerIcon: { padding: 4, width: 40 }, logo: { width: '45%', height: 32, alignSelf: 'center' }, // Scroll
    scrollContent: { paddingBottom: 40 }, // Carrusel
    carouselContainer: { marginBottom: 20, marginTop: 15 }, carouselImage: { width: SCREEN_WIDTH, height: 260 }, dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6 }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D0D0D0' }, dotActive: { backgroundColor: '#8b0000', width: 20 }, // Texto
    titulo: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', fontFamily: 'monospace', marginBottom: 4, paddingHorizontal: 24 }, idText: { fontSize: 13, color: '#555555', fontFamily: 'monospace', marginBottom: 16, paddingHorizontal: 24 }, descLabel: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', fontFamily: 'monospace', marginBottom: 8, paddingHorizontal: 24 }, separadorLinea: { height: 1.5, backgroundColor: '#BBBBBB', marginHorizontal: 24, marginBottom: 10 }, descTexto: { fontSize: 14, color: '#444444', lineHeight: 22, padding: 12 }, descScroll: { maxHeight: 80, marginHorizontal: 24, marginBottom: 16, borderRadius: 8, borderWidth: 1, borderColor: 'transparent', backgroundColor: 'rgba(0,0,0,0.04)' }, // ── Estado VIVO ──
    accionesRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 12, paddingHorizontal: 24 }, btnAccion: { flex: 0.45,
      height: 56,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: '#D0D0D0',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FAFAFA',
      flexDirection: 'row',
      gap: 8
    },
    btnAccionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: '#1A1A1A'
    },

    tiempoContainer: { paddingHorizontal: 24, marginBottom: 14 },
    tiempoBarraRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 5
    },
    tiempoLabel: { fontSize: 12, color: '#888', fontWeight: '500' },
    tiempoBarra: {
      height: 6,
      backgroundColor: '#E0E0E0',
      borderRadius: 3,
      overflow: 'hidden'
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
      minHeight: 100
    },
    precioActualPanel: {
      flex: 1,
      backgroundColor: '#8b0000',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 18,
      paddingHorizontal: 10,
      gap: 2
    },
    precioActualLabel: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.75)',
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase'
    },
    precioActualMoneda: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.85)',
      fontWeight: '600'
    },
    precioActualMonto: {
      fontSize: 26,
      color: '#FFFFFF',
      fontWeight: '800',
      letterSpacing: 0.5
    },
    pujaSeparadorV: {
      width: 1,
      backgroundColor: '#E0E0E0'
    },
    nuevaPujaPanel: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
      backgroundColor: '#FAFAFA',
      gap: 6
    },
    nuevaPujaLabel: {
      fontSize: 11,
      color: '#888',
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase'
    },
    nuevaPujaInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4
    },
    nuevaPujaMoneda: {
      fontSize: 13,
      color: '#555',
      fontWeight: '600'
    },
    nuevaPujaValor: {
      fontSize: 20,
      color: '#1A1A1A',
      fontWeight: '700'
    },
    nuevaPujaPlaceholder: {
      color: '#BDBDBD',
      fontSize: 16,
      fontWeight: '400'
    },
    nuevaPujaBtnConfirmar: {
      marginTop: 4,
      backgroundColor: '#8b0000',
      paddingHorizontal: 20,
      paddingVertical: 7,
      borderRadius: 8
    },
    nuevaPujaBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700'
    },

    // ── Estado PROXIMAMENTE ──
    proximamenteBtn: {
      marginHorizontal: 24,
      height: 52,
      backgroundColor: '#6e6e6e',
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8
    },
    proximamenteBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
    proximamenteFecha: {
      textAlign: 'center',
      fontSize: 14,
      color: '#444',
      marginBottom: 16
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
      alignItems: 'center'
    },
    estadoFinalizadoTitulo: {
      color: '#1A1A1A',
      fontSize: 18,
      fontWeight: '800',
      marginTop: 8,
      marginBottom: 6
    },
    estadoFinalizadoTexto: {
      color: '#6B4A3A',
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20
    },
    recordatorioBtn: {
      marginHorizontal: 24,
      height: 52,
      backgroundColor: '#8b0000',
      borderRadius: 10,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4
    },
    recordatorioBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

    // ── Teclado numérico ──
    tecladoOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.10)',
      justifyContent: 'flex-end',
      zIndex: 40
    },
    teclado: {
      backgroundColor: '#ECEFF1',
      paddingBottom: 16,
      paddingTop: 8
    },
    tecladoDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 20,
      paddingVertical: 12,
      marginBottom: 8,
      gap: 12
    },
    tecladoDisplayText: { flex: 1, fontSize: 18, color: '#6e6e6e', fontWeight: '600' },
    tecladoPujarBtn: {
      backgroundColor: '#8b0000',
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 10
    },
    tecladoPujarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    teclaMaFila: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 4,
      paddingHorizontal: 8
    },
    tecla: {
      flex: 1,
      marginHorizontal: 4,
      height: 52,
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 1
    },
    teclaBorrar: {
      backgroundColor: '#FFF0F0'
    },
    teclaText: { fontSize: 22, color: '#1A1A1A', fontWeight: '400' },

    // ── Modales compartidos ──
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center'
    },
    modalCard: {
      width: SCREEN_WIDTH * 0.85,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      overflow: 'hidden',
      elevation: 20
    },
    modalCloseX: {
      position: 'absolute',
      top: 10, right: 12,
      zIndex: 10,
      padding: 4
    },
    modalHeader: {
      backgroundColor: '#8b0000',
      paddingVertical: 14,
      alignItems: 'center'
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
      paddingVertical: 12
    },
    enlaceTexto: { flex: 1, fontSize: 14, color: '#555', fontFamily: 'monospace' },
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
      marginBottom: 16
    },
    infoIdText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
    infoSubtitulo: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 10, textAlign: 'left' },
    infoArticulosBox: {
      backgroundColor: '#E0E0E0',
      borderRadius: 8,
      padding: 14,
      marginBottom: 16,
      minHeight: 80,
      gap: 10
    },
    infoArticuloItem: { fontSize: 14, color: '#555', fontFamily: 'monospace' },
    infoPrecioBase: { fontSize: 14, color: '#555', fontFamily: 'monospace', textAlign: 'left' },

    // Modal recordatorio
    modalRecordatorioCard: {
      alignItems: 'center',
      padding: 32,
      borderRadius: 20
    },
    recordatorioIconCircle: { marginBottom: 16 },
    recordatorioTitulo: {
      fontSize: 18, fontWeight: '700', color: '#1A1A1A',
      textAlign: 'center', marginBottom: 12
    },
    recordatorioBody: {
      fontSize: 14, color: '#555', textAlign: 'center',
      lineHeight: 20, marginBottom: 24
    },
    recordatorioCerrarBtn: {
      backgroundColor: '#8b0000',
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 10
    },
    recordatorioCerrarText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

    // Overlay compartido
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.35)',
      zIndex: 10
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
      overflow: 'hidden'
    },
    notifSectionHeader: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 18, paddingVertical: 14
    },
    notifSectionTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
    notifContent: {
      backgroundColor: '#F5E8DC',
      marginHorizontal: 14, marginBottom: 12,
      borderRadius: 10, minHeight: 80,
      alignItems: 'center', justifyContent: 'center',
      paddingVertical: 20, paddingHorizontal: 16
    },
    notifEmpty: { fontSize: 13, color: '#888', fontStyle: 'italic' },
    notifItem: { fontSize: 14, color: '#1a1a1a', paddingVertical: 4 },
    notifDivider: {
      height: 1, backgroundColor: '#E8D5C8',
      marginHorizontal: 14, marginBottom: 4
    },
    configContent: { paddingHorizontal: 18, paddingBottom: 16 },
    themeRow: { flexDirection: 'row', alignItems: 'center' },
    themeLabel: { fontSize: 15, fontWeight: '500', color: '#1a1a1a' },

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
      borderTopRightRadius: 20, borderBottomRightRadius: 20
    },
    closeBtn: { alignSelf: 'flex-end', marginRight: 16, marginBottom: 8, padding: 4 },
    profileSection: { paddingHorizontal: 24, paddingBottom: 20 },
    avatar: {
      width: 72, height: 72, borderRadius: 36, marginBottom: 12,
      borderWidth: 2.5, borderColor: '#D4A598', backgroundColor: '#F0D8CC',
      alignItems: 'center',
      justifyContent: 'center'
    },
    avatarInitials: { fontSize: 24, fontWeight: '800', color: '#8b0000' },
    userName: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
    drawerScroll: { flex: 1 },
    separator: {
      height: 1, backgroundColor: '#E8D5C8',
      marginHorizontal: 24, marginVertical: 6
    },
    drawerItem: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 24, paddingVertical: 15
    },
    drawerItemIcon: { marginRight: 18, width: 24 },
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
      zIndex: 5
    },
    tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    tabLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '500', marginTop: 3 },
    tabLabelActive: { color: '#8b0000', fontWeight: '700' },

    // Modales fin de subasta
    finIconRow: {
      alignItems: 'center',
      marginBottom: 12,
      marginTop: 4
    },
    finTitulo: {
      fontSize: 17, fontWeight: '800', color: '#1A1A1A',
      textAlign: 'center', marginBottom: 10
    },
    finBody: {
      fontSize: 14, color: '#555', textAlign: 'center',
      lineHeight: 21, marginBottom: 20
    },
    finAceptarBtn: {
      backgroundColor: '#8b0000',
      paddingHorizontal: 40,
      paddingVertical: 12,
      borderRadius: 10,
      alignSelf: 'center',
      elevation: 3
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
      borderTopColor: '#E8D5C8'
    },
    tecladoPujaActualLeft: { flex: 1 },
    tecladoPujaActualLabel: {
      fontSize: 10,
      color: '#9E9E9E',
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 2
    },
    tecladoPujaActualMonto: {
      fontSize: 13,
      color: '#555',
      fontWeight: '600'
    },
    tecladoPujaActualMontoValor: {
      fontSize: 20,
      color: '#8b0000',
      fontWeight: '800'
    },
    tecladoPujaActualRight: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#FDE8E8',
      justifyContent: 'center',
      alignItems: 'center'
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
      marginTop: 4
    },
    sinPagoTitulo: {
      fontSize: 15,
      fontWeight: '700',
      color: '#1A1A1A',
      textAlign: 'center',
      marginBottom: 8,
      lineHeight: 22
    },
    sinPagoSubtitulo: {
      fontSize: 13,
      color: '#777',
      textAlign: 'center',
      lineHeight: 19,
      marginBottom: 20
    },
    sinPagoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#8b0000',
      paddingVertical: 13,
      borderRadius: 10,
      elevation: 3
    },
    sinPagoBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700'
    }
  });
