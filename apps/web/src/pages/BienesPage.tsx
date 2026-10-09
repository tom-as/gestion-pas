import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { TipoBien } from '@gestion-pas/types';
import { cn, cls, tipoBienBadge } from '@/lib/cn';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@gestion-pas/types';
import { motion } from 'framer-motion';

/* ── Tipos ──────────────────────────────────────────────── */
interface Bien {
  id: string; tipo: TipoBien; sumaAsegurada: number | null;
  patente: string | null; marca: string | null; modelo: string | null;
  version: string | null; anioFabricacion: number | null;
  tieneGnc: boolean | null; uso: string | null;
  asegurado?: { id: string; nombre: string };
}
interface Asegurado { id: string; nombre: string }

/* ── Schema alta ─────────────────────────────────────────── */
const baseSchema = z.object({
  tipo: z.nativeEnum(TipoBien),
  sumaAsegurada: z.coerce.number().min(0, 'Requerida').optional(),
  aseguradoId: z.string().uuid('Selecciona un asegurado'),
  patente: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  version: z.string().optional(),
  anioFabricacion: z.coerce.number().min(1900).max(2100).optional(),
  tieneGnc: z.boolean().optional(),
  uso: z.string().optional(),
});
type FormValues = z.infer<typeof baseSchema>;

/* ── Formulario modal ────────────────────────────────────── */
function BienForm({
  onClose,
  asegurados,
  defaultAseguradoId,
}: {
  onClose: () => void;
  asegurados: Asegurado[];
  defaultAseguradoId?: string;
}) {
  const qc = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(baseSchema),
      defaultValues: { tipo: TipoBien.AUTOMOTOR, aseguradoId: defaultAseguradoId ?? '' },
    });

  const tipo = useWatch({ control, name: 'tipo' });
  const isAuto = tipo === TipoBien.AUTOMOTOR;

  const mutation = useMutation({
    mutationFn: (data: FormValues) => api.post('/bienes', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bienes'] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setServerError(msg ?? 'Ocurrió un error. Intentá de nuevo.');
    },
  });

  return (
    <div className={cls.overlay}>
      <div className={cn(cls.modal, cls.modalMd, '!rounded-md')}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
          <span className="text-base font-semibold txt-primary">Nuevo bien asegurado</span>
          <button onClick={onClose} className="txt-faint hover:txt-primary transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className={cls.label}>Tipo de bien *</label>
                <select className={cn(cls.select, '!rounded-sm')} {...register('tipo')}>
                  <option value={TipoBien.AUTOMOTOR}>Automotor</option>
                  <option value={TipoBien.HOGAR}>Hogar</option>
                  <option value={TipoBien.VIDA}>Vida</option>
                  <option value={TipoBien.OTRO}>Otro</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className={cls.label}>Suma asegurada</label>
                <input type="number" className={cn(cls.input, '!rounded-sm')} {...register('sumaAsegurada')} />
              </div>

              <div className="flex flex-col gap-1 col-span-2">
                <label className={cls.label}>Asegurado titular *</label>
                {defaultAseguradoId ? (
                  <>
                    <input type="hidden" {...register('aseguradoId')} />
                    <input
                      className={cn(cls.input, '!rounded-sm opacity-70 cursor-not-allowed')}
                      readOnly
                      value={asegurados.find((a) => a.id === defaultAseguradoId)?.nombre ?? 'Cargando...'}
                    />
                  </>
                ) : (
                  <>
                    <select
                      className={cn(cls.select, '!rounded-sm', errors.aseguradoId ? cls.inputError : '')}
                      {...register('aseguradoId')}
                    >
                      <option value="">Seleccionar…</option>
                      {asegurados.map((a) => (
                        <option key={a.id} value={a.id}>{a.nombre}</option>
                      ))}
                    </select>
                    {errors.aseguradoId && <span className="text-xs text-red-500 mt-0.5">{errors.aseguradoId.message}</span>}
                  </>
                )}
              </div>

              {isAuto && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className={cls.label}>Patente</label>
                    <input className={cn(cls.input, '!rounded-sm')} placeholder="AB123CD" {...register('patente')} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={cls.label}>Año de fabricación</label>
                    <input type="number" className={cn(cls.input, '!rounded-sm')} placeholder="2021" {...register('anioFabricacion')} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={cls.label}>Marca</label>
                    <input className={cn(cls.input, '!rounded-sm')} placeholder="Peugeot" {...register('marca')} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={cls.label}>Modelo</label>
                    <input className={cn(cls.input, '!rounded-sm')} placeholder="208" {...register('modelo')} />
                  </div>
                  <div className="flex flex-col gap-1 col-span-2">
                    <label className={cls.label}>Versión</label>
                    <input className={cn(cls.input, '!rounded-sm')} placeholder="Active 1.2 PureTech" {...register('version')} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={cls.label}>Uso</label>
                    <select className={cn(cls.select, '!rounded-sm')} {...register('uso')}>
                      <option value="">Seleccionar…</option>
                      <option value="particular">Particular</option>
                      <option value="comercial">Comercial</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm txt-secondary cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded accent-brand-600" {...register('tieneGnc')} />
                      Tiene GNC
                    </label>
                  </div>
                </>
              )}
            </div>

            {serverError && (
              <p className="mt-3 text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded px-3 py-2">{serverError}</p>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/6">
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

/* ════════════════════════════════════════════════════════════
   Página principal
════════════════════════════════════════════════════════════ */
export default function BienesPage() {
  const { aseguradoId } = useParams<{ aseguradoId?: string }>();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);

  /* Filtros — solo activos en la vista de lista general */
  const [search,          setSearch]          = useState('');
  const [tipoFilter,      setTipoFilter]      = useState('');
  const [aseguradoFilter, setAseguradoFilter] = useState('');

  const isAsegurado = user?.perfil === UserRole.ASEGURADO;
  const canManage   = user?.perfil === UserRole.ORGANIZADOR || user?.perfil === UserRole.PRODUCTOR;

  const ownAseguradoId       = isAsegurado ? (user?.aseguradoId ?? undefined) : undefined;
  const effectiveAseguradoId = aseguradoId ?? ownAseguradoId;

  /* Listado general (org / productor en /bienes) */
  const { data: todosBienes = [], isLoading: loadingTodos } = useQuery<Bien[]>({
    queryKey: ['bienes', 'all'],
    queryFn: () => api.get('/bienes').then((r) => r.data),
    enabled: !effectiveAseguradoId,
  });

  /* Bienes de un asegurado específico */
  const { data: bienesAsegurado = [], isLoading: loadingAsegurado } = useQuery<Bien[]>({
    queryKey: ['bienes', 'asegurado', effectiveAseguradoId],
    queryFn: () => api.get(`/bienes/asegurado/${effectiveAseguradoId}`).then((r) => r.data),
    enabled: !!effectiveAseguradoId,
  });

  /* Asegurados para el selector del formulario y el filtro */
  const { data: asegurados = [] } = useQuery<Asegurado[]>({
    queryKey: ['asegurados'],
    queryFn: () => api.get('/asegurados').then((r) => r.data),
    enabled: canManage,
  });

  const rawBienes = effectiveAseguradoId ? bienesAsegurado : todosBienes;
  const isLoading = effectiveAseguradoId ? loadingAsegurado : loadingTodos;

  /* ── Filtrado client-side (solo en la vista de lista general) ── */
  const bienes = useMemo(() => {
    if (effectiveAseguradoId) return rawBienes; // vista de asegurado: sin filtros adicionales
    let list = rawBienes;
    if (tipoFilter) {
      list = list.filter((b) => b.tipo === tipoFilter);
    }
    if (aseguradoFilter) {
      list = list.filter((b) => b.asegurado?.id === aseguradoFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) =>
        b.patente?.toLowerCase().includes(q) ||
        b.marca?.toLowerCase().includes(q) ||
        b.modelo?.toLowerCase().includes(q) ||
        b.version?.toLowerCase().includes(q) ||
        b.asegurado?.nombre.toLowerCase().includes(q),
      );
    }
    return list;
  }, [rawBienes, tipoFilter, aseguradoFilter, search, effectiveAseguradoId]);

  const hasFilters = !!(search || tipoFilter || aseguradoFilter);

  /* ── Título ── */
  let pageTitle: string;
  if (isAsegurado) {
    pageTitle = 'Mis bienes';
  } else if (aseguradoId) {
    pageTitle = `Bienes de ${asegurados.find((a) => a.id === aseguradoId)?.nombre ?? '...'}`;
  } else {
    pageTitle = 'Lista de bienes';
  }

  const showAseguradoCol = !isAsegurado && !aseguradoId;
  const colSpan = showAseguradoCol ? 4 : 3;

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className={cls.pageTitle}>{pageTitle}</h1>
          {!isLoading && (
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
              {bienes.length} bien{bienes.length !== 1 ? 'es' : ''}
              {hasFilters && rawBienes.length !== bienes.length && ` de ${rawBienes.length}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {aseguradoId && (
            <Link
              to={`/asegurados/${aseguradoId}`}
              className="text-sm text-accent-400 hover:text-accent-300 font-medium"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1"><polyline points="15 18 9 12 15 6"/></svg>
              Volver al asegurado
            </Link>
          )}
          {canManage && (
            <button className={cn(cls.btn, cls.btnMd, cls.btnPrimary)} onClick={() => setShowForm(true)}>
              + Nuevo bien
            </button>
          )}
        </div>
      </div>

      {/* ── Filtros — solo en la vista de lista general ──── */}
      {!effectiveAseguradoId && canManage && (
        <div className="surface rounded-sm p-4">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Búsqueda por texto */}
            <div className="flex flex-col gap-1" style={{ minWidth: 220 }}>
              <label className={cls.label}>Buscar</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none txt-faint">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input
                  className={cn(cls.input, '!rounded-sm pl-8')}
                  placeholder="Patente, marca, modelo, asegurado…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Tipo de bien */}
            <div className="flex flex-col gap-1" style={{ minWidth: 160 }}>
              <label className={cls.label}>Tipo</label>
              <select
                className={cn(cls.select, '!rounded-sm')}
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
              >
                <option value="">Todos los tipos</option>
                <option value={TipoBien.AUTOMOTOR}>Automotor</option>
                <option value={TipoBien.HOGAR}>Hogar</option>
                <option value={TipoBien.VIDA}>Vida</option>
                <option value={TipoBien.OTRO}>Otro</option>
              </select>
            </div>

            {/* Asegurado */}
            <div className="flex flex-col gap-1" style={{ minWidth: 200 }}>
              <label className={cls.label}>Asegurado</label>
              <select
                className={cn(cls.select, '!rounded-sm')}
                value={aseguradoFilter}
                onChange={(e) => setAseguradoFilter(e.target.value)}
              >
                <option value="">Todos los asegurados</option>
                {asegurados.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>

            {/* Limpiar */}
            {hasFilters && (
              <button
                className={cn(cls.btn, cls.btnMd, cls.btnSecond)}
                onClick={() => { setSearch(''); setTipoFilter(''); setAseguradoFilter(''); }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Tabla ─────────────────────────────────────────── */}
      <motion.div
        className="surface rounded-sm overflow-hidden"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <table className={cls.table}>
          <thead>
            <tr>
              <th className={cls.th}>Tipo</th>
              <th className={cls.th}>Descripción</th>
              <th className={cn(cls.th, 'text-right')}>Suma asegurada</th>
              {showAseguradoCol && <th className={cls.th}>Asegurado</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={colSpan} className="px-4 py-8 text-center txt-tertiary text-sm">Cargando...</td></tr>
            )}
            {!isLoading && bienes.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="px-4 py-8 text-center txt-tertiary text-sm">
                  {hasFilters ? 'Sin resultados para los filtros aplicados.' : 'Sin bienes registrados.'}
                </td>
              </tr>
            )}
            {bienes.map((b) => (
              <tr key={b.id} className={cls.trHover}>
                <td className={cls.td}>
                  <span className={cn(cls.badge, tipoBienBadge[b.tipo])}>
                    {b.tipo}
                  </span>
                </td>
                <td className={cls.td}>
                  {b.tipo === TipoBien.AUTOMOTOR ? (
                    <div>
                      <span className="txt-primary text-sm font-medium">
                        {[b.marca, b.modelo].filter(Boolean).join(' ') || '—'}
                      </span>
                      {b.patente && (
                        <span className="ml-2 font-mono text-xs txt-faint">({b.patente})</span>
                      )}
                      {b.anioFabricacion && (
                        <span className="ml-1 text-xs txt-faint">{b.anioFabricacion}</span>
                      )}
                    </div>
                  ) : (
                    <span className="txt-secondary text-sm">{b.tipo}</span>
                  )}
                </td>
                <td className={cn(cls.td, 'text-right tabular-nums font-semibold')}>
                  {formatMoney(b.sumaAsegurada)}
                </td>
                {showAseguradoCol && (
                  <td className={cls.td}>
                    {b.asegurado ? (
                      <Link
                        to={`/asegurados/${b.asegurado.id}`}
                        className="text-accent-400 hover:underline text-sm"
                      >
                        {b.asegurado.nombre}
                      </Link>
                    ) : (
                      <span className="txt-faint">—</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {showForm && canManage && (
        <BienForm
          onClose={() => setShowForm(false)}
          asegurados={asegurados}
          defaultAseguradoId={aseguradoId}
        />
      )}
    </div>
  );
}
