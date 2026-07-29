import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { PeriodicidadRefacturacion } from '@gestion-pas/types';
import { useAuth } from '@/context/AuthContext';
import { cn, cls } from '@/lib/cn';

/* ── Tipos ──────────────────────────────────────────────── */
interface Compania {
  id: string; nombre: string;
  periodoDGraciaDias: number | null;
  periodicidadRefacturacion: PeriodicidadRefacturacion | null;
  mecanismoNotificacion: string | null;
}

/* ── Schema ──────────────────────────────────────────────── */
const schema = z.object({
  nombre: z.string().min(2, 'Requerido'),
  periodoDGraciaDias: z.coerce.number().int().min(0).optional(),
  periodicidadRefacturacion: z.nativeEnum(PeriodicidadRefacturacion).optional().or(z.literal('')),
  mecanismoNotificacion: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const PERIOD_LABEL: Record<PeriodicidadRefacturacion, string> = {
  [PeriodicidadRefacturacion.MENSUAL]:    'Mensual',
  [PeriodicidadRefacturacion.TRIMESTRAL]: 'Trimestral',
  [PeriodicidadRefacturacion.SEMESTRAL]:  'Semestral',
  [PeriodicidadRefacturacion.ANUAL]:      'Anual',
};

/* ── Formulario modal ────────────────────────────────────── */
function CompaniaForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      api.post('/companias', {
        ...data,
        periodicidadRefacturacion: data.periodicidadRefacturacion || undefined,
        periodoDGraciaDias: data.periodoDGraciaDias ?? undefined,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companias-list'] }); onClose(); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg ?? 'Ocurrió un error.');
    },
  });

  return (
    <div className={cls.overlay}>
      <div className={cn(cls.modal, cls.modalMd)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
          <h2 className="text-base font-semibold text-slate-200">Nueva compañía aseguradora</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="px-6 py-5">
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className={cls.label}>Nombre *</label>
                <input className={cn(cls.input, errors.nombre && cls.inputError)} {...register('nombre')} />
                {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
              </div>
              <div className="space-y-1">
                <label className={cls.label}>Días de gracia</label>
                <input type="number" min="0" className={cls.input} placeholder="5" {...register('periodoDGraciaDias')} />
              </div>
              <div className="space-y-1">
                <label className={cls.label}>Periodicidad refacturación</label>
                <select className={cls.select} {...register('periodicidadRefacturacion')}>
                  <option value="">Sin definir</option>
                  {Object.entries(PERIOD_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className={cls.label}>Mecanismo de notificación</label>
                <input className={cls.input} placeholder="portal / email / ninguno" {...register('mecanismoNotificacion')} />
              </div>
            </div>
            {serverError && (
              <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-red-500/8 border border-red-500/20 text-sm text-red-400">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                {serverError}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-white/6">
              <button type="button" onClick={onClose} className={cn(cls.btn, cls.btnMd, cls.btnSecond)}>Cancelar</button>
              <button type="submit" disabled={isSubmitting} className={cn(cls.btn, cls.btnMd, cls.btnPrimary)}>
                {isSubmitting ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Página ──────────────────────────────────────────────── */
export default function CompaniasPage() {
  const { isOrganizador } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { data: companias = [], isLoading } = useQuery<Compania[]>({
    queryKey: ['companias-list'],
    queryFn: () => api.get('/companias').then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className={cls.pageTitle}>Compañías Aseguradoras</h1>
        {isOrganizador && (
          <button onClick={() => setShowForm(true)} className={cn(cls.btn, cls.btnMd, cls.btnPrimary)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva compañía
          </button>
        )}
      </div>

      {/* Table */}
      <div className={cn(cls.card, 'overflow-hidden')}>
        <table className={cls.table}>
          <thead>
            <tr>
              <th className={cls.th}>Nombre</th>
              <th className={cls.th}>Días de gracia</th>
              <th className={cls.th}>Periodicidad refacturación</th>
              <th className={cls.th}>Notificación</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-400 text-sm">
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Cargando compañías…
                </div>
              </td></tr>
            )}
            {!isLoading && companias.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-400 text-sm">
                No hay compañías registradas
              </td></tr>
            )}
            {companias.map((c) => (
              <tr key={c.id} className={cls.trHover}>
                <td className={cn(cls.td, 'font-semibold text-slate-200')}>{c.nombre}</td>
                <td className={cls.td}>
                  {c.periodoDGraciaDias != null
                    ? <span className={cn(cls.badge, cls.badgeBlue)}>{c.periodoDGraciaDias} días</span>
                    : <span className="text-slate-400">—</span>}
                </td>
                <td className={cls.td}>
                  {c.periodicidadRefacturacion
                    ? <span className={cn(cls.badge, cls.badgeGray)}>{PERIOD_LABEL[c.periodicidadRefacturacion]}</span>
                    : <span className="text-slate-400">—</span>}
                </td>
                <td className={cn(cls.td, 'text-slate-500 capitalize')}>{c.mecanismoNotificacion ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && <CompaniaForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
