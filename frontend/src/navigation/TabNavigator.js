/*
Intro: TabNavigator es un navegador del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en navigation/TabNavigator.js.
Endpoints: no llama endpoints directamente.
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React from 'react'; // Explica: importa dependencias desde '@react-navigation/bottom-tabs'.
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // Explica: importa dependencias desde '@expo/vector-icons'.
import { Ionicons } from '@expo/vector-icons'; // Explica: importa dependencias desde 'react-native'.
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'; // Explica: importa dependencias desde 'react-native-safe-area-context'.
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Explica: importa dependencias desde '../context/ThemeContext'.
import { useAppTheme } from '../context/ThemeContext'; // Explica: importa dependencias desde '../screens/tabs/HomeAuthenticatedScreen'.
import HomeScreen from '../screens/tabs/HomeAuthenticatedScreen'; // Explica: importa dependencias desde '../screens/chat/ChatsScreen'.
import ChatsScreen from '../screens/chat/ChatsScreen'; // Explica: importa dependencias desde '../screens/auction/CargarProductoScreen'.
import CargarProductoScreen from '../screens/auction/CargarProductoScreen'; // Explica: importa dependencias desde '../screens/auction/AuctionListAuthScreen'.
import PujarAuth from '../screens/auction/AuctionListAuthScreen'; // Explica: define Tab usando el resultado de createBottomTabNavigator.
const Tab = createBottomTabNavigator(); // Explica: define TABS_CONFIG para usarlo en este archivo.
const TABS_CONFIG = [{ name: 'Home', label: 'Inicio', icon: 'home-outline' }, { name: 'Mensajes', label: 'Mensajes', icon: 'mail-outline' }, { name: 'Publicar', label: 'Publicar', icon: 'add-circle-outline' }, { name: 'Pujar', label: 'Pujar', icon: 'flag-outline' }]; // Explica: define CustomTabBar para usarlo en este archivo.


const CustomTabBar = ({ state, descriptors, navigation }) => {// Explica: define objeto desestructurado usando el resultado de useAppTheme.
  const { theme, isDark } = useAppTheme(); // Explica: define insets usando el resultado de useSafeAreaInsets.
  const insets = useSafeAreaInsets();

  // Ocultar tab bar en la pantalla Publicar
  // Explica: define activeRoute para usarlo en este archivo.
  const activeRoute = state.routes[state.index]; // Control: evalua una condicion para decidir el siguiente paso.
  if (activeRoute.name === 'Publicar') // Render: devuelve el resultado que consume React o la funcion llamadora.
    return null; // Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente View.
    <View style={[styles.bottomNav,
      { paddingBottom: Math.max(insets.bottom, 4), backgroundColor: isDark ? theme.surface : '#FFF5EC' }]
      }>
      {state.routes.map((route, i) => {// Explica: define isFocused para usarlo en este archivo.
        const isFocused = state.index === i; // Explica: define tabConfig usando el resultado de TABS_CONFIG.find.
        const tabConfig = TABS_CONFIG.find((t) => t.name === route.name); // Explica: define onPress para usarlo en este archivo.

        const onPress = () => {// Explica: define event usando el resultado de navigation.emit.
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            preventDefault: () => {}
          }); // Control: evalua una condicion para decidir el siguiente paso.
          if (!isFocused && !event.defaultPrevented) {// Navegacion: cambia de pantalla o ajusta opciones de navegacion.
            navigation.navigate(route.name);
          }
        }; // Render: devuelve el resultado que consume React o la funcion llamadora.

        return (// UI: renderiza un control presionable para el usuario.
          <TouchableOpacity key={i} style={styles.tabItem} onPress={onPress}>
            <Ionicons name={tabConfig?.icon || 'help-outline'}
            size={24}
            color={isFocused ? '#8b0000' : '#9E9E9E'} />
            
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {tabConfig?.label || route.name}
            </Text>
          </TouchableOpacity>);
      })}
    </View>);

}; // Explica: exporta este modulo para que otras partes de la app lo usen.

export default // Explica: declara la funcion TabNavigator que concentra una parte del flujo.
function TabNavigator() {// Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente componente.
    <Tab.Navigator tabBar={(props) => // Navegacion: declara una estructura de pantallas.
    <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Mensajes" component={ChatsScreen} />
      <Tab.Screen name="Publicar" component={CargarProductoScreen} />
      <Tab.Screen name="Pujar" component={PujarAuth} />
    </Tab.Navigator>);} // Explica: define styles usando el resultado de StyleSheet.create.
const styles = StyleSheet.create({ bottomNav: {
      position: 'absolute',
      bottom: 16,
      left: 16,
      right: 16,
      flexDirection: 'row',
      backgroundColor: '#FFF5EC',
      borderRadius: 30,
      paddingTop: 10,
      paddingHorizontal: 8,
      elevation: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 6
    },
    tabLabel: {
      fontSize: 11,
      color: '#9E9E9E',
      fontWeight: '500',
      marginTop: 3
    },
    tabLabelActive: {
      color: '#8b0000',
      fontWeight: '700'
    }
  });
