/*
Intro: ChatsScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/chat/ChatsScreen.js.
Endpoints: CHATS (/api/chats: listar conversaciones).
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useState, useEffect, useCallback } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Image,
  ActivityIndicator } from
'react-native'; // Explica: importa dependencias desde 'react-native-safe-area-context'.
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde '@react-navigation/native'.
import { useFocusEffect } from '@react-navigation/native'; // Explica: importa dependencias desde '../../services/api'.
import api from '../../services/api'; // Explica: importa dependencias desde '../../constants/api'.
import { ENDPOINTS } from '../../constants/api'; // Explica: importa dependencias desde '../../utils/images'.
import { imageSourceFromBase64 } from '../../utils/images';

// ─────────────────────────────────────────────
//  Datos mock (Fallback)
// ─────────────────────────────────────────────
// Explica: define MOCK_CHATS para usarlo en este archivo.
const MOCK_CHATS = [{ id: '1', name: 'Chat 1', lastMessage: 'Ultimo mensaje', time: '10:24', unread: 2, image: require('../../assets/images/imagen_menu1.jpeg') },
{ id: '2', name: 'Chat 2', lastMessage: 'Ultimo mensaje', time: '09:15', unread: 0, image: require('../../assets/images/imagen_menu2.jpeg') }];


// ─────────────────────────────────────────────
//  Fila de chat individual
// ─────────────────────────────────────────────
// Explica: declara la funcion ChatRow que concentra una parte del flujo.
function ChatRow({ item, onPress }) {// Explica: define name para usarlo en este archivo.
  const name = item.producto?.nombre || item.nombreProducto || item.name || 'Chat'; // Explica: define lastMessage para usarlo en este archivo.
  const lastMessage = item.ultimoMensaje || item.lastMessage || ''; // Explica: define unread para usarlo en este archivo.
  const unread = item.sinLeer ?? item.noLeidos ?? item.unread ?? 0;
  // Format time simple
  // Explica: define timeStr para usarlo en este archivo.
  let timeStr = item.ultimaFecha || item.fechaUltimoMensaje || item.time || ''; // Control: evalua una condicion para decidir el siguiente paso.
  if (item.ultimaFecha || item.fechaUltimoMensaje) {// Explica: define d para usarlo en este archivo.
    const d = new Date(item.ultimaFecha || item.fechaUltimoMensaje); // Control: evalua una condicion para decidir el siguiente paso.
    if (!isNaN(d.getTime())) {// Estado: asigna un nuevo valor para mantener sincronizado el flujo.
      timeStr = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });}
  }

  // Fallback image
  // Explica: define imageSource para usarlo en este archivo.
  const imageSource = item.portada ? imageSourceFromBase64(item.portada) :
  item.image || require('../../assets/images/imagen_menu1.jpeg'); // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (// UI: renderiza un control presionable para el usuario.
    <TouchableOpacity style={styles.row} onPress={() => onPress(item, name)} activeOpacity={0.7}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <Image source={imageSource} style={styles.avatar} />
        {unread > 0 && // UI: renderiza el componente View.
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>}
      </View>

      {/* Contenido */}
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={[styles.chatName, unread > 0 && styles.chatNameBold]}>
            {name}
          </Text>
          <Text style={[styles.timeText, unread > 0 && styles.timeTextActive]}>
            {timeStr}
          </Text>
        </View>
        <Text style={[styles.lastMsg, unread > 0 && styles.lastMsgBold]} numberOfLines={1}>
          {lastMessage}
        </Text>
      </View>
    </TouchableOpacity>);} // ─────────────────────────────────────────────
//  Pantalla principal
// ─────────────────────────────────────────────
// Explica: exporta este modulo para que otras partes de la app lo usen.
export default // Explica: declara la funcion ChatsScreen que concentra una parte del flujo.
function ChatsScreen({ navigation }) {// Explica: define insets usando el resultado de useSafeAreaInsets.
  const insets = useSafeAreaInsets(); // Estado: crea el estado valores desestructurados y su actualizador.
  const [search, setSearch] = useState(''); // Estado: crea el estado valores desestructurados y su actualizador.
  const [chats, setChats] = useState([]); // Estado: crea el estado valores desestructurados y su actualizador.
  const [loading, setLoading] = useState(true); // Explica: define fetchChats para usarlo en este archivo.
  const fetchChats = async () => {// Control: intenta una operacion y maneja errores si falla.
    try {// Estado: actualiza un valor usado por la interfaz.
      setLoading(true); // Explica: define data para usarlo en este archivo.
      const data = await api.get(ENDPOINTS.CHATS); // El backend devuelve { ok, conversaciones: [] }. Solo guardar listas:
      // una respuesta de error no puede romper el render de la pantalla.
      // Explica: define conversaciones para usarlo en este archivo.
      const conversaciones = data?.conversaciones || data?.chats || data?.data; // Estado: actualiza un valor usado por la interfaz.
      setChats(Array.isArray(conversaciones) ? conversaciones : []);} catch (error) {// Explica: ejecuta console.log como parte del flujo.
      console.log('Error fetching chats, usando mocks:', error); // Estado: actualiza un valor usado por la interfaz.
      setChats(MOCK_CHATS);
    } finally {// Estado: actualiza un valor usado por la interfaz.
      setLoading(false);
    }
  }; // Explica: ejecuta useFocusEffect como parte del flujo.

  useFocusEffect(
    useCallback(() => {// Explica: ejecuta fetchChats como parte del flujo.
      fetchChats();
    }, [])
  ); // Explica: define filtered usando el resultado de filter.

  const filtered = (Array.isArray(chats) ? chats : []).filter((c) => {// Explica: define name para usarlo en este archivo.
    const name = c.producto?.nombre || c.nombreProducto || c.name || ''; // Explica: define msg para usarlo en este archivo.
    const msg = c.ultimoMensaje || c.lastMessage || ''; // Render: devuelve el resultado que consume React o la funcion llamadora.
    return name.toLowerCase().includes(search.toLowerCase()) ||
    msg.toLowerCase().includes(search.toLowerCase());
  }); // Explica: define handleOpenChat para usarlo en este archivo.

  const handleOpenChat = (item, name) => {// Navegacion: cambia de pantalla o ajusta opciones de navegacion.
    navigation.navigate('ChatDetail', {
      chatId: item.conversacionId || item.id,
      chatName: name,
      estadoProducto: item.producto?.estado || item.estado || 'Activo'
    });
  }; // Explica: define handleBackToHome para usarlo en este archivo.

  const handleBackToHome = () => {// Navegacion: cambia de pantalla o ajusta opciones de navegacion.
    navigation.goBack();
  }; // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (// UI: renderiza el componente View.
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Header ──────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBackToHome} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SubasChat</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* ── Buscador ────────────────────────────── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#9A8880" style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="Buscar" placeholderTextColor="#9A8880" value={search} onChangeText={setSearch} clearButtonMode="while-editing" />
      </View>

      {/* ── Lista / Loader / Empty ──────────────── */}
      {loading ? // UI: renderiza el componente View.
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color="#8b0000" />
        </View> : // UI: organiza contenido desplazable.
      <FlatList data={filtered}
      keyExtractor={(item, index) => String(item.conversacionId || item.id || index)}
      renderItem={({ item }) => // UI: renderiza el componente ChatRow.
      <ChatRow item={item} onPress={handleOpenChat} />} ItemSeparatorComponent={() => // UI: renderiza el componente View.
      <View style={styles.separator} />} contentContainerStyle={{ paddingBottom: insets.bottom + 16, flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={// UI: renderiza el componente View.
      <View style={styles.emptyWrap}>
        <Ionicons name="chatbubbles-outline" size={48} color="#D0C0B8" />
        <Text style={styles.emptyText}>No hay chats activos</Text>
            </View>} />
      }
    </View>);

}

// ─────────────────────────────────────────────
//  Estilos
// ─────────────────────────────────────────────
// Explica: define styles usando el resultado de StyleSheet.create.
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#FFFFFF' },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#F0E8E0',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4
    },
    backBtn: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center'
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1A1A1A'
    },

    // Buscador
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginVertical: 12,
      paddingHorizontal: 12,
      height: 44,
      backgroundColor: '#F5F0ED',
      borderRadius: 22,
      borderWidth: 1,
      borderColor: '#EDE0D8'
    },
    searchIcon: { marginRight: 8 },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: '#1A1A1A'
    },

    // Fila de chat
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: '#FFFFFF'
    },

    // Avatar
    avatarWrap: { position: 'relative', marginRight: 14 },
    avatar: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: '#F0E8E0'
    },
    badge: {
      position: 'absolute',
      top: 0,
      right: 0,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#8b0000',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
      borderWidth: 2,
      borderColor: '#FFFFFF'
    },
    badgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },

    // Contenido fila
    rowContent: { flex: 1 },
    rowTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4
    },
    chatName: { fontSize: 16, fontWeight: '500', color: '#1A1A1A' },
    chatNameBold: { fontWeight: '700' },
    timeText: { fontSize: 12, color: '#A09088' },
    timeTextActive: { color: '#8b0000', fontWeight: '600' },
    lastMsg: { fontSize: 14, color: '#A09088' },
    lastMsgBold: { color: '#1A1A1A', fontWeight: '500' },

    // Separador
    separator: { height: 1, backgroundColor: '#F5EDE8', marginLeft: 84 },

    // Empty / Loader
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 80 },
    emptyText: { fontSize: 15, color: '#C0B0A8' },
    centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' }
  });
