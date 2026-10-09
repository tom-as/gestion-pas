import { UserRole } from '@gestion-pas/types';

export interface AuthUser {
  id: string;
  perfil: UserRole;
  nombre: string;
  /** Solo poblado cuando perfil === ASEGURADO */
  aseguradoId: string | null;
  /** Solo poblado cuando perfil === ORGANIZADOR */
  organizadorId: string | null;
  /** Solo poblado cuando perfil === PRODUCTOR */
  productorId: string | null;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
}

export function loadAuthState(): AuthState {
  try {
    const token = localStorage.getItem('token');
    const raw = localStorage.getItem('user');
    const user: AuthUser | null = raw ? (JSON.parse(raw) as AuthUser) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export function saveAuthState(token: string, user: AuthUser): void {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuthState(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
