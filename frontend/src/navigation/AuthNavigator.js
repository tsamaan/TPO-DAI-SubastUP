import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen          from '../screens/auth/LoginScreen';
import RegisterScreen       from '../screens/auth/RegisterScreen';
import RegisterScreen2      from '../screens/auth/RegisterScreen2';
import VerifyCodeScreen     from '../screens/auth/VerifyCodeScreen';
import ResetPasswordScreen  from '../screens/auth/ResetPasswordScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ 
      headerShown: false,
      gestureEnabled: false   // ← esto deshabilita el swipe back
    }}>
      <Stack.Screen name="Login"          component={LoginScreen} />
      <Stack.Screen name="Register"       component={RegisterScreen} />
      <Stack.Screen name="RegisterStep2"  component={RegisterScreen2} />
      <Stack.Screen name="VerifyCode"     component={VerifyCodeScreen} />
      <Stack.Screen name="ResetPassword"  component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}