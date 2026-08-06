/**
 * CompaniasPage.tsx — Vista operativa de compañías aseguradoras
 *
 * Filas expandibles (acordeón) con información operativa completa.
 * Sin modificar el modelo de datos ni las APIs existentes.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { PeriodicidadRefacturacion } from '@gestion-pas/types';
import { useAuth } from '@/context/AuthContext';
import { cn, cls } from '@/lib/cn';
import {
  IconCompania, IconClose, IconPlus, IconChevronRight,
  IconVencimiento, IconPoliza,
} from '@/components/ui/icons';

/* ── Types ───────────────────────────────────────────────── */
interface Compania {
  id: string; nombre: string;
  periodoDGraciaDias: number | null;
  periodicidadRefacturacion: PeriodicidadRefacturacion | null;
  mecanismoNotificacion: string | null;
}

/* ── Helpers ─────────────────────────────────────────────── */
const PERIOD_LABEL: Record<PeriodicidadRefacturacion, string> = {
  [PeriodicidadRefacturacion.MENSUAL]:    'Mensual',
  [PeriodicidadRefacturacion.TRIMESTRAL]: 'Trimestral',
  [PeriodicidadRefacturacion.SEMESTRAL]:  'Semestral',
  [PeriodicidadRefacturacion.ANUAL]:      'Anual',
};

const PERIOD_ICON: Record<PeriodicidadRefacturacion, string> = {
  [PeriodicidadRefacturacion.MENSUAL]:    '1M',
  [PeriodicidadRefacturacion.TRIMESTRAL]: '3M',
  [PeriodicidadRefacturacion.SEMESTRAL]:  '6M',
  [PeriodicidadRefacturacion.ANUAL]:      '1A',
};

/** Nivel de urgencia de días de gracia */
function graceStyle(dias: number | null): { bg: string; text: string; border: string } {
  if (dias === null) return {
    bg: 'var(--badge-gray-bg)', text: 'var(--badge-gray-text)', border: 'var(--badge-gray-ring)',
  };
  if (dias <= 5) return {
    bg: 'var(--sla-warning-bg)', text: 'var(--sla-warning-text)', border: 'var(--sla-warning-border)',
  };
  return {
    bg: 'var(--policy-active-bg)', text: 'var(--policy-active-text)', border: 'var(--policy-active-border)',
  };
}

/* ── Schema ──────────────────────────────────────────────── */
const schema = z.object({
  nombre: z.string().min(2, 'Requerido'),
  periodoDGraciaDias: z.coerce.number().int().min(0).optional(),
  periodicidadRefacturacion: z.nativeEnum(PeriodicidadRefacturacion).optional().or(z.literal('')),
  mecanismoNotificacion: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

/* ── Form modal ──────────────────────────────────────────── */
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-sm font-bold txt-primary">Nueva compañía aseguradora</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar formulario"
            className="txt-faint hover:txt-primary transition-colors"
          >
            <IconClose size={14} />
          </button>
        </div>
        <div className="px-6 py-5">
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className={cls.label}>Nombre *</label>
                <input className={cn(cls.input, errors.nombre && cls.inputError)} {...register('nombre')} />
                {errors.nombre && <p className="text-xs text-[var(--policy-cancelled-text)]">{errors.nombre.message}</p>}
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
              <div
                className="flex items-start gap-2 mt-3 p-3 text-sm"
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
            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-[var(--border-subtle)]">
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

/* ── Fila expandible ─────────────────────────────────────── */
function CompaniaRow({ c, defaultOpen = false }: { c: Compania; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const gs = graceStyle(c.periodoDGraciaDias);

  return (
    <div
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        transition: 'background 0.1s ease',
      }}
    >
      {/* Row header */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={`compania-detail-${c.id}`}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 20px',
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Ícono compañía */}
        <div
          aria-hidden="true"
          style={{
            width: 36, height: 36, borderRadius: 4, flexShrink: 0,
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <IconCompania size={16} />
        </div>

        {/* Nombre */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {c.nombre}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            {/* Días de gracia */}
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '1px 7px', borderRadius: 3,
                background: gs.bg, color: gs.text, border: `1px solid ${gs.border}`,
                fontSize: 11, fontWeight: 600,
              }}
            >
              <IconVencimiento size={10} aria-hidden />
              {c.periodoDGraciaDias != null ? `${c.periodoDGraciaDias}d gracia` : 'Sin gracia'}
            </span>

            {/* Periodicidad */}
            {c.periodicidadRefacturacion && (
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '1px 7px', borderRadius: 3,
                  background: 'var(--badge-gray-bg)',
                  color: 'var(--badge-gray-text)',
                  border: '1px solid var(--badge-gray-ring)',
                  fontSize: 11, fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {PERIOD_ICON[c.periodicidadRefacturacion]}
              </span>
            )}

            {/* Canal de notificación */}
            {c.mecanismoNotificacion && (
              <span style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'capitalize' }}>
                {c.mecanismoNotificacion}
              </span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <span
          aria-hidden="true"
          style={{
            color: 'var(--text-faint)',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.18s ease',
            display: 'flex',
          }}
        >
          <IconChevronRight size={14} />
        </span>
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`compania-detail-${c.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '0 20px 18px 70px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 12,
              }}
            >
              {/* Días de gracia — detalle */}
              <InfoBlock
                label="Período de gracia"
                value={c.periodoDGraciaDias != null ? `${c.periodoDGraciaDias} días` : '—'}
                note="Días hábiles tras vencimiento"
              />

              {/* Periodicidad — detalle */}
              <InfoBlock
                label="Periodicidad de refacturación"
                value={c.periodicidadRefacturacion ? PERIOD_LABEL[c.periodicidadRefacturacion] : '—'}
              />

              {/* Canal de notificación */}
              <InfoBlock
                label="Canal de notificación"
                value={c.mecanismoNotificacion
                  ? c.mecanismoNotificacion.charAt(0).toUpperCase() + c.mecanismoNotificacion.slice(1)
                  : '—'}
              />

              {/* Ramos — placeholder informativo */}
              <InfoBlock
                label="Ramos habilitados"
                value="Automotor · Hogar · Vida"
                muted
              />

              {/* Reglas de documentación — placeholder */}
              <InfoBlock
                label="Documentación requerida"
                value="DNI + Póliza + Comprobante"
                muted
              />

              {/* Última actualización */}
              <InfoBlock
                label="Última actualización"
                value="—"
                muted
              />
            </div>

            {/* Acciones */}
            <div
              style={{
                padding: '10px 20px 14px 70px',
                display: 'flex', gap: 8,
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <button
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 3,
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <IconPoliza size={12} />
                Ver pólizas
              </button>
              <button
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 3,
                  background: 'none',
                  border: '1px solid var(--border-subtle)',
                  fontSize: 12, fontWeight: 600, color: 'var(--text-faint)',
                  cursor: 'pointer',
                }}
              >
                Editar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoBlock({ label, value, note, muted = false }: {
  label: string; value: string; note?: string; muted?: boolean;
}) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
        {label}
      </p>
      <p style={{ fontSize: 13, fontWeight: muted ? 400 : 600, color: muted ? 'var(--text-faint)' : 'var(--text-primary)' }}>
        {value}
      </p>
      {note && <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 1 }}>{note}</p>}
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────────── */
function CompaniaSkeleton() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 4, flexShrink: 0, animationDelay: `${i * 0.08}s` }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="skeleton" style={{ width: 180, height: 14, borderRadius: 3, animationDelay: `${i * 0.08}s` }} />
            <div className="skeleton" style={{ width: 120, height: 11, borderRadius: 3, animationDelay: `${i * 0.1}s` }} />
          </div>
        </div>
      ))}
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   CompaniasPage
════════════════════════════════════════════════════════════ */
export default function CompaniasPage() {
  const { isOrganizador } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { data: companias = [], isLoading } = useQuery<Compania[]>({
    queryKey: ['companias-list'],
    queryFn: () => api.get('/companias').then((r) => r.data),
  });

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className={cls.pageTitle}>Compañías Aseguradoras</h1>
          {!isLoading && (
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
              {companias.length} compañía{companias.length !== 1 ? 's' : ''} registrada{companias.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {isOrganizador && (
          <button
            onClick={() => setShowForm(true)}
            className={cn(cls.btn, cls.btnMd, cls.btnPrimary)}
            aria-label="Agregar nueva compañía"
          >
            <IconPlus size={13} />
            Nueva compañía
          </button>
        )}
      </div>

      {/* Panel de compañías */}
      <motion.div
        className="surface rounded-sm overflow-hidden"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        role="list"
        aria-label="Listado de compañías aseguradoras"
      >
        {isLoading && <CompaniaSkeleton />}

        {!isLoading && companias.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <IconCompania size={28} aria-hidden />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>
                No hay compañías registradas
              </p>
            </div>
          </div>
        )}

        {companias.map((c, i) => (
          <div key={c.id} role="listitem">
            <CompaniaRow c={c} defaultOpen={i === 0 && companias.length === 1} />
          </div>
        ))}
      </motion.div>

      {showForm && <CompaniaForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
