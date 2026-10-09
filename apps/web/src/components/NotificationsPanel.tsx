import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNotificaciones, type NotifItem, type NotifSeverity } from '@/lib/useNotificaciones';

/* ── Severity icon ──────────────────────────────────────── */
const SEV_ICON: Record<NotifSeverity, React.ReactNode> = {
  alert: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  warn: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
};

/* Opacity por severidad — paleta monocromática */
const SEV_OPACITY: Record<NotifSeverity, string> = {
  alert: 'rgba(61,107,255,1.0)',
  warn:  'rgba(61,107,255,0.6)',
  info:  'rgba(61,107,255,0.35)',
};

/* ── Single notification row ────────────────────────────── */
function NotifRow({
  item,
  onNavigate,
}: {
  item: NotifItem;
  onNavigate: (href: string, id: string) => void;
}) {
  return (
    <button
      onClick={() => onNavigate(item.href, item.id)}
      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(61,107,255,0.06)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: SEV_OPACITY[item.severity],
        }}
      >
        {SEV_ICON[item.severity]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight truncate">{item.title}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.sub}</p>
      </div>
      {/* Dot for unread ticket notifications */}
      {item.leida === false && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
          style={{ background: 'rgba(61,107,255,0.9)' }}
        />
      )}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
  );
}

/* ── Panel ──────────────────────────────────────────────── */
interface Props { onClose: () => void }

export default function NotificationsPanel({ onClose }: Props) {
  const navigate   = useNavigate();
  const panelRef   = useRef<HTMLDivElement>(null);
  const { items, isLoading, markAsRead, markOneAsRead } = useNotificaciones();

  /* Mark all DB notifications as read when panel opens */
  useEffect(() => {
    markAsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Close on Esc */
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleNavigate(href: string, id: string) {
    // Mark individual ticket notification as read (no-op for static items like 'vencimientos')
    if (!['vencimientos', 'incompletos'].includes(id)) {
      markOneAsRead(id);
    }
    navigate(href);
    onClose();
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <motion.div
        ref={panelRef}
        className="absolute right-0 z-50 overflow-hidden"
        style={{
          top: 'calc(100% + 10px)',
          width: 320,
          background: 'linear-gradient(180deg, #131929 0%, #0f1623 100%)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '0.5rem',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.3)',
        }}
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        exit={{    opacity: 0, y: -4, scale: 0.98 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Notificaciones
          </p>
          {items.length > 0 && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums"
              style={{ background: 'rgba(61,107,255,0.2)', color: '#6690ff' }}
            >
              {items.length}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-10 gap-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span className="text-xs">Cargando…</span>
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255,255,255,0.15)' }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Sin notificaciones pendientes</p>
            </div>
          )}

          {!isLoading && items.map((item) => (
            <NotifRow key={item.id} item={item} onNavigate={handleNavigate} />
          ))}
        </div>

        {/* Footer */}
        {!isLoading && items.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => handleNavigate('/reportes', 'static')}
              className="w-full text-center text-xs font-semibold py-3 transition-colors hover:opacity-80"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              Ver todos en Reportes
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}
