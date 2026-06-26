import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { ENDPOINTS } from '../constants/api';

const useAuthStore = create((set) => ({
  user:       null,
  token:      null,
  isLoggedIn: false,
  isLoading:  false,
  error:      null,

  init: async () => {
    const token = await AsyncStorage.getItem('token');
    const user  = await AsyncStorage.getItem('user');
    if (token && user) {
      set({ token, user: JSON.parse(user), isLoggedIn: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.post(ENDPOINTS.LOGIN, { email, password });
      // El backend devuelve { ok, token, usuario: { nombre, documento, email, registroId } }
      // @TASK: Conserva el email devuelto por login para las pantallas que usan authStore.
      const userData = {
        id:        data.usuario.personaId ?? data.usuario.registroId,
        registroId: data.usuario.registroId,
        name:      data.usuario.nombre,
        email:     data.usuario.email,
        categoria: data.usuario.categoria,
        rol:       data.usuario.rol,
      };
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      set({ token: data.token, user: userData, isLoggedIn: true, isLoading: false });
    } catch (err) {
      // El backend puede devolver pendiente: true cuando la cuenta aún no fue aprobada
      const msg = err.response?.data?.message || err.response?.data?.error || 'Error al iniciar sesión';
      set({ error: msg, isLoggedIn: false, isLoading: false });
      throw new Error(msg);
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      // El backend devuelve { ok, message, registroId } — sin token.
      // La cuenta queda pendiente de aprobación por un administrador.
      const data = await api.post(ENDPOINTS.REGISTER, userData);
      set({ isLoading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Error al registrarse';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    set({ user: null, token: null, isLoggedIn: false });
  },

  clearError:    () => set({ error: null }),
  setUser:       async (user) => {
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user, isLoggedIn: true });
  },
  setIsLoading:  (isLoading) => set({ isLoading }),
  setError:      (error)     => set({ error }),
}));

export default useAuthStore;
