import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole, EstadoPoliza, EstadoSiniestro } from '@gestion-pas/types';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/format';
import { cn, cls } from '@/lib/cn';

/* ── API response types ─────────────────────────────────── */
interface CarteraResponse { total: number }
interface VencimientosResponse {
  total: number;
  cuotas: {
    id: string; numeroCuota: number; importe: number; fechaVencimiento: string;
    poliza: { numeroPoliza: string; asegurado?: string | null; compania?: string | null }
  }[];
}
interface SiniestrosResponse { total: number; porEstado: Record<string, number> }
interface PolizasResponse { porEstado: Record<string, number> }

/* ── Role text ──────────────────────────────────────────── */
const ROLE_WELCOME: Record<UserRole, string> = {
  [UserRole.ORGANIZADOR]: 'Bienvenido',
  [UserRole.PRODUCTOR]:   'Tu cartera',
  [UserRole.ASEGURADO]:   'Mi información',
};

/* ── Stat inline (horizontal row, no card) ──────────────── */
function StatItem({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col gap-1 pr-8 border-r border-white/10 last:border-0 last:pr-0">
      <span className="text-5xl font-black text-white tabular-nums leading-none">{value}</span>
      <span className="text-sm txt-tertiary">{label}</span>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="flex flex-col gap-2 pr-8 border-r border-white/10 last:border-0">
      <div className="w-12 h-10 skeleton rounded-lg" />
      <div className="w-24 h-3.5 skeleton rounded" />
    </div>
  );
}

/* ── Activity feed item ─────────────────────────────────── */
interface ActivityItem { icon: React.ReactNode; title: string; sub: string }

const ACTIVITY_ITEMS: ActivityItem[] = [
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    title: 'Nuevo siniestro reportado',
    sub:   'hace 2 horas',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Póliza renovada',
    sub:   'ayer',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
      </svg>
    ),
    title: 'Documento cargado',
    sub:   'hace 2 días',
  },
];

/* ── Quick-access button ─────────────────────────────────── */
function QuickBtn({ label, to }: { label: string; to: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="w-full text-left px-4 py-3 rounded-sm text-sm font-medium text-white transition-colors"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {label}
    </button>
  );
}

/* ── Vencimientos list (compact, no table) ──────────────── */
function VencimientosList() {
  const { data, isLoading } = useQuery<VencimientosResponse>({
    queryKey: ['reportes', 'vencimientos', 7],
    queryFn: () => api.get('/reportes/vencimientos-proximos?dias=7').then((r) => r.data),
  });

  if (isLoading) return (
    <div className="space-y-3 mt-4">
      {[1, 2].map(i => <div key={i} className="h-14 skeleton rounded-sm" style={{ animationDelay: `${i * 0.08}s` }} />)}
    </div>
  );

  if (!data || data.total === 0) return (
    <p className="text-sm txt-faint mt-4">Sin vencimientos en los próximos 7 días.</p>
  );

  return (
    <div className="mt-4 space-y-2">
      {data.cuotas.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-3 px-4 py-3 rounded-sm"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Avatar inicial del asegurado */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'rgba(100,100,120,0.35)', color: '#cbd5e1' }}
          >
            {(c.poliza.asegurado ?? '?').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {c.poliza.asegurado ?? '—'}
            </p>
            <p className="text-xs txt-tertiary truncate">{c.poliza.compania ?? '—'}</p>
          </div>
          <span className={cn(cls.badge, cls.badgeAmber, 'flex-shrink-0')}>
            {formatDate(c.fechaVencimiento)}
          </span>
          <span className="text-sm font-bold text-white flex-shrink-0 ml-2">
            {formatMoney(c.importe)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Dashboard Page ─────────────────────────────────────── */
export default function DashboardPage() {
  const { user, isOrganizador } = useAuth();

  const cartera = useQuery<CarteraResponse>({
    queryKey: ['reportes', 'cartera'],
    queryFn: () => api.get('/reportes/cartera-asegurados').then((r) => r.data),
  });
  const siniestros = useQuery<SiniestrosResponse>({
    queryKey: ['reportes', 'siniestros'],
    queryFn: () => api.get('/reportes/siniestros').then((r) => r.data),
  });
  const polizas = useQuery<PolizasResponse>({
    queryKey: ['reportes', 'polizas'],
    queryFn: () => api.get('/reportes/polizas').then((r) => r.data),
    enabled: isOrganizador,
  });

  const isLoadingStats = cartera.isLoading || siniestros.isLoading;

  const today = new Date();
  const dayLabel = today.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .toUpperCase();

  return (
    <div className="flex gap-8 items-start">

      {/* ── Left column ─────────────────────────────────── */}
      <motion.div
        className="flex-1 min-w-0 space-y-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Date + welcome */}
        <div>
          <p className="text-xs font-semibold txt-faint uppercase tracking-widest mb-2">
            {dayLabel}
          </p>
          <h1 className="text-5xl font-black text-white tracking-tight">
            {ROLE_WELCOME[user!.perfil]}
          </h1>
        </div>

        {/* Stats row */}
        <div className="flex items-start gap-0">
          {isLoadingStats ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
              {isOrganizador && <StatSkeleton />}
            </>
          ) : (
            <>
              <StatItem
                value={cartera.data?.total ?? '—'}
                label="Asegurados en cartera"
              />
              <div className="w-px self-stretch bg-white/10 mx-8" />
              <StatItem
                value={siniestros.data?.porEstado[EstadoSiniestro.ABIERTO] ?? 0}
                label="Siniestros abiertos"
              />
              <div className="w-px self-stretch bg-white/10 mx-8" />
              <StatItem
                value={siniestros.data?.porEstado[EstadoSiniestro.EN_GESTION] ?? 0}
                label="En gestión"
              />
              {isOrganizador && (
                <>
                  <div className="w-px self-stretch bg-white/10 mx-8" />
                  <StatItem
                    value={polizas.data?.porEstado[EstadoPoliza.ACTIVA] ?? '—'}
                    label="Pólizas activas"
                  />
                </>
              )}
            </>
          )}
        </div>

        {/* Vencimientos próximos */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-white">Vencimientos próximos</h2>
            <span className={cn(cls.badge, cls.badgeAmber)}>7 días</span>
          </div>
          <p className="text-sm txt-tertiary">
            Cuotas que vencen en los próximos 7 días
          </p>
          <div
            className="mt-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}
          >
            <VencimientosList />
          </div>
        </div>
      </motion.div>

      {/* ── Right column ────────────────────────────────── */}
      <motion.div
        className="w-80 flex-shrink-0 space-y-8"
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Actividad */}
        <div>
          <p className="text-[11px] font-semibold txt-faint uppercase tracking-widest mb-4">
            Actividad
          </p>
          <div
            className="space-y-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            {ACTIVITY_ITEMS.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">{item.title}</p>
                  <p className="text-xs txt-tertiary mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accesos rápidos */}
        <div>
          <p className="text-[11px] font-semibold txt-faint uppercase tracking-widest mb-4">
            Accesos
          </p>
          <div className="space-y-2">
            <QuickBtn label="Nuevo asegurado"   to="/asegurados" />
            <QuickBtn label="Nueva póliza"       to="/polizas" />
            <QuickBtn label="Registrar siniestro" to="/siniestros" />
          </div>
        </div>
      </motion.div>

    </div>
  );
}
