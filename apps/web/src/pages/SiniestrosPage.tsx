import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { formatDate } from '@/lib/format';
import { EstadoSiniestro, TipoSiniestro, TipoBien } from '@gestion-pas/types';
import { useAuth } from '@/context/AuthContext';
import VehiculoSilueta from '@/components/VehiculoSilueta';
import { cn, cls, estadoSiniestroBadge } from '@/lib/cn';
import { motion } from 'framer-motion';

/* ── Tipos ──────────────────────────────────────────────── */
interface Ref { id: string; nombre: string }
interface BienRef { id: string; tipo: TipoBien; patente?: string | null; marca?: string | null; modelo?: string | null }
interface Siniestro {
  id: string; tipo: TipoSiniestro; estado: EstadoSiniestro;
  fechaOcurrencia: string; horaOcurrencia: string | null;
  lugarOcurrencia: string | null; relato: string | null;
  datosTerceros: string | null; numeroDenunciaCompania: string | null;
  zonasAfectadas?: string[];
  asegurado: Ref; bien: BienRef; productor: Ref; compania: Ref;
}

/* ── Schema alta ─────────────────────────────────────────── */
const schema = z.object({
  tipo: z.nativeEnum(TipoSiniestro),
  fechaOcurrencia: z.string().min(1, 'Requerido'),
  horaOcurrencia: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').optional().or(z.literal('')),
  lugarOcurrencia: z.string().optional(),
  relato: z.string().optional(),
  datosTerceros: z.string().optional(),
  numeroDenunciaCompania: z.string().optional(),
  aseguradoId: z.string().uuid('Requerido'),
  bienId: z.string().uuid('Requerido'),
  productorId: z.string().uuid('Requerido'),
  companiaId: z.string().uuid('Requerido'),
});
type FormValues = z.infer<typeof schema>;

/* ── Labels ─────────────────────────────────────────────── */
const ESTADO_LABEL: Record<EstadoSiniestro, string> = {
  [EstadoSiniestro.ABIERTO]: 'Abierto',
  [EstadoSiniestro.EN_GESTION]: 'En gestion',
  [EstadoSiniestro.RESUELTO]: 'Resuelto',
  [EstadoSiniestro.RECHAZADO]: 'Rechazado',
};

const ESTADO_ORDEN: EstadoSiniestro[] = [
  EstadoSiniestro.ABIERTO,
  EstadoSiniestro.EN_GESTION,
  EstadoSiniestro.RESUELTO,
];

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

/* ══════════════════════════════════════════════════════════
   FORMULARIO ALTA SINIESTRO
══════════════════════════════════════════════════════════ */
function SiniestroForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const aseguradoId = user?.aseguradoId ?? null;

  const [serverError, setServerError] = useState<string | null>(null);
  const [zonasAfectadas, setZonasAfectadas] = useState<string[]>([]);

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
  const { data: bienes = [] } = useQuery<BienRef[]>({
    queryKey: ['bienes', aseguradoId],
    queryFn: () => api.get(aseguradoId ? `/bienes/asegurado/${aseguradoId}` : '/bienes').then((r) => r.data),
  });

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        tipo: TipoSiniestro.COLISION,
        aseguradoId: aseguradoId ?? '',
        productorId: propioAsegurado?.productor?.id ?? '',
      },
    });

  const tipoActual = watch('tipo');
  const esAutoSiniestro = tipoActual === TipoSiniestro.COLISION ||
    tipoActual === TipoSiniestro.ROBO_TOTAL ||
    tipoActual === TipoSiniestro.ROBO_AUTOPARTES;

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      api.post('/siniestros', { ...data, zonasAfectadas }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['siniestros'] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setServerError(msg ?? 'Ocurrio un error. Intenta de nuevo.');
    },
  });

  return (
    <div className={cls.overlay}>
      <div className={cn(cls.modal, cls.modalLg, '!rounded-md')}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
          <span className="text-base font-semibold txt-primary">Registrar siniestro</span>
          <button onClick={onClose} className="txt-faint hover:txt-primary transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tipo de siniestro *">
                <select className={cn(cls.select, '!rounded-sm')} {...register('tipo')}>
                  <option value={TipoSiniestro.COLISION}>Colision</option>
                  <option value={TipoSiniestro.ROBO_TOTAL}>Robo total</option>
                  <option value={TipoSiniestro.ROBO_AUTOPARTES}>Robo de autopartes</option>
                  <option value={TipoSiniestro.HOGAR}>Hogar</option>
                  <option value={TipoSiniestro.VIDA}>Vida</option>
                  <option value={TipoSiniestro.OTRO}>Otro</option>
                </select>
              </Field>

              <Field label="Fecha de ocurrencia *" error={errors.fechaOcurrencia?.message}>
                <input type="date" className={cn(cls.input, '!rounded-sm', errors.fechaOcurrencia ? cls.inputError : '')} {...register('fechaOcurrencia')} />
              </Field>

              <Field label="Hora (HH:MM)" error={errors.horaOcurrencia?.message}>
                <input className={cn(cls.input, '!rounded-sm')} placeholder="14:30" {...register('horaOcurrencia')} />
              </Field>

              <Field label="Lugar de ocurrencia" full>
                <input className={cn(cls.input, '!rounded-sm')} placeholder="Av. General Paz y Acceso Oeste" {...register('lugarOcurrencia')} />
              </Field>

              <Field label="Relato del hecho" full>
                <textarea className={cn(cls.textarea, '!rounded-sm')} rows={3} {...register('relato')} />
              </Field>

              <Field label="Datos de terceros involucrados" full>
                <textarea className={cn(cls.textarea, '!rounded-sm')} rows={2}
                  placeholder="Nombre, patente, seguro..."
                  {...register('datosTerceros')} />
              </Field>

              <Field label="N° denuncia compania">
                <input className={cn(cls.input, '!rounded-sm')} {...register('numeroDenunciaCompania')} />
              </Field>
              <div />

              {/* Asegurado / productor */}
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

              <Field label="Bien afectado *" error={errors.bienId?.message} full>
                <select className={cn(cls.select, '!rounded-sm', errors.bienId ? cls.inputError : '')} {...register('bienId')}>
                  <option value="">Seleccionar...</option>
                  {bienes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.tipo}{b.marca ? ` - ${b.marca} ${b.modelo ?? ''}` : ''}{b.patente ? ` (${b.patente})` : ''}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Compania *" error={errors.companiaId?.message}>
                <select className={cn(cls.select, '!rounded-sm', errors.companiaId ? cls.inputError : '')} {...register('companiaId')}>
                  <option value="">Seleccionar...</option>
                  {companias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </Field>
            </div>

            {/* Silueta — solo para siniestros de automotor */}
            {esAutoSiniestro && (
              <div className="mt-5">
                <p className={cn(cls.label, 'mb-2')}>
                  Zonas de dano del vehiculo (click para marcar)
                </p>
                <VehiculoSilueta
                  zonasSeleccionadas={zonasAfectadas}
                  onChange={setZonasAfectadas}
                />
              </div>
            )}

            {serverError && <p className="mt-3 text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded px-3 py-2">{serverError}</p>}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/6">
              <button type="button" className={cn(cls.btn, cls.btnMd, cls.btnSecond)} onClick={onClose}>
                Cancelar
              </button>
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
   STEPPER DE ESTADO — "caja negra resuelta"
══════════════════════════════════════════════════════════ */
function EstadoStepper({ estado }: { estado: EstadoSiniestro }) {
  if (estado === EstadoSiniestro.RECHAZADO) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 bg-red-500/8 border border-red-500/20 rounded-sm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-red-500 flex-shrink-0"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        <span className="font-semibold text-red-300">Siniestro rechazado</span>
      </div>
    );
  }

  const idxActual = ESTADO_ORDEN.indexOf(estado);

  return (
    <div className="flex items-center">
      {ESTADO_ORDEN.map((e, i) => {
        const done = i < idxActual;
        const active = i === idxActual;
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
   VISTA DETALLE SINIESTRO
══════════════════════════════════════════════════════════ */
function SiniestroDetalle({ id }: { id: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAsegurado = user?.perfil === 'asegurado';

  const { data: siniestro, isLoading } = useQuery<Siniestro>({
    queryKey: ['siniestro', id],
    queryFn: () => api.get(`/siniestros/${id}`).then((r) => r.data),
  });

  const patchEstado = useMutation({
    mutationFn: (data: { estado: EstadoSiniestro; numeroDenunciaCompania?: string }) =>
      api.patch(`/siniestros/${id}/estado`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['siniestro', id] }),
  });

  const [nuevaNumDenuncia, setNuevaNumDenuncia] = useState('');

  if (isLoading) return <p className="py-10 text-center txt-tertiary text-sm">Cargando...</p>;
  if (!siniestro) return <p className="py-10 text-center txt-tertiary text-sm">Siniestro no encontrado.</p>;

  const esAuto = siniestro.bien.tipo === TipoBien.AUTOMOTOR ||
    siniestro.tipo === TipoSiniestro.COLISION ||
    siniestro.tipo === TipoSiniestro.ROBO_TOTAL ||
    siniestro.tipo === TipoSiniestro.ROBO_AUTOPARTES;

  return (
    <div>
      <Link to="/siniestros" className="inline-block mb-4 text-sm text-accent-400 hover:text-accent-300 font-medium">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1"><polyline points="15 18 9 12 15 6"/></svg>Volver a siniestros
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className={cls.pageTitle}>Siniestro — {siniestro.tipo.replace('_', ' ')}</h1>
          <p className="txt-tertiary text-sm mt-1">
            {siniestro.asegurado.nombre} · {formatDate(siniestro.fechaOcurrencia)}
          </p>
        </div>
        <span className={cn(cls.badge, estadoSiniestroBadge[siniestro.estado])}>
          {ESTADO_LABEL[siniestro.estado]}
        </span>
      </div>

      {/* Stepper */}
      <div className={cn('surface rounded-sm p-6', 'mb-5')}>
        <h2 className={cn(cls.sectionTitle, 'mb-4')}>Estado del tramite</h2>
        <EstadoStepper estado={siniestro.estado} />
      </div>

      {/* Datos */}
      <div className={cn('surface rounded-sm p-6', 'mb-5')}>
        <h2 className={cn(cls.sectionTitle, 'mb-4')}>Datos del siniestro</h2>
        <div>
          <DR label="Asegurado" value={siniestro.asegurado.nombre} />
          <DR label="Bien afectado" value={
            <>
              {siniestro.bien.tipo}
              {siniestro.bien.marca ? ` — ${siniestro.bien.marca} ${siniestro.bien.modelo ?? ''}` : ''}
              {siniestro.bien.patente ? ` (${siniestro.bien.patente})` : ''}
            </>
          } />
          <DR label="Compania" value={siniestro.compania.nombre} />
          <DR label="Productor" value={siniestro.productor.nombre} />
          <DR label="Fecha y hora" value={
            <>
              {formatDate(siniestro.fechaOcurrencia)}
              {siniestro.horaOcurrencia ? ` a las ${siniestro.horaOcurrencia}` : ''}
            </>
          } />
          <DR label="Lugar" value={siniestro.lugarOcurrencia ?? '—'} />
          {siniestro.numeroDenunciaCompania && (
            <DR label="N° denuncia compania" value={siniestro.numeroDenunciaCompania} />
          )}
        </div>

        {siniestro.relato && (
          <div className="mt-3">
            <span className={cls.label}>Relato</span>
            <p className="mt-1 text-sm txt-secondary leading-relaxed">{siniestro.relato}</p>
          </div>
        )}

        {siniestro.datosTerceros && (
          <div className="mt-3">
            <span className={cls.label}>Datos de terceros</span>
            <p className="mt-1 text-sm txt-secondary leading-relaxed">{siniestro.datosTerceros}</p>
          </div>
        )}
      </div>

      {/* Silueta con zonas marcadas */}
      {esAuto && (
        <div className={cn('surface rounded-sm p-6', 'mb-5')}>
          <h2 className={cn(cls.sectionTitle, 'mb-4')}>Zonas de dano marcadas</h2>
          {siniestro.zonasAfectadas && siniestro.zonasAfectadas.length > 0 ? (
            <VehiculoSilueta
              zonasSeleccionadas={siniestro.zonasAfectadas}
              onChange={() => undefined}
              readOnly
            />
          ) : (
            <p className="text-sm txt-tertiary">No se marcaron zonas de dano al registrar el siniestro.</p>
          )}
        </div>
      )}

      {/* Panel de gestion — solo para org/productor */}
      {!isAsegurado && (
        <div className={cn('surface rounded-sm p-6')}>
          <h2 className={cn(cls.sectionTitle, 'mb-4')}>Gestion del siniestro</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1" style={{ minWidth: 200 }}>
              <label className={cls.label}>N° denuncia compania</label>
              <input
                className={cn(cls.input, '!rounded-sm')}
                value={nuevaNumDenuncia}
                placeholder={siniestro.numeroDenunciaCompania ?? ''}
                onChange={(e) => setNuevaNumDenuncia(e.target.value)}
              />
            </div>
            {siniestro.estado === EstadoSiniestro.ABIERTO && (
              <button className={cn(cls.btn, cls.btnMd, cls.btnSecond)}
                onClick={() => patchEstado.mutate({
                  estado: EstadoSiniestro.EN_GESTION,
                  numeroDenunciaCompania: nuevaNumDenuncia || undefined,
                })}>
                Pasar a En gestion
              </button>
            )}
            {siniestro.estado === EstadoSiniestro.EN_GESTION && (
              <>
                <button className={cn(cls.btn, cls.btnMd, cls.btnPrimary)}
                  onClick={() => patchEstado.mutate({
                    estado: EstadoSiniestro.RESUELTO,
                    numeroDenunciaCompania: nuevaNumDenuncia || undefined,
                  })}>
                  Marcar resuelto
                </button>
                <button className={cn(cls.btn, cls.btnMd, cls.btnDanger)}
                  onClick={() => patchEstado.mutate({ estado: EstadoSiniestro.RECHAZADO })}>
                  Rechazar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LISTADO DE SINIESTROS
══════════════════════════════════════════════════════════ */
function SiniestrosListado() {
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const { data: siniestros = [], isLoading } = useQuery<Siniestro[]>({
    queryKey: ['siniestros'],
    queryFn: () => api.get('/siniestros').then((r) => r.data),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className={cls.pageTitle}>Siniestros</h1>
        <button className={cn(cls.btn, cls.btnMd, cls.btnPrimary)} onClick={() => setShowForm(true)}>
          + Registrar siniestro
        </button>
      </div>

      <motion.div
        className="surface rounded-sm overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <table className={cls.table}>
          <thead>
            <tr>
              <th className={cls.th}>Tipo</th>
              <th className={cls.th}>Asegurado</th>
              <th className={cls.th}>Bien</th>
              <th className={cls.th}>Fecha</th>
              <th className={cls.th}>Compania</th>
              <th className={cls.th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center txt-tertiary text-sm">Cargando...</td></tr>
            )}
            {!isLoading && siniestros.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center txt-tertiary text-sm">Sin siniestros registrados.</td></tr>
            )}
            {siniestros.map((s) => (
              <tr key={s.id} className={cls.trHover}
                onClick={() => navigate(`/siniestros/${s.id}`)}>
                <td className={cn(cls.td, 'font-medium')}>
                  {s.tipo.replace(/_/g, ' ')}
                </td>
                <td className={cls.td}>{s.asegurado.nombre}</td>
                <td className={cls.td}>
                  {s.bien.tipo}
                  {s.bien.patente ? ` (${s.bien.patente})` : ''}
                </td>
                <td className={cls.td}>{formatDate(s.fechaOcurrencia)}</td>
                <td className={cls.td}>{s.compania.nombre}</td>
                <td className={cls.td}>
                  <span className={cn(cls.badge, estadoSiniestroBadge[s.estado])}>
                    {ESTADO_LABEL[s.estado]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {showForm && <SiniestroForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROUTER INTERNO
══════════════════════════════════════════════════════════ */
export default function SiniestrosPage() {
  const { id } = useParams<{ id?: string }>();
  return id ? <SiniestroDetalle id={id} /> : <SiniestrosListado />;
}
