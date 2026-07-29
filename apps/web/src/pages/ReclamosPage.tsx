import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { formatDate } from '@/lib/format';
import { EstadoReclamo, TipoReclamo } from '@gestion-pas/types';
import { useAuth } from '@/context/AuthContext';
import { cn, cls, estadoReclamoBadge } from '@/lib/cn';
import { motion } from 'framer-motion';

/* ── Tipos ──────────────────────────────────────────────── */
interface Ref { id: string; nombre: string }
interface Reclamo {
  id: string; tipo: TipoReclamo; estado: EstadoReclamo;
  descripcion: string | null; fechaApertura: string;
  asegurado: Ref; productor: Ref; compania: Ref | null;
}

const ESTADO_LABEL: Record<EstadoReclamo, string> = {
  [EstadoReclamo.ABIERTO]: 'Abierto',
  [EstadoReclamo.EN_GESTION]: 'En gestion',
  [EstadoReclamo.RESUELTO]: 'Resuelto',
};
const TIPO_LABEL: Record<TipoReclamo, string> = {
  [TipoReclamo.FACTURACION]: 'Facturacion',
  [TipoReclamo.COBERTURA]: 'Cobertura',
  [TipoReclamo.ADMINISTRATIVO]: 'Administrativo',
  [TipoReclamo.OTRO]: 'Otro',
};
const ESTADO_ORDEN: EstadoReclamo[] = [
  EstadoReclamo.ABIERTO, EstadoReclamo.EN_GESTION, EstadoReclamo.RESUELTO,
];

/* ── Schema ──────────────────────────────────────────────── */
const schema = z.object({
  tipo: z.nativeEnum(TipoReclamo),
  descripcion: z.string().optional(),
  fechaApertura: z.string().min(1, 'Requerido'),
  aseguradoId: z.string().uuid('Requerido'),
  productorId: z.string().uuid('Requerido'),
  companiaId: z.string().uuid().optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

/* ── Field helper ───────────────────────────────────────── */
function Field({ label, error, children, full }: { label: string; error?: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-1', full ? 'col-span-2' : '')}>
      <label className={cls.label}>{label}</label>
      {children}
      {error && <span className="text-xs text-red-500 mt-0.5">{error}</span>}
    </div>
  );
}

/* ── Detail row helper ──────────────────────────────────── */
function DR({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs font-semibold txt-faint uppercase tracking-wide">{label}</span>
      <span className="text-sm txt-secondary text-right">{value}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STEPPER DE ESTADO
══════════════════════════════════════════════════════════ */
function ReclamoStepper({ estado }: { estado: EstadoReclamo }) {
  const idx = ESTADO_ORDEN.indexOf(estado);
  return (
    <div className="flex items-center">
      {ESTADO_ORDEN.map((e, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={e} className={cn('flex items-center', i < ESTADO_ORDEN.length - 1 ? 'flex-1' : '')}>
            <div className="flex flex-col items-center gap-1" style={{ minWidth: 80 }}>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                done ? 'bg-green-600 text-white' : active ? 'bg-brand-600 text-white' : 'bg-black/6 dark:bg-white/8 txt-faint',
              )}>
                {done
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : i + 1}
              </div>
              <span className={cn(
                'text-xs text-center',
                active ? 'font-semibold txt-primary' : done ? 'text-green-600' : 'txt-faint',
              )}>
                {ESTADO_LABEL[e]}
              </span>
            </div>
            {i < ESTADO_ORDEN.length - 1 && (
              <div className={cn('flex-1 h-0.5 mb-5', done ? 'bg-green-600' : 'bg-white/10')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   FORMULARIO ALTA
══════════════════════════════════════════════════════════ */
function ReclamoForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const aseguradoId = user?.aseguradoId ?? null;
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: propioAsegurado } = useQuery<Ref & { productor?: Ref }>({
    queryKey: ['asegurado-propio', aseguradoId],
    queryFn: () => api.get(`/asegurados/${aseguradoId}`).then((r) => r.data),
    enabled: !!aseguradoId,
  });

  const { data: asegurados = [] } = useQuery<Ref[]>({
    queryKey: ['asegurados'],
    queryFn: () => api.get('/asegurados').then((r) => r.data),
    enabled: !aseguradoId,
  });
  const { data: productores = [] } = useQuery<Ref[]>({
    queryKey: ['productores'],
    queryFn: () => api.get('/productores').then((r) => r.data),
    enabled: !aseguradoId,
  });
  const { data: companias = [] } = useQuery<Ref[]>({
    queryKey: ['companias'],
    queryFn: () => api.get('/companias').then((r) => r.data),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        tipo: TipoReclamo.COBERTURA,
        fechaApertura: new Date().toISOString().slice(0, 10),
        aseguradoId: aseguradoId ?? '',
        productorId: propioAsegurado?.productor?.id ?? '',
      },
    });

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      api.post('/reclamos', { ...data, companiaId: data.companiaId || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reclamos'] }); onClose(); },
    onError: (err: unknown) => {
      setServerError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error.',
      );
    },
  });

  return (
    <div className={cls.overlay}>
      <div className={cn(cls.modal, cls.modalMd, '!rounded-md')}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
          <span className="text-base font-semibold txt-primary">Nuevo reclamo</span>
          <button onClick={onClose} className="txt-faint hover:txt-primary transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tipo *">
                <select className={cn(cls.select, '!rounded-sm')} {...register('tipo')}>
                  {Object.entries(TIPO_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label="Fecha apertura *" error={errors.fechaApertura?.message}>
                <input type="date" className={cn(cls.input, '!rounded-sm')} {...register('fechaApertura')} />
              </Field>
              <Field label="Descripcion" full>
                <textarea className={cn(cls.textarea, '!rounded-sm')} rows={3}
                  placeholder="Detalla el motivo del reclamo..."
                  {...register('descripcion')} />
              </Field>
              {aseguradoId ? (
                <>
                  <input type="hidden" {...register('aseguradoId')} value={aseguradoId} />
                  <Field label="Asegurado">
                    <input className={cn(cls.input, '!rounded-sm')} readOnly value={propioAsegurado?.nombre ?? 'Cargando...'} />
                  </Field>
                  <input type="hidden" {...register('productorId')} value={propioAsegurado?.productor?.id ?? ''} />
                  <Field label="Productor">
                    <input className={cn(cls.input, '!rounded-sm')} readOnly value={propioAsegurado?.productor?.nombre ?? 'Cargando...'} />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Asegurado *" error={errors.aseguradoId?.message}>
                    <select className={cn(cls.select, '!rounded-sm', errors.aseguradoId ? cls.inputError : '')} {...register('aseguradoId')}>
                      <option value="">Seleccionar...</option>
                      {asegurados.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                  </Field>
                  <Field label="Productor *" error={errors.productorId?.message}>
                    <select className={cn(cls.select, '!rounded-sm', errors.productorId ? cls.inputError : '')} {...register('productorId')}>
                      <option value="">Seleccionar...</option>
                      {productores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </Field>
                </>
              )}
              <Field label="Compania (opcional)" full>
                <select className={cn(cls.select, '!rounded-sm')} {...register('companiaId')}>
                  <option value="">Sin compania</option>
                  {companias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </Field>
            </div>
            {serverError && <p className="mt-3 text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded px-3 py-2">{serverError}</p>}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/6">
              <button type="button" className={cn(cls.btn, cls.btnMd, cls.btnSecond)} onClick={onClose}>Cancelar</button>
              <button type="submit" className={cn(cls.btn, cls.btnMd, cls.btnPrimary)} disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DETALLE RECLAMO
══════════════════════════════════════════════════════════ */
function ReclamoDetalle({ id }: { id: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAsegurado = user?.perfil === 'asegurado';

  const { data: reclamo, isLoading } = useQuery<Reclamo>({
    queryKey: ['reclamo', id],
    queryFn: () => api.get(`/reclamos/${id}`).then((r) => r.data),
  });

  const patchEstado = useMutation({
    mutationFn: (estado: EstadoReclamo) => api.patch(`/reclamos/${id}/estado`, { estado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reclamo', id] }),
  });

  if (isLoading) return <p className="py-10 text-center txt-tertiary text-sm">Cargando...</p>;
  if (!reclamo) return <p className="py-10 text-center txt-tertiary text-sm">Reclamo no encontrado.</p>;

  return (
    <div>
      <Link to="/reclamos" className="inline-block mb-4 text-sm text-accent-400 hover:text-accent-300 font-medium">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1"><polyline points="15 18 9 12 15 6"/></svg>Volver a reclamos
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className={cls.pageTitle}>Reclamo — {TIPO_LABEL[reclamo.tipo]}</h1>
          <p className="txt-tertiary text-sm mt-1">
            {reclamo.asegurado.nombre} · Abierto el {formatDate(reclamo.fechaApertura)}
          </p>
        </div>
        <span className={cn(cls.badge, estadoReclamoBadge[reclamo.estado])}>
          {ESTADO_LABEL[reclamo.estado]}
        </span>
      </div>

      {/* Stepper */}
      <div className={cn('card-base rounded-sm p-6', 'mb-5')}>
        <h2 className={cn(cls.sectionTitle, 'mb-4')}>Estado del reclamo</h2>
        <ReclamoStepper estado={reclamo.estado} />
      </div>

      {/* Datos */}
      <div className={cn('card-base rounded-sm p-6', 'mb-5')}>
        <h2 className={cn(cls.sectionTitle, 'mb-4')}>Datos del reclamo</h2>
        <div>
          <DR label="Asegurado" value={reclamo.asegurado.nombre} />
          <DR label="Productor" value={reclamo.productor.nombre} />
          <DR label="Compania" value={reclamo.compania?.nombre ?? '—'} />
          <DR label="Tipo" value={TIPO_LABEL[reclamo.tipo]} />
        </div>
        {reclamo.descripcion && (
          <div className="mt-3">
            <span className={cls.label}>Descripcion</span>
            <p className="mt-1 text-sm txt-secondary leading-relaxed">{reclamo.descripcion}</p>
          </div>
        )}
      </div>

      {/* Gestion — org y productor */}
      {!isAsegurado && reclamo.estado !== EstadoReclamo.RESUELTO && (
        <div className={cn('card-base rounded-sm p-6')}>
          <h2 className={cn(cls.sectionTitle, 'mb-4')}>Gestion</h2>
          <div className="flex flex-wrap gap-3">
            {reclamo.estado === EstadoReclamo.ABIERTO && (
              <button className={cn(cls.btn, cls.btnMd, cls.btnSecond)}
                onClick={() => patchEstado.mutate(EstadoReclamo.EN_GESTION)}>
                Tomar en gestion
              </button>
            )}
            {reclamo.estado === EstadoReclamo.EN_GESTION && (
              <button className={cn(cls.btn, cls.btnMd, cls.btnPrimary)}
                onClick={() => patchEstado.mutate(EstadoReclamo.RESUELTO)}>
                Marcar resuelto
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LISTADO
══════════════════════════════════════════════════════════ */
function ReclamosListado() {
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const { data: reclamos = [], isLoading } = useQuery<Reclamo[]>({
    queryKey: ['reclamos'],
    queryFn: () => api.get('/reclamos').then((r) => r.data),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className={cls.pageTitle}>Reclamos</h1>
        <button className={cn(cls.btn, cls.btnMd, cls.btnPrimary)} onClick={() => setShowForm(true)}>
          + Nuevo reclamo
        </button>
      </div>

      <motion.div
        className={cn('card-base rounded-none overflow-hidden border-x-0')}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <table className={cls.table}>
          <thead>
            <tr>
              <th className={cls.th}>Tipo</th>
              <th className={cls.th}>Asegurado</th>
              <th className={cls.th}>Compania</th>
              <th className={cls.th}>Fecha apertura</th>
              <th className={cls.th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center txt-tertiary text-sm">Cargando...</td></tr>}
            {!isLoading && reclamos.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center txt-tertiary text-sm">Sin reclamos registrados.</td></tr>
            )}
            {reclamos.map((r) => (
              <tr key={r.id} className={cls.trHover} onClick={() => navigate(`/reclamos/${r.id}`)}>
                <td className={cn(cls.td, 'font-medium')}>{TIPO_LABEL[r.tipo]}</td>
                <td className={cls.td}>{r.asegurado.nombre}</td>
                <td className={cls.td}>{r.compania?.nombre ?? '—'}</td>
                <td className={cls.td}>{formatDate(r.fechaApertura)}</td>
                <td className={cls.td}>
                  <span className={cn(cls.badge, estadoReclamoBadge[r.estado])}>
                    {ESTADO_LABEL[r.estado]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {showForm && <ReclamoForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

export default function ReclamosPage() {
  const { id } = useParams<{ id?: string }>();
  return id ? <ReclamoDetalle id={id} /> : <ReclamosListado />;
}
