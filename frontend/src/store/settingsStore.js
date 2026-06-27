/*
Intro: settingsStore es un modulo de apoyo del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en store/settingsStore.js.
Endpoints: no llama endpoints directamente.
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'zustand'.
import { create } from 'zustand'; // Explica: importa dependencias desde '@react-native-async-storage/async-storage'.
import AsyncStorage from '@react-native-async-storage/async-storage'; // Explica: define STORAGE_KEY para usarlo en este archivo.
const STORAGE_KEY = 'subastup_settings'; // Explica: define defaultSettings para usarlo en este archivo.
const defaultSettings = { darkTheme: false, notificaciones: true, moneda: 'ARS', idioma: 'es' }; // Explica: define useSettingsStore usando el resultado de create.

const useSettingsStore = create((set, get) => ({
  ...defaultSettings,

  init: async () => {// Control: intenta una operacion y maneja errores si falla.
    try {// Explica: define stored para usarlo en este archivo.
      const stored = await AsyncStorage.getItem(STORAGE_KEY); // Control: evalua una condicion para decidir el siguiente paso.
      if (stored) // Estado: actualiza un valor usado por la interfaz.
        set(JSON.parse(stored));} catch {}
  },

  _persist: async (newState) => {// Control: intenta una operacion y maneja errores si falla.
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch {}
  },

  setDarkTheme: (value) => {// Explica: define next para usarlo en este archivo.
    const next = { ...get(), darkTheme: value }; // Estado: actualiza un valor usado por la interfaz.
    set({ darkTheme: value }); // Explica: ejecuta _persist como parte del flujo.
    get()._persist(next);
  },

  setNotificaciones: (value) => {// Explica: define next para usarlo en este archivo.
    const next = { ...get(), notificaciones: value }; // Estado: actualiza un valor usado por la interfaz.
    set({ notificaciones: value }); // Explica: ejecuta _persist como parte del flujo.
    get()._persist(next);
  },

  setMoneda: (value) => {// Explica: define next para usarlo en este archivo.
    const next = { ...get(), moneda: value }; // Estado: actualiza un valor usado por la interfaz.
    set({ moneda: value }); // Explica: ejecuta _persist como parte del flujo.
    get()._persist(next);
  },

  setIdioma: (value) => {// Explica: define next para usarlo en este archivo.
    const next = { ...get(), idioma: value }; // Estado: actualiza un valor usado por la interfaz.
    set({ idioma: value }); // Explica: ejecuta _persist como parte del flujo.
    get()._persist(next);
  }
})); // Explica: exporta este modulo para que otras partes de la app lo usen.

export default useSettingsStore;
