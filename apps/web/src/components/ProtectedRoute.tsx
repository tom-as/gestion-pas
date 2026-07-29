import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@gestion-pas/types';

interface Props {
  /** Si se especifica, solo ese perfil puede pasar; si no, cualquier autenticado */
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.perfil)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
