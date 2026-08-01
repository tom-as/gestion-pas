import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { TipoBien } from '@gestion-pas/types';
import { cn, cls, tipoBienBadge } from '@/lib/cn';

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
      setServerError(msg ?? 'Ocurrio un error. Intenta de nuevo.');
    },
  });

  return (
    <div className={cls.overlay}>
      <div className={cn(cls.modal, cls.modalMd, '!rounded-md')}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
          <span className="text-base font-semibold txt-primary">Nuevo bien asegurado</span>
          <button onClick={onClose} className="txt-faint hover:txt-primary transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
            <div className="grid grid-cols-2 gap-4">
              {/* Tipo */}
              <div className="flex flex-col gap-1">
                <label className={cls.label}>Tipo de bien *</label>
                <select className={cn(cls.select, '!rounded-sm')} {...register('tipo')}>
                  <option value={TipoBien.AUTOMOTOR}>Automotor</option>
                  <option value={TipoBien.HOGAR}>Hogar</option>
                  <option value={TipoBien.VIDA}>Vida</option>
                  <option value={TipoBien.OTRO}>Otro</option>
                </select>
              </div>

              {/* Suma asegurada */}
              <div className="flex flex-col gap-1">
                <label className={cls.label}>Suma asegurada</label>
                <input type="number" className={cn(cls.input, '!rounded-sm')} {...register('sumaAsegurada')} />
              </div>

              {/* Asegurado titular */}
              <div className="flex flex-col gap-1 col-span-2">
                <label className={cls.label}>Asegurado titular *</label>
                <select className={cn(cls.select, '!rounded-sm', errors.aseguradoId ? cls.inputError : '')}
                  {...register('aseguradoId')}>
                  <option value="">Seleccionar…</option>
                  {asegurados.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
                {errors.aseguradoId && <span className="text-xs text-red-500 mt-0.5">{errors.aseguradoId.message}</span>}
              </div>

              {/* Campos condicionales automotor */}
              {isAuto && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className={cls.label}>Patente *</label>
                    <input className={cn(cls.input, '!rounded-sm', errors.patente ? cls.inputError : '')}
                      placeholder="AB123CD" {...register('patente')} />
                    {errors.patente && <span className="text-xs text-red-500 mt-0.5">{errors.patente.message}</span>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className={cls.label}>Año de fabricacion</label>
                    <input type="number" className={cn(cls.input, '!rounded-sm')}
                      placeholder="2021" {...register('anioFabricacion')} />
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
                    <label className={cls.label}>Version</label>
                    <input className={cn(cls.input, '!rounded-sm')} placeholder="Active 1.2 PureTech"
                      {...register('version')} />
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

            {serverError && <p className="mt-3 text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded px-3 py-2">{serverError}</p>}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/6">
              <button type="button" className={cn(cls.btn, cls.btnMd, cls.btnSecond)} onClick={onClose}>
                Cancelar
              </button>
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

/* ── Pagina principal ────────────────────────────────────── */
export default function BienesPage() {
  const { aseguradoId } = useParams<{ aseguradoId?: string }>();
  const [showForm, setShowForm] = useState(false);

  const { data: bienes = [], isLoading } = useQuery<Bien[]>({
    queryKey: ['bienes', aseguradoId],
    queryFn: () =>
      api.get(aseguradoId ? `/bienes/asegurado/${aseguradoId}` : '/bienes').then((r) => r.data),
  });

  const { data: asegurados = [] } = useQuery<Asegurado[]>({
    queryKey: ['asegurados'],
    queryFn: () => api.get('/asegurados').then((r) => r.data),
  });

  const pageTitle = aseguradoId
    ? `Bienes de ${asegurados.find((a) => a.id === aseguradoId)?.nombre ?? '...'}`
    : 'Bienes Asegurados';

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className={cls.pageTitle}>{pageTitle}</h1>
        <div className="flex items-center gap-3">
          {aseguradoId && (
            <Link to={`/asegurados/${aseguradoId}`}
              className="text-sm text-accent-400 hover:text-accent-300 font-medium">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1"><polyline points="15 18 9 12 15 6"/></svg>Volver al asegurado
            </Link>
          )}
          <button className={cn(cls.btn, cls.btnMd, cls.btnPrimary)} onClick={() => setShowForm(true)}>
            + Nuevo bien
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="surface rounded-sm overflow-hidden">
        <table className={cls.table}>
          <thead>
            <tr>
              <th className={cls.th}>Tipo</th>
              <th className={cls.th}>Descripcion</th>
              <th className={cls.th}>Suma asegurada</th>
              <th className={cls.th}>Asegurado</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={4} className="px-4 py-8 text-center txt-tertiary text-sm">Cargando...</td></tr>
            )}
            {!isLoading && bienes.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center txt-tertiary text-sm">Sin bienes registrados.</td></tr>
            )}
            {bienes.map((b) => (
              <tr key={b.id} className={cls.trHover}>
                <td className={cls.td}>
                  <span className={cn(cls.badge, tipoBienBadge[b.tipo])}>
                    {b.tipo}
                  </span>
                </td>
                <td className={cls.td}>
                  {b.tipo === TipoBien.AUTOMOTOR
                    ? [b.marca, b.modelo, b.anioFabricacion, b.patente ? `(${b.patente})` : '']
                        .filter(Boolean).join(' ')
                    : b.tipo}
                </td>
                <td className={cls.td}>{formatMoney(b.sumaAsegurada)}</td>
                <td className={cls.td}>{b.asegurado?.nombre ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <BienForm
          onClose={() => setShowForm(false)}
          asegurados={asegurados}
          defaultAseguradoId={aseguradoId}
        />
      )}
    </div>
  );
}
