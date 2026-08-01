import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
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

/* ── Paleta monocromática — pasos de opacidad del azul accent */
const ESTADO_COLORS: Record<string, string> = {
  // siniestros / reclamos
  abierto:    'rgba(61,107,255,1.0)',
  en_gestion: 'rgba(61,107,255,0.55)',
  resuelto:   'rgba(61,107,255,0.30)',
  rechazado:  'rgba(61,107,255,0.15)',
  // pólizas
  activa:     'rgba(61,107,255,1.0)',
  suspendida: 'rgba(61,107,255,0.45)',
  anulada:    'rgba(61,107,255,0.18)',
};
const FALLBACK_COLORS = [
  'rgba(61,107,255,1.0)',
  'rgba(61,107,255,0.65)',
  'rgba(61,107,255,0.40)',
  'rgba(61,107,255,0.20)',
];

/* ── KPI card superior ───────────────────────────────────── */
type KpiColor = 'blue' | 'green' | 'amber' | 'red';

function KpiCard({ label, value, footnote }: {
  label: string; value: string | number; color?: KpiColor; footnote?: string;
}) {
  return (
    <div className="stat-card px-5 py-4 flex flex-col gap-1.5 min-w-0">
      {/* label */}
      <span className="text-[11px] txt-faint truncate uppercase tracking-widest font-semibold">{label}</span>
      {/* value */}
      <div className="text-3xl font-bold leading-none tabular-nums text-white">{value}</div>
      {/* optional footnote */}
      {footnote && <div className="text-[10px] txt-faint">{footnote}</div>}
    </div>
  );
}

/* ── Tooltip minimal ─────────────────────────────────────── */
function ChartTooltip({ active, payload, label, formatter }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[];
  label?: string; formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="modal-base px-3 py-2 rounded-sm text-xs shadow-lg">
      {label && (
        <p className="txt-secondary font-semibold mb-1 capitalize">
          {label.replace(/_/g, ' ')}
        </p>
      )}
      {payload.map((p) => (
        <p key={p.name} className="tabular-nums" style={{ color: p.color }}>
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
          axisLine={false} tickLine={false} width={86}
          tickFormatter={(v: string) => v.replace(/_/g, ' ')}
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
function ComisionesBarChart({ data, dark }: {
  data: ComisionesResp['productores']; dark: boolean;
}) {
  const chartData  = data.map((p) => ({ nombre: p.nombre.split(' ')[0], total: p.totalImporteCuotasMes }));
  const axisColor  = dark ? '#475569' : '#94a3b8';
  const cursorFill = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
        <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} width={52}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          content={(props) => (
            <ChartTooltip
              active={props.active}
              payload={props.payload as unknown as { name: string; value: number; color: string }[]}
              label={typeof props.label === 'string' ? props.label : undefined}
              formatter={(v) => formatMoney(v)}
            />
          )}
          cursor={{ fill: cursorFill }}
        />
        <Bar dataKey="total" fill="#3d6bff" fillOpacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Sección colapsable ──────────────────────────────────── */
function Section({ title, badge, defaultOpen = false, children }: {
  title: string; badge?: string | number; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="surface rounded-sm mb-3 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left group"
      >
        <span className="flex items-center gap-3">
          <span className="text-sm font-semibold txt-secondary">{title}</span>
          {badge !== undefined && (
            <span className={cn(cls.badge, cls.badgeGray, 'tabular-nums')}>{badge}</span>
          )}
        </span>
        {/* chevron */}
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          className={cn('transition-transform duration-200 txt-faint', open && 'rotate-180')}
        >
          <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && <div className="panel-sep" />}
      {open && <div className="px-6 py-5">{children}</div>}
    </div>
  );
}

/* ── Fila de carga ───────────────────────────────────────── */
function Loading() {
  return <p className="text-sm txt-faint text-center py-8">Cargando...</p>;
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
      <h1 className={cn(cls.pageTitle, 'mb-1')}>Reportes</h1>
      <p className="txt-faint text-sm mb-7">Resumen operativo de la cartera</p>

      {/* ════════════════════════════════════════════════════
          KPIs — fila superior
      ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
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
          label="Vencen en 30 d"
          value={venc30.data?.total ?? '—'}
          color="amber"
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
          footnote={incompletos.data?.total === 0 ? 'Todo completo' : undefined}
        />
      </div>

      {/* ════════════════════════════════════════════════════
          Gráficos — grilla 2 + 1
      ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Siniestros por estado */}
        <div className="surface rounded-sm p-6">
          <p className="text-xs font-semibold txt-faint uppercase tracking-widest mb-4">
            Siniestros por estado
          </p>
          {siniestros.isLoading ? <Loading /> :
           siniestros.data ? <EstadosBarChart data={siniestros.data.porEstado} dark={dark} /> : null}
        </div>

        {/* Reclamos por estado */}
        <div className="surface rounded-sm p-6">
          <p className="text-xs font-semibold txt-faint uppercase tracking-widest mb-4">
            Reclamos por estado
          </p>
          {reclamos.isLoading ? <Loading /> :
           reclamos.data ? <EstadosBarChart data={reclamos.data.porEstado} dark={dark} /> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">

        {/* Pólizas — donut */}
        <div className="surface rounded-sm p-6">
          <p className="text-xs font-semibold txt-faint uppercase tracking-widest mb-4">
            Distribución de pólizas
          </p>
          {polizas.isLoading ? <Loading /> :
           polizas.data ? <EstadosPieChart data={polizas.data.porEstado} dark={dark} /> : null}
        </div>

        {/* Comisiones estimadas */}
        <div className="surface rounded-sm p-6">
          <p className="text-xs font-semibold txt-faint uppercase tracking-widest mb-4">
            Comisiones estimadas por productor
          </p>
          {comisiones.isLoading ? <Loading /> :
           comisiones.data?.productores.length
             ? <ComisionesBarChart data={comisiones.data.productores} dark={dark} />
             : <p className="text-sm txt-faint text-center py-8">Sin datos.</p>}
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
