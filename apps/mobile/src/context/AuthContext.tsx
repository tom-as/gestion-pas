import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';
import {
  AuthUser,
  getToken,
  getUser,
  removeToken,
  removeUser,
  setToken,
  setUser,
} from '../lib/auth';
import { setUnauthorizedListener } from '../lib/authEvents';

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from SecureStore on mount
  useEffect(() => {
    (async () => {
      const [storedToken, storedUser] = await Promise.all([getToken(), getUser()]);
      if (storedToken && storedUser) {
        setTokenState(storedToken);
        setUserState(storedUser);
      }
      setIsLoading(false);
    })();
  }, []);

  // Registrar listener para limpiar estado cuando el interceptor recibe un 401
  useEffect(() => {
    setUnauthorizedListener(() => {
      setTokenState(null);
      setUserState(null);
    });
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', {
      identificadorAcceso: email,
      password,
    });
    const authUser: AuthUser = {
      id: data.id,
      perfil: data.perfil,
      aseguradoId: data.aseguradoId ?? null,
      organizadorId: data.organizadorId ?? null,
      productorId: data.productorId ?? null,
    };
    await setToken(data.accessToken);
    await setUser(authUser);
    setTokenState(data.accessToken);
    setUserState(authUser);
  };

  const logout = async () => {
    await removeToken();
    await removeUser();
    setTokenState(null);
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
}
