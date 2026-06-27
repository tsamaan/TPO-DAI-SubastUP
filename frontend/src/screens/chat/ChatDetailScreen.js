/*
Intro: ChatDetailScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/chat/ChatDetailScreen.js.
Endpoints: CHAT_MESSAGES (/api/chats/:id/messages: leer o enviar mensajes de un chat).
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'expo-image-picker'.
import * as ImagePicker from 'expo-image-picker'; // Explica: importa dependencias desde 'expo-document-picker'.
import * as DocumentPicker from 'expo-document-picker'; // Explica: importa dependencias desde 'react'.
import React, { useState, useRef, useEffect } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  Alert,
  Image,
  ActivityIndicator } from
'react-native'; // Explica: importa dependencias desde 'react-native-safe-area-context'.
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde '../../services/api'.
import api from '../../services/api'; // Explica: importa dependencias desde '../../constants/api'.
import { ENDPOINTS } from '../../constants/api'; // Explica: importa dependencias desde '../../utils/images'.
import { dataUriFromBase64 } from '../../utils/images';

// ─────────────────────────────────────────────
//  Datos mock — fallback
// ─────────────────────────────────────────────
// Explica: define MOCK_MESSAGES para usarlo en este archivo.
const MOCK_MESSAGES = [{ id: '1', contenido: 'Hola, ¿sigue disponible el artículo?', remitente: 'soporte', fechaEnvio: '2026-06-10T10:10:00Z' },
{ id: '2', contenido: 'Sí, está disponible hasta el viernes.', remitente: 'usuario', fechaEnvio: '2026-06-10T10:11:00Z' }]; // Explica: define normalizarMensaje para usarlo en este archivo.


const normalizarMensaje = (mensaje) => ({
  id: mensaje.mensajeId || mensaje.id || mensaje.identificador || String(Date.now()),
  contenido: mensaje.texto || mensaje.contenido || mensaje.message || '',
  remitente: mensaje.esMio || mensaje.isMine ? 'usuario' : 'soporte',
  fechaEnvio: mensaje.fecha || mensaje.fechaEnvio || mensaje.createdAt || new Date().toISOString(),
  isMine: Boolean(mensaje.esMio || mensaje.isMine),
  type: mensaje.imagen ? 'image' : 'text',
  imageUri: dataUriFromBase64(mensaje.imagen)
});

// ─────────────────────────────────────────────
//  Burbuja de mensaje
// ─────────────────────────────────────────────
// Explica: declara la funcion MessageBubble que concentra una parte del flujo.
function MessageBubble({ message }) {// Explica: define isMine para usarlo en este archivo.
  const isMine = message.remitente === 'usuario' || message.isMine; // Explica: define text para usarlo en este archivo.
  const text = message.contenido || message.text || ''; // Explica: define timeStr para usarlo en este archivo.
  let timeStr = message.time || ''; // Control: evalua una condicion para decidir el siguiente paso.
  if (message.fechaEnvio) {// Explica: define d para usarlo en este archivo.
    const d = new Date(message.fechaEnvio); // Control: evalua una condicion para decidir el siguiente paso.
    if (!isNaN(d.getTime())) {// Estado: asigna un nuevo valor para mantener sincronizado el flujo.
      timeStr = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    }
  } // Explica: define objeto desestructurado para usarlo en este archivo.

  const { type, imageUri, fileName } = message; // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (// UI: renderiza el componente View.
    <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        {type === 'image' && imageUri ? // UI: muestra una imagen o recurso visual.
        <Image source={{ uri: imageUri }} style={styles.attachmentImage} resizeMode="cover" /> : null}

        {type === 'file' ? // UI: renderiza el componente View.
        <View style={styles.fileChip}>
          <Ionicons name="document-outline" size={16} color={isMine ? '#FFF' : '#8b0000'} />
          <Text style={[styles.fileName, isMine && styles.fileNameMine]} numberOfLines={2}>
              {fileName || text}
            </Text>
          </View> : null}

        {(type === 'text' || !type) && !!text ? // UI: muestra texto visible en la pantalla.
        <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
            {text}
          </Text> : null}

        <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
          {timeStr}
        </Text>
      </View>
    </View>);
}

// ─────────────────────────────────────────────
//  Menú contextual del botón +
// ─────────────────────────────────────────────
// Explica: declara la funcion AttachMenu que concentra una parte del flujo.
function AttachMenu({ visible, onClose, onArchivos, onCamara }) {// Explica: define anim para usarlo en este archivo.
  const anim = useRef(new Animated.Value(0)).current; // Explica: define opacity para usarlo en este archivo.
  const opacity = useRef(new Animated.Value(0)).current; // Efecto: ejecuta logica cuando cambia el ciclo de vida o sus dependencias.
  useEffect(() => {// Control: evalua una condicion para decidir el siguiente paso.
    if (visible) {// Explica: ejecuta start como parte del flujo.
      Animated.parallel([
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, bounciness: 4, speed: 18 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true })]
      ).start();
    } else {// Explica: ejecuta start como parte del flujo.
      Animated.parallel([
      Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true })]
      ).start();
    }
  }, [visible]); // Control: evalua una condicion para decidir el siguiente paso.

  if (!visible) // Render: devuelve el resultado que consume React o la funcion llamadora.
    return null; // Explica: define translateY usando el resultado de anim.interpolate.
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }); // Explica: define scale usando el resultado de anim.interpolate.
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }); // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (// UI: renderiza el componente TouchableWithoutFeedback.
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.attachMenu,
          { opacity, transform: [{ translateY }, { scale }] }]
          }>
          
          <TouchableOpacity style={styles.attachItem} onPress={onArchivos} activeOpacity={0.7}>
            <Ionicons name="folder-outline" size={22} color="#1A1A1A" />
            <Text style={styles.attachLabel}>Archivos</Text>
          </TouchableOpacity>

          <View style={styles.attachDivider} />

          <TouchableOpacity style={styles.attachItem} onPress={onCamara} activeOpacity={0.7}>
            <Ionicons name="camera-outline" size={22} color="#1A1A1A" />
            <Text style={styles.attachLabel}>Abrir camara</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>);} // ─────────────────────────────────────────────
//  Pantalla principal
// ─────────────────────────────────────────────
// Explica: exporta este modulo para que otras partes de la app lo usen.
export default // Explica: declara la funcion ChatDetailScreen que concentra una parte del flujo.
function ChatDetailScreen({ route, navigation }) {// Explica: define insets usando el resultado de useSafeAreaInsets.
  const insets = useSafeAreaInsets(); // Explica: define objeto desestructurado para usarlo en este archivo.
  const { chatId, chatName = 'Soporte', estadoProducto = 'Activo' } = route?.params ?? {}; // Estado: crea el estado valores desestructurados y su actualizador.
  const [messages, setMessages] = useState([]); // Estado: crea el estado valores desestructurados y su actualizador.
  const [inputText, setInputText] = useState(''); // Estado: crea el estado valores desestructurados y su actualizador.
  const [menuVisible, setMenuVisible] = useState(false); // Estado: crea el estado valores desestructurados y su actualizador.
  const [loading, setLoading] = useState(true); // Estado: crea la referencia mutable listRef.
  const listRef = useRef(null); // ── 1. Cargar historial ────────────────────────
  // Efecto: ejecuta logica cuando cambia el ciclo de vida o sus dependencias.
  useEffect(() => {// Explica: define fetchHistory para usarlo en este archivo.
      const fetchHistory = async () => {// Control: intenta una operacion y maneja errores si falla.
        try {// Estado: actualiza un valor usado por la interfaz.
          setLoading(true); // Control: evalua una condicion para decidir el siguiente paso.
          if (!chatId) // Render: devuelve el resultado que consume React o la funcion llamadora.
            return; // Explica: define data para usarlo en este archivo.
          const data = await api.get(ENDPOINTS.CHAT_MESSAGES(chatId)); // Explica: define mensajes para usarlo en este archivo.
          const mensajes = Array.isArray(data?.mensajes) ? data.mensajes : Array.isArray(data) ? data : []; // Estado: actualiza un valor usado por la interfaz.
          setMessages(mensajes.map(normalizarMensaje));
        } catch (error) {// Explica: ejecuta console.log como parte del flujo.
          console.log('Error fetching messages:', error?.response?.data || error?.message || error); // Estado: actualiza un valor usado por la interfaz.
          setMessages([]);
        } finally {// Estado: actualiza un valor usado por la interfaz.
          setLoading(false); // Estado: actualiza un valor usado por la interfaz.
          setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 150);
        }
      }; // Explica: ejecuta fetchHistory como parte del flujo.
      fetchHistory();
    }, [chatId]); // Explica: define appendMessage para usarlo en este archivo.

  const appendMessage = (message) => {// Estado: actualiza un valor usado por la interfaz.
    setMessages((prev) => [...prev, message]); // Estado: actualiza un valor usado por la interfaz.
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  };

  // ── Enviar mensaje texto ───────────────────────
  // Explica: define handleSend para usarlo en este archivo.
  const handleSend = async () => {// Explica: define text usando el resultado de inputText.trim.
    const text = inputText.trim(); // Control: evalua una condicion para decidir el siguiente paso.
    if (!text || !chatId) // Render: devuelve el resultado que consume React o la funcion llamadora.
      return; // Explica: define textoPendiente para usarlo en este archivo.
    const textoPendiente = text; // Estado: actualiza un valor usado por la interfaz.
    setInputText(''); // Control: intenta una operacion y maneja errores si falla.
    try {// Explica: define data para usarlo en este archivo.
      const data = await api.post(ENDPOINTS.CHAT_MESSAGES(chatId), { texto: textoPendiente }); // Explica: ejecuta appendMessage como parte del flujo.
      appendMessage({ id: data?.mensajeId || String(Date.now()),
          contenido: textoPendiente,
          remitente: 'usuario',
          fechaEnvio: data?.fecha || new Date().toISOString(),
          isMine: true
        });
    } catch (error) {// Explica: ejecuta console.log como parte del flujo.
      console.log('Error sending message:', error?.response?.data || error?.message || error); // Estado: actualiza un valor usado por la interfaz.
      setInputText(textoPendiente); // Explica: ejecuta Alert.alert como parte del flujo.
      Alert.alert('Error', error?.response?.data?.message || 'No se pudo enviar el mensaje. Intentá nuevamente.');
    }
  }; // Explica: define handleCamara para usarlo en este archivo.

  const handleCamara = async () => {// Estado: actualiza un valor usado por la interfaz.
    setMenuVisible(false); // Control: intenta una operacion y maneja errores si falla.

    try {// Explica: define permission para usarlo en este archivo.
      const permission = await ImagePicker.requestCameraPermissionsAsync(); // Control: evalua una condicion para decidir el siguiente paso.
      if (!permission.granted) {// Explica: ejecuta Alert.alert como parte del flujo.
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara.'); // Render: devuelve el resultado que consume React o la funcion llamadora.
        return;
      } // Explica: define result para usarlo en este archivo.

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8
      }); // Control: evalua una condicion para decidir el siguiente paso.

      if (!result.canceled && result.assets?.length > 0) {// Explica: define asset para usarlo en este archivo.
        const asset = result.assets[0]; // Explica: define uri para usarlo en este archivo.
        const uri = asset?.uri; // Control: evalua una condicion para decidir el siguiente paso.

        if (uri) {// Explica: ejecuta appendMessage como parte del flujo.
          appendMessage({
            id: String(Date.now()),
            text: 'Foto enviada',
            type: 'image',
            imageUri: uri,
            remitente: 'usuario',
            fechaEnvio: new Date().toISOString()
          });
        }
      }
    } catch (error) {// Explica: ejecuta console.log como parte del flujo.
      console.log('Error al abrir cámara:', error); // Explica: ejecuta Alert.alert como parte del flujo.
      Alert.alert('Error', 'No se pudo abrir la cámara. Intenta nuevamente.');
    }
  }; // Explica: define handleArchivos para usarlo en este archivo.

  const handleArchivos = async () => {// Estado: actualiza un valor usado por la interfaz.
    setMenuVisible(false); // Control: intenta una operacion y maneja errores si falla.

    try {// Explica: define result para usarlo en este archivo.
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
        copyToCacheDirectory: true
      }); // Control: evalua una condicion para decidir el siguiente paso.

      if (!result.canceled && result.assets?.length > 0) {// Explica: define file para usarlo en este archivo.
        const file = result.assets[0]; // Explica: ejecuta appendMessage como parte del flujo.

        appendMessage({
          id: String(Date.now()),
          text: file.name || 'Archivo enviado',
          type: 'file',
          fileName: file.name,
          remitente: 'usuario',
          fechaEnvio: new Date().toISOString()
        });
      }
    } catch (error) {// Explica: ejecuta console.log como parte del flujo.
      console.log('Error al abrir archivo:', error); // Explica: ejecuta Alert.alert como parte del flujo.
      Alert.alert('Error', 'No se pudo abrir el selector de archivos.');
    }
  };

  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────
  // Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente KeyboardAvoidingView.
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={0}>
      
      {/* ── Top Bar ─────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>{chatName}</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* ── Banner Producto ─────────────────────── */}
      <View style={styles.banner}>
        <Ionicons name="information-circle" size={20} color="#8b0000" />
        <View style={styles.bannerTexts}>
          <Text style={styles.bannerTitle} numberOfLines={1}>{chatName}</Text>
          <Text style={styles.bannerStatus}>Estado: {estadoProducto}</Text>
        </View>
      </View>

      {/* ── Mensajes ────────────────────────────── */}
      {loading ? // UI: renderiza el componente View.
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color="#8b0000" />
        </View> : // UI: organiza contenido desplazable.
      <FlatList ref={listRef} data={messages} keyExtractor={(item) => String(item.id)} renderItem={({ item }) => // UI: renderiza el componente MessageBubble.
        <MessageBubble message={item} />} contentContainerStyle={styles.messagesList} showsVerticalScrollIndicator={false} onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })} />}

      {/* ── Input bar ───────────────────────────── */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        {/* Botón + */}
        <TouchableOpacity style={styles.plusBtn} onPress={() => setMenuVisible((v) => !v)} activeOpacity={0.8}>
          <Ionicons name="add" size={24} color="#8b0000" />
        </TouchableOpacity>

        {/* Campo de texto */}
        <TextInput style={styles.input} placeholder="Mensaje"
          placeholderTextColor="#A09088"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          returnKeyType="send" />
        

        {/* Botón enviar */}
        <TouchableOpacity style={[styles.sendBtn, inputText.trim() && styles.sendBtnActive]}
        onPress={handleSend}
        activeOpacity={0.8}
        disabled={!inputText.trim()}>
          
          <Ionicons name="send"
          size={20}
          color={inputText.trim() ? '#8b0000' : '#C0B0A8'} />
          
        </TouchableOpacity>
      </View>

      {/* ── Menú adjuntar ───────────────────────── */}
      <AttachMenu visible={menuVisible}
      onClose={() => setMenuVisible(false)}
      onArchivos={() => {// Estado: actualiza un valor usado por la interfaz.
        setMenuVisible(false); // Explica: ejecuta handleArchivos como parte del flujo.
        handleArchivos();
      }}
      onCamara={() => {// Estado: actualiza un valor usado por la interfaz.
        setMenuVisible(false); // Explica: ejecuta handleCamara como parte del flujo.
        handleCamara();
      }} />
      

    </KeyboardAvoidingView>);

}

// ─────────────────────────────────────────────
//  Estilos
// ─────────────────────────────────────────────
// Explica: define styles usando el resultado de StyleSheet.create.
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#FFFFFF' },

    // Top bar
    topBar: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#F0E8E0',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4
    },
    backBtn: { padding: 4 },
    topBarTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },

    // Banner Producto
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF5EC',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#F0D8C8'
    },
    bannerTexts: {
      marginLeft: 12,
      flex: 1
    },
    bannerTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#1A1A1A'
    },
    bannerStatus: {
      fontSize: 12,
      color: '#8b0000',
      fontWeight: '500',
      marginTop: 2,
      textTransform: 'capitalize'
    },

    // Loader
    centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    // Lista de mensajes
    messagesList: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      gap: 6
    },

    // Burbujas
    bubbleRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      marginVertical: 2
    },
    bubbleRowMine: {
      justifyContent: 'flex-end'
    },
    bubble: {
      maxWidth: '75%',
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 9
    },
    bubbleOther: {
      backgroundColor: '#F0F0F0',
      borderBottomLeftRadius: 4
    },
    bubbleMine: {
      backgroundColor: '#8b0000',
      borderBottomRightRadius: 4
    },
    bubbleText: {
      fontSize: 15,
      color: '#1A1A1A',
      lineHeight: 21
    },
    attachmentImage: {
      width: 220,
      height: 160,
      borderRadius: 14,
      marginBottom: 8,
      backgroundColor: '#EEE'
    },
    fileChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 6,
      maxWidth: 220
    },
    fileName: {
      fontSize: 13,
      color: '#1A1A1A',
      flexShrink: 1
    },
    fileNameMine: {
      color: '#FFF'
    },
    bubbleTextMine: {
      color: '#FFFFFF'
    },
    bubbleTime: {
      fontSize: 10,
      color: '#A09088',
      marginTop: 4,
      alignSelf: 'flex-end'
    },
    bubbleTimeMine: {
      color: 'rgba(255,255,255,0.65)'
    },

    // Input bar
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 12,
      paddingTop: 10,
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#F0E8E0',
      gap: 8
    },
    plusBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FFF5EC',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#F0D8C8',
      marginBottom: 1
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 100,
      backgroundColor: '#F5F0ED',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      color: '#1A1A1A',
      borderWidth: 1,
      borderColor: '#EDE0D8'
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F5F0ED',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 1
    },
    sendBtnActive: {
      backgroundColor: '#FFE8D6'
    },

    // Menú adjuntar
    attachMenu: {
      position: 'absolute',
      bottom: 70,
      left: 16,
      backgroundColor: '#FFF5EC',
      borderRadius: 14,
      overflow: 'hidden',
      width: 190,
      elevation: 12,
      shadowColor: '#8b0000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      borderWidth: 1,
      borderColor: '#F0D8C8'
    },
    attachItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 15,
      gap: 14
    },
    attachLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: '#1A1A1A'
    },
    attachDivider: {
      height: 1,
      backgroundColor: '#F0D8C8',
      marginHorizontal: 12
    }
  });
