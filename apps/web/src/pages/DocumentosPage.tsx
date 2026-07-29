import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { formatDate } from '@/lib/format';
import { EntidadDocumento, TipoDocumento } from '@gestion-pas/types';
import { cn, cls } from '@/lib/cn';

/* ── Tipos ──────────────────────────────────────────────── */
interface Documento {
  id: string; tipo: TipoDocumento; entidadVinculada: EntidadDocumento;
  archivoUrl: string; tramiteContexto: string | null; fechaIncorporacion: string;
}

const TIPO_LABEL: Record<TipoDocumento, string> = {
  [TipoDocumento.POLIZA]: 'Poliza',
  [TipoDocumento.COMPROBANTE_PAGO]: 'Comprobante de pago',
  [TipoDocumento.FOTOGRAFIA_DANOS]: 'Fotografia de danos',
  [TipoDocumento.DOCUMENTACION_PERSONAL]: 'Documentacion personal',
  [TipoDocumento.FACTURA_ACCESORIOS]: 'Factura de accesorios',
};

const ENTIDAD_LABEL: Record<EntidadDocumento, string> = {
  [EntidadDocumento.ASEGURADO]: 'Asegurado',
  [EntidadDocumento.BIEN]: 'Bien',
  [EntidadDocumento.POLIZA]: 'Poliza',
  [EntidadDocumento.CUOTA]: 'Cuota',
  [EntidadDocumento.SINIESTRO]: 'Siniestro',
  [EntidadDocumento.RECLAMO]: 'Reclamo',
};

/* ── Schema ──────────────────────────────────────────────── */
const schema = z.object({
  tipo: z.nativeEnum(TipoDocumento),
  entidadVinculada: z.nativeEnum(EntidadDocumento),
  entidadId: z.string().uuid('Debe ser un UUID valido'),
  archivoUrl: z.string().url('URL invalida'),
  tramiteContexto: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

/* ══════════════════════════════════════════════════════════
   FORMULARIO ALTA
══════════════════════════════════════════════════════════ */
function DocumentoForm({ onClose, defaultEntidad, defaultEntidadId }: {
  onClose: () => void;
  defaultEntidad?: EntidadDocumento;
  defaultEntidadId?: string;
}) {
  const qc = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        tipo: TipoDocumento.POLIZA,
        entidadVinculada: defaultEntidad ?? EntidadDocumento.POLIZA,
        entidadId: defaultEntidadId ?? '',
      },
    });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => api.post('/documentos', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documentos'] });
      onClose();
    },
    onError: (err: unknown) => {
      setServerError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error.',
      );
    },
  });

  return (
    <div className={cls.overlay}>
      <div className={cn(cls.modal, cls.modalMd)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
          <span className="text-base font-semibold text-slate-200">Agregar documento</span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="px-6 py-5">
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className={cls.label}>Tipo de documento *</label>
                <select className={cls.select} {...register('tipo')}>
                  {Object.entries(TIPO_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className={cls.label}>Entidad vinculada *</label>
                <select className={cls.select} {...register('entidadVinculada')}>
                  {Object.entries(ENTIDAD_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <label className={cls.label}>ID de la entidad (UUID) *</label>
                <input className={cn(cls.input, errors.entidadId ? cls.inputError : '')}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  {...register('entidadId')} />
                {errors.entidadId && <span className="text-xs text-red-500 mt-0.5">{errors.entidadId.message}</span>}
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <label className={cls.label}>URL del archivo *</label>
                <input className={cn(cls.input, errors.archivoUrl ? cls.inputError : '')}
                  placeholder="https://storage.example.com/docs/archivo.pdf"
                  {...register('archivoUrl')} />
                {errors.archivoUrl && <span className="text-xs text-red-500 mt-0.5">{errors.archivoUrl.message}</span>}
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <label className={cls.label}>Contexto del tramite</label>
                <input className={cls.input}
                  placeholder="Ej: Poliza emitida en renovacion 2024"
                  {...register('tramiteContexto')} />
              </div>
            </div>
            {serverError && <p className="mt-3 text-sm text-red-400 bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2">{serverError}</p>}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/6">
              <button type="button" className={cn(cls.btn, cls.btnMd, cls.btnSecond)} onClick={onClose}>Cancelar</button>
              <button type="submit" className={cn(cls.btn, cls.btnMd, cls.btnPrimary)} disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGINA PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function DocumentosPage() {
  const [showForm, setShowForm] = useState(false);
  const [filtroEntidad, setFiltroEntidad] = useState<EntidadDocumento>(EntidadDocumento.POLIZA);
  const [filtroId, setFiltroId] = useState('');
  const [buscando, setBuscando] = useState(false);

  const { data: documentos = [], isLoading, refetch } = useQuery<Documento[]>({
    queryKey: ['documentos', filtroEntidad, filtroId],
    queryFn: () =>
      api.get(`/documentos?entidad=${filtroEntidad}&entidadId=${filtroId}`).then((r) => r.data),
    enabled: buscando && filtroId.length === 36,
  });

  const handleBuscar = () => {
    if (filtroId.length === 36) setBuscando(true);
    else setBuscando(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className={cls.pageTitle}>Documentos</h1>
        <button className={cn(cls.btn, cls.btnMd, cls.btnPrimary)} onClick={() => setShowForm(true)}>
          + Agregar documento
        </button>
      </div>

      {/* Filtro por entidad */}
      <div className={cn(cls.cardPad, 'mb-5')}>
        <h2 className={cn(cls.sectionTitle, 'mb-4')}>Buscar documentos por entidad</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1" style={{ minWidth: 160 }}>
            <label className={cls.label}>Tipo de entidad</label>
            <select className={cls.select}
              value={filtroEntidad}
              onChange={(e) => { setFiltroEntidad(e.target.value as EntidadDocumento); setBuscando(false); }}>
              {Object.entries(ENTIDAD_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1" style={{ minWidth: 280 }}>
            <label className={cls.label}>UUID de la entidad</label>
            <input className={cls.input}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={filtroId}
              onChange={(e) => { setFiltroId(e.target.value); setBuscando(false); }} />
          </div>
          <button className={cn(cls.btn, cls.btnMd, cls.btnSecond)} onClick={handleBuscar}>
            Buscar
          </button>
        </div>
      </div>

      {/* Resultados */}
      <div className={cn(cls.card, 'overflow-hidden')}>
        <table className={cls.table}>
          <thead>
            <tr>
              <th className={cls.th}>Tipo</th>
              <th className={cls.th}>Entidad</th>
              <th className={cls.th}>Contexto</th>
              <th className={cls.th}>Fecha</th>
              <th className={cls.th}>Archivo</th>
            </tr>
          </thead>
          <tbody>
            {!buscando && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                Selecciona una entidad e ingresa su UUID para ver documentos.
              </td></tr>
            )}
            {buscando && isLoading && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400 text-sm">Cargando...</td></tr>}
            {buscando && !isLoading && documentos.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">Sin documentos para esta entidad.</td></tr>
            )}
            {documentos.map((d) => (
              <tr key={d.id} className={cls.trHover}>
                <td className={cls.td}><span className={cn(cls.badge, cls.badgeGray)}>{TIPO_LABEL[d.tipo]}</span></td>
                <td className={cls.td}>{ENTIDAD_LABEL[d.entidadVinculada]}</td>
                <td className={cls.td}>{d.tramiteContexto ?? '—'}</td>
                <td className={cls.td}>{formatDate(d.fechaIncorporacion)}</td>
                <td className={cls.td}>
                  <a href={d.archivoUrl} target="_blank" rel="noreferrer"
                    className={cn(cls.btn, cls.btnSm, cls.btnSecond, 'no-underline')}>
                    Abrir
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && <DocumentoForm onClose={() => { setShowForm(false); refetch(); }} />}
    </div>
  );
}
