import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import AseguradoDetailPage from '@/pages/AseguradoDetailPage';
import AseguradosPage from '@/pages/AseguradosPage';
import BienesPage from '@/pages/BienesPage';
import PolizasPage from '@/pages/PolizasPage';
import SiniestrosPage from '@/pages/SiniestrosPage';
import ReclamosPage from '@/pages/ReclamosPage';
import DocumentosPage from '@/pages/DocumentosPage';
import ReportesPage from '@/pages/ReportesPage';
import ProductoresPage from '@/pages/ProductoresPage';
import CompaniasPage from '@/pages/CompaniasPage';
import ExportarPage from '@/pages/ExportarPage';
import { UserRole } from '@gestion-pas/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AppRoutes() {
  return (
    <Routes>
      {/* Pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* Privadas — cualquier usuario autenticado */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/dashboard"
          element={
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          }
        />
        <Route
          path="/asegurados"
          element={<AppLayout><AseguradosPage /></AppLayout>}
        />
        <Route
          path="/asegurados/:id"
          element={<AppLayout><AseguradoDetailPage /></AppLayout>}
        />
        <Route
          path="/bienes"
          element={<AppLayout><BienesPage /></AppLayout>}
        />
        <Route
          path="/bienes/asegurado/:aseguradoId"
          element={<AppLayout><BienesPage /></AppLayout>}
        />
        <Route
          path="/polizas"
          element={<AppLayout><PolizasPage /></AppLayout>}
        />
        <Route
          path="/polizas/:id"
          element={<AppLayout><PolizasPage /></AppLayout>}
        />
        <Route
          path="/siniestros"
          element={<AppLayout><SiniestrosPage /></AppLayout>}
        />
        <Route
          path="/siniestros/:id"
          element={<AppLayout><SiniestrosPage /></AppLayout>}
        />
        <Route
          path="/reclamos"
          element={<AppLayout><ReclamosPage /></AppLayout>}
        />
        <Route
          path="/reclamos/:id"
          element={<AppLayout><ReclamosPage /></AppLayout>}
        />
        <Route
          path="/documentos"
          element={<AppLayout><DocumentosPage /></AppLayout>}
        />
        {/* Productores, Compañías y Exportar: solo organizador */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZADOR]} />}>
          <Route
            path="/productores"
            element={<AppLayout><ProductoresPage /></AppLayout>}
          />
          <Route
            path="/companias"
            element={<AppLayout><CompaniasPage /></AppLayout>}
          />
          <Route
            path="/exportar"
            element={<AppLayout><ExportarPage /></AppLayout>}
          />
        </Route>
        {/* Reportes: solo organizador y productor */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.ORGANIZADOR, UserRole.PRODUCTOR]} />}>
          <Route
            path="/reportes"
            element={<AppLayout><ReportesPage /></AppLayout>}
          />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
