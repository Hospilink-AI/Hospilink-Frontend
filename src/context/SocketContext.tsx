// src/context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const connect = async () => {
      // Try multiple token keys
      let token = await AsyncStorage.getItem('authToken');
      if (!token && Platform.OS === 'web') {
        token = localStorage.getItem('hospilink_token');
      }
      if (!token) {
        token = await AsyncStorage.getItem('hospilink_token');
      }
      
      console.log('🔌 [SocketContext] Attempting to connect...');
      console.log('🔌 [SocketContext] Auth token exists:', !!token);
      console.log('🔌 [SocketContext] Token value:', token ? token.substring(0, 20) + '...' : 'null');
      
      if (!token) {
        console.log('❌ [SocketContext] No auth token found, skipping connection');
        return;
      }

      if (!SOCKET_URL) {
        console.log('❌ [SocketContext] EXPO_PUBLIC_API_URL is not set, skipping connection');
        return;
      }

      console.log('🔌 [SocketContext] Connecting to:', SOCKET_URL);
      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socket.on('connect', () => {
        console.log('✅ [SocketContext] Socket connected successfully');
        console.log('✅ [SocketContext] Socket ID:', socket.id);
        setIsConnected(true);
        setSocket(socket);
      });
      socket.on('disconnect', () => {
        console.log('⚠️ [SocketContext] Socket disconnected');
        setIsConnected(false);
        setSocket(null);
      });
      socket.on('connect_error', (error) => {
        console.error('❌ [SocketContext] Connection error:', error.message);
        console.error('❌ [SocketContext] Error details:', error);
      });
      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('🔄 [SocketContext] Reconnection attempt:', attemptNumber);
      });
      socketRef.current = socket;
      setSocket(socket);
    };

    connect();

    return () => {
      console.log('🔌 [SocketContext] Disconnecting socket...');
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);