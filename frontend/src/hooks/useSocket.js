import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constants/api';

export default function useSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    const connectSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        socketRef.current = io(BASE_URL, {
          auth: { token },
          transports: ['websocket'],
          reconnection: true,
        });

        socketRef.current.on('connect', () => {
          console.log('Socket conectado:', socketRef.current?.id);
        });

        socketRef.current.on('connect_error', (err) => {
          console.error('Error de conexión socket:', err.message);
        });

      } catch (error) {
        console.error('Error inicializando socket:', error);
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return socketRef;
}
