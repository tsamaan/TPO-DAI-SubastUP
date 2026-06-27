/*
Intro: AuthNavigator es un navegador del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en navigation/AuthNavigator.js.
Endpoints: no llama endpoints directamente.
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React from 'react'; // Explica: importa dependencias desde '@react-navigation/native-stack'.
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // Explica: importa dependencias desde '../screens/auth/LoginScreen'.
import LoginScreen from '../screens/auth/LoginScreen'; // Explica: importa dependencias desde '../screens/auth/RegisterScreen'.
import RegisterScreen from '../screens/auth/RegisterScreen'; // Explica: importa dependencias desde '../screens/auth/RegisterScreen2'.
import RegisterScreen2 from '../screens/auth/RegisterScreen2'; // Explica: importa dependencias desde '../screens/auth/VerifyCodeScreen'.
import VerifyCodeScreen from '../screens/auth/VerifyCodeScreen'; // Explica: importa dependencias desde '../screens/auth/ResetPasswordScreen'.
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen'; // Explica: define Stack usando el resultado de createNativeStackNavigator.
const Stack = createNativeStackNavigator(); // Explica: exporta este modulo para que otras partes de la app lo usen.
export default // Explica: declara la funcion AuthNavigator que concentra una parte del flujo.
function AuthNavigator() {// Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente componente.
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: false // ← esto deshabilita el swipe back
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="RegisterStep2" component={RegisterScreen2} />
      <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>);}
