import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppTheme } from '../context/ThemeContext';

import useAuthStore             from '../store/authStore';
import SplashScreen             from '../screens/SplashScreen';
import HomeUnauthenticatedScreen from '../screens/tabs/HomeUnauthenticatedScreen';
import AuthNavigator            from './AuthNavigator';
import TabNavigator             from './TabNavigator';
import VerifyCodeScreen     from '../screens/auth/VerifyCodeScreen';
import ResetPasswordScreen  from '../screens/auth/ResetPasswordScreen';
import AuctionListScreen    from '../screens/auction/AuctionListScreen';
import AuctionDetailScreen  from '../screens/auction/AuctionDetailScreen';
import CalendarScreen       from '../screens/tabs/CalendarScreen';
import InformacionScreen    from '../screens/tabs/InformacionScreen';
import AyudaScreen          from '../screens/tabs/AyudaScreen';
import ConfiguracionScreen  from '../screens/tabs/ConfiguracionScreen';
import MiCuentaScreen       from '../screens/profile/MiCuentaScreen';
import CargarProductoScreen from '../screens/auction/CargarProductoScreen';
import AuctionListAuthScreen    from '../screens/auction/AuctionListAuthScreen';
import AuctionDetailAuthScreen  from '../screens/auction/AuctionDetailAuthScreen';
import ChatsScreen             from '../screens/chat/ChatsScreen';
import ChatDetailScreen        from '../screens/chat/ChatDetailScreen';
import AgregarMetodoPagoScreen from '../screens/payments/AgregarMetodoPagoScreen';
import MetodosDePagoScreen     from '../screens/payments/MetodosDePagoScreen';
import MetodoDePagoDetalleScreen from '../screens/payments/MetodoDePagoDetalleScreen';
import HistorialPujasScreen     from '../screens/auction/HistorialPujasScreen';
import ArticulosEnSubastasScreen from '../screens/auction/ArticulosEnSubastasScreen';
import ArticuloEnSubastaDetalleScreen from '../screens/auction/ArticuloEnSubastaDetalleScreen';

const Stack = createNativeStackNavigator();


export default function AppNavigator() {
  const { isLoggedIn, init } = useAuthStore();
  const { isDark, theme } = useAppTheme();

  const DEV_FORCE_LOGIN = false; // ← SOLO DESARROLLO, sacar antes de entregar

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Corre init() y un timer de 3s en paralelo; espera a que ambos terminen.
    // Así el splash siempre dura al menos 3 segundos sin importar qué tan
    // rápido responda AsyncStorage.
    const timer = new Promise((resolve) => setTimeout(resolve, 3000));
    Promise.all([init(), timer]).finally(() => setLoading(false));
  }, []);

  // Mientras se inicializa la app, mostramos la SplashScreen
  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      theme={isDark
        ? {
            ...DarkTheme,
            colors: {
              ...DarkTheme.colors,
              primary:      '#8b0000',
              card:         '#1E1E1E',
              background:   '#121212',
              notification: '#8b0000',
            },
          }
        : {
            ...DefaultTheme,
            colors: {
              ...DefaultTheme.colors,
              primary:      '#8b0000',
              notification: '#8b0000',
            },
          }
      }
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn && !DEV_FORCE_LOGIN ? (
          <>
            <Stack.Screen name="HomeUnauth" component={HomeUnauthenticatedScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="Calendar" component={CalendarScreen} />
            <Stack.Screen name="AuctionList" component={AuctionListScreen} />
            <Stack.Screen name="Auth" component={AuthNavigator} options={{ animationEnabled: false }} />
            <Stack.Screen name="AuctionDetail"  component={AuctionDetailScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main"             component={TabNavigator} />
            <Stack.Screen name="Calendar"         component={CalendarScreen} />
            <Stack.Screen name="Informacion"      component={InformacionScreen} />
            <Stack.Screen name="Configuracion"    component={ConfiguracionScreen} />
            <Stack.Screen name="Ayuda"            component={AyudaScreen} />
            <Stack.Screen name="MiCuenta"         component={MiCuentaScreen} />
            <Stack.Screen name="CargarProducto"   component={CargarProductoScreen} />
            <Stack.Screen name="PujarAuth"        component={AuctionListAuthScreen} />
            <Stack.Screen name="AuctionDetailAuth"  component={AuctionDetailAuthScreen} />
            <Stack.Screen name="Chats" component={ChatsScreen} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
            <Stack.Screen name="AgregarMetodoPago" component={AgregarMetodoPagoScreen} />
            <Stack.Screen name="MetodosDePago" component={MetodosDePagoScreen} />
            <Stack.Screen name="MetodoDePagoDetalle" component={MetodoDePagoDetalleScreen} />
            <Stack.Screen name="HistorialPujas"      component={HistorialPujasScreen} />
            <Stack.Screen name="ArticulosEnSubastas" component={ArticulosEnSubastasScreen} />
            <Stack.Screen name="ArticuloEnSubastaDetalle" component={ArticuloEnSubastaDetalleScreen} />
            <Stack.Screen name="VerifyCode"          component={VerifyCodeScreen} />
            <Stack.Screen name="ResetPassword"       component={ResetPasswordScreen} />

          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
