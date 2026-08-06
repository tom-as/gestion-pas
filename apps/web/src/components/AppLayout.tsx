import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/lib/useDarkMode';
import { UserRole } from '@gestion-pas/types';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalSearch from './GlobalSearch';
import NotificationsPanel from './NotificationsPanel';
import { useNotificaciones } from '@/lib/useNotificaciones';
import {
  NavIcon,
  IconSun, IconMoon, IconBell, IconLogOut,
} from './ui/icons';

interface NavItem { to: string; label: string; IconComponent: React.ComponentType<{ size?: number }> }

/* ── Nav items by role ───────────────────────────────────── */
function navItemsByRole(role: UserRole): NavItem[] {
  const shared: NavItem[] = [
    { to: '/dashboard',  label: 'Inicio',      IconComponent: NavIcon.dashboard  },
    { to: '/asegurados', label: 'Asegurados',   IconComponent: NavIcon.asegurados },
    { to: '/bienes',     label: 'Bienes',        IconComponent: NavIcon.bienes     },
    { to: '/polizas',    label: 'Pólizas',       IconComponent: NavIcon.polizas    },
    { to: '/siniestros', label: 'Siniestros',    IconComponent: NavIcon.siniestros },
    { to: '/reclamos',   label: 'Reclamos',      IconComponent: NavIcon.reclamos   },
    { to: '/documentos', label: 'Documentos',    IconComponent: NavIcon.documentos },
  ];
  if (role === UserRole.ORGANIZADOR) {
    return [
      ...shared,
      { to: '/productores', label: 'Productores', IconComponent: NavIcon.productores },
      { to: '/companias',   label: 'Compañías',   IconComponent: NavIcon.companias   },
      { to: '/reportes',    label: 'Reportes',    IconComponent: NavIcon.reportes    },
    ];
  }
  if (role === UserRole.ASEGURADO) {
    return [
      { to: '/dashboard',  label: 'Inicio',        IconComponent: NavIcon.dashboard  },
      { to: '/polizas',    label: 'Mis pólizas',   IconComponent: NavIcon.polizas    },
      { to: '/siniestros', label: 'Mis siniestros', IconComponent: NavIcon.siniestros },
      { to: '/reclamos',   label: 'Mis reclamos',   IconComponent: NavIcon.reclamos   },
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
  [UserRole.ORGANIZADOR]: { bg: 'rgba(128,80,200,0.16)', text: '#a78bfa' },
  [UserRole.PRODUCTOR]:   { bg: 'rgba(16,163,108,0.16)', text: '#34d399' },
  [UserRole.ASEGURADO]:   { bg: 'rgba(214,154,12,0.16)', text: '#fbbf24' },
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
          width: 52,
          background: 'var(--surface-panel)',
          borderRight: '1px solid var(--border-subtle)',
          transition: 'width 200ms cubic-bezier(0.16,1,0.3,1)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.width = '220px')}
        onMouseLeave={(e) => (e.currentTarget.style.width = '52px')}
      >
        {/* Brand */}
        <div
          className="flex items-center h-14 flex-shrink-0 overflow-hidden"
          style={{
            paddingLeft: 12,
            paddingRight: 12,
            gap: 10,
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {/* Logo — escudo de póliza */}
          <div
            className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
            style={{
              background: 'var(--accent-primary)',
              color: '#fff',
            }}
          >
            <NavIcon.polizas size={14} />
          </div>
          <span
            className="text-sm font-bold tracking-tight whitespace-nowrap"
            style={{
              color: 'var(--text-primary)',
              opacity: 0,
              transform: 'translateX(-6px)',
              transition: 'opacity 160ms ease, transform 160ms ease',
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
        <nav
          className="flex-1 py-3 overflow-y-auto overflow-x-hidden"
          style={{ paddingLeft: 6, paddingRight: 6 }}
          aria-label="Navegación principal"
        >
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                aria-label={item.label}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-2 rounded text-sm font-medium transition-colors duration-100 select-none overflow-hidden whitespace-nowrap ${
                    isActive
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-[var(--surface-record)]'
                  }`
                }
                style={({ isActive }) => ({
                  paddingLeft: 10,
                  paddingRight: 10,
                  ...(isActive ? {
                    background: 'var(--surface-record)',
                    borderLeft: '2px solid var(--accent-primary)',
                    paddingLeft: 8,
                  } : {}),
                })}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className="flex-shrink-0"
                      style={{ color: isActive ? 'var(--accent-primary)' : 'inherit' }}
                    >
                      <item.IconComponent size={15} />
                    </span>
                    <span
                      className="whitespace-nowrap"
                      style={{
                        opacity: 0,
                        transition: 'opacity 140ms ease',
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
          style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 10px' }}
        >
          <span
            className="text-[10px] font-semibold tracking-widest uppercase whitespace-nowrap"
            style={{
              color: 'var(--text-faint)',
              opacity: 0,
              transition: 'opacity 140ms ease',
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
          className="sticky top-0 z-20 flex-shrink-0 flex items-center justify-between px-6 h-14"
          style={{
            background: 'var(--topbar-bg)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderBottom: '1px solid var(--topbar-border)',
          }}
        >
          {/* Search bar */}
          <GlobalSearch />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Dark mode */}
            <button
              onClick={toggle}
              title={dark ? 'Modo claro' : 'Modo oscuro'}
              aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="w-8 h-8 rounded flex items-center justify-center transition-colors hover:bg-[var(--surface-record)]"
              style={{ color: 'var(--text-faint)' }}
            >
              {dark ? <IconSun /> : <IconMoon />}
            </button>

            {/* Bell + Notifications panel */}
            <div className="relative">
              <button
                onClick={handleNotifOpen}
                aria-label="Notificaciones"
                aria-expanded={notifOpen}
                className="relative w-8 h-8 rounded flex items-center justify-center transition-colors hover:bg-[var(--surface-record)]"
                style={{ color: notifOpen ? 'var(--text-primary)' : 'var(--text-faint)' }}
              >
                <IconBell />
                {hasUnread && (
                  <span
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                    style={{
                      background: 'var(--sla-warning-text)',
                      boxShadow: '0 0 0 2px var(--topbar-bg)',
                    }}
                    aria-hidden="true"
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
            <div
              className="w-px h-4 mx-1"
              style={{ background: 'var(--border-subtle)' }}
              aria-hidden="true"
            />

            {/* User */}
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p
                  className="text-xs font-semibold leading-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {(user as any).nombre ?? ROLE_LABEL[user.perfil]}
                </p>
                <p
                  className="text-[10px] uppercase tracking-widest"
                  style={{ color: roleColor.text }}
                >
                  {ROLE_LABEL[user.perfil]}
                </p>
              </div>
              <div
                className="w-7 h-7 rounded flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={{
                  background: roleColor.bg,
                  color: roleColor.text,
                  border: '1px solid ' + roleColor.text + '40',
                }}
                aria-hidden="true"
              >
                {initials}
              </div>
              {/* Logout */}
              <button
                onClick={logout}
                className="w-8 h-8 rounded flex items-center justify-center transition-colors hover:bg-[var(--surface-record)]"
                style={{ color: 'var(--text-faint)' }}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <IconLogOut />
              </button>
            </div>
          </div>
        </header>

        {/* ── Main content ────────────────────────────────── */}
        <main
          className="flex-1 overflow-y-auto content-area"
          style={{ background: 'var(--surface-app)' }}
        >
          <div className="max-w-7xl mx-auto px-6 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="page-canvas p-7"
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
