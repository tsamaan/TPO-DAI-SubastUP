import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/api';
import { imageSourceFromBase64 } from '../../utils/images';

// ─────────────────────────────────────────────
//  Datos mock (Fallback)
// ─────────────────────────────────────────────
const MOCK_CHATS = [
  { id: '1', name: 'Chat 1', lastMessage: 'Ultimo mensaje', time: '10:24', unread: 2, image: require('../../assets/images/imagen_menu1.jpeg') },
  { id: '2', name: 'Chat 2', lastMessage: 'Ultimo mensaje', time: '09:15', unread: 0, image: require('../../assets/images/imagen_menu2.jpeg') },
];

// ─────────────────────────────────────────────
//  Fila de chat individual
// ─────────────────────────────────────────────
function ChatRow({ item, onPress }) {
  const name = item.producto?.nombre || item.nombreProducto || item.name || 'Chat';
  const lastMessage = item.ultimoMensaje || item.lastMessage || '';
  const unread = item.sinLeer ?? item.noLeidos ?? item.unread ?? 0;
  
  // Format time simple
  let timeStr = item.ultimaFecha || item.fechaUltimoMensaje || item.time || '';
  if (item.ultimaFecha || item.fechaUltimoMensaje) {
    const d = new Date(item.ultimaFecha || item.fechaUltimoMensaje);
    if (!isNaN(d.getTime())) {
      timeStr = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    }
  }

  // Fallback image
  const imageSource = item.portada
    ? imageSourceFromBase64(item.portada)
    : item.image || require('../../assets/images/imagen_menu1.jpeg');

  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(item, name)} activeOpacity={0.7}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <Image source={imageSource} style={styles.avatar} />
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
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
        <Text
          style={[styles.lastMsg, unread > 0 && styles.lastMsgBold]}
          numberOfLines={1}
        >
          {lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────
//  Pantalla principal
// ─────────────────────────────────────────────
export default function ChatsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const data = await api.get(ENDPOINTS.CHATS);
      // El backend devuelve { ok, conversaciones: [] }. Solo guardar listas:
      // una respuesta de error no puede romper el render de la pantalla.
      const conversaciones = data?.conversaciones || data?.chats || data?.data;
      setChats(Array.isArray(conversaciones) ? conversaciones : []);
    } catch (error) {
      console.log('Error fetching chats, usando mocks:', error);
      setChats(MOCK_CHATS);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [])
  );

  const filtered = (Array.isArray(chats) ? chats : []).filter(c => {
    const name = c.producto?.nombre || c.nombreProducto || c.name || '';
    const msg = c.ultimoMensaje || c.lastMessage || '';
    return name.toLowerCase().includes(search.toLowerCase()) ||
           msg.toLowerCase().includes(search.toLowerCase());
  });

  const handleOpenChat = (item, name) => {
    navigation.navigate('ChatDetail', { 
      chatId: item.conversacionId || item.id,
      chatName: name,
      estadoProducto: item.producto?.estado || item.estado || 'Activo'
    });
  };

  const handleBackToHome = () => {
    navigation.navigate('Main');
  };

  return (
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
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar"
          placeholderTextColor="#9A8880"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* ── Lista / Loader / Empty ──────────────── */}
      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#8b0000" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => String(item.conversacionId || item.id || index)}
          renderItem={({ item }) => <ChatRow item={item} onPress={handleOpenChat} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubbles-outline" size={48} color="#D0C0B8" />
              <Text style={styles.emptyText}>No hay chats activos</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
//  Estilos
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

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
    shadowRadius: 4,
  },
  backBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
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
    borderColor: '#EDE0D8',
  },
  searchIcon:  { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },

  // Fila de chat
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },

  // Avatar
  avatarWrap: { position: 'relative', marginRight: 14 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F0E8E0',
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
    borderColor: '#FFFFFF',
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },

  // Contenido fila
  rowContent: { flex: 1 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName:       { fontSize: 16, fontWeight: '500', color: '#1A1A1A' },
  chatNameBold:   { fontWeight: '700' },
  timeText:       { fontSize: 12, color: '#A09088' },
  timeTextActive: { color: '#8b0000', fontWeight: '600' },
  lastMsg:        { fontSize: 14, color: '#A09088' },
  lastMsgBold:    { color: '#1A1A1A', fontWeight: '500' },

  // Separador
  separator: { height: 1, backgroundColor: '#F5EDE8', marginLeft: 84 },

  // Empty / Loader
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 80 },
  emptyText: { fontSize: 15, color: '#C0B0A8' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
