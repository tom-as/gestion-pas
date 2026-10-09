/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { type AuthUser, clearAuthState, loadAuthState, saveAuthState } from '@/lib/auth';
import { UserRole } from '@gestion-pas/types';

interface LoginResponse {
  accessToken: string;
  perfil: UserRole;
  id: string;
  nombre: string;
  aseguradoId: string | null;
  organizadorId: string | null;
  productorId: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (identificadorAcceso: string, password: string) => Promise<void>;
  logout: () => void;
  isOrganizador: boolean;
  isProductor: boolean;
  isAsegurado: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadAuthState);
  const navigate = useNavigate();

  const login = useCallback(async (identificadorAcceso: string, password: string) => {
    const { data } = await api.post<LoginResponse>('/auth/login', {
      identificadorAcceso,
      password,
    });
    const user: AuthUser = { id: data.id, perfil: data.perfil, nombre: data.nombre, aseguradoId: data.aseguradoId, organizadorId: data.organizadorId, productorId: data.productorId };
    saveAuthState(data.accessToken, user);
    setState({ token: data.accessToken, user });

    // Todos los perfiles acceden al dashboard; ampliar aquí si cambia en v2
    navigate('/dashboard');
  }, [navigate]);

  const logout = useCallback(() => {
    clearAuthState();
    setState({ token: null, user: null });
    navigate('/login');
  }, [navigate]);

  const value = useMemo<AuthContextValue>(() => ({
    user: state.user,
    token: state.token,
    login,
    logout,
    isOrganizador: state.user?.perfil === UserRole.ORGANIZADOR,
    isProductor: state.user?.perfil === UserRole.PRODUCTOR,
    isAsegurado: state.user?.perfil === UserRole.ASEGURADO,
  }), [state, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
