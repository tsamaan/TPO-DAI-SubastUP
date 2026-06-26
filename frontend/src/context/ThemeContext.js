import React, { createContext, useContext } from 'react';
import useSettingsStore from '../store/settingsStore';
import { COLORS, DARK_COLORS } from '../constants/colors';

const ThemeContext = createContext({ theme: COLORS, isDark: false });

export function ThemeProvider({ children }) {
  const isDark = useSettingsStore((s) => s.darkTheme);
  const theme  = isDark ? DARK_COLORS : COLORS;
  return (
    <ThemeContext.Provider value={{ theme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
