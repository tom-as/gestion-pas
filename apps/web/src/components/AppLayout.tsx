import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/lib/useDarkMode';
import { UserRole } from '@gestion-pas/types';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem { to: string; label: string }

/* ── SVG icons ────────────────────────────────────────── */
const Icon = {
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  sun:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
};

/* ── Nav items by role ───────────────────────────────────── */
function navItemsByRole(role: UserRole): NavItem[] {
  const shared: NavItem[] = [
    { to: '/dashboard',  label: 'Inicio'     },
    { to: '/asegurados', label: 'Asegurados' },
    { to: '/bienes',     label: 'Bienes'     },
    { to: '/polizas',    label: 'Pólizas'    },
    { to: '/siniestros', label: 'Siniestros' },
    { to: '/reclamos',   label: 'Reclamos'   },
    { to: '/documentos', label: 'Documentos' },
  ];
  if (role === UserRole.ORGANIZADOR) {
    return [
      ...shared,
      { to: '/productores', label: 'Productores' },
      { to: '/companias',   label: 'Compañías'   },
      { to: '/reportes',    label: 'Reportes'    },
    ];
  }
  if (role === UserRole.ASEGURADO) {
    return [
      { to: '/dashboard',  label: 'Inicio'         },
      { to: '/polizas',    label: 'Mis pólizas'    },
      { to: '/siniestros', label: 'Mis siniestros' },
      { to: '/reclamos',   label: 'Mis reclamos'   },
    ];
  }
  return shared;
}

/* ── Role labels / colors ────────────────────────────────── */
const ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.ORGANIZADOR]: 'organizador',
  [UserRole.PRODUCTOR]:   'productor',
  [UserRole.ASEGURADO]:   'asegurado',
};
const ROLE_COLOR: Record<UserRole, { bg: string; text: string }> = {
  [UserRole.ORGANIZADOR]: { bg: 'rgba(139,92,246,0.18)', text: '#a78bfa' },
  [UserRole.PRODUCTOR]:   { bg: 'rgba(16,185,129,0.18)', text: '#34d399' },
  [UserRole.ASEGURADO]:   { bg: 'rgba(245,158,11,0.18)', text: '#fbbf24' },
};

/* ════════════════════════════════════════════════════════════
   AppLayout — top-nav layout
════════════════════════════════════════════════════════════ */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useDarkMode();
  const location = useLocation();
  if (!user) return null;

  const navItems = navItemsByRole(user.perfil);
  const roleColor = ROLE_COLOR[user.perfil];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg-main)' }}
    >
      {/* ════════════════════════════════════════════════════
          TOP BAR — logo + nav + user
      ════════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-30 flex-shrink-0"
        style={{
          background: 'linear-gradient(180deg, #111827 0%, #0f1623 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* ── Row 1: brand + user actions ─────────────────── */}
        <div className="flex items-center justify-between px-6 h-12">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(61,107,255,0.15)',
                border: '1px solid rgba(61,107,255,0.3)',
                color: '#6690ff',
              }}
            >
              {Icon.shield}
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">
              Gestión PAS
            </span>
          </div>

          {/* Right: search + user */}
          <div className="flex items-center gap-3">
            {/* Search icon button */}
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'rgba(255,255,255,0.45)' }}
              title="Buscar"
            >
              {Icon.search}
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              title={dark ? 'Modo claro' : 'Modo oscuro'}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              {dark ? Icon.sun : Icon.moon}
            </button>

            {/* Avatar + name + role badge */}
            <div className="flex items-center gap-2">
              {/* Avatar circle */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: 'rgba(61,107,255,0.25)',
                  border: '1px solid rgba(61,107,255,0.4)',
                  color: '#6690ff',
                }}
              >
                {ROLE_LABEL[user.perfil][0].toUpperCase()}
              </div>
              <span className="text-sm font-medium text-white hidden sm:inline">
                {ROLE_LABEL[user.perfil].charAt(0).toUpperCase() + ROLE_LABEL[user.perfil].slice(1)}
              </span>
              {/* Role badge */}
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                style={{ background: roleColor.bg, color: roleColor.text }}
              >
                {ROLE_LABEL[user.perfil]}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.35)' }}
              title="Cerrar sesión"
            >
              Salir
            </button>
          </div>
        </div>

        {/* ── Row 2: nav tabs ─────────────────────────────── */}
        <nav
          className="flex items-end gap-0 px-5 overflow-x-auto"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap select-none ${
                  isActive
                    ? 'text-white'
                    : 'text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.75)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-4 right-4 h-[2px] rounded-t-full"
                      style={{ background: '#6690ff' }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* ════════════════════════════════════════════════════
          CONTENIDO PRINCIPAL
      ════════════════════════════════════════════════════ */}
      <main
        className="flex-1 overflow-y-auto content-area"
        style={{ background: 'var(--bg-main-gradient)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="page-canvas p-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
