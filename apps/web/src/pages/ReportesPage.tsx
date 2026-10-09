import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Legend,
} from 'recharts';
import api from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/format';
import { EstadoPoliza, EstadoSiniestro, EstadoReclamo } from '@gestion-pas/types';
import { cn, cls, estadoPolicaBadge } from '@/lib/cn';
import { useDarkMode } from '@/lib/useDarkMode';

/* ── Tipos de respuesta ──────────────────────────────────── */
interface CarteraResp    { total: number; asegurados: { id: string; nombre: string; dniCuil: string; productor: { nombre: string } | null }[] }
interface VencimientosResp { total: number; cuotas: { id: string; numeroCuota: number; importe: number; fechaVencimiento: string; poliza: { numeroPoliza: string; asegurado?: string; compania?: string } }[] }
interface EstadosResp    { total: number; porEstado: Record<string, number> }
interface PolizasResp    { total: number; porEstado: Record<string, number>; polizas: { id: string; numeroPoliza: string; estado: EstadoPoliza; vigenciaFin: string; asegurado: { nombre: string }; compania: { nombre: string } }[] }
interface ComisionesResp { total: number; productores: { id: string; nombre: string; estado: string; polizasActivas: number; totalImporteCuotasMes: number }[] }
interface IncompletosResp{ total: number; bienes: { id: string; tipo: string; asegurado: { nombre: string } | null; camposFaltantes: string[] }[] }

/* ── Paleta semántica neutralizada — mismos roles, menos saturación */
const ESTADO_COLORS: Record<string, string> = {
  // siniestros / reclamos
  abierto:    '#5b7fbd',   // azul apagado
  en_gestion: '#a07830',   // ámbar oscuro
  resuelto:   '#3a8a62',   // verde bosque
  rechazado:  '#8f4040',   // rojo oscuro
  // pólizas
  activa:     '#3a8a62',   // verde bosque
  suspendida: '#a07830',   // ámbar oscuro
  anulada:    '#8f4040',   // rojo oscuro
};
const FALLBACK_COLORS = ['#5b7fbd', '#a07830', '#3a8a62', '#7060a8', '#8f4040'];

/* Estado etiquetas legibles */
const ESTADO_LABEL: Record<string, string> = {
  abierto:    'Abierto',
  en_gestion: 'En gestión',
  resuelto:   'Resuelto',
  rechazado:  'Rechazado',
  activa:     'Activa',
  suspendida: 'Suspendida',
  anulada:    'Anulada',
};

/* ── KPI card superior ───────────────────────────────────── */
type KpiColor = 'blue' | 'green' | 'amber' | 'red';

const KPI_LEFT: Record<KpiColor, string> = {
  blue:  'var(--accent-primary)',
  green: 'var(--policy-active-text)',
  amber: 'var(--policy-grace-text)',
  red:   'var(--policy-cancelled-text)',
};

function KpiCard({ label, value, color = 'blue', footnote }: {
  label: string; value: string | number; color?: KpiColor; footnote?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--surface-record)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 4,
        borderLeft: `3px solid ${KPI_LEFT[color]}`,
        padding: '12px 14px',
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
        {label}
      </span>
      <div style={{ fontSize: 26, fontWeight: 600, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
        {value}
      </div>
      {footnote && (
        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>{footnote}</div>
      )}
    </div>
  );
}

/* ── Tooltip con etiquetas ───────────────────────────────── */
function ChartTooltip({ active, payload, label, formatter }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[];
  label?: string; formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const displayLabel = label
    ? (ESTADO_LABEL[label] ?? label.replace(/_/g, ' '))
    : undefined;
  return (
    <div
      style={{
        background: 'var(--surface-elevated)',
        border: '1px solid var(--border-strong)',
        borderRadius: 4, padding: '8px 12px',
        fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      }}
    >
      {displayLabel && (
        <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, textTransform: 'capitalize' }}>
          {displayLabel}
        </p>
      )}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontFamily: 'var(--font-mono)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
          {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

/* ── Bar chart horizontal (por estado) ──────────────────── */
function EstadosBarChart({ data, dark }: { data: Record<string, number>; dark: boolean }) {
  const chartData = Object.entries(data).map(([estado, count]) => ({ estado, count }));
  const axisColor  = dark ? '#475569' : '#94a3b8';
  const cursorFill = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';

  return (
    <ResponsiveContainer width="100%" height={Math.max(120, chartData.length * 48)}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20, top: 2, bottom: 2 }}>
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: axisColor }}
          axisLine={false} tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category" dataKey="estado"
          tick={{ fontSize: 11, fill: axisColor }}
          axisLine={false} tickLine={false} width={96}
          tickFormatter={(v: string) => ESTADO_LABEL[v] ?? v.replace(/_/g, ' ')}
        />
        <Tooltip
          content={(props) => (
            <ChartTooltip
              active={props.active}
              payload={props.payload as unknown as { name: string; value: number; color: string }[]}
            />
          )}
          cursor={{ fill: cursorFill }}
        />
        <Bar dataKey="count" radius={[0, 3, 3, 0]} maxBarSize={28}>
          {chartData.map(({ estado }, i) => (
            <Cell
              key={estado}
              fill={ESTADO_COLORS[estado] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Pie chart (distribución pólizas) ───────────────────── */
function EstadosPieChart({ data, dark }: { data: Record<string, number>; dark: boolean }) {
  const chartData   = Object.entries(data).map(([estado, value]) => ({ name: estado, value }));
  const legendColor = dark ? '#475569' : '#94a3b8';

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData} dataKey="value" nameKey="name"
          cx="50%" cy="50%" outerRadius={72} innerRadius={36}
          paddingAngle={3}
        >
          {chartData.map(({ name }, i) => (
            <Cell
              key={name}
              fill={ESTADO_COLORS[name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
              fillOpacity={0.9}
            />
          ))}
        </Pie>
        <Tooltip
          content={(props) => (
            <ChartTooltip
              active={props.active}
              payload={props.payload as unknown as { name: string; value: number; color: string }[]}
              label={typeof props.label === 'string' ? props.label : undefined}
            />
          )}
        />
        <Legend
          iconType="circle" iconSize={7}
          formatter={(value: string) => (
            <span style={{ fontSize: 11, color: legendColor, textTransform: 'capitalize' }}>
              {value.replace(/_/g, ' ')}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ── Bar chart vertical (comisiones) ────────────────────── */
function ComisionesChart({ data, dark }: {
  data: ComisionesResp['productores']; dark: boolean;
}) {
  const axisColor  = dark ? '#475569' : '#94a3b8';
  const cursorFill = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';

  const totalPolizas = data.reduce((s, p) => s + p.polizasActivas, 0);
  const totalImporte = data.reduce((s, p) => s + p.totalImporteCuotasMes, 0);
  const hayImporte   = totalImporte > 0;

  // Ordenar de mayor a menor pólizas activas
  const sorted = [...data].sort((a, b) => b.polizasActivas - a.polizasActivas);

  const chartData = sorted.map((p) => ({
    nombre: p.nombre.split(' ')[0],
    polizas: p.polizasActivas,
    importe: p.totalImporteCuotasMes,
    pct: totalPolizas > 0 ? Math.round((p.polizasActivas / totalPolizas) * 100) : 0,
  }));

  const BAR_COLORS = ['#5b8fb0', '#7080a8', '#4a8a70', '#806898', '#9a7840'];

  return (
    <div>
      {/* Gráfico de barras — pólizas activas */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
          <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} width={36}
            tickFormatter={(v: number) => String(v)}
            allowDecimals={false}
          />
          <Tooltip
            content={(props) => (
              <ChartTooltip
                active={props.active}
                payload={props.payload as unknown as { name: string; value: number; color: string }[]}
                label={typeof props.label === 'string' ? props.label : undefined}
                formatter={(v) => `${v} póliza${v !== 1 ? 's' : ''}`}
              />
            )}
            cursor={{ fill: cursorFill }}
          />
          <Bar dataKey="polizas" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Ranking tabla — participación % + importe si hay */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map((p, i) => {
          const pct = totalPolizas > 0 ? Math.round((p.polizasActivas / totalPolizas) * 100) : 0;
          const color = BAR_COLORS[i % BAR_COLORS.length];
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Nombre + barra */}
              <span style={{ fontSize: 11, color: 'var(--text-faint)', width: 72, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.nombre.split(' ')[0]}
              </span>
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.4s ease' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 32, textAlign: 'right' }}>{pct}%</span>
              <span style={{ fontSize: 11, color: 'var(--text-faint)', minWidth: 24, textAlign: 'right' }}>
                {p.polizasActivas} pol.
              </span>
              {hayImporte && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 64, textAlign: 'right' }}>
                  {formatMoney(p.totalImporteCuotasMes)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Total footer */}
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
          Total: <strong style={{ color: 'var(--text-secondary)' }}>{totalPolizas} pólizas activas</strong>
        </span>
        {hayImporte && (
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
            {formatMoney(totalImporte)} / mes
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Sección colapsable ──────────────────────────────────── */
function Section({ title, badge, defaultOpen = false, children }: {
  title: string; badge?: string | number; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        background: 'var(--surface-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 4,
        marginBottom: 10,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
          {badge !== undefined && (
            <span className={cn(cls.badge, cls.badgeGray)}>{badge}</span>
          )}
        </span>
        <svg
          width="13" height="13" viewBox="0 0 14 14" fill="none"
          style={{
            transition: 'transform 0.18s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--text-faint)',
          }}
        >
          <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && <div style={{ borderTop: '1px solid var(--border-subtle)' }} />}
      {open && <div style={{ padding: '16px 20px' }}>{children}</div>}
    </div>
  );
}

/* ── Fila de carga ───────────────────────────────────────── */
function Loading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0' }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton" style={{ height: 14, borderRadius: 3, animationDelay: `${i * 0.06}s` }} />
      ))}
    </div>
  );
}

/* ── Estado vacío de gráfico ─────────────────────────────── */
function EmptyChart({ msg }: { msg: string }) {
  return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>{msg}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PÁGINA
══════════════════════════════════════════════════════════ */
export default function ReportesPage() {
  const { dark } = useDarkMode();

  const cartera    = useQuery<CarteraResp>({
    queryKey: ['r', 'cartera'],
    queryFn: () => api.get('/reportes/cartera-asegurados').then((r) => r.data),
  });
  const venc30     = useQuery<VencimientosResp>({
    queryKey: ['r', 'venc', 30],
    queryFn: () => api.get('/reportes/vencimientos-proximos?dias=30').then((r) => r.data),
  });
  const siniestros = useQuery<EstadosResp>({
    queryKey: ['r', 'siniestros'],
    queryFn: () => api.get('/reportes/siniestros').then((r) => r.data),
  });
  const reclamos   = useQuery<EstadosResp>({
    queryKey: ['r', 'reclamos'],
    queryFn: () => api.get('/reportes/reclamos').then((r) => r.data),
  });
  const polizas    = useQuery<PolizasResp>({
    queryKey: ['r', 'polizas'],
    queryFn: () => api.get('/reportes/polizas').then((r) => r.data),
  });
  const comisiones = useQuery<ComisionesResp>({
    queryKey: ['r', 'comisiones'],
    queryFn: () => api.get('/reportes/comisiones').then((r) => r.data),
  });
  const incompletos= useQuery<IncompletosResp>({
    queryKey: ['r', 'incompletos'],
    queryFn: () => api.get('/reportes/datos-incompletos').then((r) => r.data),
  });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 className={cls.pageTitle}>Reportes</h1>
        <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
          Indicadores operativos de la cartera
        </p>
      </div>

      {/* ════════════════════════════════════════════════════
          KPIs — fila superior con jerarquía visual
      ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard
          label="Asegurados"
          value={cartera.data?.total ?? '—'}
          color="blue"
        />
        <KpiCard
          label="Pólizas activas"
          value={polizas.data?.porEstado[EstadoPoliza.ACTIVA] ?? '—'}
          color="green"
        />
        <KpiCard
          label="Vencen en 30 días"
          value={venc30.data?.total ?? '—'}
          color="amber"
          footnote="Próximas a vencer"
        />
        <KpiCard
          label="Siniestros abiertos"
          value={siniestros.data?.porEstado[EstadoSiniestro.ABIERTO] ?? '—'}
          color="red"
        />
        <KpiCard
          label="Reclamos abiertos"
          value={reclamos.data?.porEstado[EstadoReclamo.ABIERTO] ?? '—'}
          color="red"
        />
        <KpiCard
          label="Datos incompletos"
          value={incompletos.data?.total ?? '—'}
          color={incompletos.data?.total ? 'amber' : 'green'}
          footnote={incompletos.data?.total === 0 ? '✓ Todo completo' : 'Requieren atención'}
        />
      </div>

      {/* ════════════════════════════════════════════════════
          Gráficos — grilla semántica
      ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Siniestros por estado — responde: ¿en qué estado está la cartera? */}
        <div
          style={{
            background: 'var(--surface-panel)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 4,
            padding: '16px 20px',
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Siniestros por estado
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
            ¿En qué estado está la cartera de siniestros?
          </p>
          {siniestros.isLoading ? <Loading /> :
           siniestros.data && Object.keys(siniestros.data.porEstado).length
             ? <EstadosBarChart data={siniestros.data.porEstado} dark={dark} />
             : <EmptyChart msg="Sin datos de siniestros" />}
        </div>

        {/* Reclamos por estado */}
        <div
          style={{
            background: 'var(--surface-panel)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 4,
            padding: '16px 20px',
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Reclamos por estado
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
            ¿Cuántos reclamos están activos o resueltos?
          </p>
          {reclamos.isLoading ? <Loading /> :
           reclamos.data && Object.keys(reclamos.data.porEstado).length
             ? <EstadosBarChart data={reclamos.data.porEstado} dark={dark} />
             : <EmptyChart msg="Sin datos de reclamos" />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

        {/* Pólizas — donut */}
        <div
          style={{
            background: 'var(--surface-panel)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 4,
            padding: '16px 20px',
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Distribución de pólizas
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
            ¿Cómo está distribuida la cartera de pólizas?
          </p>
          {polizas.isLoading ? <Loading /> :
           polizas.data && Object.keys(polizas.data.porEstado).length
             ? <EstadosPieChart data={polizas.data.porEstado} dark={dark} />
             : <EmptyChart msg="Sin datos de pólizas" />}
        </div>

        {/* Comisiones estimadas */}
        <div
          style={{
            background: 'var(--surface-panel)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 4,
            padding: '16px 20px',
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Comisiones estimadas por productor
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
            Total de cuotas activas por productor este mes
          </p>
          {comisiones.isLoading ? <Loading /> :
           comisiones.data?.productores.length
             ? <ComisionesChart data={comisiones.data.productores} dark={dark} />
             : <EmptyChart msg="Sin datos de comisiones" />}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          Secciones colapsables — tablas de detalle
      ════════════════════════════════════════════════════ */}
      <Section title="Cartera de asegurados" badge={cartera.data?.total} defaultOpen>
        {cartera.isLoading ? <Loading /> : (
          <table className={cls.table}>
            <thead><tr>
              <th className={cls.th}>Nombre</th>
              <th className={cls.th}>DNI / CUIL</th>
              <th className={cls.th}>Productor</th>
            </tr></thead>
            <tbody>
              {cartera.data?.asegurados.map((a) => (
                <tr key={a.id} className={cls.trHover}>
                  <td className={cn(cls.td, 'font-medium txt-primary')}>{a.nombre}</td>
                  <td className={cls.td}>{a.dniCuil}</td>
                  <td className={cls.td}>{a.productor?.nombre ?? <span className="txt-faint">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Vencimientos próximos (30 días)" badge={venc30.data?.total}>
        {venc30.isLoading ? <Loading /> :
         venc30.data?.total === 0
           ? <p className="text-sm txt-faint">Sin cuotas que venzan en los próximos 30 días.</p>
           : (
           <table className={cls.table}>
             <thead><tr>
               <th className={cls.th}>Póliza</th>
               <th className={cls.th}>Asegurado</th>
               <th className={cls.th}>Compañía</th>
               <th className={cls.th}>Vencimiento</th>
               <th className={cn(cls.th, 'text-right')}>Importe</th>
             </tr></thead>
             <tbody>
               {venc30.data?.cuotas.map((c) => (
                 <tr key={c.id} className={cls.trHover}>
                   <td className={cls.td}>{c.poliza.numeroPoliza}</td>
                   <td className={cls.td}>{c.poliza.asegurado ?? <span className="txt-faint">—</span>}</td>
                   <td className={cls.td}>{c.poliza.compania ?? <span className="txt-faint">—</span>}</td>
                   <td className={cls.td}>{formatDate(c.fechaVencimiento)}</td>
                   <td className={cn(cls.td, 'text-right font-semibold tabular-nums')}>{formatMoney(c.importe)}</td>
                 </tr>
               ))}
             </tbody>
           </table>
         )}
      </Section>

      <Section title="Detalle de pólizas" badge={polizas.data?.total}>
        {polizas.isLoading ? <Loading /> : (
          <table className={cls.table}>
            <thead><tr>
              <th className={cls.th}>Número</th>
              <th className={cls.th}>Asegurado</th>
              <th className={cls.th}>Compañía</th>
              <th className={cls.th}>Vence</th>
              <th className={cls.th}>Estado</th>
            </tr></thead>
            <tbody>
              {polizas.data?.polizas.map((p) => (
                <tr key={p.id} className={cls.trHover}>
                  <td className={cn(cls.td, 'font-medium txt-primary')}>{p.numeroPoliza}</td>
                  <td className={cls.td}>{p.asegurado.nombre}</td>
                  <td className={cls.td}>{p.compania.nombre}</td>
                  <td className={cls.td}>{formatDate(p.vigenciaFin)}</td>
                  <td className={cls.td}>
                    <span className={cn(cls.badge, estadoPolicaBadge[p.estado])}>{p.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Comisiones estimadas" badge={comisiones.data?.productores.length}>
        {comisiones.isLoading ? <Loading /> :
         !comisiones.data?.productores.length
           ? <p className="text-sm txt-faint">Sin datos.</p>
           : (
           <table className={cls.table}>
             <thead><tr>
               <th className={cls.th}>Productor</th>
               <th className={cls.th}>Estado</th>
               <th className={cls.th}>Pólizas activas</th>
               <th className={cn(cls.th, 'text-right')}>Total cuotas / mes</th>
             </tr></thead>
             <tbody>
               {comisiones.data.productores.map((p) => (
                 <tr key={p.id} className={cls.trHover}>
                   <td className={cn(cls.td, 'font-medium txt-primary')}>{p.nombre}</td>
                   <td className={cls.td}>
                     <span className={cn(cls.badge, p.estado === 'activo' ? cls.badgeGreen : cls.badgeGray)}>
                       {p.estado}
                     </span>
                   </td>
                   <td className={cls.td}>{p.polizasActivas}</td>
                   <td className={cn(cls.td, 'text-right font-semibold tabular-nums')}>
                     {formatMoney(p.totalImporteCuotasMes)}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         )}
      </Section>

      <Section
        title="Bienes con datos incompletos"
        badge={incompletos.data?.total}
      >
        {incompletos.isLoading ? <Loading /> :
         incompletos.data?.total === 0 ? (
           <p className="text-sm text-[#10b981]">Todos los bienes tienen datos completos.</p>
         ) : (
           <table className={cls.table}>
             <thead><tr>
               <th className={cls.th}>Tipo</th>
               <th className={cls.th}>Asegurado</th>
               <th className={cls.th}>Campos faltantes</th>
             </tr></thead>
             <tbody>
               {incompletos.data?.bienes.map((b) => (
                 <tr key={b.id} className={cls.trHover}>
                   <td className={cls.td}>
                     <span className={cn(cls.badge, cls.badgeGray)}>{b.tipo}</span>
                   </td>
                   <td className={cls.td}>{b.asegurado?.nombre ?? <span className="txt-faint">—</span>}</td>
                   <td className={cls.td}>
                     <div className="flex flex-wrap gap-1">
                       {b.camposFaltantes.map((c) => (
                         <span key={c} className={cn(cls.badge, cls.badgeAmber)}>{c}</span>
                       ))}
                     </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         )}
      </Section>
    </div>
  );
}
