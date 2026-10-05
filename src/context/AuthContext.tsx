import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { fcmService } from '@/service/fcm';
import { adminAPI, notificationAPI } from '@/service/api';
import { AdminSubRole } from '@/constant/adminCapabilities';
import { flash, onSessionEnded } from '@/service/session';
import { router } from 'expo-router';

type User = {
  id: string;
  role: 'staff' | 'hospital' | 'admin';
  email?: string;
  name?: string;
  isEmailVerified?: boolean;
  adminSubRole?: AdminSubRole;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  setSession: (token: string, user: User) => void; 
  
};



const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  

  // older admin sessions don't have adminSubRole stored, fetch it from profile
  const backfillAdminSubRole = async (stored: User): Promise<User> => {
    if (stored.role !== 'admin' || stored.adminSubRole) return stored;
    try {
      const res = await adminAPI.getProfile();
      const adminSubRole = res?.data?.adminSubRole;
      if (!adminSubRole) return stored;

      const patched = { ...stored, adminSubRole };
      const serialised = JSON.stringify(patched);
      if (Platform.OS === 'web') {
        localStorage.setItem('hospilink_user', serialised);
      } else {
        await AsyncStorage.setItem('hospilink_user', serialised);
      }
      return patched;
    } catch {
      return stored;
    }
  };

  useEffect(() => {
    const load = async () => {
      const t = Platform.OS === 'web'
        ? localStorage.getItem('hospilink_token')
        : await AsyncStorage.getItem('hospilink_token');
      const u = Platform.OS === 'web'
        ? localStorage.getItem('hospilink_user')
        : await AsyncStorage.getItem('hospilink_user');

      setToken(t);

      const stored: User | null = u ? JSON.parse(u) : null;
      setUser(stored && t ? await backfillAdminSubRole(stored) : stored);

      setIsLoading(false);
    };
    load();
  }, []);

  

  // The API ended the session (account scheduled for deletion, user gone, token rejected).
  // Web reloads on its own; the app clears the session here and goes to sign-in.
  useEffect(
    () =>
      onSessionEnded((message) => {
        setToken(null);
        setUser(null);
        if (Platform.OS !== 'web') {
          if (message) flash(message, 'warning');
          router.replace('/auth/login' as any);
        }
      }),
    []
  );

  const logout = async () => {
    // Remove FCM token before logout
  try {
    const fcmToken = await fcmService.getFCMToken();
    if (fcmToken) {
      await notificationAPI.deleteFCMToken(fcmToken);
    }
  } catch (error) {
    console.error('Failed to remove FCM token:', error);
  }

    if (Platform.OS === 'web') {
      localStorage.removeItem('hospilink_token');
      localStorage.removeItem('hospilink_user');
    } else {
      await AsyncStorage.multiRemove(['hospilink_token', 'hospilink_user']);
    }
    setToken(null);
    setUser(null);
  };

  const setSession = (token: string, user: User) => {
  setToken(token);
  setUser(user);
};
  return (
    <AuthContext.Provider value={{ user, token, isLoading, logout, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
