/*
Intro: AyudaScreen es un pantalla del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en screens/tabs/AyudaScreen.js.
Endpoints: no llama endpoints directamente.
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useState } from 'react'; // Explica: importa dependencias desde 'react-native'.
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native'; // Explica: importa dependencias desde 'react-native-safe-area-context'.
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde '../../context/ThemeContext'.
import { useAppTheme } from '../../context/ThemeContext'; // Explica: define FAQS para usarlo en este archivo.

const FAQS = [
{
  pregunta: '¿Cómo funciona el sistema de pujas?',
  respuesta: 'Cada artículo tiene un precio base y un tiempo límite. Podés hacer tu oferta en cualquier momento antes del cierre. Si alguien supera tu puja, recibirás una notificación para volver a ofertar.'
},
{
  pregunta: '¿Qué pasa si gano una subasta?',
  respuesta: 'Recibirás una notificación al ganar. Tenés 48 horas para completar el pago. Una vez confirmado, el vendedor coordinará el envío o entrega del artículo.'
},
{
  pregunta: '¿Cómo publico un artículo para subastar?',
  respuesta: 'Desde tu perfil, tocá "Publicar subasta". Completá la descripción, subí fotos, definí el precio base y la duración. Tu publicación será revisada antes de aparecer en la plataforma.'
},
{
  pregunta: '¿Puedo cancelar una puja realizada?',
  respuesta: 'Las pujas son vinculantes y no pueden cancelarse una vez enviadas. Te recomendamos verificar bien el artículo y el precio antes de ofertar.'
},
{
  pregunta: '¿Cuáles son los métodos de pago aceptados?',
  respuesta: 'Aceptamos transferencia bancaria, tarjeta de crédito/débito y MercadoPago. El pago debe realizarse dentro de las 48 horas posteriores al cierre de la subasta.'
}]; // Explica: define FAQItem para usarlo en este archivo.


const FAQItem = ({ pregunta, respuesta }) => {// Explica: define objeto desestructurado usando el resultado de useAppTheme.
  const { theme } = useAppTheme(); // Estado: crea el estado valores desestructurados y su actualizador.
  const [open, setOpen] = useState(false); // Render: devuelve el resultado que consume React o la funcion llamadora.

  return (// UI: renderiza el componente View.
    <View style={[styles.faqItem, { borderBottomColor: theme.border }]}>
      <TouchableOpacity style={styles.faqQuestion}
      onPress={() => setOpen((v) => !v)}
      activeOpacity={0.7}>
        
        <Text style={[styles.faqQuestionText, { color: theme.secondary }]}>{pregunta}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18}
          color="#888888" />
        
      </TouchableOpacity>

      {open && // UI: muestra texto visible en la pantalla.
      <Text style={[styles.faqAnswer, { color: theme.placeholder }]}>{respuesta}</Text>
      }
    </View>);

}; // Explica: exporta este modulo para que otras partes de la app lo usen.

export default // Explica: declara la funcion AyudaScreen que concentra una parte del flujo.
function AyudaScreen({ navigation }) {// Explica: define objeto desestructurado usando el resultado de useAppTheme.
  const { theme, isDark } = useAppTheme(); // Explica: define insets usando el resultado de useSafeAreaInsets.
  const insets = useSafeAreaInsets(); // Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente View.
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.white }]}>

      {/* Header */}
      <View style={[styles.topBar, { backgroundColor: theme.white, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: theme.secondary }]}>Ayuda</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>

        {/* Preguntas Frecuentes */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.secondary }]}>Preguntas Frecuentes</Text>
          {FAQS.map((item, i) => // UI: renderiza el componente FAQItem.
            <FAQItem key={i} pregunta={item.pregunta} respuesta={item.respuesta} />)}
        </View>

        {/* Soporte y Seguridad */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.secondary }]}>Soporte y Seguridad</Text>
          <Text style={[styles.supportText, { color: theme.placeholder }]}>
            Reporta un problema con un artículo, solicita ayuda con una transacción
            o contacta directamente con nuestro equipo de soporte técnico 24/7.
          </Text>
          <TouchableOpacity style={styles.emailRow} onPress={() => Linking.openURL('mailto:soporteSubastUp@gmail.com')} activeOpacity={0.7}>
            <Ionicons name="mail-outline" size={18} color={theme.secondary} />
            <Text style={[styles.emailText, { color: theme.secondary }]}>soporteSubastUp@gmail.com</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>);} // Explica: define styles usando el resultado de StyleSheet.create.
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#EFEFEF' }, topBar: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#F0E8E0',
      elevation: 3,
      shadowColor: '#8b0000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6
    },
    backBtn: { padding: 4 },
    topBarTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', letterSpacing: 0.3 },

    scroll: { padding: 16 },

    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 18,
      marginBottom: 14
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1A1A1A',
      marginBottom: 12
    },

    // FAQ
    faqItem: {
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0'
    },
    faqQuestion: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      gap: 10
    },
    faqQuestionText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '500',
      color: '#1A1A1A',
      lineHeight: 20
    },
    faqAnswer: {
      fontSize: 12,
      color: '#555555',
      lineHeight: 19,
      paddingBottom: 14
    },

    // Soporte
    supportText: {
      fontSize: 13,
      color: '#444444',
      lineHeight: 20,
      marginBottom: 16
    },
    emailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingBottom: 4
    },
    emailText: {
      fontSize: 13,
      color: '#1A1A1A',
      fontWeight: '500'
    }
  });
