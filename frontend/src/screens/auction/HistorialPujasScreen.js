/*
Intro: HistorialPujasScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/auction/HistorialPujasScreen.js.
Endpoints: MY_BIDS (/api/users/me/bids: listar las pujas del usuario).
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // screens/HistorialPujasScreen.js
// Historial de pujas del usuario con filtros: Recientes, Antiguas, Ganadas, Perdidas
// Explica: importa dependencias desde 'react'.
import React, { useState, useEffect, useCallback } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator,
  SafeAreaView } from
'react-native'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde '../../services/api'.
import api from '../../services/api'; // Explica: importa dependencias desde '../../constants/api'.
import { ENDPOINTS } from '../../constants/api'; // Explica: importa dependencias desde '../../utils/images'.
import { imageSourceFromBase64 } from '../../utils/images'; // Explica: define FILTROS para usarlo en este archivo.

const FILTROS = ['Recientes', 'Antiguas', 'Ganadas', 'Perdidas']; // Explica: define COLORS para usarlo en este archivo.

const COLORS = {
  primary: '#8B0000',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textLight: '#888888',
  border: '#E0E0E0',
  ganada: '#2E7D32',
  perdida: '#8B0000',
  enCurso: '#555555',
  filtroActivo: '#8B0000',
  filtroInactivo: '#4A4A4A'
}; // Explica: define RESULTADO_CONFIG para usarlo en este archivo.

const RESULTADO_CONFIG = {
  ganada: { label: 'Ganada', color: COLORS.ganada },
  superada: { label: 'Superada', color: COLORS.perdida },
  en_curso: { label: 'En curso', color: COLORS.enCurso }
}; // Explica: exporta este modulo para que otras partes de la app lo usen.

export default // Explica: declara la funcion HistorialPujasScreen que concentra una parte del flujo.
function HistorialPujasScreen({ navigation }) {// Estado: crea el estado valores desestructurados y su actualizador.
  const [filtro, setFiltro] = useState('Recientes'); // Estado: crea el estado valores desestructurados y su actualizador.
  const [historial, setHistorial] = useState([]); // Estado: crea el estado valores desestructurados y su actualizador.
  const [loading, setLoading] = useState(true); // Estado: crea el estado valores desestructurados y su actualizador.
  const [error, setError] = useState(null); // Evento: memoiza el callback fetchHistorial.
  const fetchHistorial = useCallback(async () => {// Control: intenta una operacion y maneja errores si falla.
    try {// Estado: actualiza un valor usado por la interfaz.
      setLoading(true); // Estado: actualiza un valor usado por la interfaz.
      setError(null); // Explica: define data para usarlo en este archivo.
      const data = await api.get(ENDPOINTS.MY_BIDS); // Estado: actualiza un valor usado por la interfaz.
      setHistorial(data.historial || []);
    } catch (err) {// Estado: actualiza un valor usado por la interfaz.
      setError('No se pudo cargar el historial. Intentá de nuevo.');
    } finally {// Estado: actualiza un valor usado por la interfaz.
      setLoading(false);
    }
  }, []); // Efecto: ejecuta logica cuando cambia el ciclo de vida o sus dependencias.

  useEffect(() => {// Explica: ejecuta fetchHistorial como parte del flujo.
    fetchHistorial();
  }, [fetchHistorial]); // Explica: define historialFiltrado para usarlo en este archivo.

  const historialFiltrado = () => {
    switch (filtro) {
      case 'Antiguas': // Render: devuelve el resultado que consume React o la funcion llamadora.
        return [...historial].reverse();
      case 'Ganadas': // Render: devuelve el resultado que consume React o la funcion llamadora.
        return historial.filter((p) => p.resultado === 'ganada');
      case 'Perdidas': // Render: devuelve el resultado que consume React o la funcion llamadora.
        return historial.filter((p) => p.resultado === 'superada');
      default: // Render: devuelve el resultado que consume React o la funcion llamadora.
        return historial;
    }
  }; // Explica: define renderItem para usarlo en este archivo.

  const renderItem = ({ item }) => {// Explica: define config para usarlo en este archivo.
    const config = RESULTADO_CONFIG[item.resultado] || RESULTADO_CONFIG.en_curso; // Render: devuelve el resultado que consume React o la funcion llamadora.

    return (// UI: renderiza un control presionable para el usuario.
      <TouchableOpacity
        style={styles.card}
        onPress={() => {}}
        activeOpacity={0.7}>
        
        {/* Foto */}
        <View style={styles.fotoContainer}>
          {item.portada ? // UI: muestra una imagen o recurso visual.
          <Image source={imageSourceFromBase64(item.portada)}
          style={styles.foto}
          resizeMode="cover" /> : // UI: renderiza el componente View.


          <View style={[styles.foto, styles.fotoPlaceholder]}>
            <Ionicons name="image-outline" size={24} color={COLORS.border} />
            </View>}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
          <Text style={styles.importe}>
            ${parseFloat(item.importe).toLocaleString('es-AR')}
          </Text>
          <View style={[styles.badge, { backgroundColor: config.color + '20' }]}>
            <Text style={[styles.badgeText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        {/* Estado indicador + flecha */}
        <View style={styles.rightSection}>
          <View style={[styles.dot, { backgroundColor: config.color }]} />
          <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
        </View>
      </TouchableOpacity>);}; // Explica: define renderEmpty para usarlo en este archivo.
  const renderEmpty = () => // UI: renderiza el componente View.
  <View style={styles.emptyContainer}>
    <Ionicons name="receipt-outline" size={48} color={COLORS.border} />
    <Text style={styles.emptyText}>
        {filtro === 'Ganadas' ? 'Todavía no ganaste ninguna subasta.' : filtro === 'Perdidas' ? 'No tenés pujas superadas.' : 'No tenés historial de pujas todavía.'}
      </Text>
    </View>; // Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente SafeAreaView.
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.titulo}>Historial de pujas</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        {FILTROS.map((f) => // UI: renderiza un control presionable para el usuario.
          <TouchableOpacity key={f} style={[styles.filtroBadge, filtro === f && styles.filtroBadgeActivo]} onPress={() => setFiltro(f)} activeOpacity={0.8}>
            
            <Text style={[styles.filtroTexto,
              filtro === f && styles.filtroTextoActivo]
              }>
              {f}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contenido */}
      {loading ? // UI: renderiza el componente View.
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        </View> : error ? // UI: renderiza el componente View.
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.perdida} />
        <Text style={styles.emptyText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchHistorial}>
          <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View> : // UI: organiza contenido desplazable.
      <FlatList data={historialFiltrado()} keyExtractor={(item) => item.pujaId.toString()} renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
        styles.lista,
        historialFiltrado().length === 0 && styles.listaVacia]
        }
        showsVerticalScrollIndicator={false} />

      }

    </SafeAreaView>);

} // Explica: define styles usando el resultado de StyleSheet.create.

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
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
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center'
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text
  },
  filtrosContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  filtroBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.filtroInactivo
  },
  filtroBadgeActivo: {
    backgroundColor: COLORS.filtroActivo
  },
  filtroTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white
  },
  filtroTextoActivo: {
    color: COLORS.white
  },
  lista: {
    padding: 16,
    gap: 10
  },
  listaVacia: {
    flex: 1,
    justifyContent: 'center'
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2
  },
  fotoContainer: {
    marginRight: 12
  },
  foto: {
    width: 60,
    height: 60,
    borderRadius: 8
  },
  fotoPlaceholder: {
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  info: {
    flex: 1,
    gap: 4
  },
  nombre: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text
  },
  importe: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600'
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14
  }
});
