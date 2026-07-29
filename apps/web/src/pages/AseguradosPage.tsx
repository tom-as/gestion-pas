import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { formatDate } from '@/lib/format';
import { cls, cn } from '@/lib/cn';

interface Productor { id: string; nombre: string }
interface Asegurado {
  id: string; nombre: string; dniCuil: string;
  telefono: string | null; email: string | null;
  fechaNacimiento: string | null; productor: Productor;
}

const schema = z.object({
  nombre: z.string().min(2, 'Requerido'),
  dniCuil: z.string().min(7, 'Mínimo 7 caracteres'),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().optional(),
  codigoPostal: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  productorId: z.string().uuid('Seleccioná un productor'),
});
type FormValues = z.infer<typeof schema>;

function AseguradoForm({ onClose, productores }: { onClose: () => void; productores: Productor[] }) {
  const qc = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => api.post('/asegurados', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['asegurados'] }); onClose(); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg ?? 'Ocurrió un error.');
    },
  });

  return (
    <div className={cls.overlay}>
      <div className={cn(cls.modal, cls.modalMd)}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Nuevo asegurado</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
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
                <label className={cls.label}>Fecha de nacimiento</label>
                <input type="date" className={cls.input} {...register('fechaNacimiento')} />
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
                <label className={cls.label}>Dirección</label>
                <input className={cls.input} {...register('direccion')} />
              </div>
              <div className="space-y-1">
                <label className={cls.label}>Código postal</label>
                <input className={cls.input} {...register('codigoPostal')} />
              </div>
              <div className="space-y-1">
                <label className={cls.label}>Productor *</label>
                <select className={cn(cls.select, errors.productorId && cls.inputError)} {...register('productorId')}>
                  <option value="">Seleccionar…</option>
                  {productores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                {errors.productorId && <p className="text-xs text-red-500">{errors.productorId.message}</p>}
              </div>
            </div>

            {serverError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-400">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                {serverError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
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

export default function AseguradosPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: asegurados = [], isLoading } = useQuery<Asegurado[]>({
    queryKey: ['asegurados', search],
    queryFn: () => api.get(`/asegurados${search ? `?search=${encodeURIComponent(search)}` : ''}`).then((r) => r.data),
  });
  const { data: productores = [] } = useQuery<Productor[]>({
    queryKey: ['productores'],
    queryFn: () => api.get('/productores').then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className={cls.pageTitle}>Asegurados</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 w-60 placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-900 dark:text-slate-100"
              placeholder="Buscar por nombre o DNI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => setShowForm(true)} className={cn(cls.btn, cls.btnMd, cls.btnPrimary)}>
            + Nuevo asegurado
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className={cls.table}>
          <thead>
            <tr>
              <th className={cls.th}>Nombre</th>
              <th className={cls.th}>DNI / CUIL</th>
              <th className={cls.th}>Teléfono</th>
              <th className={cls.th}>Email</th>
              <th className={cls.th}>Productor</th>
              <th className={cls.th}>Nacimiento</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Cargando asegurados…
                </div>
              </td></tr>
            )}
            {!isLoading && asegurados.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                {search ? `Sin resultados para "${search}"` : 'No hay asegurados registrados'}
              </td></tr>
            )}
            {asegurados.map((a) => (
              <tr key={a.id} className={cls.trHover}>
                <td className={cls.td}>
                  <Link to={`/asegurados/${a.id}`} className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                    {a.nombre}
                  </Link>
                </td>
                <td className={cn(cls.td, 'font-mono text-xs text-slate-500')}>{a.dniCuil}</td>
                <td className={cn(cls.td, 'text-slate-500')}>{a.telefono ?? '—'}</td>
                <td className={cn(cls.td, 'text-slate-500')}>{a.email ?? '—'}</td>
                <td className={cls.td}>
                  <span className={cn(cls.badge, cls.badgeGray)}>{a.productor?.nombre ?? '—'}</span>
                </td>
                <td className={cn(cls.td, 'text-slate-500')}>{formatDate(a.fechaNacimiento)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && <AseguradoForm onClose={() => setShowForm(false)} productores={productores} />}
    </div>
  );
}
