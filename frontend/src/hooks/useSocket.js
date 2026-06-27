/*
Intro: useSocket es un modulo de apoyo del frontend de SubastUP.
Responsabilidad: organiza la logica visual y de estado definida en hooks/useSocket.js.
Endpoints: no llama endpoints directamente.
Como se conecta: usa el cliente api con BASE_URL y el interceptor de token cuando necesita backend.
Para que sirve: deja claro el flujo para que la pantalla sea facil de estudiar y mantener.
*/ // Explica: importa dependencias desde 'react'.
import { useEffect, useRef } from 'react'; // Explica: importa dependencias desde 'socket.io-client'.
import { io } from 'socket.io-client'; // Explica: importa dependencias desde '@react-native-async-storage/async-storage'.
import AsyncStorage from '@react-native-async-storage/async-storage'; // Explica: importa dependencias desde '../constants/api'.
import { BASE_URL } from '../constants/api'; // Explica: exporta este modulo para que otras partes de la app lo usen.
export default // Explica: declara la funcion useSocket que concentra una parte del flujo.
function useSocket() {// Estado: crea la referencia mutable socketRef.
  const socketRef = useRef(null); // Efecto: ejecuta logica cuando cambia el ciclo de vida o sus dependencias.
  useEffect(() => {// Explica: define connectSocket para usarlo en este archivo.
      const connectSocket = async () => {// Control: intenta una operacion y maneja errores si falla.
        try {// Explica: define token para usarlo en este archivo.
          const token = await AsyncStorage.getItem('token'); // Control: evalua una condicion para decidir el siguiente paso.
          if (!token) // Render: devuelve el resultado que consume React o la funcion llamadora.
            return; // Estado: asigna un nuevo valor para mantener sincronizado el flujo.
          socketRef.current = io(BASE_URL, { auth: { token }, transports: ['websocket'], reconnection: true }); // Explica: ejecuta socketRef.current.on como parte del flujo.
          socketRef.current.on('connect', () => {// Explica: ejecuta console.log como parte del flujo.
              console.log('Socket conectado:', socketRef.current?.id);}); // Explica: ejecuta socketRef.current.on como parte del flujo.

          socketRef.current.on('connect_error', (err) => {// Explica: ejecuta console.error como parte del flujo.
            console.error('Error de conexión socket:', err.message);
          });

        } catch (error) {// Explica: ejecuta console.error como parte del flujo.
          console.error('Error inicializando socket:', error);
        }
      }; // Explica: ejecuta connectSocket como parte del flujo.

      connectSocket(); // Render: devuelve el resultado que consume React o la funcion llamadora.

      return () => {// Control: evalua una condicion para decidir el siguiente paso.
        if (socketRef.current) {// Explica: ejecuta socketRef.current.disconnect como parte del flujo.
          socketRef.current.disconnect();
        }
      };
    }, []); // Render: devuelve el resultado que consume React o la funcion llamadora.

  return socketRef;
}
