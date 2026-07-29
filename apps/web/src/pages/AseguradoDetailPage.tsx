import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/format';
import { cn, cls, estadoPolicaBadge, tipoBienBadge } from '@/lib/cn';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@gestion-pas/types';

/* ── Tipos ──────────────────────────────────────────────── */
interface Bien {
  id: string; tipo: string;
  patente?: string | null; marca?: string | null; modelo?: string | null;
  version?: string | null; anioFabricacion?: number | null;
  sumaAsegurada?: number | null;
}
interface Poliza {
  id: string; numeroPoliza: string; estado: string;
  vigenciaInicio: string; vigenciaFin: string;
  importeCuotaVigente: number;
  compania: { id: string; nombre: string };
  bien: { id: string; tipo: string };
}
interface Asegurado {
  id: string; nombre: string; dniCuil: string;
  fechaNacimiento: string | null; direccion: string | null;
  codigoPostal: string | null; telefono: string | null;
  email: string | null;
  productor: { id: string; nombre: string } | null;
  bienes: Bien[];
  polizas: Poliza[];
}

/* ── Schema edición ──────────────────────────────────────── */
const editSchema = z.object({
  nombre:          z.string().min(2, 'Requerido'),
  fechaNacimiento: z.string().optional(),
  telefono:        z.string().optional(),
  email:           z.string().email('Email inválido').optional().or(z.literal('')),
  direccion:       z.string().optional(),
  codigoPostal:    z.string().optional(),
});
type EditValues = z.infer<typeof editSchema>;

/* ── Sub-componente: fila de datos ──────────────────────── */
function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start py-3 border-b border-[var(--td-border)] last:border-0">
      <span className="w-36 flex-shrink-0 text-[11px] font-semibold uppercase tracking-widest txt-faint">
        {label}
      </span>
      <span className="txt-primary text-sm">{value || <span className="txt-faint">—</span>}</span>
    </div>
  );
}

/* ── Modal de edición ────────────────────────────────────── */
function EditModal({ asegurado, onClose }: { asegurado: Asegurado; onClose: () => void }) {
  const qc = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<EditValues>({
      resolver: zodResolver(editSchema),
      defaultValues: {
        nombre:          asegurado.nombre,
        fechaNacimiento: asegurado.fechaNacimiento?.slice(0, 10) ?? '',
        telefono:        asegurado.telefono ?? '',
        email:           asegurado.email ?? '',
        direccion:       asegurado.direccion ?? '',
        codigoPostal:    asegurado.codigoPostal ?? '',
      },
    });

  const mutation = useMutation({
    mutationFn: (data: EditValues) => api.patch(`/asegurados/${asegurado.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asegurado', asegurado.id] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg ?? 'Ocurrió un error.');
    },
  });

  return (
    <div className={cls.overlay}>
      <div className={cn(cls.modal, cls.modalMd, '!rounded-md')}>
        <div className={cn('flex items-center justify-between px-6 py-4', cls.modalDivider)}>
          <h2 className="text-base font-semibold txt-primary">Editar asegurado</h2>
          <button onClick={onClose} className="p-1 rounded txt-faint hover:txt-primary hover:bg-black/5 dark:hover:bg-white/8 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className={cls.label}>Nombre completo *</label>
                <input className={cn(cls.input, '!rounded-sm', errors.nombre && cls.inputError)} {...register('nombre')} />
                {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
              </div>
              <div className="space-y-1">
                <label className={cls.label}>Fecha de nacimiento</label>
                <input type="date" className={cn(cls.input, '!rounded-sm')} {...register('fechaNacimiento')} />
              </div>
              <div className="space-y-1">
                <label className={cls.label}>Teléfono</label>
                <input className={cn(cls.input, '!rounded-sm')} {...register('telefono')} />
              </div>
              <div className="col-span-2 space-y-1">
                <label className={cls.label}>Email</label>
                <input type="email" className={cn(cls.input, '!rounded-sm', errors.email && cls.inputError)} {...register('email')} />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div className="col-span-2 space-y-1">
                <label className={cls.label}>Dirección</label>
                <input className={cn(cls.input, '!rounded-sm')} {...register('direccion')} />
              </div>
              <div className="space-y-1">
                <label className={cls.label}>Código postal</label>
                <input className={cn(cls.input, '!rounded-sm')} {...register('codigoPostal')} />
              </div>
            </div>

            {serverError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/8 border border-red-500/20 text-sm text-red-400">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                {serverError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className={cn(cls.btn, cls.btnMd, cls.btnSecond, '!rounded-sm')}>Cancelar</button>
              <button type="submit" disabled={isSubmitting} className={cn(cls.btn, cls.btnMd, cls.btnPrimary, '!rounded-sm')}>
                {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function AseguradoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);

  const canEdit = user?.perfil === UserRole.ORGANIZADOR || user?.perfil === UserRole.PRODUCTOR;

  const { data: asegurado, isLoading, isError } = useQuery<Asegurado>({
    queryKey: ['asegurado', id],
    queryFn: () => api.get(`/asegurados/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  /* ── Loading ─────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 txt-faint text-sm gap-2">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Cargando…
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────────── */
  if (isError || !asegurado) {
    return (
      <div className="space-y-4">
        <Link to="/asegurados" className="inline-flex items-center gap-1.5 text-sm txt-faint hover:txt-primary transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver a asegurados
        </Link>
        <p className="text-sm txt-faint">No se pudo cargar el asegurado.</p>
      </div>
    );
  }

  const inicial = asegurado.nombre.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">

      {/* ── Breadcrumb ─────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm txt-faint">
        <Link to="/asegurados" className="hover:txt-primary transition-colors">Asegurados</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="txt-primary">{asegurado.nombre}</span>
      </div>

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {/* Avatar grande */}
          <div
            className="w-12 h-12 rounded-sm flex items-center justify-center text-lg font-bold flex-shrink-0"
            style={{ background: 'rgba(61,107,255,0.12)', color: '#6690ff' }}
          >
            {inicial}
          </div>
          <div>
            <h1 className={cn(cls.pageTitle)}>{asegurado.nombre}</h1>
            <p className="text-sm txt-faint mt-0.5 font-mono">{asegurado.dniCuil}</p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => setEditing(true)}
            className={cn(cls.btn, cls.btnMd, cls.btnSecond, '!rounded-sm')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar
          </button>
        )}
      </div>

      {/* ── Grilla 2 columnas: ficha + bienes/pólizas ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Columna izquierda — datos personales */}
        <div className="lg:col-span-1 space-y-4">
          <div className="surface rounded-none overflow-hidden">
            <div className="px-5 py-3.5 panel-sep">
              <p className="text-[11px] font-semibold uppercase tracking-widest txt-faint">Datos personales</p>
            </div>
            <div className="px-5">
              <DataRow label="Nombre"    value={asegurado.nombre} />
              <DataRow label="DNI / CUIL" value={<span className="font-mono text-xs">{asegurado.dniCuil}</span>} />
              <DataRow label="Nacimiento" value={formatDate(asegurado.fechaNacimiento)} />
              <DataRow label="Teléfono"  value={asegurado.telefono} />
              <DataRow label="Email"     value={asegurado.email} />
              <DataRow label="Dirección" value={asegurado.direccion} />
              <DataRow label="C. postal" value={asegurado.codigoPostal} />
              <DataRow
                label="Productor"
                value={
                  asegurado.productor
                    ? <span className={cn(cls.badge, cls.badgeGray, '!rounded-sm')}>{asegurado.productor.nombre}</span>
                    : null
                }
              />
            </div>
          </div>
        </div>

        {/* Columna derecha — bienes y pólizas */}
        <div className="lg:col-span-2 space-y-5">

          {/* Bienes asegurados */}
          <div className="surface rounded-none overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 panel-sep">
              <p className="text-[11px] font-semibold uppercase tracking-widest txt-faint">Bienes asegurados</p>
              <span className={cn(cls.badge, cls.badgeGray)}>{asegurado.bienes.length}</span>
            </div>
            {asegurado.bienes.length === 0 ? (
              <p className="px-5 py-6 text-sm txt-faint">Sin bienes registrados.</p>
            ) : (
              <table className={cls.table}>
                <thead>
                  <tr>
                    <th className={cls.th}>Tipo</th>
                    <th className={cls.th}>Identificación</th>
                    <th className={cn(cls.th, 'text-right')}>Suma asegurada</th>
                    <th className={cls.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {asegurado.bienes.map((b) => (
                    <tr key={b.id} className={cls.trHover}>
                      <td className={cls.td}>
                        <span className={cn(cls.badge, tipoBienBadge[b.tipo as keyof typeof tipoBienBadge] ?? cls.badgeGray, '!rounded-sm')}>
                          {b.tipo}
                        </span>
                      </td>
                      <td className={cls.td}>
                        {b.patente
                          ? <span className="font-mono text-xs txt-primary">{b.patente}</span>
                          : <span className="txt-faint text-xs">—</span>}
                        {(b.marca || b.modelo) && (
                          <span className="txt-faint text-xs ml-2">{[b.marca, b.modelo].filter(Boolean).join(' ')}</span>
                        )}
                      </td>
                      <td className={cn(cls.td, 'text-right tabular-nums font-semibold')}>
                        {formatMoney(b.sumaAsegurada)}
                      </td>
                      <td className={cls.td}>
                        <Link
                          to={`/bienes/asegurado/${asegurado.id}`}
                          className="text-xs text-accent-400 hover:underline"
                        >
                          Ver bienes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pólizas */}
          <div className="surface rounded-none overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 panel-sep">
              <p className="text-[11px] font-semibold uppercase tracking-widest txt-faint">Pólizas</p>
              <span className={cn(cls.badge, cls.badgeGray)}>{asegurado.polizas.length}</span>
            </div>
            {asegurado.polizas.length === 0 ? (
              <p className="px-5 py-6 text-sm txt-faint">Sin pólizas registradas.</p>
            ) : (
              <table className={cls.table}>
                <thead>
                  <tr>
                    <th className={cls.th}>Número</th>
                    <th className={cls.th}>Compañía</th>
                    <th className={cls.th}>Vigencia</th>
                    <th className={cn(cls.th, 'text-right')}>Cuota</th>
                    <th className={cls.th}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {asegurado.polizas.map((p) => (
                    <tr key={p.id} className={cls.trHover}>
                      <td className={cls.td}>
                        <Link to={`/polizas/${p.id}`} className="font-medium txt-primary hover:text-accent-400 transition-colors text-sm">
                          {p.numeroPoliza}
                        </Link>
                      </td>
                      <td className={cn(cls.td, 'txt-secondary text-sm')}>{p.compania?.nombre ?? '—'}</td>
                      <td className={cn(cls.td, 'txt-faint text-sm whitespace-nowrap')}>
                        {formatDate(p.vigenciaInicio)} — {formatDate(p.vigenciaFin)}
                      </td>
                      <td className={cn(cls.td, 'text-right tabular-nums font-semibold text-sm')}>
                        {formatMoney(p.importeCuotaVigente)}
                      </td>
                      <td className={cls.td}>
                        <span className={cn(cls.badge, estadoPolicaBadge[p.estado as keyof typeof estadoPolicaBadge] ?? cls.badgeGray, '!rounded-sm')}>
                          {p.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>

      {editing && <EditModal asegurado={asegurado} onClose={() => setEditing(false)} />}
    </div>
  );
}
