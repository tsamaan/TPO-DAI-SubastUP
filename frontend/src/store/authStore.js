/*
Intro: authStore es un modulo de apoyo del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en store/authStore.js.
Endpoints: LOGIN (/api/auth/login: iniciar sesion y obtener credenciales); REGISTER (/api/auth/register: crear una cuenta nueva).
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'zustand'.
import { create } from 'zustand'; // Explica: importa dependencias desde '@react-native-async-storage/async-storage'.
import AsyncStorage from '@react-native-async-storage/async-storage'; // Explica: importa dependencias desde '../services/api'.
import api from '../services/api'; // Explica: importa dependencias desde '../constants/api'.
import { ENDPOINTS } from '../constants/api'; // Explica: define useAuthStore usando el resultado de create.
const useAuthStore = create((set) => ({ user: null, token: null, isLoggedIn: false, isLoading: false, error: null,
    init: async () => {// Explica: define token para usarlo en este archivo.
      const token = await AsyncStorage.getItem('token'); // Explica: define user para usarlo en este archivo.
      const user = await AsyncStorage.getItem('user'); // Control: evalua una condicion para decidir el siguiente paso.
      if (token && user) {// Estado: actualiza un valor usado por la interfaz.
        set({ token, user: JSON.parse(user), isLoggedIn: true });
      }
    },

    login: async (email, password) => {// Estado: actualiza un valor usado por la interfaz.
      set({ isLoading: true, error: null }); // Control: intenta una operacion y maneja errores si falla.
      try {// Explica: define data para usarlo en este archivo.
        const data = await api.post(ENDPOINTS.LOGIN, { email, password });
        // El backend devuelve { ok, token, usuario: { nombre, documento, email, registroId } }
        // @TASK: Conserva el email devuelto por login para las pantallas que usan authStore.
        // Explica: define userData para usarlo en este archivo.
        const userData = { id: data.usuario.personaId ?? data.usuario.registroId,
          registroId: data.usuario.registroId,
          name: data.usuario.nombre,
          email: data.usuario.email,
          categoria: data.usuario.categoria,
          rol: data.usuario.rol
        };
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(userData)); // Estado: actualiza un valor usado por la interfaz.
        set({ token: data.token, user: userData, isLoggedIn: true, isLoading: false });
      } catch (err) {
        // El backend puede devolver pendiente: true cuando la cuenta aún no fue aprobada
        // Explica: define msg para usarlo en este archivo.
        const msg = err.response?.data?.message || err.response?.data?.error || 'Error al iniciar sesión'; // Estado: actualiza un valor usado por la interfaz.
        set({ error: msg, isLoggedIn: false, isLoading: false });throw new Error(msg);
      }
    },

    register: async (userData) => {// Estado: actualiza un valor usado por la interfaz.
      set({ isLoading: true, error: null }); // Control: intenta una operacion y maneja errores si falla.
      try {
        // El backend devuelve { ok, message, registroId } — sin token.
        // La cuenta queda pendiente de aprobación por un administrador.
        // Explica: define data para usarlo en este archivo.
        const data = await api.post(ENDPOINTS.REGISTER, userData); // Estado: actualiza un valor usado por la interfaz.
        set({ isLoading: false }); // Render: devuelve el resultado que consume React o la funcion llamadora.
        return data;} catch (err) {// Explica: define msg para usarlo en este archivo.
        const msg = err.response?.data?.message || err.response?.data?.error || 'Error al registrarse'; // Estado: actualiza un valor usado por la interfaz.
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
    },

    logout: async () => {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user'); // Estado: actualiza un valor usado por la interfaz.
      set({ user: null, token: null, isLoggedIn: false });
    },

    clearError: () => set({ error: null }),
    setUser: async (user) => {
      await AsyncStorage.setItem('user', JSON.stringify(user)); // Estado: actualiza un valor usado por la interfaz.
      set({ user, isLoggedIn: true });
    },
    setIsLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error })
  })); // Explica: exporta este modulo para que otras partes de la app lo usen.

export default useAuthStore;
