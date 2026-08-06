import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/lib/useDarkMode';
import { UserRole } from '@gestion-pas/types';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalSearch from './GlobalSearch';
import NotificationsPanel from './NotificationsPanel';
import { useNotificaciones } from '@/lib/useNotificaciones';

interface NavItem { to: string; label: string; icon: React.ReactNode }

/* ── SVG icons ────────────────────────────────────────── */
const Icon = {
  shield:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  home:        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  users:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  package:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  fileText:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  alertTri:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  folder:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  userCheck:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>,
  building:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
  barChart:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  search:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  sun:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  bell:        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  logOut:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

/* ── Nav items by role ───────────────────────────────────── */
function navItemsByRole(role: UserRole): NavItem[] {
  const shared: NavItem[] = [
    { to: '/dashboard',  label: 'Inicio',      icon: Icon.home      },
    { to: '/asegurados', label: 'Asegurados',   icon: Icon.users     },
    { to: '/bienes',     label: 'Bienes',        icon: Icon.package   },
    { to: '/polizas',    label: 'Pólizas',       icon: Icon.fileText  },
    { to: '/siniestros', label: 'Siniestros',    icon: Icon.alertTri  },
    { to: '/reclamos',   label: 'Reclamos',      icon: Icon.alertTri  },
    { to: '/documentos', label: 'Documentos',    icon: Icon.folder    },
  ];
  if (role === UserRole.ORGANIZADOR) {
    return [
      ...shared,
      { to: '/productores', label: 'Productores', icon: Icon.userCheck },
      { to: '/companias',   label: 'Compañías',   icon: Icon.building  },
      { to: '/reportes',    label: 'Reportes',    icon: Icon.barChart  },
    ];
  }
  if (role === UserRole.ASEGURADO) {
    return [
      { to: '/dashboard',  label: 'Inicio',           icon: Icon.home     },
      { to: '/polizas',    label: 'Mis pólizas',       icon: Icon.fileText },
      { to: '/siniestros', label: 'Mis siniestros',    icon: Icon.alertTri },
      { to: '/reclamos',   label: 'Mis reclamos',      icon: Icon.alertTri },
    ];
  }
  return shared;
}

/* ── Role labels / colors ────────────────────────────────── */
const ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.ORGANIZADOR]: 'Organizador',
  [UserRole.PRODUCTOR]:   'Productor Senior',
  [UserRole.ASEGURADO]:   'Asegurado',
};
const ROLE_COLOR: Record<UserRole, { bg: string; text: string }> = {
  [UserRole.ORGANIZADOR]: { bg: 'rgba(139,92,246,0.18)', text: '#a78bfa' },
  [UserRole.PRODUCTOR]:   { bg: 'rgba(16,185,129,0.18)', text: '#34d399' },
  [UserRole.ASEGURADO]:   { bg: 'rgba(245,158,11,0.18)', text: '#fbbf24' },
};

/* ════════════════════════════════════════════════════════════
   AppLayout — sidebar layout
════════════════════════════════════════════════════════════ */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useDarkMode();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const { hasUnread, markAsRead } = useNotificaciones();

  if (!user) return null;

  const navItems = navItemsByRole(user.perfil);
  const roleColor = ROLE_COLOR[user.perfil];
  const initials = (user as any).nombre
    ? (user as any).nombre.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : ROLE_LABEL[user.perfil].slice(0, 2).toUpperCase();

  function handleNotifOpen() {
    setNotifOpen(true);
    markAsRead();
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--surface-app)' }}>

      {/* ══════════════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════════════ */}
      <aside
        className="group flex-shrink-0 flex flex-col min-h-screen sticky top-0 z-30 overflow-hidden"
        style={{
          width: 56,
          background: 'linear-gradient(180deg, #0d1117 0%, #0a0f1a 100%)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          transition: 'width 220ms cubic-bezier(0.16,1,0.3,1)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.width = '230px')}
        onMouseLeave={(e) => (e.currentTarget.style.width = '56px')}
      >
        {/* Brand */}
        <div
          className="flex items-center h-16 flex-shrink-0 overflow-hidden"
          style={{
            paddingLeft: 14,
            paddingRight: 14,
            gap: 12,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(61,107,255,0.18)',
              border: '1px solid rgba(61,107,255,0.35)',
              color: '#6690ff',
            }}
          >
            {Icon.shield}
          </div>
          {/* Label fades in when expanded */}
          <span
            className="text-sm font-bold text-white tracking-tight whitespace-nowrap"
            style={{
              opacity: 0,
              transform: 'translateX(-6px)',
              transition: 'opacity 180ms ease, transform 180ms ease',
            }}
            ref={(el) => {
              if (!el) return;
              const aside = el.closest('aside')!;
              const show = () => { el.style.opacity = '1'; el.style.transform = 'translateX(0)'; };
              const hide = () => { el.style.opacity = '0'; el.style.transform = 'translateX(-6px)'; };
              aside.addEventListener('mouseenter', show);
              aside.addEventListener('mouseleave', hide);
            }}
          >
            Gestión PAS
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden" style={{ paddingLeft: 8, paddingRight: 8 }}>
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 select-none overflow-hidden whitespace-nowrap ${
                    isActive
                      ? 'text-white'
                      : 'text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.75)] hover:bg-white/[0.04]'
                  }`
                }
                style={({ isActive }) => ({
                  paddingLeft: 10,
                  paddingRight: 10,
                  ...(isActive ? {
                    background: 'rgba(61,107,255,0.15)',
                    boxShadow: 'inset 0 0 0 1px rgba(61,107,255,0.2)',
                  } : {}),
                })}
              >
                {({ isActive }) => (
                  <>
                    <span className="flex-shrink-0" style={{ color: isActive ? '#6690ff' : 'inherit' }}>
                      {item.icon}
                    </span>
                    <span
                      className="whitespace-nowrap"
                      style={{
                        opacity: 0,
                        transition: 'opacity 160ms ease',
                      }}
                      ref={(el) => {
                        if (!el) return;
                        const aside = el.closest('aside')!;
                        const show = () => { el.style.opacity = '1'; };
                        const hide = () => { el.style.opacity = '0'; };
                        aside.addEventListener('mouseenter', show);
                        aside.addEventListener('mouseleave', hide);
                      }}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Bottom: role label */}
        <div
          className="flex-shrink-0 overflow-hidden"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '14px 10px' }}
        >
          <span
            className="text-[10px] font-semibold tracking-widest uppercase whitespace-nowrap"
            style={{
              color: 'rgba(255,255,255,0.18)',
              opacity: 0,
              transition: 'opacity 160ms ease',
            }}
            ref={(el) => {
              if (!el) return;
              const aside = el.closest('aside')!;
              const show = () => { el.style.opacity = '1'; };
              const hide = () => { el.style.opacity = '0'; };
              aside.addEventListener('mouseenter', show);
              aside.addEventListener('mouseleave', hide);
            }}
          >
            {user.perfil.toUpperCase().replace('_', ' ')}
          </span>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════
          RIGHT SIDE: topbar + content
      ══════════════════════════════════════════════════════ */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* ── Top bar ─────────────────────────────────────── */}
        <header
          className="sticky top-0 z-20 flex-shrink-0 flex items-center justify-between px-6 h-16"
          style={{
            background: 'var(--topbar-bg)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--topbar-border)',
          }}
        >
          {/* Search bar */}
          <GlobalSearch />

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Dark mode */}
            <button
              onClick={toggle}
              title={dark ? 'Modo claro' : 'Modo oscuro'}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              {dark ? Icon.sun : Icon.moon}
            </button>

            {/* Bell + Notifications panel */}
            <div className="relative">
              <button
                onClick={handleNotifOpen}
                className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: notifOpen ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.45)' }}
              >
                {Icon.bell}
                {hasUnread && (
                  <span
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                    style={{ background: '#f59e0b', boxShadow: '0 0 0 2px #0d1117' }}
                  />
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <NotificationsPanel onClose={() => setNotifOpen(false)} />
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.08)' }} />

            {/* User */}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white leading-tight">{(user as any).nombre ?? ROLE_LABEL[user.perfil]}</p>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: roleColor.text }}>{ROLE_LABEL[user.perfil]}</p>
              </div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: 'rgba(61,107,255,0.25)',
                  border: '1px solid rgba(61,107,255,0.4)',
                  color: '#6690ff',
                }}
              >
                {initials}
              </div>
              {/* Logout */}
              <button
                onClick={logout}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: 'rgba(255,255,255,0.3)' }}
                title="Cerrar sesión"
              >
                {Icon.logOut}
              </button>
            </div>
          </div>
        </header>

        {/* ── Main content ────────────────────────────────── */}
        <main
          className="flex-1 overflow-y-auto content-area"
          style={{ background: 'var(--surface-app)' }}
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
    </div>
  );
}
