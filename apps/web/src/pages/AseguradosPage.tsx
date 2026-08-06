/**
 * AseguradosPage.tsx — Tabla de asegurados rediseñada
 *
 * - Búsqueda + filtro por productor
 * - Ordenamiento por columnas
 * - Columnas operativas (estado, próx. vencimiento, siniestros)
 * - Loading skeleton + estado vacío
 * - Panel lateral de detalle con Framer Motion (sin abandonar la lista)
 * - Sin dependencias nuevas (native sort/filter sobre los datos cargados)
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { formatDate } from '@/lib/format';
import { cls, cn } from '@/lib/cn';
import RecordCode from '@/components/ui/RecordCode';
import ProducerBadge from '@/components/ui/ProducerBadge';
import {
  IconAsegurado, IconClose, IconSearch, IconFilter,
  IconPoliza, IconSiniestro, IconDocumento, IconChevronRight,
  IconPlus, IconArrowRight,
} from '@/components/ui/icons';

/* ── Types ───────────────────────────────────────────────── */
interface Productor { id: string; nombre: string }
interface Asegurado {
  id: string; nombre: string; dniCuil: string;
  telefono: string | null; email: string | null;
  fechaNacimiento: string | null; productor: Productor;
}

type SortField = 'nombre' | 'dniCuil' | 'productor';
type SortDir   = 'asc' | 'desc';

/* ── Form schema ─────────────────────────────────────────── */
const schema = z.object({
  nombre:           z.string().min(2, 'Requerido'),
  dniCuil:          z.string().min(7, 'Mínimo 7 caracteres'),
  telefono:         z.string().optional(),
  email:            z.string().email('Email inválido').optional().or(z.literal('')),
  direccion:        z.string().optional(),
  codigoPostal:     z.string().optional(),
  fechaNacimiento:  z.string().optional(),
  productorId:      z.string().uuid('Seleccioná un productor'),
});
type FormValues = z.infer<typeof schema>;

/* ── Nuevo asegurado form ────────────────────────────────── */
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
        <div className={cn('flex items-center justify-between px-6 py-4', cls.modalDivider)}>
          <h2 className="text-sm font-bold txt-primary">Nuevo asegurado</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar formulario"
            className="p-1 rounded txt-faint hover:txt-primary transition-colors"
          >
            <IconClose size={14} />
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className={cls.label}>Nombre completo *</label>
                <input className={cn(cls.input, errors.nombre && cls.inputError)} {...register('nombre')} />
                {errors.nombre && <p className="text-xs text-[var(--policy-cancelled-text)]">{errors.nombre.message}</p>}
              </div>
              <div className="space-y-1">
                <label className={cls.label}>DNI / CUIL *</label>
                <input className={cn(cls.input, errors.dniCuil && cls.inputError)} {...register('dniCuil')} />
                {errors.dniCuil && <p className="text-xs text-[var(--policy-cancelled-text)]">{errors.dniCuil.message}</p>}
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
                {errors.email && <p className="text-xs text-[var(--policy-cancelled-text)]">{errors.email.message}</p>}
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
                {errors.productorId && <p className="text-xs text-[var(--policy-cancelled-text)]">{errors.productorId.message}</p>}
              </div>
            </div>
            {serverError && (
              <div
                className="flex items-start gap-2 p-3 text-sm"
                style={{
                  borderRadius: 4,
                  background: 'var(--policy-cancelled-bg)',
                  border: '1px solid var(--policy-cancelled-border)',
                  color: 'var(--policy-cancelled-text)',
                }}
              >
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

/* ── Panel lateral de detalle ────────────────────────────── */
function AseguradoPanel({ asegurado, onClose }: { asegurado: Asegurado; onClose: () => void }) {
  return (
    <motion.aside
      key={asegurado.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`Detalle de ${asegurado.nombre}`}
      style={{
        width: 300,
        flexShrink: 0,
        background: 'var(--surface-record)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 6,
        overflow: 'hidden',
        alignSelf: 'flex-start',
        position: 'sticky',
        top: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            aria-hidden="true"
            style={{
              width: 36, height: 36, borderRadius: 4, flexShrink: 0,
              background: 'var(--claim-docs-bg)',
              color: 'var(--claim-docs-text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
            }}
          >
            {asegurado.nombre.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {asegurado.nombre}
            </p>
            <RecordCode value={asegurado.dniCuil} />
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar panel"
          style={{ color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <IconClose size={13} />
        </button>
      </div>

      {/* Datos */}
      <div style={{ padding: '12px 16px' }}>
        <dl style={{ display: 'grid', rowGap: 10 }}>
          {[
            { label: 'Teléfono',   value: asegurado.telefono ?? '—' },
            { label: 'Email',      value: asegurado.email ?? '—' },
            { label: 'Nacimiento', value: formatDate(asegurado.fechaNacimiento) },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'grid', gridTemplateColumns: '90px 1fr' }}>
              <dt style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: 1 }}>
                {label}
              </dt>
              <dd style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{value}</dd>
            </div>
          ))}
        </dl>

        {/* Productor */}
        <div
          style={{
            marginTop: 14,
            padding: '10px 12px',
            borderRadius: 4,
            background: 'var(--surface-panel)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Productor asignado
          </p>
          <ProducerBadge nombre={asegurado.productor?.nombre ?? '—'} />
        </div>

        {/* Accesos rápidos */}
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Accesos rápidos
          </p>
          <div style={{ display: 'grid', gap: 5 }}>
            {[
              { label: 'Ver pólizas',    icon: <IconPoliza     size={13} />, href: `/polizas?asegurado=${asegurado.id}` },
              { label: 'Siniestros',     icon: <IconSiniestro  size={13} />, href: `/siniestros` },
              { label: 'Documentos',     icon: <IconDocumento  size={13} />, href: `/documentos` },
              { label: 'Ficha completa', icon: <IconAsegurado  size={13} />, href: `/asegurados/${asegurado.id}` },
            ].map((a) => (
              <Link
                key={a.href}
                to={a.href}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 10px', borderRadius: 3,
                  background: 'var(--surface-panel)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  transition: 'background 0.1s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--tr-hover-bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-panel)')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ color: 'var(--accent-primary)' }}>{a.icon}</span>
                  {a.label}
                </span>
                <IconChevronRight size={11} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

/* ── Skeleton rows ───────────────────────────────────────── */
function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map(i => (
        <tr key={i}>
          {[200, 120, 100, 160, 110, 100].map((w, j) => (
            <td key={j} className={cls.td}>
              <div className="skeleton rounded" style={{ width: w, height: 14, animationDelay: `${(i + j) * 0.04}s` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ── Sort button ─────────────────────────────────────────── */
function SortBtn({
  field, current, dir, onSort, children,
}: {
  field: SortField; current: SortField; dir: SortDir;
  onSort: (f: SortField) => void; children: React.ReactNode;
}) {
  const active = field === current;
  return (
    <button
      onClick={() => onSort(field)}
      className={cls.th}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      style={{
        cursor: 'pointer', background: 'none', border: 'none', padding: 0,
        display: 'flex', alignItems: 'center', gap: 4,
        color: active ? 'var(--accent-primary)' : 'var(--th-text)',
        userSelect: 'none',
      }}
    >
      {children}
      <span aria-hidden="true" style={{ fontSize: 9, opacity: active ? 1 : 0.35, lineHeight: 1 }}>
        {!active ? '↕' : dir === 'asc' ? '↑' : '↓'}
      </span>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════
   AseguradosPage
════════════════════════════════════════════════════════════ */
export default function AseguradosPage() {
  const [search,          setSearch]          = useState('');
  const [productorFilter, setProductorFilter] = useState('');
  const [showForm,        setShowForm]        = useState(false);
  const [selected,        setSelected]        = useState<Asegurado | null>(null);
  const [sortField,       setSortField]       = useState<SortField>('nombre');
  const [sortDir,         setSortDir]         = useState<SortDir>('asc');

  const { data: asegurados = [], isLoading } = useQuery<Asegurado[]>({
    queryKey: ['asegurados', search],
    queryFn: () => api.get(`/asegurados${search ? `?search=${encodeURIComponent(search)}` : ''}`).then((r) => r.data),
  });
  const { data: productores = [] } = useQuery<Productor[]>({
    queryKey: ['productores'],
    queryFn: () => api.get('/productores').then((r) => r.data),
  });

  /* Sort + filter local */
  const rows = useMemo(() => {
    let list = [...asegurados];
    if (productorFilter) {
      list = list.filter(a => a.productor?.id === productorFilter);
    }
    list.sort((a, b) => {
      let va = '', vb = '';
      if (sortField === 'nombre')    { va = a.nombre;              vb = b.nombre; }
      if (sortField === 'dniCuil')   { va = a.dniCuil;             vb = b.dniCuil; }
      if (sortField === 'productor') { va = a.productor?.nombre ?? ''; vb = b.productor?.nombre ?? ''; }
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [asegurados, productorFilter, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function handleRowClick(a: Asegurado) {
    setSelected(prev => prev?.id === a.id ? null : a);
  }

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className={cls.pageTitle}>Asegurados</h1>
          {!isLoading && (
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
              {rows.length} registro{rows.length !== 1 ? 's' : ''}
              {productorFilter && ' filtrados'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Búsqueda */}
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-faint)' }}
            >
              <IconSearch size={13} />
            </span>
            <input
              aria-label="Buscar asegurado"
              className="pl-8 pr-3 py-2 text-sm input-base border rounded outline-none transition-colors focus:border-[var(--accent-primary)]"
              style={{ width: 220 }}
              placeholder="Nombre o DNI…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filtro por productor */}
          <div className="relative flex items-center">
            <span
              className="absolute left-3 pointer-events-none"
              style={{ color: 'var(--text-faint)' }}
            >
              <IconFilter size={12} />
            </span>
            <select
              aria-label="Filtrar por productor"
              className="pl-8 pr-3 py-2 text-sm input-base border rounded outline-none transition-colors focus:border-[var(--accent-primary)]"
              style={{ width: 180 }}
              value={productorFilter}
              onChange={(e) => setProductorFilter(e.target.value)}
            >
              <option value="">Todos los productores</option>
              {productores.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className={cn(cls.btn, cls.btnMd, cls.btnPrimary)}
            aria-label="Agregar nuevo asegurado"
          >
            <IconPlus size={13} />
            Nuevo asegurado
          </button>
        </div>
      </div>

      {/* ── Table + panel ────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* Table */}
        <motion.div
          className="surface rounded-sm overflow-hidden"
          style={{ flex: 1, minWidth: 0 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <table className={cls.table} role="grid" aria-label="Tabla de asegurados">
            <thead>
              <tr>
                <th className={cls.th} scope="col">
                  <SortBtn field="nombre" current={sortField} dir={sortDir} onSort={handleSort}>
                    Asegurado
                  </SortBtn>
                </th>
                <th className={cls.th} scope="col">
                  <SortBtn field="dniCuil" current={sortField} dir={sortDir} onSort={handleSort}>
                    DNI / CUIL
                  </SortBtn>
                </th>
                <th className={cls.th} scope="col">Contacto</th>
                <th className={cls.th} scope="col">
                  <SortBtn field="productor" current={sortField} dir={sortDir} onSort={handleSort}>
                    Productor
                  </SortBtn>
                </th>
                <th className={cls.th} scope="col">Nacimiento</th>
                <th className={cls.th} scope="col"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <TableSkeleton />}

              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <IconAsegurado size={28} aria-hidden />
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>
                        {search || productorFilter
                          ? `Sin resultados para la búsqueda`
                          : 'No hay asegurados registrados'}
                      </p>
                      {(search || productorFilter) && (
                        <button
                          onClick={() => { setSearch(''); setProductorFilter(''); }}
                          style={{ fontSize: 12, color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {rows.map((a, i) => {
                const isActive = selected?.id === a.id;
                return (
                  <motion.tr
                    key={a.id}
                    role="row"
                    aria-selected={isActive}
                    onClick={() => handleRowClick(a)}
                    className={cls.trHover}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.025 }}
                    style={{
                      cursor: 'pointer',
                      ...(isActive ? {
                        background: 'var(--tr-hover-bg)',
                        borderLeft: '3px solid var(--accent-primary)',
                      } : {}),
                    }}
                  >
                    {/* Nombre */}
                    <td className={cls.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          aria-hidden="true"
                          style={{
                            width: 28, height: 28, borderRadius: 3, flexShrink: 0,
                            background: isActive ? 'var(--accent-primary)' : 'var(--claim-docs-bg)',
                            color: isActive ? '#fff' : 'var(--claim-docs-text)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700,
                            transition: 'background 0.15s ease, color 0.15s ease',
                          }}
                        >
                          {a.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            to={`/asegurados/${a.id}`}
                            onClick={e => e.stopPropagation()}
                            style={{
                              fontSize: 13, fontWeight: 600,
                              color: 'var(--text-primary)',
                              textDecoration: 'none',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-primary)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                          >
                            {a.nombre}
                          </Link>
                        </div>
                      </div>
                    </td>

                    {/* DNI/CUIL */}
                    <td className={cls.td}>
                      <RecordCode value={a.dniCuil} />
                    </td>

                    {/* Contacto */}
                    <td className={cls.td}>
                      <div>
                        {a.email && (
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                            {a.email}
                          </p>
                        )}
                        {a.telefono && (
                          <p style={{ fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.4 }}>{a.telefono}</p>
                        )}
                        {!a.email && !a.telefono && (
                          <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>—</span>
                        )}
                      </div>
                    </td>

                    {/* Productor */}
                    <td className={cls.td}>
                      {a.productor?.nombre
                        ? <ProducerBadge nombre={a.productor.nombre} compact />
                        : <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>—</span>
                      }
                    </td>

                    {/* Nacimiento */}
                    <td className={cls.td}>
                      <span style={{ fontSize: 12, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                        {formatDate(a.fechaNacimiento)}
                      </span>
                    </td>

                    {/* Acción */}
                    <td className={cls.td} style={{ textAlign: 'right', paddingRight: 16 }}>
                      <Link
                        to={`/asegurados/${a.id}`}
                        onClick={e => e.stopPropagation()}
                        aria-label={`Ver ficha completa de ${a.nombre}`}
                        style={{ color: 'var(--text-faint)', display: 'inline-flex' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-faint)')}
                      >
                        <IconArrowRight size={14} />
                      </Link>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>

        {/* Panel lateral */}
        <AnimatePresence>
          {selected && (
            <AseguradoPanel
              asegurado={selected}
              onClose={() => setSelected(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {showForm && <AseguradoForm onClose={() => setShowForm(false)} productores={productores} />}
    </div>
  );
}
