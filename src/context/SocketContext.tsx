// src/context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
const API_URL = process.env.EXPO_PUBLIC_API_URL;

const SOCKET_URL = API_URL ?? ''

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  // logging in doesn't reload the app, so connect when the session token appears (and drop it on logout)
  const { token: sessionToken } = useAuth();

  useEffect(() => {
    if (!sessionToken) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const connect = () => {
      // the token from the current sign-in (an old 'authToken' storage key could hold a stale value)
      const token = sessionToken;
      if (!SOCKET_URL) {
        console.log('[SocketContext] EXPO_PUBLIC_API_URL is not set, skipping connection');
        return;
      }

      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        // spread reconnects after a server deploy
        randomizationFactor: 1,
        reconnectionDelayMax: 30000,
      });

      socket.on('connect', () => {
        setIsConnected(true);
        setSocket(socket);
      });
      socket.on('disconnect', () => {
        setIsConnected(false);
        setSocket(null);
      });
      socket.on('connect_error', (error) => {
        console.warn('[SocketContext] Connection error:', error.message);
      });
      socketRef.current = socket;
      setSocket(socket);
    };

    connect();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [sessionToken]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);