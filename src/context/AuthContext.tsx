import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

type User = { id: string; role: 'staff' | 'hospital' | 'admin' };

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

  

  useEffect(() => {
    const load = async () => {
      const t = Platform.OS === 'web'
        ? localStorage.getItem('hospilink_token')
        : await AsyncStorage.getItem('hospilink_token');
      const u = Platform.OS === 'web'
        ? localStorage.getItem('hospilink_user')
        : await AsyncStorage.getItem('hospilink_user');

      setToken(t);
      setUser(u ? JSON.parse(u) : null);
      
      setIsLoading(false);
    };
    load();
  }, []);

  

  const logout = async () => {
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
    <AuthContext.Provider value={{ user, token, isLoading, logout,setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);