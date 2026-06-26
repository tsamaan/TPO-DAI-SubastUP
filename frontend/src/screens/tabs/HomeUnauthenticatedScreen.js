import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';

const LOGO             = require('../../assets/images/texto_appbar.jpeg');
const IMG_PLACEHOLDER1 = require('../../assets/images/imagen_menu1.jpeg');
const IMG_PLACEHOLDER2 = require('../../assets/images/imagen_menu2.jpeg');

export default function HomeUnauthenticatedScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.white }]}>

      <View style={[styles.headerContainer, { backgroundColor: theme.white }]}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: theme.secondary }]}>Subastas Especiales</Text>
        <View style={styles.auctionContainer}>
          <Image source={IMG_PLACEHOLDER1} style={styles.auctionImage} resizeMode="cover" />
          <TouchableOpacity
            style={[styles.verMasButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('AuctionList', { auctionType: 'especial' })}
          >
            <Text style={[styles.verMasText, { color: theme.white }]}>Ver mas</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.secondary }]}>Subastas Comunes</Text>
        <View style={styles.auctionContainer}>
          <Image source={IMG_PLACEHOLDER2} style={styles.auctionImage} resizeMode="cover" />
          <TouchableOpacity
            style={[styles.verMasButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('AuctionList', { auctionType: 'comun' })}
          >
            <Text style={[styles.verMasText, { color: theme.white }]}>Ver mas</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 65 }]}>
        <TouchableOpacity
          style={[styles.navItem, styles.navButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('Auth')}
        >
          <Ionicons name="log-in-outline" size={40} color={theme.white} />
          <Text style={[styles.navLabel, { color: theme.white }]}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItemCenter, styles.navButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('Calendar')}
        >
          <Ionicons name="calendar-outline" size={50} color={theme.white} />
          <Text style={[styles.navLabel, { color: theme.white }]}>Calendario</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, styles.navButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('Auth', { screen: 'Register' })}
        >
          <Ionicons name="person-add-outline" size={40} color={theme.white} />
          <Text style={[styles.navLabel, { color: theme.white }]}>Registrarse</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#FFFFFF' },
  headerContainer:  { alignItems: 'center', paddingTop: 12, paddingBottom: 8, backgroundColor: '#FFFFFF' },
  logo:             { width: '55%', height: 36 },
  scroll:           { flex: 1 },
  scrollContent:    { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 },
  sectionTitle:     { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginTop: 30, marginBottom: 10 },
  auctionContainer: { position: 'relative', height: 190, borderRadius: 12, overflow: 'hidden', marginBottom: 4, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  auctionImage:     { width: '100%', height: '100%' },
  verMasButton:     { position: 'absolute', bottom: 14, right: 14, paddingHorizontal: 18, paddingVertical: 8, backgroundColor: '#8b0000', borderRadius: 8, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 },
  verMasText:       { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  bottomNav:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, paddingHorizontal: 24, gap: 10 },
  navItem:          { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  navItemCenter:    { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  navButton:        { flex: 1, aspectRatio: 1, backgroundColor: '#8b0000', borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 10, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 },
  navLabel:         { fontSize: 11, color: '#FFFFFF', fontWeight: '600', marginTop: 4, textAlign: 'center' },
});
