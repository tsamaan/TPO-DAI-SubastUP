/*
Intro: AppNavigator es un navegador del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en navigation/AppNavigator.js.
Endpoints: no llama endpoints directamente.
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { useEffect, useState } from 'react'; // Explica: importa dependencias desde '@react-navigation/native'.
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native'; // Explica: importa dependencias desde '@react-navigation/native-stack'.
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // Explica: importa dependencias desde '../context/ThemeContext'.
import { useAppTheme } from '../context/ThemeContext'; // Explica: importa dependencias desde '../store/authStore'.
import useAuthStore from '../store/authStore'; // Explica: importa dependencias desde '../screens/SplashScreen'.
import SplashScreen from '../screens/SplashScreen'; // Explica: importa dependencias desde '../screens/tabs/HomeUnauthenticatedScreen'.
import HomeUnauthenticatedScreen from '../screens/tabs/HomeUnauthenticatedScreen'; // Explica: importa dependencias desde './AuthNavigator'.
import AuthNavigator from './AuthNavigator'; // Explica: importa dependencias desde './TabNavigator'.
import TabNavigator from './TabNavigator'; // Explica: importa dependencias desde '../screens/auth/VerifyCodeScreen'.
import VerifyCodeScreen from '../screens/auth/VerifyCodeScreen'; // Explica: importa dependencias desde '../screens/auth/ResetPasswordScreen'.
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen'; // Explica: importa dependencias desde '../screens/auction/AuctionListScreen'.
import AuctionListScreen from '../screens/auction/AuctionListScreen'; // Explica: importa dependencias desde '../screens/auction/AuctionDetailScreen'.
import AuctionDetailScreen from '../screens/auction/AuctionDetailScreen'; // Explica: importa dependencias desde '../screens/tabs/CalendarScreen'.
import CalendarScreen from '../screens/tabs/CalendarScreen'; // Explica: importa dependencias desde '../screens/tabs/InformacionScreen'.
import InformacionScreen from '../screens/tabs/InformacionScreen'; // Explica: importa dependencias desde '../screens/tabs/AyudaScreen'.
import AyudaScreen from '../screens/tabs/AyudaScreen'; // Explica: importa dependencias desde '../screens/tabs/ConfiguracionScreen'.
import ConfiguracionScreen from '../screens/tabs/ConfiguracionScreen'; // Explica: importa dependencias desde '../screens/profile/MiCuentaScreen'.
import MiCuentaScreen from '../screens/profile/MiCuentaScreen'; // Explica: importa dependencias desde '../screens/auction/CargarProductoScreen'.
import CargarProductoScreen from '../screens/auction/CargarProductoScreen'; // Explica: importa dependencias desde '../screens/auction/AuctionListAuthScreen'.
import AuctionListAuthScreen from '../screens/auction/AuctionListAuthScreen'; // Explica: importa dependencias desde '../screens/auction/AuctionDetailAuthScreen'.
import AuctionDetailAuthScreen from '../screens/auction/AuctionDetailAuthScreen'; // Explica: importa dependencias desde '../screens/chat/ChatsScreen'.
import ChatsScreen from '../screens/chat/ChatsScreen'; // Explica: importa dependencias desde '../screens/chat/ChatDetailScreen'.
import ChatDetailScreen from '../screens/chat/ChatDetailScreen'; // Explica: importa dependencias desde '../screens/payments/AgregarMetodoPagoScreen'.
import AgregarMetodoPagoScreen from '../screens/payments/AgregarMetodoPagoScreen'; // Explica: importa dependencias desde '../screens/payments/MetodosDePagoScreen'.
import MetodosDePagoScreen from '../screens/payments/MetodosDePagoScreen'; // Explica: importa dependencias desde '../screens/payments/MetodoDePagoDetalleScreen'.
import MetodoDePagoDetalleScreen from '../screens/payments/MetodoDePagoDetalleScreen'; // Explica: importa dependencias desde '../screens/auction/HistorialPujasScreen'.
import HistorialPujasScreen from '../screens/auction/HistorialPujasScreen'; // Explica: importa dependencias desde '../screens/auction/ArticulosEnSubastasScreen'.
import ArticulosEnSubastasScreen from '../screens/auction/ArticulosEnSubastasScreen'; // Explica: importa dependencias desde '../screens/auction/ArticuloEnSubastaDetalleScreen'.
import ArticuloEnSubastaDetalleScreen from '../screens/auction/ArticuloEnSubastaDetalleScreen'; // Explica: define Stack usando el resultado de createNativeStackNavigator.
const Stack = createNativeStackNavigator(); // Explica: exporta este modulo para que otras partes de la app lo usen.
export default // Explica: declara la funcion AppNavigator que concentra una parte del flujo.
function AppNavigator() {// Explica: define objeto desestructurado usando el resultado de useAuthStore.
  const { isLoggedIn, init } = useAuthStore(); // Explica: define objeto desestructurado usando el resultado de useAppTheme.
  const { isDark, theme } = useAppTheme(); // Explica: define DEV_FORCE_LOGIN para usarlo en este archivo.
  const DEV_FORCE_LOGIN = false; // ← SOLO DESARROLLO, sacar antes de entregar
  // Estado: crea el estado valores desestructurados y su actualizador.
  const [loading, setLoading] = useState(true); // Efecto: ejecuta logica cuando cambia el ciclo de vida o sus dependencias.
  useEffect(() => {// Corre init() y un timer de 3s en paralelo; espera a que ambos terminen.
      // Así el splash siempre dura al menos 3 segundos sin importar qué tan
      // rápido responda AsyncStorage.
      // Explica: define timer para usarlo en este archivo.
      const timer = new Promise((resolve) => setTimeout(resolve, 3000)); // Explica: ejecuta finally como parte del flujo.
      Promise.all([init(), timer]).finally(() => setLoading(false));}, []);
  // Mientras se inicializa la app, mostramos la SplashScreen
  // Control: evalua una condicion para decidir el siguiente paso.
  if (loading) {// Render: devuelve el resultado que consume React o la funcion llamadora.
    return (// UI: renderiza el componente SplashScreen.
      <SplashScreen />);} // Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente NavigationContainer.
    <NavigationContainer
      theme={isDark ?
      {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: '#8b0000',
          card: '#1E1E1E',
          background: '#121212',
          notification: '#8b0000'
        }
      } :
      {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: '#8b0000',
          notification: '#8b0000'
        }
      }
      }>
      
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn && !DEV_FORCE_LOGIN ? <>
          <Stack.Screen name="HomeUnauth" component={HomeUnauthenticatedScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="Calendar" component={CalendarScreen} />
          <Stack.Screen name="AuctionList" component={AuctionListScreen} />
          <Stack.Screen name="Auth" component={AuthNavigator} options={{ animationEnabled: false }} />
          <Stack.Screen name="AuctionDetail" component={AuctionDetailScreen} />
          </> : <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="Calendar" component={CalendarScreen} />
          <Stack.Screen name="Informacion" component={InformacionScreen} />
          <Stack.Screen name="Configuracion" component={ConfiguracionScreen} />
          <Stack.Screen name="Ayuda" component={AyudaScreen} />
          <Stack.Screen name="MiCuenta" component={MiCuentaScreen} />
          <Stack.Screen name="CargarProducto" component={CargarProductoScreen} />
          <Stack.Screen name="PujarAuth" component={AuctionListAuthScreen} />
          <Stack.Screen name="AuctionDetailAuth" component={AuctionDetailAuthScreen} />
          <Stack.Screen name="Chats" component={ChatsScreen} />
          <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
          <Stack.Screen name="AgregarMetodoPago" component={AgregarMetodoPagoScreen} />
          <Stack.Screen name="MetodosDePago" component={MetodosDePagoScreen} />
          <Stack.Screen name="MetodoDePagoDetalle" component={MetodoDePagoDetalleScreen} />
          <Stack.Screen name="HistorialPujas" component={HistorialPujasScreen} />
          <Stack.Screen name="ArticulosEnSubastas" component={ArticulosEnSubastasScreen} />
          <Stack.Screen name="ArticuloEnSubastaDetalle" component={ArticuloEnSubastaDetalleScreen} />
          <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

          </>}
      </Stack.Navigator>
    </NavigationContainer>);}
