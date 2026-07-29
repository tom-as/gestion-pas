import { useAuth } from '@/context/AuthContext';
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
const ROLE_WELCOME: Record<UserRole, () => string> = {
  [UserRole.ORGANIZADOR]: () => 'Bienvenido',
  [UserRole.PRODUCTOR]:   () => 'Tu cartera',
  [UserRole.ASEGURADO]:   () => 'Mi información',
};
const ROLE_SUB: Record<UserRole, string> = {
  [UserRole.ORGANIZADOR]: 'Vista general del sistema Gestión PAS',
  [UserRole.PRODUCTOR]:   'Resumen de tu cartera de asegurados',
  [UserRole.ASEGURADO]:   'Estado de tus pólizas y trámites',
};

/* ── Stat card config ───────────────────────────────────── */
type StatColor = 'blue' | 'green' | 'amber' | 'red' | 'violet';

const ACCENT_COLOR: Record<StatColor, string> = {
  blue:   '#3d6bff',
  green:  '#10b981',
  amber:  '#f59e0b',
  red:    '#ef4444',
  violet: '#8b5cf6',
};
const ICON_BG: Record<StatColor, string> = {
  blue:   'rgba(61,107,255,0.12)',
  green:  'rgba(16,185,129,0.12)',
  amber:  'rgba(245,158,11,0.12)',
  red:    'rgba(239,68,68,0.12)',
  violet: 'rgba(139,92,246,0.12)',
};
const ICON_COLOR: Record<StatColor, string> = {
  blue:   '#6690ff',
  green:  '#34d399',
  amber:  '#fbbf24',
  red:    '#f87171',
  violet: '#a78bfa',
};
const GLOW_COLOR: Record<StatColor, string> = {
  blue:   'rgba(61,107,255,0.06)',
  green:  'rgba(16,185,129,0.06)',
  amber:  'rgba(245,158,11,0.06)',
  red:    'rgba(239,68,68,0.06)',
  violet: 'rgba(139,92,246,0.06)',
};

const STAT_ICONS: Record<StatColor, React.ReactNode> = {
  blue: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/>
    </svg>
  ),
  red: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  amber: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  green: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  violet: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
};

/* ── Stat Card ──────────────────────────────────────────── */
function StatCard({
  label, value, sub, color = 'blue', delay = 0,
}: {
  label: string; value: string | number; sub?: string;
  color?: StatColor; delay?: number;
}) {
  const accent = ACCENT_COLOR[color];
  const glow   = GLOW_COLOR[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="stat-card p-5 flex flex-col gap-4 relative"
      style={{ borderTop: `2px solid ${accent}` }}
    >
      {/* Fondo glow de color sutil en la esquina superior */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, ${glow} 0%, transparent 70%)`,
          transform: 'translate(30%, -30%)',
        }}
      />

      <div className="flex items-start justify-between relative">
        {/* Ícono */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: ICON_BG[color], color: ICON_COLOR[color] }}
        >
          {STAT_ICONS[color]}
        </div>

        {/* Número grande */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl font-black tabular-nums"
          style={{ color: ICON_COLOR[color] }}
        >
          {value}
        </motion.div>
      </div>

      <div className="relative">
        <div className="text-sm font-semibold text-slate-200">{label}</div>
        {sub && (
          <div className="text-xs mt-0.5 font-medium" style={{ color: accent }}>
            {sub}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Loading skeleton para stat cards ───────────────────── */
function StatCardSkeleton() {
  return (
    <div className="stat-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl skeleton" />
        <div className="w-12 h-10 rounded-lg skeleton" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3.5 w-24 skeleton" />
        <div className="h-2.5 w-16 skeleton" />
      </div>
    </div>
  );
}

/* ── Vencimientos table ─────────────────────────────────── */
function VencimientosTable() {
  const { data, isLoading } = useQuery<VencimientosResponse>({
    queryKey: ['reportes', 'vencimientos', 7],
    queryFn: () => api.get('/reportes/vencimientos-proximos?dias=7').then((r) => r.data),
  });

  if (isLoading) return (
    <div className="space-y-2 p-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-10 skeleton" style={{ animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  );

  if (!data || data.total === 0) return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-slate-500">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(16,185,129,0.08)', color: '#34d399' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-300 text-center">Sin vencimientos próximos</p>
        <p className="text-xs text-slate-600 text-center mt-0.5">No hay cuotas que venzan en los próximos 7 días</p>
      </div>
    </div>
  );

  return (
    <table className={cls.table}>
      <thead>
        <tr>
          <th className={cls.th}>Asegurado</th>
          <th className={cls.th}>Compañía</th>
          <th className={cls.th}>Vencimiento</th>
          <th className={cn(cls.th, 'text-right')}>Importe</th>
        </tr>
      </thead>
      <tbody>
        {data.cuotas.map((c, i) => (
          <motion.tr
            key={c.id}
            className={cls.trHover}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <td className={cn(cls.td, 'font-semibold text-slate-100')}>
              {c.poliza.asegurado ?? '—'}
            </td>
            <td className={cn(cls.td, 'text-slate-400')}>{c.poliza.compania ?? '—'}</td>
            <td className={cls.td}>
              <span className={cn(cls.badge, cls.badgeAmber)}>{formatDate(c.fechaVencimiento)}</span>
            </td>
            <td className={cn(cls.td, 'text-right font-bold text-slate-200')}>
              {formatMoney(c.importe)}
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
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

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────── */}
      <motion.div
        className="flex items-end justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">
            {ROLE_WELCOME[user!.perfil]()}
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            {ROLE_SUB[user!.perfil]}
          </p>
        </div>

        {/* Fecha actual */}
        <div className="text-right hidden sm:block">
          <p className="text-[11px] text-slate-600 font-semibold uppercase tracking-widest">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long' })}
          </p>
          <p className="text-base font-bold text-slate-300 mt-0.5">
            {new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </motion.div>

      {/* ── Stats grid ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              sub="en cartera"
              color="blue"
              delay={0}
            />
            <StatCard
              label="Siniestros abiertos"
              value={siniestros.data?.porEstado[EstadoSiniestro.ABIERTO] ?? 0}
              sub="requieren atención"
              color="red"
              delay={0.06}
            />
            <StatCard
              label="En gestión"
              value={siniestros.data?.porEstado[EstadoSiniestro.EN_GESTION] ?? 0}
              sub="en proceso"
              color="amber"
              delay={0.12}
            />
            {isOrganizador && (
              <StatCard
                label="Pólizas activas"
                value={polizas.data?.porEstado[EstadoPoliza.ACTIVA] ?? '—'}
                sub="vigentes"
                color="green"
                delay={0.18}
              />
            )}
          </>
        )}
      </div>

      {/* ── Vencimientos próximos ────────────────────────── */}
      <motion.div
        className="surface rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Panel header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-3">
            {/* Ícono del panel */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-200">Vencimientos próximos</h2>
              <p className="text-xs text-slate-600 mt-0.5">Cuotas que vencen en los próximos 7 días</p>
            </div>
          </div>
          <span className={cn(cls.badge, cls.badgeAmber)}>7 días</span>
        </div>

        <VencimientosTable />
      </motion.div>

    </div>
  );
}
