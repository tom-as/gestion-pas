import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
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
import CommentThread from '@/components/CommentThread';

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

/* ── Iconos de tipo de siniestro ────────────────────────── */
const TIPO_META: Record<TipoSiniestro, { label: string; icon: React.ReactNode; color: string }> = {
  [TipoSiniestro.COLISION]:        { label: 'Colisión',           color: '#4a8cff', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17h2l1-4h12l1 4h2"/><path d="M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0M15 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/><path d="M5 13V9a1 1 0 0 1 1-1h4l3 5"/><path d="M13 8h4l2 5"/></svg> },
  [TipoSiniestro.ROBO_TOTAL]:      { label: 'Robo total',         color: '#e05050', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
  [TipoSiniestro.ROBO_AUTOPARTES]: { label: 'Robo autopartes',    color: '#f0a020', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> },
  [TipoSiniestro.HOGAR]:           { label: 'Hogar',              color: '#10c97a', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg> },
  [TipoSiniestro.VIDA]:            { label: 'Vida',               color: '#c084fc', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg> },
  [TipoSiniestro.OTRO]:            { label: 'Otro',               color: '#7090c8', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> },
};

/* ── Sección visual del formulario ──────────────────────── */
function FormSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-faint)' }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)', marginLeft: 4 }} />
      </div>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   FORMULARIO ALTA SINIESTRO
══════════════════════════════════════════════════════════ */
function SiniestroForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const fixedAseguradoId = user?.aseguradoId ?? null;
  const fixedProductorId = user?.productorId ?? null;

  const [serverError, setServerError] = useState<string | null>(null);
  const [zonasAfectadas, setZonasAfectadas] = useState<string[]>([]);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        tipo: TipoSiniestro.COLISION,
        aseguradoId: fixedAseguradoId ?? '',
        productorId: fixedProductorId ?? '',
      },
    });

  const { data: propioAsegurado } = useQuery<Ref & { productor?: Ref }>({
    queryKey: ['asegurado-propio', fixedAseguradoId],
    queryFn: () => api.get(`/asegurados/${fixedAseguradoId}`).then((r) => r.data),
    enabled: !!fixedAseguradoId,
  });

  useEffect(() => {
    if (propioAsegurado?.productor?.id) {
      setValue('productorId', propioAsegurado.productor.id);
    }
  }, [propioAsegurado, setValue]);

  const { data: asegurados = [] } = useQuery<(Ref & { productor?: Ref })[]>({
    queryKey: ['asegurados'],
    queryFn: () => api.get('/asegurados').then((r) => r.data),
    enabled: !fixedAseguradoId,
  });

  const { data: productores = [] } = useQuery<Ref[]>({
    queryKey: ['productores'],
    queryFn: () => api.get('/productores').then((r) => r.data),
    enabled: !fixedAseguradoId && !fixedProductorId,
  });

  const { data: companias = [] } = useQuery<Ref[]>({
    queryKey: ['companias'],
    queryFn: () => api.get('/companias').then((r) => r.data),
  });

  const aseguradoSeleccionado = watch('aseguradoId');
  const tipoActual = watch('tipo');
  const tipoMeta = TIPO_META[tipoActual];

  useEffect(() => {
    if (!fixedAseguradoId && !fixedProductorId && aseguradoSeleccionado) {
      const found = asegurados.find((a) => a.id === aseguradoSeleccionado);
      if (found?.productor?.id) setValue('productorId', found.productor.id);
    }
  }, [aseguradoSeleccionado, asegurados, fixedAseguradoId, fixedProductorId, setValue]);

  useEffect(() => {
    if (!fixedAseguradoId && fixedProductorId && aseguradoSeleccionado) {
      setValue('productorId', fixedProductorId);
    }
  }, [aseguradoSeleccionado, fixedAseguradoId, fixedProductorId, setValue]);

  const efectivoAseguradoId = fixedAseguradoId ?? aseguradoSeleccionado;
  const { data: bienes = [] } = useQuery<BienRef[]>({
    queryKey: ['bienes-form', efectivoAseguradoId],
    queryFn: () => api.get(`/bienes/asegurado/${efectivoAseguradoId}`).then((r) => r.data),
    enabled: !!efectivoAseguradoId,
  });

  useEffect(() => { setValue('bienId', ''); }, [efectivoAseguradoId, setValue]);

  const esAutoSiniestro = tipoActual === TipoSiniestro.COLISION ||
    tipoActual === TipoSiniestro.ROBO_TOTAL ||
    tipoActual === TipoSiniestro.ROBO_AUTOPARTES;

  const mutation = useMutation({
    mutationFn: (data: FormValues) => api.post('/siniestros', { ...data, zonasAfectadas }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['siniestros'] }); onClose(); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg ?? 'Ocurrió un error. Intentá de nuevo.');
    },
  });

  return (
    <div className={cls.overlay}>
      <motion.div
        className={cn(cls.modal, cls.modalLg)}
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* ── Header con acento de color por tipo ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          background: `linear-gradient(135deg, color-mix(in srgb, ${tipoMeta.color} 8%, transparent), transparent)`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: `color-mix(in srgb, ${tipoMeta.color} 14%, transparent)`,
              border: `1px solid color-mix(in srgb, ${tipoMeta.color} 30%, transparent)`,
              color: tipoMeta.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}>
              {tipoMeta.icon}
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>Registrar siniestro</p>
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 1 }}>{tipoMeta.label}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, lineHeight: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-faint)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Selector de tipo — pills ── */}
        <div style={{ padding: '14px 24px 0', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 14 }}>
            {(Object.entries(TIPO_META) as [TipoSiniestro, typeof TIPO_META[TipoSiniestro]][]).map(([val, meta]) => {
              const active = tipoActual === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setValue('tipo', val as TipoSiniestro)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 11px', borderRadius: 20,
                    fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    background: active ? `color-mix(in srgb, ${meta.color} 16%, transparent)` : 'var(--surface-panel)',
                    border: `1px solid ${active ? `color-mix(in srgb, ${meta.color} 40%, transparent)` : 'var(--border-subtle)'}`,
                    color: active ? meta.color : 'var(--text-faint)',
                  }}
                >
                  <span style={{ lineHeight: 0, opacity: active ? 1 : 0.6 }}>
                    {React.cloneElement(meta.icon as React.ReactElement<React.SVGProps<SVGSVGElement>>, { width: 13, height: 13 })}
                  </span>
                  {meta.label}
                </button>
              );
            })}
          </div>
          <input type="hidden" {...register('tipo')} />
        </div>

        {/* ── Body scrollable ── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>

            {/* §1 Cuándo y dónde */}
            <FormSection
              title="Cuándo y dónde"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Field label="Fecha de ocurrencia *" error={errors.fechaOcurrencia?.message}>
                  <input type="date" className={cn(cls.input, errors.fechaOcurrencia ? cls.inputError : '')} {...register('fechaOcurrencia')} />
                </Field>
                <Field label="Hora (HH:MM)" error={errors.horaOcurrencia?.message}>
                  <input className={cls.input} placeholder="14:30" {...register('horaOcurrencia')} />
                </Field>
                <Field label="Lugar de ocurrencia" full>
                  <input className={cls.input} placeholder="Av. General Paz y Acceso Oeste" {...register('lugarOcurrencia')} />
                </Field>
              </div>
            </FormSection>

            {/* §2 Relato */}
            <FormSection
              title="Relato del hecho"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
            >
              <div className="grid grid-cols-1 gap-3">
                <Field label="Descripción del siniestro">
                  <textarea
                    className={cls.textarea}
                    rows={3}
                    placeholder="Describí brevemente cómo ocurrió el hecho..."
                    {...register('relato')}
                  />
                </Field>
                <Field label="Datos de terceros involucrados">
                  <textarea
                    className={cls.textarea}
                    rows={2}
                    placeholder="Nombre, patente, compañía de seguro..."
                    {...register('datosTerceros')}
                  />
                </Field>
                <Field label="N° denuncia en compañía">
                  <input className={cls.input} placeholder="Ej: 2024-00123" {...register('numeroDenunciaCompania')} />
                </Field>
              </div>
            </FormSection>

            {/* §3 Partes */}
            <FormSection
              title="Partes involucradas"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {fixedAseguradoId ? (
                  <>
                    <input type="hidden" {...register('aseguradoId')} />
                    <Field label="Asegurado">
                      <input className={cn(cls.input, 'opacity-70 cursor-not-allowed')} readOnly value={propioAsegurado?.nombre ?? 'Cargando...'} />
                    </Field>
                    <input type="hidden" {...register('productorId')} />
                    <Field label="Productor">
                      <input className={cn(cls.input, 'opacity-70 cursor-not-allowed')} readOnly value={propioAsegurado?.productor?.nombre ?? 'Cargando...'} />
                    </Field>
                  </>
                ) : fixedProductorId ? (
                  <>
                    <Field label="Asegurado *" error={errors.aseguradoId?.message}>
                      <select className={cn(cls.select, errors.aseguradoId ? cls.inputError : '')} {...register('aseguradoId')}>
                        <option value="">Seleccionar...</option>
                        {asegurados.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                      </select>
                    </Field>
                    <input type="hidden" {...register('productorId')} />
                    <Field label="Productor">
                      <input className={cn(cls.input, 'opacity-70 cursor-not-allowed')} readOnly
                        value={asegurados.find((a) => a.id === aseguradoSeleccionado)?.productor?.nombre ?? '—'} />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Asegurado *" error={errors.aseguradoId?.message}>
                      <select className={cn(cls.select, errors.aseguradoId ? cls.inputError : '')} {...register('aseguradoId')}>
                        <option value="">Seleccionar...</option>
                        {asegurados.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                      </select>
                    </Field>
                    <Field label="Productor *" error={errors.productorId?.message}>
                      <select className={cn(cls.select, errors.productorId ? cls.inputError : '')} {...register('productorId')}>
                        <option value="">Seleccionar...</option>
                        {productores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                    </Field>
                  </>
                )}

                <Field label="Bien afectado *" error={errors.bienId?.message} full>
                  <select className={cn(cls.select, errors.bienId ? cls.inputError : '')} {...register('bienId')}
                    disabled={!efectivoAseguradoId}>
                    <option value="">{efectivoAseguradoId ? 'Seleccionar...' : 'Seleccioná un asegurado primero'}</option>
                    {bienes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.tipo}{b.marca ? ` · ${b.marca} ${b.modelo ?? ''}` : ''}{b.patente ? ` (${b.patente})` : ''}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Compañía aseguradora *" error={errors.companiaId?.message}>
                  <select className={cn(cls.select, errors.companiaId ? cls.inputError : '')} {...register('companiaId')}>
                    <option value="">Seleccionar...</option>
                    {companias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </Field>
              </div>
            </FormSection>

            {/* §4 Silueta — solo automotor */}
            {esAutoSiniestro && (
              <FormSection
                title="Zonas de daño del vehículo"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
              >
                <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 10 }}>
                  Hacé clic sobre las zonas afectadas para marcarlas.
                </p>
                <VehiculoSilueta zonasSeleccionadas={zonasAfectadas} onChange={setZonasAfectadas} />
              </FormSection>
            )}

            {/* Error del servidor */}
            {serverError && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 6, marginBottom: 16,
                background: 'rgba(224,80,80,0.08)', border: '1px solid rgba(224,80,80,0.22)',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e05050" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ fontSize: 13, color: '#e05050' }}>{serverError}</span>
              </div>
            )}

            {/* Footer */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 10,
              paddingTop: 16, borderTop: '1px solid var(--border-subtle)',
            }}>
              <button type="button" className={cn(cls.btn, cls.btnMd, cls.btnSecond)} onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className={cn(cls.btn, cls.btnMd, cls.btnPrimary)} disabled={isSubmitting}>
                {isSubmitting
                  ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Guardando...</>
                  : <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Registrar siniestro
                    </>
                }
              </button>
            </div>
          </form>
        </div>
      </motion.div>
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
          <DR label="Asegurado" value={
            <Link to={`/asegurados/${siniestro.asegurado.id}`} className="text-accent-400 hover:underline">
              {siniestro.asegurado.nombre}
            </Link>
          } />
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

      {/* Hilo de comentarios */}
      <CommentThread
        entidad="siniestros"
        entidadId={id}
        nombreAsegurado={siniestro.asegurado.nombre}
        nombreProductor={siniestro.productor.nombre}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LISTADO DE SINIESTROS
══════════════════════════════════════════════════════════ */
function SiniestrosListado() {
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filtroAseguradoId = searchParams.get('asegurado');

  const { data: siniestros = [], isLoading } = useQuery<Siniestro[]>({
    queryKey: ['siniestros'],
    queryFn: () => api.get('/siniestros').then((r) => r.data),
  });

  const rows = filtroAseguradoId
    ? siniestros.filter((s) => s.asegurado.id === filtroAseguradoId)
    : siniestros;

  const nombreAsegurado = filtroAseguradoId
    ? (siniestros.find((s) => s.asegurado.id === filtroAseguradoId)?.asegurado.nombre ?? '')
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={cls.pageTitle}>Siniestros</h1>
          {nombreAsegurado && (
            <p className="text-sm txt-faint mt-0.5">
              Filtrando por:{' '}
              <span className="text-accent-400 font-medium">{nombreAsegurado}</span>
              {' · '}
              <button
                onClick={() => navigate('/siniestros')}
                className="text-xs txt-faint hover:txt-primary underline underline-offset-2"
              >
                Ver todos
              </button>
            </p>
          )}
        </div>
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
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center txt-tertiary text-sm">
                {filtroAseguradoId ? 'Este asegurado no tiene siniestros registrados.' : 'Sin siniestros registrados.'}
              </td></tr>
            )}
            {rows.map((s) => (
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
