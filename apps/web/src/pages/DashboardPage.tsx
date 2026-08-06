import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { EstadoPoliza, EstadoSiniestro } from '@gestion-pas/types';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/format';
import { cn, cls } from '@/lib/cn';
import OperationalAlert from '@/components/ui/OperationalAlert';
import ExpirationIndicator from '@/components/ui/ExpirationIndicator';
import RecordCode from '@/components/ui/RecordCode';
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
    poliza: { numeroPoliza: string; asegurado?: string | null; compania?: string | null }
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

/* ── KPI principal ───────────────────────────────────────── */
interface KpiPrimaryProps {
  label: string;
  value: number | string;
  trend?: string;
  sub?: string;
  icon: React.ReactNode;
  loading?: boolean;
}
function KpiPrimary({ label, value, trend, sub, icon, loading }: KpiPrimaryProps) {
  return (
    <div
      style={{
        background: 'var(--surface-record)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 6,
        padding: '18px 20px',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div style={{ color: 'var(--text-faint)' }}>{icon}</div>
        {trend && (
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--sla-safe-text)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <IconTrendUp size={11} />
            {trend}
          </span>
        )}
      </div>
      <div style={{ marginTop: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
          {label}
        </p>
        {loading
          ? <Sk w={48} h={32} />
          : (
            <p style={{ fontSize: 30, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {value}
            </p>
          )
        }
        {sub && !loading && (
          <p style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</p>
        )}
      </div>
    </div>
  );
}

/* ── KPI secundaria ──────────────────────────────────────── */
function KpiSecondary({ label, value, loading }: { label: string; value: number | string; loading?: boolean }) {
  return (
    <div
      style={{
        background: 'var(--surface-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 4,
        padding: '12px 14px',
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        {label}
      </p>
      {loading
        ? <Sk w={36} h={22} />
        : <p style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      }
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
      <div
        style={{
          marginTop: 12,
          padding: '20px 16px',
          borderRadius: 4,
          background: 'var(--surface-record)',
          border: '1px solid var(--border-subtle)',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sin vencimientos en los próximos 7 días</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10 }}>
      {data.cuotas.map((c) => {
        const dias = diffDays(c.fechaVencimiento);
        return (
          <button
            key={c.id}
            onClick={() => navigate('/polizas')}
            className="w-full text-left"
            aria-label={`Ver póliza ${c.poliza.numeroPoliza} — vence en ${dias} días`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 4,
              marginBottom: 4,
              background: 'var(--surface-record)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'background 0.1s ease',
              width: '100%',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--tr-hover-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-record)')}
          >
            {/* Avatar */}
            <div
              aria-hidden="true"
              style={{
                width: 32, height: 32, borderRadius: 4,
                background: 'var(--claim-docs-bg)',
                color: 'var(--claim-docs-text)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}
            >
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

            {/* Right: fecha + importe */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                {formatMoney(c.importe)}
              </p>
              <ExpirationIndicator diasRestantes={dias} fechaLabel={formatDate(c.fechaVencimiento)} />
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
  { icon: <IconSiniestro size={14} />, title: 'Siniestro Reportado',  sub: 'Exp. #4402',          time: '2h' },
  { icon: <IconPoliza    size={14} />, title: 'Póliza Renovada',      sub: 'J. Domínguez',         time: 'Ayer' },
  { icon: <IconReclamo   size={14} />, title: 'Reclamo Actualizado',   sub: 'RCL-0089 · En gestión',time: '2d' },
];

function ActivityFeed() {
  return (
    <div
      style={{
        background: 'var(--surface-record)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Actividad reciente
        </p>
        <span
          className="animate-pulse-dot"
          style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--sla-warning-text)', display: 'inline-block' }}
          aria-hidden="true"
        />
      </div>

      <div>
        {ACTIVITY_ITEMS.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 14px',
              borderBottom: i < ACTIVITY_ITEMS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 28, height: 28, borderRadius: 4, flexShrink: 0, marginTop: 1,
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
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
    { label: 'Nuevo asegurado', icon: <IconAsegurado size={18} />, to: '/asegurados' },
    { label: 'Nueva póliza',    icon: <IconPoliza    size={18} />, to: '/polizas'    },
    { label: 'Reportar siniestro', icon: <IconSiniestro size={18} />, to: '/siniestros' },
    { label: 'Nuevo reclamo',   icon: <IconReclamo   size={18} />, to: '/reclamos'   },
  ];

  return (
    <div
      style={{
        background: 'var(--surface-record)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
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
              gap: 8, padding: '14px 8px',
              borderRadius: 4,
              background: 'var(--surface-panel)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer', transition: 'background 0.1s ease',
              color: 'var(--text-muted)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-elevated)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-panel)')}
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
   Dashboard Page — Resumen operativo
════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user, isOrganizador } = useAuth();
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

  /* Alertas calculadas desde datos reales */
  const siniestrosAbiertos  = siniestros.data?.porEstado[EstadoSiniestro.ABIERTO]    ?? 0;
  const siniestrosEnGestion = siniestros.data?.porEstado[EstadoSiniestro.EN_GESTION] ?? 0;
  const polizasActivas      = polizas.data?.porEstado[EstadoPoliza.ACTIVA]           ?? 0;
  const vencimientosCriticos = vencimientos.data?.total                              ?? 0;
  const totalTareas = siniestrosAbiertos + vencimientosCriticos;

  return (
    <div className="space-y-6">

      {/* ── Cabecera operativa ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Indicador de fecha — pequeño y discreto */}
        <p
          style={{
            fontSize: 11, fontWeight: 600,
            color: 'var(--text-faint)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            marginBottom: 6,
          }}
        >
          {new Date().toLocaleDateString('es-AR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          }).toUpperCase()}
        </p>

        {/* Título operativo */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            Resumen operativo
          </h1>
          {!isLoadingStats && totalTareas > 0 && (
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 3,
                background: 'var(--sla-warning-bg)',
                color: 'var(--sla-warning-text)',
                border: '1px solid var(--sla-warning-border)',
                fontSize: 12, fontWeight: 700,
              }}
              role="status"
              aria-label={`${totalTareas} tareas requieren atención`}
            >
              {totalTareas} tareas requieren atención
            </span>
          )}
        </div>

        {/* Subtítulo con desglose */}
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
              <span>
                <span style={{ color: 'var(--sla-warning-text)', fontWeight: 600 }}>
                  {siniestrosAbiertos} siniestro{siniestrosAbiertos !== 1 ? 's' : ''} abierto{siniestrosAbiertos !== 1 ? 's' : ''}
                </span>
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

      {/* ── Alertas de atención requerida ──────────────────── */}
      {!isLoadingStats && (siniestrosAbiertos > 0 || siniestrosEnGestion > 0 || vencimientosCriticos > 0) && (
        <motion.section
          aria-labelledby="sec-atencion"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
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

      {/* ── KPIs ───────────────────────────────────────────── */}
      <motion.section
        aria-labelledby="sec-indicadores"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 id="sec-indicadores" style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          Indicadores generales
        </h2>

        {/* KPI principal + secundarias */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
          {/* Principal: cartera */}
          <KpiPrimary
            label="Cartera asegurados"
            value={cartera.data?.total ?? 0}
            trend="+2 este mes"
            sub="Total activos"
            icon={<IconAsegurado size={18} />}
            loading={isLoadingStats}
          />
          {/* Secundarias */}
          <KpiSecondary
            label="Siniestros abiertos"
            value={siniestros.data?.porEstado[EstadoSiniestro.ABIERTO] ?? 0}
            loading={siniestros.isLoading}
          />
          <KpiSecondary
            label="En gestión"
            value={siniestros.data?.porEstado[EstadoSiniestro.EN_GESTION] ?? 0}
            loading={siniestros.isLoading}
          />
          {isOrganizador && (
            <KpiSecondary
              label="Pólizas activas"
              value={polizasActivas}
              loading={polizas.isLoading}
            />
          )}
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
