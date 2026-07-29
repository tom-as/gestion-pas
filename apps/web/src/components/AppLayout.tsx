import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/lib/useDarkMode';
import { UserRole } from '@gestion-pas/types';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem { to: string; label: string; icon: React.ReactNode; group?: string }

/* ── SVG icons ────────────────────────────────────────── */
const Icon = {
  home:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>,
  users:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/></svg>,
  shield:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  alert:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  message:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  paperclip:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  handshake:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l1.06 1.06L12 21.23l7.36-7.36 1.06-1.07a5.4 5.4 0 0 0 0-7.22z"/></svg>,
  building: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="18"/><rect x="14" y="8" width="7" height="13"/><rect x="7" y="14" width="7" height="7"/></svg>,
  chart:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  property: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
  logout:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  sun:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  chevron:  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
};

/* ── Nav items by role ───────────────────────────────────── */
function navItemsByRole(role: UserRole): NavItem[] {
  const shared: NavItem[] = [
    { to: '/dashboard',  label: 'Inicio',     icon: Icon.home,      group: 'Principal' },
    { to: '/asegurados', label: 'Asegurados', icon: Icon.users,     group: 'Gestión' },
    { to: '/bienes',     label: 'Bienes',     icon: Icon.property,  group: 'Gestión' },
    { to: '/polizas',    label: 'Pólizas',    icon: Icon.shield,    group: 'Gestión' },
    { to: '/siniestros', label: 'Siniestros', icon: Icon.alert,     group: 'Trámites' },
    { to: '/reclamos',   label: 'Reclamos',   icon: Icon.message,   group: 'Trámites' },
    { to: '/documentos', label: 'Documentos', icon: Icon.paperclip, group: 'Trámites' },
  ];
  if (role === UserRole.ORGANIZADOR) {
    return [
      ...shared,
      { to: '/productores', label: 'Productores', icon: Icon.handshake, group: 'Admin' },
      { to: '/companias',   label: 'Compañías',   icon: Icon.building,  group: 'Admin' },
      { to: '/reportes',    label: 'Reportes',    icon: Icon.chart,     group: 'Admin' },
    ];
  }
  if (role === UserRole.ASEGURADO) {
    return [
      { to: '/dashboard',  label: 'Inicio',         icon: Icon.home,    group: 'Principal' },
      { to: '/polizas',    label: 'Mis pólizas',    icon: Icon.shield,  group: 'Mi cuenta' },
      { to: '/siniestros', label: 'Mis siniestros', icon: Icon.alert,   group: 'Mi cuenta' },
      { to: '/reclamos',   label: 'Mis reclamos',   icon: Icon.message, group: 'Mi cuenta' },
    ];
  }
  return shared;
}

/* ── Breadcrumb label map ────────────────────────────────── */
const ROUTE_LABEL: Record<string, string> = {
  dashboard:  'Dashboard',
  asegurados: 'Asegurados',
  bienes:     'Bienes',
  polizas:    'Pólizas',
  siniestros: 'Siniestros',
  reclamos:   'Reclamos',
  documentos: 'Documentos',
  productores:'Productores',
  companias:  'Compañías',
  reportes:   'Reportes',
};

/* ── Role labels / colors ────────────────────────────────── */
const ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.ORGANIZADOR]: 'Organizador',
  [UserRole.PRODUCTOR]:   'Productor',
  [UserRole.ASEGURADO]:   'Asegurado',
};
const ROLE_COLOR: Record<UserRole, string> = {
  [UserRole.ORGANIZADOR]: 'rgba(61,107,255,0.15)',
  [UserRole.PRODUCTOR]:   'rgba(16,185,129,0.15)',
  [UserRole.ASEGURADO]:   'rgba(245,158,11,0.15)',
};
const ROLE_TEXT: Record<UserRole, string> = {
  [UserRole.ORGANIZADOR]: '#6690ff',
  [UserRole.PRODUCTOR]:   '#34d399',
  [UserRole.ASEGURADO]:   '#fbbf24',
};

/* ── Role avatar initial color ───────────────────────────── */
const ROLE_AVATAR_BG: Record<UserRole, string> = {
  [UserRole.ORGANIZADOR]: 'linear-gradient(135deg, rgba(61,107,255,0.35), rgba(61,107,255,0.15))',
  [UserRole.PRODUCTOR]:   'linear-gradient(135deg, rgba(16,185,129,0.35), rgba(16,185,129,0.15))',
  [UserRole.ASEGURADO]:   'linear-gradient(135deg, rgba(245,158,11,0.35), rgba(245,158,11,0.15))',
};

/* ════════════════════════════════════════════════════════════
   AppLayout
════════════════════════════════════════════════════════════ */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useDarkMode();
  const location = useLocation();
  if (!user) return null;

  const navItems = navItemsByRole(user.perfil);

  // Group nav items
  const groups: { label: string; items: NavItem[] }[] = [];
  for (const item of navItems) {
    const g = item.group ?? '';
    const existing = groups.find((x) => x.label === g);
    if (existing) existing.items.push(item);
    else groups.push({ label: g, items: [item] });
  }

  // Breadcrumb: derive current section from pathname
  const pathSegment = location.pathname.split('/').filter(Boolean)[0] ?? 'dashboard';
  const breadcrumbLabel = ROUTE_LABEL[pathSegment] ?? pathSegment;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0d1117' }}>
      {/* ════════════════════════════════════════════════════
          SIDEBAR
      ════════════════════════════════════════════════════ */}
      <aside
        className="w-[220px] flex-shrink-0 flex flex-col select-none"
        style={{
          background: 'linear-gradient(180deg, #111827 0%, #0f1623 100%)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* ── Logo ──────────────────────────────────────── */}
        <div className="px-5 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(61,107,255,0.15)',
                border: '1px solid rgba(61,107,255,0.3)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#6690ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-white tracking-tight leading-none">
                Gestión PAS
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5">Sistema de seguros</div>
            </div>
          </div>
        </div>

        {/* ── Nav ───────────────────────────────────────── */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0">
          {groups.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? 'mt-4' : ''}>
              {gi > 0 && (
                <div className="px-3 mb-2 flex items-center gap-2">
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {group.label}
                  </span>
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/dashboard'}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]'
                      }`
                    }
                    style={({ isActive }) => isActive ? {
                      background: 'rgba(61,107,255,0.1)',
                      border: '1px solid rgba(61,107,255,0.18)',
                    } : { border: '1px solid transparent' }}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
                            style={{ background: '#3d6bff' }}
                          />
                        )}
                        <span
                          className="w-4 h-4 flex-shrink-0 transition-colors"
                          style={{ color: isActive ? '#6690ff' : 'currentColor' }}
                        >
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Footer — perfil + acciones ─────────────────── */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Avatar + rol + ID abreviado */}
          <div className="flex items-center gap-2.5 px-2 mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                background: ROLE_AVATAR_BG[user.perfil],
                border: `1px solid ${ROLE_TEXT[user.perfil]}33`,
                color: ROLE_TEXT[user.perfil],
              }}
            >
              {ROLE_LABEL[user.perfil][0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-300 truncate">
                {ROLE_LABEL[user.perfil]}
              </div>
              <div
                className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md mt-0.5"
                style={{
                  background: ROLE_COLOR[user.perfil],
                  color: ROLE_TEXT[user.perfil],
                }}
              >
                {user.id.slice(0, 8)}…
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="space-y-0.5">
            <button
              onClick={toggle}
              title={dark ? 'Modo claro' : 'Modo oscuro'}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-all duration-150 font-medium border border-transparent"
            >
              <span className="w-3.5 h-3.5 opacity-60">{dark ? Icon.sun : Icon.moon}</span>
              {dark ? 'Modo claro' : 'Modo oscuro'}
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-all duration-150 font-medium border border-transparent"
            >
              <span className="w-3.5 h-3.5 opacity-60">{Icon.logout}</span>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════
          CONTENIDO PRINCIPAL
      ════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto" style={{ background: '#0d1117' }}>
        {/* Top bar */}
        <div
          className="sticky top-0 z-10 h-12 px-8 flex items-center justify-between"
          style={{
            background: 'rgba(13,17,23,0.88)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-600">Gestión PAS</span>
            <span className="text-slate-700">{Icon.chevron}</span>
            <span className="text-slate-400 font-medium">{breadcrumbLabel}</span>
          </div>

          {/* Indicador de sección activa — pill derecho */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
            style={{ background: 'rgba(61,107,255,0.08)', color: '#6690ff' }}
          >
            <div className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: '#3d6bff' }} />
            {breadcrumbLabel}
          </div>
        </div>

        {/* Página — con fade al cambiar de ruta */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-6xl mx-auto px-8 py-8"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
