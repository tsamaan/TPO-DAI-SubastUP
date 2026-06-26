import React, { useEffect } from 'react';
import { StatusBar }        from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator         from './src/navigation/AppNavigator';
import useSettingsStore     from './src/store/settingsStore';
import { ThemeProvider }    from './src/context/ThemeContext';

export default function App() {
  const darkTheme    = useSettingsStore((s) => s.darkTheme);
  const initSettings = useSettingsStore((s) => s.init);

  useEffect(() => {
    initSettings();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar
          style={darkTheme ? 'light' : 'dark'}
          backgroundColor={darkTheme ? '#121212' : '#FFFFFF'}
        />
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
