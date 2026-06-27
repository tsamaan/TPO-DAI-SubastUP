/*
Intro: api es un servicio compartido del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en services/api.js.
Endpoints: no llama endpoints directamente.
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'axios'.
import axios from 'axios'; // Explica: importa dependencias desde '@react-native-async-storage/async-storage'.
import AsyncStorage from '@react-native-async-storage/async-storage'; // Explica: importa dependencias desde '../constants/api'.
import { BASE_URL } from '../constants/api'; // Explica: define api usando el resultado de axios.create.
const api = axios.create({ baseURL: BASE_URL, timeout: 60000, headers: { 'Content-Type': 'application/json' } }); // Explica: ejecuta api.interceptors.request.use como parte del flujo.
api.interceptors.request.use(async (config) => {// Explica: define token para usarlo en este archivo.
  const token = await AsyncStorage.getItem('token'); // Control: evalua una condicion para decidir el siguiente paso.
  if (token) // Estado: asigna un nuevo valor para mantener sincronizado el flujo.
    config.headers.Authorization = `Bearer ${token}`; // Render: devuelve el resultado que consume React o la funcion llamadora.
  return config;},
(error) => Promise.reject(error)
); // Explica: ejecuta api.interceptors.response.use como parte del flujo.

api.interceptors.response.use(
  (response) => response.data, // ← antes era: (response) => response
  async (error) => {// Control: evalua una condicion para decidir el siguiente paso.
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } // Render: devuelve el resultado que consume React o la funcion llamadora.
    return Promise.reject(error);
  }
); // Explica: exporta este modulo para que otras partes de la app lo usen.

export default api;
