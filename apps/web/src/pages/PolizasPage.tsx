import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/format';
import { EstadoPoliza } from '@gestion-pas/types';
import { cn, cls, estadoPolicaBadge, estadoCuotaBadge } from '@/lib/cn';

/* ── Tipos ──────────────────────────────────────────────── */
interface Ref { id: string; nombre: string }
interface Poliza {
  id: string; numeroPoliza: string; estado: EstadoPoliza;
  vigenciaInicio: string; vigenciaFin: string;
  importeCuotaVigente: number; modalidadPago: string | null;
  periodicidadRefacturacion: string | null;
  asegurado: Ref; bien: BienRef; productor: Ref; compania: Ref;
}
interface BienRef { id: string; tipo: string; patente?: string | null; marca?: string | null; modelo?: string | null }
interface Endoso { id: string; numeroEndoso: string; tipoModificacion: string; fechaEmision: string; importeActualizado: number | null }
interface Cuota { id: string; numeroCuota: number; importe: number; fechaVencimiento: string; estado: string; fechaPagoEfectivo: string | null }

/* ── Schema alta poliza ──────────────────────────────────── */
const schema = z.object({
  numeroPoliza: z.string().min(1, 'Requerido'),
  vigenciaInicio: z.string().min(1, 'Requerido'),
  vigenciaFin: z.string().min(1, 'Requerido'),
  importeCuotaVigente: z.coerce.number().min(0, 'Requerido'),
  modalidadPago: z.string().optional(),
  periodicidadRefacturacion: z.string().optional(),
  aseguradoId: z.string().uuid('Requerido'),
  bienId: z.string().uuid('Requerido'),
  productorId: z.string().uuid('Requerido'),
  companiaId: z.string().uuid('Requerido'),
});
type FormValues = z.infer<typeof schema>;

/* ── Schema endoso ───────────────────────────────────────── */
const endosoSchema = z.object({
  numeroEndoso: z.string().min(1, 'Requerido'),
  tipoModificacion: z.string().min(1, 'Requerido'),
  fechaEmision: z.string().min(1, 'Requerido'),
  importeActualizado: z.coerce.number().optional(),
  sumaAseguradaActualizada: z.coerce.number().optional(),
});
type EndosoValues = z.infer<typeof endosoSchema>;

/* ── Schema cuota ────────────────────────────────────────── */
const cuotaSchema = z.object({
  numeroCuota: z.coerce.number().min(1, 'Requerido'),
  importe: z.coerce.number().min(0, 'Requerido'),
  fechaVencimiento: z.string().min(1, 'Requerido'),
});
type CuotaValues = z.infer<typeof cuotaSchema>;

/* ── Shared modal helpers ───────────────────────────────── */
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
   FORMULARIO ALTA POLIZA
══════════════════════════════════════════════════════════ */
function PolizaForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: asegurados = [] } = useQuery<Ref[]>({
    queryKey: ['asegurados'], queryFn: () => api.get('/asegurados').then((r) => r.data),
  });
  const { data: productores = [] } = useQuery<Ref[]>({
    queryKey: ['productores'], queryFn: () => api.get('/productores').then((r) => r.data),
  });
  const { data: companias = [] } = useQuery<Ref[]>({
    queryKey: ['companias'], queryFn: () => api.get('/companias').then((r) => r.data),
  });
  const { data: bienes = [] } = useQuery<BienRef[]>({
    queryKey: ['bienes'], queryFn: () => api.get('/bienes').then((r) => r.data),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => api.post('/polizas', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['polizas'] }); onClose(); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg ?? 'Ocurrio un error.');
    },
  });

  return (
    <div className={cls.overlay}>
      <div className={cn(cls.modal, cls.modalLg)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <span className="text-base font-semibold text-slate-800 dark:text-slate-200">Nueva poliza</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Numero de poliza *" error={errors.numeroPoliza?.message} full>
                <input className={cn(cls.input, errors.numeroPoliza ? cls.inputError : '')} {...register('numeroPoliza')} />
              </Field>

              <Field label="Vigencia inicio *">
                <input type="date" className={cls.input} {...register('vigenciaInicio')} />
              </Field>
              <Field label="Vigencia fin *">
                <input type="date" className={cls.input} {...register('vigenciaFin')} />
              </Field>

              <Field label="Importe cuota *" error={errors.importeCuotaVigente?.message}>
                <input type="number" className={cn(cls.input, errors.importeCuotaVigente ? cls.inputError : '')} {...register('importeCuotaVigente')} />
              </Field>
              <Field label="Modalidad de pago">
                <input className={cls.input} placeholder="debito automatico, efectivo..." {...register('modalidadPago')} />
              </Field>

              <Field label="Periodicidad refacturacion">
                <select className={cls.select} {...register('periodicidadRefacturacion')}>
                  <option value="">Sin periodicidad</option>
                  <option value="mensual">Mensual</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </Field>
              <div />

              <Field label="Asegurado *" error={errors.aseguradoId?.message} full>
                <select className={cn(cls.select, errors.aseguradoId ? cls.inputError : '')} {...register('aseguradoId')}>
                  <option value="">Seleccionar…</option>
                  {asegurados.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </Field>

              <Field label="Bien asegurado *" error={errors.bienId?.message}>
                <select className={cn(cls.select, errors.bienId ? cls.inputError : '')} {...register('bienId')}>
                  <option value="">Seleccionar…</option>
                  {bienes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.tipo} {b.marca ? `- ${b.marca} ${b.modelo ?? ''}` : ''} {b.patente ? `(${b.patente})` : ''}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Productor *" error={errors.productorId?.message}>
                <select className={cn(cls.select, errors.productorId ? cls.inputError : '')} {...register('productorId')}>
                  <option value="">Seleccionar…</option>
                  {productores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </Field>

              <Field label="Compania aseguradora *" error={errors.companiaId?.message} full>
                <select className={cn(cls.select, errors.companiaId ? cls.inputError : '')} {...register('companiaId')}>
                  <option value="">Seleccionar…</option>
                  {companias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </Field>
            </div>

            {serverError && <p className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">{serverError}</p>}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button type="button" className={cn(cls.btn, cls.btnMd, cls.btnSecond)} onClick={onClose}>Cancelar</button>
              <button type="submit" className={cn(cls.btn, cls.btnMd, cls.btnPrimary)} disabled={isSubmitting}>
                {isSubmitting ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   FORMULARIO ENDOSO
══════════════════════════════════════════════════════════ */
function EndosoForm({ polizaId, onClose }: { polizaId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<EndosoValues>({ resolver: zodResolver(endosoSchema) });

  const mutation = useMutation({
    mutationFn: (data: EndosoValues) => api.post(`/polizas/${polizaId}/endosos`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['endosos', polizaId] }); onClose(); },
    onError: (err: unknown) => {
      setServerError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error.');
    },
  });

  return (
    <div className={cls.overlay}>
      <div className={cn(cls.modal, cls.modalMd)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <span className="text-base font-semibold text-slate-800 dark:text-slate-200">Registrar endoso</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="px-6 py-5">
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Numero de endoso *" error={errors.numeroEndoso?.message}>
                <input className={cn(cls.input, errors.numeroEndoso ? cls.inputError : '')} {...register('numeroEndoso')} />
              </Field>
              <Field label="Fecha de emision *">
                <input type="date" className={cls.input} {...register('fechaEmision')} />
              </Field>
              <Field label="Tipo de modificacion *" error={errors.tipoModificacion?.message} full>
                <input className={cn(cls.input, errors.tipoModificacion ? cls.inputError : '')} {...register('tipoModificacion')} />
              </Field>
              <Field label="Nuevo importe de cuota">
                <input type="number" className={cls.input} {...register('importeActualizado')} />
              </Field>
              <Field label="Nueva suma asegurada">
                <input type="number" className={cls.input} {...register('sumaAseguradaActualizada')} />
              </Field>
            </div>
            {serverError && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{serverError}</p>}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button type="button" className={cn(cls.btn, cls.btnMd, cls.btnSecond)} onClick={onClose}>Cancelar</button>
              <button type="submit" className={cn(cls.btn, cls.btnMd, cls.btnPrimary)} disabled={isSubmitting}>
                {isSubmitting ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   FORMULARIO CUOTA
══════════════════════════════════════════════════════════ */
function CuotaForm({ polizaId, onClose }: { polizaId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<CuotaValues>({ resolver: zodResolver(cuotaSchema) });

  const mutation = useMutation({
    mutationFn: (data: CuotaValues) => api.post('/cuotas', { ...data, polizaId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cuotas', polizaId] }); onClose(); },
    onError: (err: unknown) => {
      setServerError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error.');
    },
  });

  return (
    <div className={cls.overlay}>
      <div className={cn(cls.modal, cls.modalSm)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <span className="text-base font-semibold text-slate-800 dark:text-slate-200">Nueva cuota</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="px-6 py-5">
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
            <div className="flex flex-col gap-4">
              <Field label="Numero de cuota *" error={errors.numeroCuota?.message}>
                <input type="number" className={cn(cls.input, errors.numeroCuota ? cls.inputError : '')} {...register('numeroCuota')} />
              </Field>
              <Field label="Importe *" error={errors.importe?.message}>
                <input type="number" className={cn(cls.input, errors.importe ? cls.inputError : '')} {...register('importe')} />
              </Field>
              <Field label="Fecha de vencimiento *">
                <input type="date" className={cls.input} {...register('fechaVencimiento')} />
              </Field>
            </div>
            {serverError && <p className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">{serverError}</p>}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button type="button" className={cn(cls.btn, cls.btnMd, cls.btnSecond)} onClick={onClose}>Cancelar</button>
              <button type="submit" className={cn(cls.btn, cls.btnMd, cls.btnPrimary)} disabled={isSubmitting}>
                {isSubmitting ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Detail row helper ──────────────────────────────────── */
function DR({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-700 dark:text-slate-300 text-right">{value}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   VISTA DETALLE DE POLIZA
══════════════════════════════════════════════════════════ */
function PolizaDetalle({ id }: { id: string }) {
  const [showEndoso, setShowEndoso] = useState(false);
  const [showCuota, setShowCuota] = useState(false);
  const qc = useQueryClient();

  const { data: poliza, isLoading } = useQuery<Poliza>({
    queryKey: ['poliza', id],
    queryFn: () => api.get(`/polizas/${id}`).then((r) => r.data),
  });
  const { data: endosos = [] } = useQuery<Endoso[]>({
    queryKey: ['endosos', id],
    queryFn: () => api.get(`/polizas/${id}/endosos`).then((r) => r.data),
  });
  const { data: cuotas = [] } = useQuery<Cuota[]>({
    queryKey: ['cuotas', id],
    queryFn: () => api.get(`/cuotas?polizaId=${id}`).then((r) => r.data),
  });

  const patchEstado = useMutation({
    mutationFn: (estado: EstadoPoliza) => api.patch(`/polizas/${id}`, { estado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['poliza', id] }),
  });

  const patchCuota = useMutation({
    mutationFn: ({ cuotaId, estado }: { cuotaId: string; estado: string }) =>
      api.patch(`/cuotas/${cuotaId}`, { estado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cuotas', id] }),
  });

  if (isLoading) return <p className="py-10 text-center text-slate-400 text-sm">Cargando...</p>;
  if (!poliza) return <p className="py-10 text-center text-slate-400 text-sm">Poliza no encontrada.</p>;

  return (
    <div>
      <Link to="/polizas" className="inline-block mb-4 text-sm text-brand-600 hover:text-brand-700 font-medium">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1"><polyline points="15 18 9 12 15 6"/></svg>Volver a pólizas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <h1 className={cls.pageTitle}>{poliza.numeroPoliza}</h1>
        <div className="flex items-center gap-2">
          <span className={cn(cls.badge, estadoPolicaBadge[poliza.estado])}>
            {poliza.estado}
          </span>
          {poliza.estado === EstadoPoliza.ACTIVA && (
            <button className={cn(cls.btn, cls.btnSm, cls.btnSecond)}
              onClick={() => patchEstado.mutate(EstadoPoliza.SUSPENDIDA)}>
              Suspender
            </button>
          )}
          {poliza.estado === EstadoPoliza.SUSPENDIDA && (
            <button className={cn(cls.btn, cls.btnSm, cls.btnSecond)}
              onClick={() => patchEstado.mutate(EstadoPoliza.ACTIVA)}>
              Reactivar
            </button>
          )}
        </div>
      </div>

      {/* Datos principales */}
      <div className={cn(cls.cardPad, 'mb-5')}>
        <h2 className={cn(cls.sectionTitle, 'mb-4')}>Datos de la poliza</h2>
        <div>
          <DR label="Asegurado" value={poliza.asegurado.nombre} />
          <DR label="Bien asegurado" value={
            <>
              {poliza.bien.tipo}
              {poliza.bien.marca ? ` — ${poliza.bien.marca} ${poliza.bien.modelo ?? ''}` : ''}
              {poliza.bien.patente ? ` (${poliza.bien.patente})` : ''}
            </>
          } />
          <DR label="Compania" value={poliza.compania.nombre} />
          <DR label="Productor" value={poliza.productor.nombre} />
          <DR label="Vigencia" value={`${formatDate(poliza.vigenciaInicio)} – ${formatDate(poliza.vigenciaFin)}`} />
          <DR label="Cuota vigente" value={formatMoney(poliza.importeCuotaVigente)} />
          <DR label="Modalidad de pago" value={poliza.modalidadPago ?? '—'} />
          <DR label="Periodicidad" value={poliza.periodicidadRefacturacion ?? '—'} />
        </div>
      </div>

      {/* Endosos */}
      <div className={cn(cls.cardPad, 'mb-5')}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={cls.sectionTitle}>Endosos ({endosos.length})</h2>
          <button className={cn(cls.btn, cls.btnSm, cls.btnSecond)} onClick={() => setShowEndoso(true)}>
            + Agregar endoso
          </button>
        </div>
        {endosos.length === 0
          ? <p className="text-sm text-slate-400">Sin endosos registrados.</p>
          : (
            <table className={cls.table}>
              <thead>
                <tr>
                  <th className={cls.th}>Numero</th>
                  <th className={cls.th}>Tipo</th>
                  <th className={cls.th}>Fecha</th>
                  <th className={cls.th}>Nuevo importe</th>
                </tr>
              </thead>
              <tbody>
                {endosos.map((e) => (
                  <tr key={e.id}>
                    <td className={cls.td}>{e.numeroEndoso}</td>
                    <td className={cls.td}>{e.tipoModificacion}</td>
                    <td className={cls.td}>{formatDate(e.fechaEmision)}</td>
                    <td className={cls.td}>{formatMoney(e.importeActualizado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>

      {/* Cuotas */}
      <div className={cls.cardPad}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={cls.sectionTitle}>Cuotas ({cuotas.length})</h2>
          <button className={cn(cls.btn, cls.btnSm, cls.btnSecond)} onClick={() => setShowCuota(true)}>
            + Agregar cuota
          </button>
        </div>
        {cuotas.length === 0
          ? <p className="text-sm text-slate-400">Sin cuotas registradas.</p>
          : (
            <table className={cls.table}>
              <thead>
                <tr>
                  <th className={cls.th}>#</th>
                  <th className={cls.th}>Importe</th>
                  <th className={cls.th}>Vencimiento</th>
                  <th className={cls.th}>Estado</th>
                  <th className={cls.th}></th>
                </tr>
              </thead>
              <tbody>
                {cuotas.map((c) => (
                  <tr key={c.id}>
                    <td className={cls.td}>{c.numeroCuota}</td>
                    <td className={cls.td}>{formatMoney(c.importe)}</td>
                    <td className={cls.td}>{formatDate(c.fechaVencimiento)}</td>
                    <td className={cls.td}>
                      <span className={cn(cls.badge, estadoCuotaBadge[c.estado] ?? cls.badgeGray)}>
                        {c.estado}
                      </span>
                    </td>
                    <td className={cls.td}>
                      {c.estado === 'pendiente' && (
                        <button
                          className={cn(cls.btn, cls.btnSm, cls.btnSecond)}
                          onClick={() => patchCuota.mutate({ cuotaId: c.id, estado: 'pagada' })}
                        >
                          Marcar pagada
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>

      {showEndoso && <EndosoForm polizaId={id} onClose={() => setShowEndoso(false)} />}
      {showCuota && <CuotaForm polizaId={id} onClose={() => setShowCuota(false)} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LISTADO DE POLIZAS
══════════════════════════════════════════════════════════ */
function PolizasListado() {
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const { data: polizas = [], isLoading } = useQuery<Poliza[]>({
    queryKey: ['polizas'],
    queryFn: () => api.get('/polizas').then((r) => r.data),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className={cls.pageTitle}>Polizas</h1>
        <button className={cn(cls.btn, cls.btnMd, cls.btnPrimary)} onClick={() => setShowForm(true)}>
          + Nueva poliza
        </button>
      </div>

      <div className={cn(cls.card, 'overflow-hidden')}>
        <table className={cls.table}>
          <thead>
            <tr>
              <th className={cls.th}>Numero</th>
              <th className={cls.th}>Asegurado</th>
              <th className={cls.th}>Compania</th>
              <th className={cls.th}>Vigencia fin</th>
              <th className={cls.th}>Cuota vigente</th>
              <th className={cls.th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">Cargando...</td></tr>
            )}
            {!isLoading && polizas.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">Sin polizas registradas.</td></tr>
            )}
            {polizas.map((p) => (
              <tr key={p.id} className={cls.trHover} onClick={() => navigate(`/polizas/${p.id}`)}>
                <td className={cn(cls.td, 'font-medium text-brand-600')}>{p.numeroPoliza}</td>
                <td className={cls.td}>{p.asegurado.nombre}</td>
                <td className={cls.td}>{p.compania.nombre}</td>
                <td className={cls.td}>{formatDate(p.vigenciaFin)}</td>
                <td className={cls.td}>{formatMoney(p.importeCuotaVigente)}</td>
                <td className={cls.td}>
                  <span className={cn(cls.badge, estadoPolicaBadge[p.estado])}>
                    {p.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && <PolizaForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROUTER INTERNO: listado o detalle
══════════════════════════════════════════════════════════ */
export default function PolizasPage() {
  const { id } = useParams<{ id?: string }>();
  return id ? <PolizaDetalle id={id} /> : <PolizasListado />;
}
