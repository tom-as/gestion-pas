import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@gestion-pas/types';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/format';
import { cn, cls } from '@/lib/cn';
import { EstadoPoliza, EstadoSiniestro } from '@gestion-pas/types';

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

const ROLE_WELCOME: Record<UserRole, (id: string | null) => string> = {
  [UserRole.ORGANIZADOR]: () => 'Bienvenido',
  [UserRole.PRODUCTOR]:   () => 'Tu cartera',
  [UserRole.ASEGURADO]:   () => 'Mi información',
};

const ROLE_SUB: Record<UserRole, string> = {
  [UserRole.ORGANIZADOR]: 'Vista general del sistema Gestión PAS',
  [UserRole.PRODUCTOR]:   'Resumen de tu cartera de asegurados',
  [UserRole.ASEGURADO]:   'Estado de tus pólizas y trámites',
};

/* ── Stat card ──────────────────────────────────────────── */
type StatColor = 'blue' | 'green' | 'amber' | 'red' | 'violet';

const CARD_BG: Record<StatColor, string> = {
  blue:   'bg-brand-600',
  green:  'bg-green-600',
  amber:  'bg-amber-500',
  red:    'bg-red-500',
  violet: 'bg-violet-600',
};

const CARD_LIGHT: Record<StatColor, string> = {
  blue:   'bg-brand-50 border-brand-100',
  green:  'bg-green-50 border-green-100',
  amber:  'bg-amber-50 border-amber-100',
  red:    'bg-red-50 border-red-100',
  violet: 'bg-violet-50 border-violet-100',
};

const CARD_TEXT: Record<StatColor, string> = {
  blue:   'text-brand-700',
  green:  'text-green-700',
  amber:  'text-amber-700',
  red:    'text-red-700',
  violet: 'text-violet-700',
};

const CARD_SUB: Record<StatColor, string> = {
  blue:   'text-brand-500',
  green:  'text-green-500',
  amber:  'text-amber-500',
  red:    'text-red-500',
  violet: 'text-violet-500',
};

/* SVG stat icons — stroke, currentColor */
const STAT_SVG: Record<string, React.ReactNode> = {
  blue:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/></svg>,
  red:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  amber:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  green:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  violet: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
};

function StatCard({ label, value, sub, color = 'blue' }: {
  label: string; value: string | number; sub?: string;
  color?: StatColor;
}) {
  return (
    <div className={cn('rounded-2xl border p-5 flex flex-col gap-4', CARD_LIGHT[color])}>
      <div className="flex items-start justify-between">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white', CARD_BG[color])}>
            {STAT_SVG[color]}
        </div>
        <div className={cn('text-4xl font-black tabular-nums', CARD_TEXT[color])}>{value}</div>
      </div>
      <div>
        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{label}</div>
        {sub && <div className={cn('text-xs mt-0.5', CARD_SUB[color])}>{sub}</div>}
      </div>
    </div>
  );
}

/* ── Vencimientos ───────────────────────────────────────── */
function VencimientosTable() {
  const { data, isLoading } = useQuery<VencimientosResponse>({
    queryKey: ['reportes', 'vencimientos', 7],
    queryFn: () => api.get('/reportes/vencimientos-proximos?dias=7').then((r) => r.data),
  });

  if (isLoading) return (
    <div className="space-y-2 p-6">
      {[1, 2, 3].map(i => <div key={i} className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
    </div>
  );

  if (!data || data.total === 0) return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-300">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
      <p className="text-sm font-medium text-slate-400">Sin vencimientos en los próximos 7 días</p>
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
        {data.cuotas.map((c) => (
          <tr key={c.id} className="hover:bg-amber-50/40 transition-colors">
            <td className={cn(cls.td, 'font-semibold text-slate-900')}>{c.poliza.asegurado ?? '—'}</td>
            <td className={cn(cls.td, 'text-slate-500')}>{c.poliza.compania ?? '—'}</td>
            <td className={cls.td}>
              <span className={cn(cls.badge, cls.badgeAmber)}>{formatDate(c.fechaVencimiento)}</span>
            </td>
            <td className={cn(cls.td, 'text-right font-bold text-slate-800')}>{formatMoney(c.importe)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Página ─────────────────────────────────────────────── */
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

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {ROLE_WELCOME[user!.perfil](user!.organizadorId)}
          </h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1 font-medium">{ROLE_SUB[user!.perfil]}</p>
        </div>
        {/* Fecha actual */}
        <div className="text-right hidden sm:block">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long' })}
          </p>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            {new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Asegurados"
          value={cartera.data?.total ?? '—'}
          color="blue"
          sub="en cartera"
        />
        <StatCard
          label="Siniestros abiertos"
          value={siniestros.data?.porEstado[EstadoSiniestro.ABIERTO] ?? '—'}
          color="red"
          sub="requieren atención"
        />
        <StatCard
          label="En gestión"
          value={siniestros.data?.porEstado[EstadoSiniestro.EN_GESTION] ?? '—'}
          color="amber"
          sub="en proceso"
        />
        {isOrganizador && (
          <StatCard
            label="Pólizas activas"
            value={polizas.data?.porEstado[EstadoPoliza.ACTIVA] ?? '—'}
            color="green"
            sub="vigentes"
          />
        )}
      </div>

      {/* ── Vencimientos ─────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Vencimientos próximos</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Cuotas que vencen en los próximos 7 días</p>
          </div>
          <span className={cn(cls.badge, cls.badgeAmber)}>7 días</span>
        </div>
        <VencimientosTable />
      </div>

    </div>
  );
}
