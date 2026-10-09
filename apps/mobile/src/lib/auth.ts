import * as SecureStore from 'expo-secure-store';
import { UserRole } from '@gestion-pas/types';

export interface AuthUser {
  id: string;
  perfil: UserRole;
  aseguradoId: string | null;
  organizadorId: string | null;
  productorId: string | null;
}

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);
export const setToken = (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token);
export const removeToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);

export const getUser = async (): Promise<AuthUser | null> => {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
};
export const setUser = (user: AuthUser) =>
  SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
export const removeUser = () => SecureStore.deleteItemAsync(USER_KEY);
