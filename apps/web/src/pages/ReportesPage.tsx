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
interface CarteraResp { total: number; asegurados: { id: string; nombre: string; dniCuil: string; productor: { nombre: string } | null }[] }
interface VencimientosResp { total: number; cuotas: { id: string; numeroCuota: number; importe: number; fechaVencimiento: string; poliza: { numeroPoliza: string; asegurado?: string; compania?: string } }[] }
interface EstadosResp { total: number; porEstado: Record<string, number> }
interface PolizasResp { total: number; porEstado: Record<string, number>; polizas: { id: string; numeroPoliza: string; estado: EstadoPoliza; vigenciaFin: string; asegurado: { nombre: string }; compania: { nombre: string } }[] }
interface ComisionesResp { total: number; productores: { id: string; nombre: string; estado: string; polizasActivas: number; totalImporteCuotasMes: number }[] }
interface IncompletosResp { total: number; bienes: { id: string; tipo: string; asegurado: { nombre: string } | null; camposFaltantes: string[] }[] }

/* ── Paleta de colores por estado ────────────────────────── */
const ESTADO_COLORS: Record<string, string> = {
  abierto:     '#3b82f6',
  en_gestion:  '#f59e0b',
  resuelto:    '#22c55e',
  rechazado:   '#ef4444',
  activa:      '#22c55e',
  suspendida:  '#f59e0b',
  anulada:     '#ef4444',
};
const FALLBACK_COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#06b6d4'];

/* ── Stat card ────────────────────────────────────────────── */
type StatColor = 'accent' | 'green' | 'yellow' | 'red';
const STAT_COLOR_MAP: Record<StatColor, string> = {
  accent: 'text-brand-600',
  green:  'text-green-600',
  yellow: 'text-amber-600',
  red:    'text-red-600',
};

function StatCard({ label, value, color = 'accent' }: { label: string; value: string | number; color?: StatColor }) {
  return (
    <div className={cn(cls.cardPad, 'flex flex-col gap-1')}>
      <div className={cn('text-3xl font-bold leading-none', STAT_COLOR_MAP[color])}>{value}</div>
      <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{label}</div>
    </div>
  );
}

/* ── Seccion wrapper ─────────────────────────────────────── */
function ReporteSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={cn(cls.cardPad, 'mb-5')}>
      <h2 className={cn(cls.sectionTitle, 'mb-4')}>{title}</h2>
      {children}
    </div>
  );
}

/* ── Tooltip custom dark-aware ───────────────────────────── */
function ChartTooltip({ active, payload, label, dark, formatter }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[];
  label?: string; dark: boolean; formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`px-3 py-2 rounded-lg text-xs shadow-lg border ${
      dark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
    }`}>
      {label && <p className="font-semibold mb-1 capitalize">{label.replace(/_/g, ' ')}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

/* ── Gráfico de barras horizontal (estados) ──────────────── */
function EstadosBarChart({ data, dark }: { data: Record<string, number>; dark: boolean }) {
  const chartData = Object.entries(data).map(([estado, count]) => ({ estado, count }));
  const axisColor = dark ? '#64748b' : '#94a3b8';
  const gridColor = dark ? '#1e293b' : '#f1f5f9';

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 52)}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
        <YAxis
          type="category" dataKey="estado"
          tick={{ fontSize: 11, fill: axisColor }}
          axisLine={false} tickLine={false} width={90}
          tickFormatter={(v: string) => v.replace(/_/g, ' ')}
        />
        <Tooltip
          content={(props) => (
            <ChartTooltip
              active={props.active}
              payload={props.payload as unknown as { name: string; value: number; color: string }[]}
              dark={dark}
            />
          )}
          cursor={{ fill: gridColor }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={32}>
          {chartData.map(({ estado }, i) => (
            <Cell key={estado} fill={ESTADO_COLORS[estado] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Gráfico de torta (distribución) ────────────────────── */
function EstadosPieChart({ data, dark }: { data: Record<string, number>; dark: boolean }) {
  const chartData = Object.entries(data).map(([estado, value]) => ({ name: estado, value }));
  const legendColor = dark ? '#94a3b8' : '#64748b';

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData} dataKey="value" nameKey="name"
          cx="50%" cy="50%" outerRadius={80}
          paddingAngle={2}
        >
          {chartData.map(({ name }, i) => (
            <Cell key={name} fill={ESTADO_COLORS[name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          content={(props) => (
            <ChartTooltip
              active={props.active}
              payload={props.payload as unknown as { name: string; value: number; color: string }[]}
              label={typeof props.label === 'string' ? props.label : undefined}
              dark={dark}
            />
          )}
        />
        <Legend
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

/* ── Gráfico de barras verticales (comisiones) ───────────── */
function ComisionesBarChart({ data, dark }: {
  data: ComisionesResp['productores']; dark: boolean;
}) {
  const chartData = data.map((p) => ({ nombre: p.nombre.split(' ')[0], total: p.totalImporteCuotasMes }));
  const axisColor = dark ? '#64748b' : '#94a3b8';
  const gridColor = dark ? '#1e293b' : '#f1f5f9';

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
        <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          content={(props) => (
            <ChartTooltip
              active={props.active}
              payload={props.payload as unknown as { name: string; value: number; color: string }[]}
              label={typeof props.label === 'string' ? props.label : undefined}
              dark={dark}
              formatter={(v) => formatMoney(v)}
            />
          )}
          cursor={{ fill: gridColor }}
        />
        <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ══════════════════════════════════════════════════════════
   PÁGINA
══════════════════════════════════════════════════════════ */
export default function ReportesPage() {
  const { dark } = useDarkMode();

  const cartera = useQuery<CarteraResp>({
    queryKey: ['r', 'cartera'],
    queryFn: () => api.get('/reportes/cartera-asegurados').then((r) => r.data),
  });
  const venc30 = useQuery<VencimientosResp>({
    queryKey: ['r', 'venc', 30],
    queryFn: () => api.get('/reportes/vencimientos-proximos?dias=30').then((r) => r.data),
  });
  const siniestros = useQuery<EstadosResp>({
    queryKey: ['r', 'siniestros'],
    queryFn: () => api.get('/reportes/siniestros').then((r) => r.data),
  });
  const reclamos = useQuery<EstadosResp>({
    queryKey: ['r', 'reclamos'],
    queryFn: () => api.get('/reportes/reclamos').then((r) => r.data),
  });
  const polizas = useQuery<PolizasResp>({
    queryKey: ['r', 'polizas'],
    queryFn: () => api.get('/reportes/polizas').then((r) => r.data),
  });
  const comisiones = useQuery<ComisionesResp>({
    queryKey: ['r', 'comisiones'],
    queryFn: () => api.get('/reportes/comisiones').then((r) => r.data),
  });
  const incompletos = useQuery<IncompletosResp>({
    queryKey: ['r', 'incompletos'],
    queryFn: () => api.get('/reportes/datos-incompletos').then((r) => r.data),
  });

  const loading = 'px-4 py-6 text-center text-slate-400 text-sm';

  return (
    <div>
      <h1 className={cn(cls.pageTitle, 'mb-6')}>Reportes</h1>

      {/* ── Resumen en stats cards ───────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="Asegurados" value={cartera.data?.total ?? '—'} />
        <StatCard label="Pólizas activas" value={polizas.data?.porEstado[EstadoPoliza.ACTIVA] ?? '—'} color="green" />
        <StatCard label="Vencimientos (30d)" value={venc30.data?.total ?? '—'} color="yellow" />
        <StatCard label="Siniestros abiertos" value={siniestros.data?.porEstado[EstadoSiniestro.ABIERTO] ?? '—'} color="red" />
        <StatCard label="Reclamos abiertos" value={reclamos.data?.porEstado[EstadoReclamo.ABIERTO] ?? '—'} color="red" />
        <StatCard label="Datos incompletos" value={incompletos.data?.total ?? '—'} color={incompletos.data?.total ? 'yellow' : 'green'} />
      </div>

      {/* ── R3 + R4 + R5 — Gráficos en grilla ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* R3 — Siniestros */}
        <div className={cls.cardPad}>
          <h2 className={cn(cls.sectionTitle, 'mb-4')}>R3 — Siniestros por estado</h2>
          {siniestros.isLoading
            ? <p className="text-center text-slate-400 text-sm py-10">Cargando...</p>
            : siniestros.data
              ? <EstadosBarChart data={siniestros.data.porEstado} dark={dark} />
              : null}
        </div>

        {/* R4 — Reclamos */}
        <div className={cls.cardPad}>
          <h2 className={cn(cls.sectionTitle, 'mb-4')}>R4 — Reclamos por estado</h2>
          {reclamos.isLoading
            ? <p className="text-center text-slate-400 text-sm py-10">Cargando...</p>
            : reclamos.data
              ? <EstadosBarChart data={reclamos.data.porEstado} dark={dark} />
              : null}
        </div>

        {/* R5 — Pólizas torta */}
        <div className={cls.cardPad}>
          <h2 className={cn(cls.sectionTitle, 'mb-4')}>R5 — Pólizas por estado</h2>
          {polizas.isLoading
            ? <p className="text-center text-slate-400 text-sm py-10">Cargando...</p>
            : polizas.data
              ? <EstadosPieChart data={polizas.data.porEstado} dark={dark} />
              : null}
        </div>
      </div>

      {/* ── R6 — Comisiones barras ───────────────────────────── */}
      <ReporteSection title="R6 — Comisiones estimadas por productor">
        {comisiones.isLoading
          ? <p className={loading}>Cargando...</p>
          : comisiones.data?.productores.length
            ? (
              <div className="space-y-5">
                <ComisionesBarChart data={comisiones.data.productores} dark={dark} />
                <table className={cls.table}>
                  <thead><tr>
                    <th className={cls.th}>Productor</th>
                    <th className={cls.th}>Estado</th>
                    <th className={cls.th}>Pólizas activas</th>
                    <th className={cn(cls.th, 'text-right')}>Total cuotas / mes</th>
                  </tr></thead>
                  <tbody>
                    {comisiones.data.productores.map((p) => (
                      <tr key={p.id}>
                        <td className={cn(cls.td, 'font-medium')}>{p.nombre}</td>
                        <td className={cls.td}>
                          <span className={cn(cls.badge, p.estado === 'activo' ? cls.badgeGreen : cls.badgeGray)}>
                            {p.estado}
                          </span>
                        </td>
                        <td className={cls.td}>{p.polizasActivas}</td>
                        <td className={cn(cls.td, 'text-right font-semibold')}>{formatMoney(p.totalImporteCuotasMes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
            : <p className={loading}>Sin datos de comisiones.</p>}
      </ReporteSection>

      {/* ── R1 — Cartera ────────────────────────────────────── */}
      <ReporteSection title="R1 — Cartera de asegurados">
        {cartera.isLoading ? <p className={loading}>Cargando...</p> : (
          <table className={cls.table}>
            <thead><tr>
              <th className={cls.th}>Nombre</th>
              <th className={cls.th}>DNI / CUIL</th>
              <th className={cls.th}>Productor</th>
            </tr></thead>
            <tbody>
              {cartera.data?.asegurados.map((a) => (
                <tr key={a.id}>
                  <td className={cn(cls.td, 'font-medium')}>{a.nombre}</td>
                  <td className={cls.td}>{a.dniCuil}</td>
                  <td className={cls.td}>{a.productor?.nombre ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReporteSection>

      {/* ── R2 — Vencimientos ───────────────────────────────── */}
      <ReporteSection title="R2 — Vencimientos próximos (30 días)">
        {venc30.isLoading ? <p className={loading}>Cargando...</p> :
         venc30.data?.total === 0
           ? <p className="text-sm text-slate-400">Sin vencimientos en los próximos 30 días.</p>
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
                <tr key={c.id}>
                  <td className={cls.td}>{c.poliza.numeroPoliza}</td>
                  <td className={cls.td}>{c.poliza.asegurado ?? '—'}</td>
                  <td className={cls.td}>{c.poliza.compania ?? '—'}</td>
                  <td className={cls.td}>{formatDate(c.fechaVencimiento)}</td>
                  <td className={cn(cls.td, 'text-right font-semibold')}>{formatMoney(c.importe)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReporteSection>

      {/* ── R5 tabla detalle ────────────────────────────────── */}
      <ReporteSection title="R5 — Detalle de pólizas">
        {polizas.isLoading ? <p className={loading}>Cargando...</p> : (
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
                <tr key={p.id}>
                  <td className={cn(cls.td, 'font-medium')}>{p.numeroPoliza}</td>
                  <td className={cls.td}>{p.asegurado.nombre}</td>
                  <td className={cls.td}>{p.compania.nombre}</td>
                  <td className={cls.td}>{formatDate(p.vigenciaFin)}</td>
                  <td className={cls.td}>
                    <span className={cn(cls.badge, estadoPolicaBadge[p.estado])}>
                      {p.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReporteSection>

      {/* ── R7 — Datos incompletos ───────────────────────────── */}
      <ReporteSection title="R7 — Bienes con datos incompletos">
        {incompletos.isLoading ? <p className={loading}>Cargando...</p> :
         incompletos.data?.total === 0 ? (
           <p className="text-sm font-medium text-green-600">Todos los bienes tienen datos completos.</p>
         ) : (
          <table className={cls.table}>
            <thead><tr>
              <th className={cls.th}>Tipo</th>
              <th className={cls.th}>Asegurado</th>
              <th className={cls.th}>Campos faltantes</th>
            </tr></thead>
            <tbody>
              {incompletos.data?.bienes.map((b) => (
                <tr key={b.id}>
                  <td className={cls.td}><span className={cn(cls.badge, cls.badgeGray)}>{b.tipo}</span></td>
                  <td className={cls.td}>{b.asegurado?.nombre ?? '—'}</td>
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
      </ReporteSection>
    </div>
  );
}
