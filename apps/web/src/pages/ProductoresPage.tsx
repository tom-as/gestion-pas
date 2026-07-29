import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { formatDate } from '@/lib/format';
import { EstadoProductor } from '@gestion-pas/types';
import { useAuth } from '@/context/AuthContext';
import { cn, cls } from '@/lib/cn';

/* ── Tipos ──────────────────────────────────────────────── */
interface Productor {
  id: string; nombre: string; dniCuil: string;
  telefono: string | null; email: string | null;
  fechaIncorporacion: string | null; companiasOpera: string | null;
  estado: EstadoProductor;
}

const ESTADO_BADGE: Record<EstadoProductor, string> = {
  [EstadoProductor.ACTIVO]:   cls.badgeGreen,
  [EstadoProductor.INACTIVO]: cls.badgeGray,
};

/* ── Schema ──────────────────────────────────────────────── */
const schema = z.object({
  nombre: z.string().min(2, 'Requerido'),
  dniCuil: z.string().min(7, 'Mínimo 7 caracteres'),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  fechaIncorporacion: z.string().optional(),
  companiasOpera: z.string().optional(),
  organizadorId: z.string().uuid(),
});
type FormValues = z.infer<typeof schema>;

/* ── Formulario modal ────────────────────────────────────── */
function ProductorForm({ onClose, organizadorId }: { onClose: () => void; organizadorId: string }) {
  const qc = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { organizadorId },
    });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => api.post('/productores', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['productores-list'] }); onClose(); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg ?? 'Ocurrió un error.');
    },
  });

  return (
    <div className={cls.overlay}>
      <div className={cn(cls.modal, cls.modalMd)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Nuevo productor</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="px-6 py-5">
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
            <input type="hidden" {...register('organizadorId')} />
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className={cls.label}>Nombre completo *</label>
                <input className={cn(cls.input, errors.nombre && cls.inputError)} {...register('nombre')} />
                {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
              </div>
              <div className="space-y-1">
                <label className={cls.label}>DNI / CUIL *</label>
                <input className={cn(cls.input, errors.dniCuil && cls.inputError)} {...register('dniCuil')} />
                {errors.dniCuil && <p className="text-xs text-red-500">{errors.dniCuil.message}</p>}
              </div>
              <div className="space-y-1">
                <label className={cls.label}>Fecha de incorporación</label>
                <input type="date" className={cls.input} {...register('fechaIncorporacion')} />
              </div>
              <div className="space-y-1">
                <label className={cls.label}>Teléfono</label>
                <input className={cls.input} {...register('telefono')} />
              </div>
              <div className="space-y-1">
                <label className={cls.label}>Email</label>
                <input type="email" className={cn(cls.input, errors.email && cls.inputError)} {...register('email')} />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div className="col-span-2 space-y-1">
                <label className={cls.label}>Compañías que opera</label>
                <input className={cls.input} placeholder="Federación Patronal, Galicia…" {...register('companiasOpera')} />
              </div>
            </div>
            {serverError && (
              <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-400">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                {serverError}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
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
export default function ProductoresPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { data: productores = [], isLoading } = useQuery<Productor[]>({
    queryKey: ['productores-list'],
    queryFn: () => api.get('/productores').then((r) => r.data),
  });

  const organizadorId = user?.organizadorId ?? '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className={cls.pageTitle}>Productores</h1>
        {organizadorId && (
          <button onClick={() => setShowForm(true)} className={cn(cls.btn, cls.btnMd, cls.btnPrimary)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo productor
          </button>
        )}
      </div>

      {/* Table */}
      <div className={cn(cls.card, 'overflow-hidden')}>
        <table className={cls.table}>
          <thead>
            <tr>
              <th className={cls.th}>Nombre</th>
              <th className={cls.th}>DNI / CUIL</th>
              <th className={cls.th}>Teléfono</th>
              <th className={cls.th}>Email</th>
              <th className={cls.th}>Incorporación</th>
              <th className={cls.th}>Compañías</th>
              <th className={cls.th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Cargando productores…
                </div>
              </td></tr>
            )}
            {!isLoading && productores.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                No hay productores registrados
              </td></tr>
            )}
            {productores.map((p) => (
              <tr key={p.id} className={cls.trHover}>
                <td className={cn(cls.td, 'font-semibold text-slate-800 dark:text-slate-200')}>{p.nombre}</td>
                <td className={cn(cls.td, 'font-mono text-xs text-slate-500')}>{p.dniCuil}</td>
                <td className={cn(cls.td, 'text-slate-500')}>{p.telefono ?? '—'}</td>
                <td className={cn(cls.td, 'text-slate-500')}>{p.email ?? '—'}</td>
                <td className={cls.td}>{formatDate(p.fechaIncorporacion)}</td>
                <td className={cn(cls.td, 'text-slate-500 max-w-[200px] truncate')}>{p.companiasOpera ?? '—'}</td>
                <td className={cls.td}>
                  <span className={cn(cls.badge, ESTADO_BADGE[p.estado])}>{p.estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && organizadorId && (
        <ProductorForm onClose={() => setShowForm(false)} organizadorId={organizadorId} />
      )}
    </div>
  );
}
