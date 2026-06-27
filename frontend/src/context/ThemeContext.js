/*
Intro: ThemeContext es un modulo de apoyo del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en context/ThemeContext.js.
Endpoints: no llama endpoints directamente.
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import React, { createContext, useContext } from 'react'; // Explica: importa dependencias desde '../store/settingsStore'.
import useSettingsStore from '../store/settingsStore'; // Explica: importa dependencias desde '../constants/colors'.
import { COLORS, DARK_COLORS } from '../constants/colors'; // Explica: define ThemeContext usando el resultado de createContext.
const ThemeContext = createContext({ theme: COLORS, isDark: false });export // Explica: declara la funcion ThemeProvider que concentra una parte del flujo.
function ThemeProvider({ children }) {// Explica: define isDark usando el resultado de useSettingsStore.
  const isDark = useSettingsStore((s) => s.darkTheme); // Explica: define theme para usarlo en este archivo.
  const theme = isDark ? DARK_COLORS : COLORS; // Render: devuelve el resultado que consume React o la funcion llamadora.
  return (// UI: renderiza el componente componente.
    <ThemeContext.Provider value={{ theme, isDark }}>
      {children}
    </ThemeContext.Provider>);}export // Explica: declara la funcion useAppTheme que concentra una parte del flujo.
function useAppTheme() {// Render: devuelve el resultado que consume React o la funcion llamadora.
  return useContext(ThemeContext);}
