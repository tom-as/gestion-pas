import { useNavigate } from 'react-router-dom';
import { EstadoPoliza, EstadoReclamo, EstadoSiniestro } from '@gestion-pas/types';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/format';
import { cn, cls } from '@/lib/cn';
import OperationalAlert from '@/components/ui/OperationalAlert';
import ExpirationIndicator from '@/components/ui/ExpirationIndicator';
import RecordCode from '@/components/ui/RecordCode';
import { useAuth } from '@/context/AuthContext';
import {
  IconSiniestro, IconPoliza, IconVencimiento, IconReclamo,
  IconAsegurado, IconTrendUp, IconArrowRight,
} from '@/components/ui/icons';

/* ── API response types ─────────────────────────────────── */
interface CarteraResponse { total: number }
interface VencimientosResponse {
  total: number;
  cuotas: {
    id: string; numeroCuota: number; importe: number; fechaVencimiento: string;
    poliza: { id: string; numeroPoliza: string; asegurado?: string | null; compania?: string | null }
  }[];
}
interface SiniestrosResponse { total: number; porEstado: Record<string, number> }
interface PolizasResponse { porEstado: Record<string, number> }

/* ── Helpers ─────────────────────────────────────────────── */
function diffDays(fechaStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(fechaStr + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/* ── Skeleton inline ─────────────────────────────────────── */
function Sk({ w, h = 20 }: { w: number | string; h?: number }) {
  return (
    <span
      className="skeleton inline-block"
      style={{ width: w, height: h, borderRadius: 3, verticalAlign: 'middle' }}
    />
  );
}

/* ── Area chart SVG sparkline ────────────────────────────── */
function AreaChart({ color, points }: { color: string; points: string }) {
  const gradId = `ag-${color.replace('#', '')}`;
  const fill = points + ` L200,52 L0,52 Z`;
  return (
    <svg viewBox="0 0 200 52" preserveAspectRatio="none" style={{ width: '100%', height: 52, overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.30" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gradId})`} />
      <path d={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── KPI card with area chart ────────────────────────────── */
interface KpiCardProps {
  label: string;
  value: number | string;
  trend?: string;
  trendUp?: boolean;
  sub?: string;
  icon: React.ReactNode;
  iconColor: string;
  chartColor: string;
  chartPoints: string;
  loading?: boolean;
}
function KpiCard({ label, value, trend, trendUp = true, sub, icon, iconColor, chartColor, chartPoints, loading }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div
          style={{
            width: 30, height: 30, borderRadius: 7,
            background: `color-mix(in srgb, ${iconColor} 14%, transparent)`,
            border: `1px solid color-mix(in srgb, ${iconColor} 24%, transparent)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: iconColor, flexShrink: 0,
          }}
        >
          {icon}
        </div>
        {trend && (
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: trendUp ? 'var(--sla-safe-text)' : 'var(--sla-breached-text)',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>

      <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        {label}
      </p>
      {loading
        ? <Sk w={48} h={32} />
        : (
          <p style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
            {value}
          </p>
        )
      }
      {sub && !loading && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</p>
      )}

      {/* Area chart */}
      <div style={{ marginTop: 14, height: 52 }}>
        <AreaChart color={chartColor} points={chartPoints} />
      </div>
    </div>
  );
}

/* ── Ops bar ─────────────────────────────────────────────── */
function OpsBar({ tareas, vencimientos, siniestros, docs }: {
  tareas: number; vencimientos: number; siniestros: number; docs: number;
}) {
  if (tareas === 0) return null;
  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(0,212,255,0.06), rgba(74,140,255,0.04))',
      border: '1px solid rgba(0,212,255,0.13)',
      borderRadius: 8, padding: '11px 18px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 22, flexWrap: 'wrap', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {tareas} tarea{tareas !== 1 ? 's' : ''} requieren atención
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
            Revisión requerida antes del cierre del día
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {vencimientos > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 5,
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'var(--sla-warning-bg)', color: 'var(--sla-warning-text)',
            border: '1px solid rgba(240,160,32,0.22)',
          }}>
            {vencimientos} vencimiento{vencimientos !== 1 ? 's' : ''} crítico{vencimientos !== 1 ? 's' : ''}
          </span>
        )}
        {siniestros > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 5,
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'var(--sla-breached-bg)', color: 'var(--sla-breached-text)',
            border: '1px solid rgba(224,80,80,0.22)',
          }}>
            {siniestros} siniestro{siniestros !== 1 ? 's' : ''} abierto{siniestros !== 1 ? 's' : ''}
          </span>
        )}
        {docs > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 5,
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'var(--claim-reported-bg)', color: 'var(--claim-reported-text)',
            border: '1px solid rgba(74,140,255,0.22)',
          }}>
            {docs} documentos pendientes
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Vencimientos ────────────────────────────────────────── */
function VencimientosSection() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery<VencimientosResponse>({
    queryKey: ['reportes', 'vencimientos', 7],
    queryFn: () => api.get('/reportes/vencimientos-proximos?dias=7').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-2 mt-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 skeleton rounded" style={{ animationDelay: `${i * 0.07}s` }} />
        ))}
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div style={{
        marginTop: 12, padding: '20px 16px', borderRadius: 6,
        background: 'var(--surface-record)', border: '1px solid var(--border-subtle)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sin vencimientos en los próximos 7 días</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10 }}>
      {data.cuotas.map((c) => {
        const dias = diffDays(c.fechaVencimiento);
        const urgentColor = dias <= 3 ? 'var(--sla-breached-text)' : dias <= 7 ? 'var(--sla-warning-text)' : 'var(--text-muted)';
        return (
          <button
            key={c.id}
            onClick={() => navigate(`/polizas/${c.poliza.id}`)}
            className="w-full text-left"
            aria-label={`Ver póliza ${c.poliza.numeroPoliza} — vence en ${dias} días`}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 6, marginBottom: 4,
              background: 'var(--surface-record)', border: '1px solid var(--border-subtle)',
              cursor: 'pointer', transition: 'all 0.12s ease', width: '100%',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(0,212,255,0.05)';
              e.currentTarget.style.borderColor = 'rgba(0,212,255,0.18)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--surface-record)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            {/* Avatar */}
            <div aria-hidden="true" style={{
              width: 32, height: 32, borderRadius: 6, flexShrink: 0,
              background: 'rgba(0,212,255,0.09)', color: 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
            }}>
              {(c.poliza.asegurado ?? '?').slice(0, 2).toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.poliza.asegurado ?? '—'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 1 }}>
                <RecordCode value={c.poliza.numeroPoliza} />
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{c.poliza.compania ?? '—'}</span>
              </div>
            </div>

            {/* Right */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                {formatMoney(c.importe)}
              </p>
              <p style={{ fontSize: 12, fontWeight: 600, color: urgentColor, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                {formatDate(c.fechaVencimiento)} · {dias}d
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ── Activity feed ───────────────────────────────────────── */
interface ActivityItem { icon: React.ReactNode; title: string; sub: string; time: string }

const ACTIVITY_ITEMS: ActivityItem[] = [
  { icon: <IconSiniestro size={14} />, title: 'Siniestro Reportado',  sub: 'Exp. #4402',           time: '2h' },
  { icon: <IconPoliza    size={14} />, title: 'Póliza Renovada',      sub: 'J. Domínguez',          time: 'Ayer' },
  { icon: <IconReclamo   size={14} />, title: 'Reclamo Actualizado',  sub: 'RCL-0089 · En gestión', time: '2d' },
];

function ActivityFeed() {
  const navigate = useNavigate();
  return (
    <div style={{
      background: 'var(--surface-record)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 8, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)',
      }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Actividad reciente
        </p>
        <span className="animate-pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--sla-warning-text)', display: 'inline-block' }} aria-hidden="true" />
      </div>

      <div>
        {ACTIVITY_ITEMS.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 14px',
            borderBottom: i < ACTIVITY_ITEMS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
          }}>
            <div aria-hidden="true" style={{
              width: 28, height: 28, borderRadius: 6, flexShrink: 0, marginTop: 1,
              background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)',
              color: 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {item.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{item.title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{item.sub}</p>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0, marginTop: 2 }}>{item.time}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => navigate('/siniestros')}
          style={{
            width: '100%', textAlign: 'center', fontSize: 12, fontWeight: 600,
            color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
          }}
          aria-label="Ver historial completo de actividad"
        >
          Ver historial completo
        </button>
      </div>
    </div>
  );
}

/* ── Accesos rápidos ──────────────────────────────────────── */
function QuickActions() {
  const navigate = useNavigate();
  const items = [
    { label: 'Nuevo asegurado',    icon: <IconAsegurado size={18} />, to: '/asegurados' },
    { label: 'Nueva póliza',       icon: <IconPoliza    size={18} />, to: '/polizas'    },
    { label: 'Reportar siniestro', icon: <IconSiniestro size={18} />, to: '/siniestros' },
    { label: 'Nuevo reclamo',      icon: <IconReclamo   size={18} />, to: '/reclamos'   },
  ];

  return (
    <div style={{
      background: 'var(--surface-record)', border: '1px solid var(--border-subtle)',
      borderRadius: 8, overflow: 'hidden',
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Accesos rápidos
        </p>
      </div>
      <div style={{ padding: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {items.map((item) => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '14px 8px', borderRadius: 6,
              background: 'var(--surface-panel)', border: '1px solid var(--border-subtle)',
              cursor: 'pointer', transition: 'all 0.12s ease', color: 'var(--text-muted)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(0,212,255,0.06)';
              e.currentTarget.style.borderColor = 'rgba(0,212,255,0.20)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--surface-panel)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
            aria-label={item.label}
          >
            <span style={{ color: 'var(--accent-primary)' }}>{item.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.3 }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Dashboard Asegurado — Vista personal del asegurado
════════════════════════════════════════════════════════════ */

interface PolizaAseg { id: string; numeroPoliza: string; estado: EstadoPoliza; compania: { nombre: string } | null }
interface SiniestroAseg { id: string; tipo: string; estado: EstadoSiniestro; fechaOcurrencia: string }
interface ReclamoAseg { id: string; tipo: string; estado: EstadoReclamo; fechaApertura: string }

function DashboardAsegurado() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const primerNombre = user?.nombre?.split(' ')[0] ?? '';

  const polizas = useQuery<PolizaAseg[]>({
    queryKey: ['mis-polizas'],
    queryFn: () => api.get('/polizas').then((r) => r.data),
  });
  const siniestros = useQuery<SiniestroAseg[]>({
    queryKey: ['mis-siniestros'],
    queryFn: () => api.get('/siniestros').then((r) => r.data),
  });
  const reclamos = useQuery<ReclamoAseg[]>({
    queryKey: ['mis-reclamos'],
    queryFn: () => api.get('/reclamos').then((r) => r.data),
  });

  const polizasActivas   = polizas.data?.filter(p => p.estado === EstadoPoliza.ACTIVA).length ?? 0;
  const sinAbiertos      = siniestros.data?.filter(s => s.estado === EstadoSiniestro.ABIERTO || s.estado === EstadoSiniestro.EN_GESTION).length ?? 0;
  const recAbiertos      = reclamos.data?.filter(r => r.estado === EstadoReclamo.ABIERTO || r.estado === EstadoReclamo.EN_GESTION).length ?? 0;
  const isLoading        = polizas.isLoading || siniestros.isLoading || reclamos.isLoading;

  const kpis = [
    {
      label: 'Pólizas activas',
      value: polizas.isLoading ? null : polizasActivas,
      icon: <IconPoliza size={16} />,
      iconColor: '#10c97a',
      to: '/polizas',
    },
    {
      label: 'Siniestros abiertos',
      value: siniestros.isLoading ? null : sinAbiertos,
      icon: <IconSiniestro size={16} />,
      iconColor: '#f0a020',
      to: '/siniestros',
    },
    {
      label: 'Reclamos activos',
      value: reclamos.isLoading ? null : recAbiertos,
      icon: <IconReclamo size={16} />,
      iconColor: '#e05050',
      to: '/reclamos',
    },
  ];

  return (
    <div className="space-y-6">

      {/* Cabecera */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          Bienvenido/a, {primerNombre}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Este es el resumen de tu cobertura y trámites activos.
        </p>
      </motion.div>

      {/* KPIs */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
      >
        {kpis.map((k) => (
          <button
            key={k.to}
            onClick={() => navigate(k.to)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '18px 20px', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
              background: 'var(--surface-record)', border: '1px solid var(--border-subtle)',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = k.iconColor + '55')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 8, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: k.iconColor + '18', color: k.iconColor,
              border: `1px solid ${k.iconColor}30`,
            }}>
              {k.icon}
            </div>
            <div>
              <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                {k.value === null ? <Sk w={32} h={24} /> : k.value}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{k.label}</p>
            </div>
          </button>
        ))}
      </motion.div>

      {/* Alertas de trámites activos */}
      {!isLoading && (sinAbiertos > 0 || recAbiertos > 0) && (
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Trámites en curso
          </h2>
          {sinAbiertos > 0 && (
            <OperationalAlert
              severity="warning"
              title={`${sinAbiertos} siniestro${sinAbiertos !== 1 ? 's' : ''} en curso`}
              description="Podés ver el estado y agregar comentarios"
              actionLabel="Ver siniestros"
              onAction={() => navigate('/siniestros')}
              count={sinAbiertos}
            />
          )}
          {recAbiertos > 0 && (
            <OperationalAlert
              severity="info"
              title={`${recAbiertos} reclamo${recAbiertos !== 1 ? 's' : ''} activo${recAbiertos !== 1 ? 's' : ''}`}
              description="Tu productor está gestionando tu reclamo"
              actionLabel="Ver reclamos"
              onAction={() => navigate('/reclamos')}
              count={recAbiertos}
            />
          )}
        </motion.div>
      )}

      {/* Últimas pólizas */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Mis pólizas</h2>
          <button
            onClick={() => navigate('/polizas')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Ver todo <IconArrowRight size={12} />
          </button>
        </div>
        <div style={{ background: 'var(--surface-record)', border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
          {polizas.isLoading && (
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(i => <Sk key={i} w="100%" h={20} />)}
            </div>
          )}
          {!polizas.isLoading && (!polizas.data || polizas.data.length === 0) && (
            <p style={{ padding: '24px 20px', fontSize: 14, color: 'var(--text-faint)', textAlign: 'center' }}>Sin pólizas registradas.</p>
          )}
          {(polizas.data ?? []).slice(0, 5).map((p, i) => (
            <div
              key={p.id}
              onClick={() => navigate('/polizas')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px', cursor: 'pointer',
                borderTop: i > 0 ? '1px solid var(--border-subtle)' : undefined,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-panel)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#10c97a' }}><IconPoliza size={14} /></span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.numeroPoliza}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{p.compania?.nombre ?? '—'}</p>
                </div>
              </div>
              <span className={cn(cls.badge, p.estado === EstadoPoliza.ACTIVA ? cls.badgeGreen : p.estado === EstadoPoliza.SUSPENDIDA ? cls.badgeAmber : cls.badgeRed)}>
                {p.estado}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Accesos rápidos */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Accesos rápidos
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Reportar siniestro', icon: <IconSiniestro size={18} />, to: '/siniestros', color: '#f0a020' },
            { label: 'Hacer un reclamo',   icon: <IconReclamo   size={18} />, to: '/reclamos',   color: '#e05050' },
            { label: 'Ver mis bienes',     icon: <IconPoliza    size={18} />, to: '/bienes',     color: '#00d4ff' },
          ].map(item => (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '18px 12px', borderRadius: 8, cursor: 'pointer',
                background: 'var(--surface-record)', border: '1px solid var(--border-subtle)',
                transition: 'all 0.12s ease', color: 'var(--text-muted)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = item.color + '10';
                e.currentTarget.style.borderColor = item.color + '40';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--surface-record)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <span style={{ color: item.color }}>{item.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Dashboard Page — Resumen operativo (org / productor)
════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { isOrganizador, isAsegurado, user } = useAuth();
  // Primer nombre solamente para el saludo
  const primerNombre = user?.nombre?.split(' ')[0] ?? '';
  const navigate = useNavigate();

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
  const vencimientos = useQuery<VencimientosResponse>({
    queryKey: ['reportes', 'vencimientos', 7],
    queryFn: () => api.get('/reportes/vencimientos-proximos?dias=7').then((r) => r.data),
  });

  const isLoadingStats = cartera.isLoading || siniestros.isLoading;

  const siniestrosAbiertos  = siniestros.data?.porEstado[EstadoSiniestro.ABIERTO]    ?? 0;
  const siniestrosEnGestion = siniestros.data?.porEstado[EstadoSiniestro.EN_GESTION] ?? 0;
  const polizasActivas      = polizas.data?.porEstado[EstadoPoliza.ACTIVA]           ?? 0;
  const vencimientosCriticos = vencimientos.data?.total                              ?? 0;
  const totalTareas = siniestrosAbiertos + vencimientosCriticos;

  if (isAsegurado) return <DashboardAsegurado />;

  return (
    <div className="space-y-6">

      {/* ── Cabecera operativa ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <p style={{
          fontSize: 11, fontWeight: 600, color: 'var(--text-faint)',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
        }}>
          {new Date().toLocaleDateString('es-AR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          }).toUpperCase()}
        </p>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            Bienvenido/a, {primerNombre}
          </h1>
          {!isLoadingStats && totalTareas > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 5,
              background: 'var(--sla-warning-bg)', color: 'var(--sla-warning-text)',
              border: '1px solid rgba(240,160,32,0.28)',
              fontSize: 12, fontWeight: 700,
            }} role="status" aria-label={`${totalTareas} tareas requieren atención`}>
              {totalTareas} tareas requieren atención
            </span>
          )}
        </div>

        {!isLoadingStats && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
            {vencimientosCriticos > 0 && (
              <span>
                <span style={{ color: 'var(--sla-breached-text)', fontWeight: 600 }}>
                  {vencimientosCriticos} vencimiento{vencimientosCriticos !== 1 ? 's' : ''} esta semana
                </span>
                {siniestrosAbiertos > 0 && <span style={{ color: 'var(--text-faint)' }}> · </span>}
              </span>
            )}
            {siniestrosAbiertos > 0 && (
              <span style={{ color: 'var(--sla-warning-text)', fontWeight: 600 }}>
                {siniestrosAbiertos} siniestro{siniestrosAbiertos !== 1 ? 's' : ''} abierto{siniestrosAbiertos !== 1 ? 's' : ''}
              </span>
            )}
            {totalTareas === 0 && (
              <span style={{ color: 'var(--sla-safe-text)', fontWeight: 600 }}>
                Sin tareas pendientes urgentes
              </span>
            )}
          </p>
        )}
      </motion.div>

      {/* ── Ops bar ────────────────────────────────────────── */}
      {!isLoadingStats && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
        >
          <OpsBar
            tareas={totalTareas}
            vencimientos={vencimientosCriticos}
            siniestros={siniestrosAbiertos}
            docs={0}
          />
        </motion.div>
      )}

      {/* ── Alertas ────────────────────────────────────────── */}
      {!isLoadingStats && (siniestrosAbiertos > 0 || siniestrosEnGestion > 0 || vencimientosCriticos > 0) && (
        <motion.section
          aria-labelledby="sec-atencion"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 id="sec-atencion" style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Atención requerida
          </h2>
          <div className="space-y-2">
            {siniestrosAbiertos > 0 && (
              <OperationalAlert
                severity="warning"
                title={`${siniestrosAbiertos} siniestro${siniestrosAbiertos !== 1 ? 's' : ''} abierto${siniestrosAbiertos !== 1 ? 's' : ''}`}
                description="Sin asignar o sin movimientos recientes"
                actionLabel="Ver siniestros"
                onAction={() => navigate('/siniestros')}
                count={siniestrosAbiertos}
              />
            )}
            {siniestrosEnGestion > 0 && (
              <OperationalAlert
                severity="info"
                title={`${siniestrosEnGestion} siniestro${siniestrosEnGestion !== 1 ? 's' : ''} en gestión`}
                description="Requieren seguimiento activo"
                actionLabel="Ver detalle"
                onAction={() => navigate('/siniestros')}
                count={siniestrosEnGestion}
              />
            )}
            {vencimientosCriticos > 0 && (
              <OperationalAlert
                severity="critical"
                title={`${vencimientosCriticos} vencimiento${vencimientosCriticos !== 1 ? 's' : ''} en los próximos 7 días`}
                description="Revisar y notificar a los asegurados"
                actionLabel="Ver pólizas"
                onAction={() => navigate('/polizas')}
                count={vencimientosCriticos}
              />
            )}
          </div>
        </motion.section>
      )}

      {/* ── KPI grid con area charts ────────────────────────── */}
      <motion.section
        aria-labelledby="sec-indicadores"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 id="sec-indicadores" style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          Indicadores generales
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <KpiCard
            label="Cartera asegurados"
            value={cartera.data?.total ?? 0}
            trend="+2 este mes"
            trendUp={true}
            sub="Total activos"
            icon={<IconAsegurado size={14} />}
            iconColor="#00d4ff"
            chartColor="#00d4ff"
            chartPoints="M0,42 L25,38 L50,35 L75,30 L100,28 L125,22 L150,18 L175,12 L200,8"
            loading={isLoadingStats}
          />
          <KpiCard
            label="Pólizas activas"
            value={isOrganizador ? polizasActivas : '—'}
            trend="94.2% en vigor"
            trendUp={true}
            icon={<IconPoliza size={14} />}
            iconColor="#10c97a"
            chartColor="#10c97a"
            chartPoints="M0,38 L25,35 L50,32 L75,34 L100,25 L125,20 L150,16 L175,14 L200,10"
            loading={polizas.isLoading && isOrganizador}
          />
          <KpiCard
            label="Siniestros abiertos"
            value={siniestrosAbiertos}
            trend={siniestrosAbiertos > 0 ? `${siniestrosEnGestion} en gestión` : 'Sin pendientes'}
            trendUp={false}
            sub={siniestrosAbiertos > 0 ? 'Requieren atención' : undefined}
            icon={<IconSiniestro size={14} />}
            iconColor="#f0a020"
            chartColor="#f0a020"
            chartPoints="M0,20 L25,28 L50,18 L75,32 L100,24 L125,30 L150,20 L175,28 L200,22"
            loading={siniestros.isLoading}
          />
          <KpiCard
            label="Vencimientos 7 días"
            value={vencimientosCriticos}
            trend={vencimientosCriticos > 0 ? 'Revisar urgente' : 'Sin vencimientos'}
            trendUp={false}
            icon={<IconVencimiento size={14} />}
            iconColor="#e05050"
            chartColor="#e05050"
            chartPoints="M0,10 L25,15 L50,12 L75,20 L100,28 L125,24 L150,32 L175,38 L200,44"
            loading={vencimientos.isLoading}
          />
        </div>
      </motion.section>

      {/* ── Columnas: vencimientos + sidebar ───────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

        {/* Vencimientos */}
        <motion.section
          aria-labelledby="sec-vencimientos"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 id="sec-vencimientos" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
              Próximos vencimientos
            </h2>
            <button
              onClick={() => navigate('/polizas')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 600, color: 'var(--accent-primary)',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
              aria-label="Ver todas las pólizas"
            >
              Ver todo <IconArrowRight size={12} />
            </button>
          </div>
          <VencimientosSection />
        </motion.section>

        {/* Sidebar derecho */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
        >
          <ActivityFeed />
          <QuickActions />
        </motion.div>
      </div>

    </div>
  );
}
