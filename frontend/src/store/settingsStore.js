import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'subastup_settings';

const defaultSettings = {
  darkTheme:      false,
  notificaciones: true,
  moneda:         'ARS',
  idioma:         'es',
};

const useSettingsStore = create((set, get) => ({
  ...defaultSettings,

  init: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) set(JSON.parse(stored));
    } catch {}
  },

  _persist: async (newState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch {}
  },

  setDarkTheme: (value) => {
    const next = { ...get(), darkTheme: value };
    set({ darkTheme: value });
    get()._persist(next);
  },

  setNotificaciones: (value) => {
    const next = { ...get(), notificaciones: value };
    set({ notificaciones: value });
    get()._persist(next);
  },

  setMoneda: (value) => {
    const next = { ...get(), moneda: value };
    set({ moneda: value });
    get()._persist(next);
  },

  setIdioma: (value) => {
    const next = { ...get(), idioma: value };
    set({ idioma: value });
    get()._persist(next);
  },
}));

export default useSettingsStore;
