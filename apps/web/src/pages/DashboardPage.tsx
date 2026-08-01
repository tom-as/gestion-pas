import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { EstadoPoliza, EstadoSiniestro } from '@gestion-pas/types';
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

/* ── Stat card (rectangular, like the reference) ────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}
function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div
      className="flex flex-col justify-between px-5 py-4 rounded-sm"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        minWidth: 0,
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {label}
      </p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-black text-white tabular-nums leading-none">{value}</span>
        {sub && (
          <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</span>
        )}
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div
      className="flex flex-col justify-between px-5 py-4 rounded-sm"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="w-20 h-3 skeleton rounded" />
      <div className="mt-3 w-12 h-8 skeleton rounded-lg" />
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
    title: 'Siniestro Reportado',
    sub:   'Exp. #4402 • 2h atrás',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Póliza Renovada',
    sub:   'J. Domínguez • Ayer',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
      </svg>
    ),
    title: 'Documento Cargado',
    sub:   'DNI Scan • Hace 2 días',
  },
];

/* ── Quick-access card (2×2 grid, like the reference) ────── */
function QuickCard({ icon, label, to, accent }: { icon: React.ReactNode; label: string; to: string; accent?: boolean }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="flex flex-col items-center justify-center gap-3 py-6 rounded-sm transition-all duration-150 hover:opacity-80 active:scale-[0.97]"
      style={accent ? {
        background: 'rgba(61,107,255,0.25)',
        border: '1px solid rgba(61,107,255,0.35)',
      } : {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.09)',
      }}
    >
      <span style={{ color: accent ? '#6690ff' : 'rgba(255,255,255,0.7)' }}>{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: accent ? '#93b4ff' : 'rgba(255,255,255,0.55)' }}>
        {label}
      </span>
    </button>
  );
}

/* ── Icon helpers ────────────────────────────────────────── */
const QIcons = {
  userPlus: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  filePlus: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
  alertOct: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
};

/* ── Vencimientos list ──────────────────────────────────── */
function VencimientosList() {
  const { data, isLoading } = useQuery<VencimientosResponse>({
    queryKey: ['reportes', 'vencimientos', 7],
    queryFn: () => api.get('/reportes/vencimientos-proximos?dias=7').then((r) => r.data),
  });

  if (isLoading) return (
    <div className="space-y-2 mt-4">
      {[1, 2].map(i => <div key={i} className="h-16 skeleton rounded-sm" style={{ animationDelay: `${i * 0.08}s` }} />)}
    </div>
  );

  if (!data || data.total === 0) return (
    <p className="text-sm txt-faint mt-4">Sin vencimientos en los próximos 7 días.</p>
  );

  return (
    <div className="mt-3 space-y-2">
      {data.cuotas.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-3 px-4 py-3 rounded-sm"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'rgba(100,100,120,0.35)', color: '#cbd5e1' }}
          >
            {(c.poliza.asegurado ?? '?').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{c.poliza.asegurado ?? '—'}</p>
            <p className="text-xs txt-tertiary truncate">{c.poliza.compania ?? '—'}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Fecha</p>
            <p className="text-xs font-semibold text-white">{formatDate(c.fechaVencimiento)}</p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Monto</p>
            <p className="text-sm font-bold text-white">{formatMoney(c.importe)}</p>
          </div>
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
        className="flex-1 min-w-0 space-y-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Date + welcome */}
        <div>
          <p className="text-xs font-semibold txt-faint uppercase tracking-widest mb-2">
            {dayLabel}
          </p>
          <h1 className="text-5xl font-black text-white tracking-tight mb-3">
            Hola de nuevo
          </h1>
          <p className="text-sm txt-tertiary leading-relaxed max-w-md">
            Tu cartera presenta un incremento del 4.2% esta semana.<br />
            Tienes tareas que requieren tu atención inmediata.
          </p>
        </div>

        {/* ── Stat cards grid (4 rectangular cards) ─── */}
        <div className="grid grid-cols-4 gap-3">
          {isLoadingStats ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              {isOrganizador && <StatCardSkeleton />}
            </>
          ) : (
            <>
              <StatCard
                label="Asegurados"
                value={cartera.data?.total ?? '—'}
                sub="+2"
              />
              <StatCard
                label="Siniestros"
                value={siniestros.data?.porEstado[EstadoSiniestro.ABIERTO] ?? 0}
                sub="Nuevos"
              />
              <StatCard
                label="En Gestión"
                value={siniestros.data?.porEstado[EstadoSiniestro.EN_GESTION] ?? 0}
                sub="Pend."
              />
              {isOrganizador && (
                <StatCard
                  label="Pólizas"
                  value={polizas.data?.porEstado[EstadoPoliza.ACTIVA] ?? '—'}
                  sub="Act."
                />
              )}
            </>
          )}
        </div>

        {/* ── Vencimientos próximos ─────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-white">Vencimientos próximos</h2>
            <div className="flex items-center gap-2">
              <span className={cn(cls.badge, cls.badgeRed)}>CRÍTICO</span>
              <button className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                VER TODO
              </button>
            </div>
          </div>
          <VencimientosList />
        </div>
      </motion.div>

      {/* ── Right column ────────────────────────────────── */}
      <motion.div
        className="w-72 flex-shrink-0 space-y-6"
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Actividad reciente */}
        <div
          className="rounded-sm overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Actividad reciente
            </p>
            <span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
          </div>

          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {ACTIVITY_ITEMS.map((item, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.55)',
                  }}
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

          <div
            className="px-4 py-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <button
              className="w-full text-center text-xs font-semibold py-1.5 rounded-sm transition-colors hover:opacity-80"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              Ver historial completo
            </button>
          </div>
        </div>

        {/* Accesos rápidos 2×2 grid */}
        <div className="grid grid-cols-2 gap-2">
          <QuickCard icon={QIcons.userPlus} label="Asegurado" to="/asegurados" />
          <QuickCard icon={QIcons.filePlus} label="Nueva Póliza" to="/polizas" />
          <QuickCard icon={QIcons.alertOct} label="Siniestro" to="/siniestros" />
          {/* Meta card with ring */}
          <div
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-sm"
            style={{ background: 'rgba(61,107,255,0.2)', border: '1px solid rgba(61,107,255,0.3)' }}
          >
            {/* Simple ring progress */}
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(61,107,255,0.2)" strokeWidth="3.5"/>
              <circle
                cx="22" cy="22" r="18" fill="none"
                stroke="#6690ff" strokeWidth="3.5"
                strokeDasharray={`${2 * Math.PI * 18 * 0.78} ${2 * Math.PI * 18 * 0.22}`}
                strokeDashoffset={2 * Math.PI * 18 * 0.25}
                strokeLinecap="round"
              />
              <text x="22" y="27" textAnchor="middle" fill="white" fontSize="11" fontWeight="800">78%</text>
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Meta
            </span>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
