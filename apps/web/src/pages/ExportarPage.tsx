import { useRef, useState } from 'react';
import api from '@/lib/api';
import { IconExportar } from '@/components/ui/icons';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

interface ExportItem {
  key: string;
  label: string;
  description: string;
  filename: string;
}

interface ImportItem {
  key: string;
  order: number;
  label: string;
  description: string;
  endpoint: string;
}

interface ImportResult {
  inserted: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

interface ImportState {
  file: File | null;
  loading: boolean;
  result: ImportResult | null;
  error: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Datos estáticos
// ─────────────────────────────────────────────────────────────────────────────

const EXPORTS: ExportItem[] = [
  {
    key: 'asegurados',
    label: 'Asegurados',
    description: 'Datos personales de todos los asegurados con el productor asignado.',
    filename: 'asegurados.csv',
  },
  {
    key: 'productores',
    label: 'Productores',
    description: 'Productores registrados en la organización con sus datos de contacto.',
    filename: 'productores.csv',
  },
  {
    key: 'companias',
    label: 'Compañías aseguradoras',
    description: 'Compañías con período de gracia, periodicidad y mecanismo de notificación.',
    filename: 'companias.csv',
  },
  {
    key: 'bienes',
    label: 'Bienes asegurados',
    description: 'Todos los bienes (automotores, hogar, vida, otros) con sus atributos completos.',
    filename: 'bienes.csv',
  },
  {
    key: 'polizas',
    label: 'Pólizas',
    description: 'Pólizas con vigencias, importe, estado y referencias al asegurado, bien, productor y compañía.',
    filename: 'polizas.csv',
  },
  {
    key: 'endosos',
    label: 'Endosos',
    description: 'Historial de endosos vinculados a su póliza de origen.',
    filename: 'endosos.csv',
  },
  {
    key: 'cuotas',
    label: 'Cuotas',
    description: 'Cuotas de cada póliza con estado de pago, vencimiento y medio de pago.',
    filename: 'cuotas.csv',
  },
  {
    key: 'siniestros',
    label: 'Siniestros',
    description: 'Siniestros con tipo, relato, estado y referencias al bien, asegurado y compañía.',
    filename: 'siniestros.csv',
  },
  {
    key: 'reclamos',
    label: 'Reclamos',
    description: 'Reclamos administrativos y de facturación con estado y fecha de apertura.',
    filename: 'reclamos.csv',
  },
];

// Orden de importación respeta dependencias entre entidades
const IMPORTS: ImportItem[] = [
  { key: 'companias',   order: 1, label: 'Compañías aseguradoras', description: 'Sin dependencias — importar primero.',                                        endpoint: 'companias'   },
  { key: 'productores', order: 2, label: 'Productores',            description: 'Requiere que el organizador exista (se toma del usuario autenticado).',        endpoint: 'productores' },
  { key: 'asegurados',  order: 3, label: 'Asegurados',             description: 'Requiere productores importados.',                                             endpoint: 'asegurados'  },
  { key: 'bienes',      order: 4, label: 'Bienes asegurados',      description: 'Requiere asegurados importados.',                                              endpoint: 'bienes'      },
  { key: 'polizas',     order: 5, label: 'Pólizas',                description: 'Requiere asegurados, bienes, productores y compañías.',                        endpoint: 'polizas'     },
  { key: 'endosos',     order: 6, label: 'Endosos',                description: 'Requiere pólizas importadas.',                                                 endpoint: 'endosos'     },
  { key: 'cuotas',      order: 7, label: 'Cuotas',                 description: 'Requiere pólizas importadas.',                                                 endpoint: 'cuotas'      },
  { key: 'siniestros',  order: 8, label: 'Siniestros',             description: 'Requiere asegurados, bienes, productores y compañías.',                        endpoint: 'siniestros'  },
  { key: 'reclamos',    order: 9, label: 'Reclamos',               description: 'Requiere asegurados, productores y compañías.',                                endpoint: 'reclamos'    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function downloadCsv(filename: string): Promise<void> {
  const response = await api.get(`/export/${filename}`, { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function uploadCsv(endpoint: string, file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<ImportResult>(`/import/${endpoint}`, formData);
  return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponente: fila de resultado del import
// ─────────────────────────────────────────────────────────────────────────────

function ImportResultBadges({ result }: { result: ImportResult }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-2 space-y-1">
      <div className="flex flex-wrap gap-2">
        {result.inserted > 0 && (
          <span
            className="text-xs px-2 py-0.5 rounded font-medium"
            style={{ background: 'rgba(16,201,122,0.12)', color: '#10c97a', border: '1px solid rgba(16,201,122,0.25)' }}
          >
            ✓ {result.inserted} insertado{result.inserted !== 1 ? 's' : ''}
          </span>
        )}
        {result.skipped > 0 && (
          <span
            className="text-xs px-2 py-0.5 rounded font-medium"
            style={{ background: 'rgba(240,160,32,0.12)', color: '#f0a020', border: '1px solid rgba(240,160,32,0.25)' }}
          >
            ↷ {result.skipped} omitido{result.skipped !== 1 ? 's' : ''} (ya existían)
          </span>
        )}
        {result.errors.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs px-2 py-0.5 rounded font-medium"
            style={{ background: 'rgba(255,80,80,0.12)', color: '#ff5050', border: '1px solid rgba(255,80,80,0.25)', cursor: 'pointer' }}
          >
            ✕ {result.errors.length} error{result.errors.length !== 1 ? 'es' : ''} {expanded ? '▲' : '▼'}
          </button>
        )}
      </div>
      {expanded && result.errors.length > 0 && (
        <ul
          className="text-xs space-y-0.5 pl-1 mt-1"
          style={{ color: '#ff8080', maxHeight: 120, overflowY: 'auto' }}
        >
          {result.errors.map((e, i) => (
            <li key={i}>
              Fila {e.row}: {e.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────

export default function ExportarPage() {
  // ── Export state ──────────────────────────────────────────────────────────
  const [exportLoading, setExportLoading] = useState<Record<string, boolean>>({});
  const [exportError, setExportError] = useState<Record<string, string>>({});

  // ── Import state ──────────────────────────────────────────────────────────
  const [importStates, setImportStates] = useState<Record<string, ImportState>>(() =>
    Object.fromEntries(
      IMPORTS.map((item) => [item.key, { file: null, loading: false, result: null, error: '' }]),
    ),
  );
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Export handlers ───────────────────────────────────────────────────────

  async function handleDownload(item: ExportItem) {
    setExportLoading((prev) => ({ ...prev, [item.key]: true }));
    setExportError((prev) => ({ ...prev, [item.key]: '' }));
    try {
      await downloadCsv(item.filename);
    } catch {
      setExportError((prev) => ({ ...prev, [item.key]: 'Error al descargar. Intentá de nuevo.' }));
    } finally {
      setExportLoading((prev) => ({ ...prev, [item.key]: false }));
    }
  }

  // ── Import handlers ───────────────────────────────────────────────────────

  function handleFileChange(key: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImportStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], file, result: null, error: '' },
    }));
  }

  async function handleUpload(item: ImportItem) {
    const state = importStates[item.key];
    if (!state.file) return;
    setImportStates((prev) => ({
      ...prev,
      [item.key]: { ...prev[item.key], loading: true, result: null, error: '' },
    }));
    try {
      const result = await uploadCsv(item.endpoint, state.file);
      setImportStates((prev) => ({
        ...prev,
        [item.key]: { ...prev[item.key], loading: false, result },
      }));
      // Reset file input visually
      const ref = fileInputRefs.current[item.key];
      if (ref) ref.value = '';
      setImportStates((prev) => ({
        ...prev,
        [item.key]: { ...prev[item.key], file: null },
      }));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al importar. Revisá el archivo y volvé a intentar.';
      setImportStates((prev) => ({
        ...prev,
        [item.key]: { ...prev[item.key], loading: false, error: msg },
      }));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const sectionTitle = (title: string, subtitle: string) => (
    <div className="mb-4">
      <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {subtitle}
      </p>
    </div>
  );

  const tableHeader = (cols: string[]) => (
    <div
      className="grid text-xs font-semibold uppercase tracking-widest px-5 py-3"
      style={{
        gridTemplateColumns: cols.join(' '),
        background: 'var(--surface-record)',
        borderBottom: '1px solid var(--border-subtle)',
        color: 'var(--text-faint)',
      }}
    >
      {['Entidad', 'Descripción', 'Acción'].map((h) => <span key={h}>{h}</span>)}
    </div>
  );

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Transferencia de datos
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Exportá o importá datos en masa en formato <code>.csv</code>. Todos los campos necesarios
          para una futura reimportación están incluidos en los archivos exportados.
        </p>
      </div>

      {/* ── EXPORT ─────────────────────────────────────────────────────────── */}
      {sectionTitle('Exportar', 'Descargá cualquier entidad como archivo .csv.')}

      <div
        className="rounded-lg overflow-hidden mb-10"
        style={{ border: '1px solid var(--border-subtle)' }}
      >
        {tableHeader(['1fr', '2fr', 'auto'])}

        {EXPORTS.map((item, idx) => (
          <div
            key={item.key}
            className="grid items-center px-5 py-4 gap-4"
            style={{
              gridTemplateColumns: '1fr 2fr auto',
              borderBottom: idx < EXPORTS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              background: 'var(--surface-card)',
            }}
          >
            {/* Label */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                {item.label}
              </span>
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  background: 'rgba(0,212,255,0.08)',
                  color: 'var(--text-faint)',
                  border: '1px solid rgba(0,212,255,0.12)',
                }}
              >
                {item.filename}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {item.description}
            </p>

            {/* Action */}
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => handleDownload(item)}
                disabled={exportLoading[item.key]}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded transition-colors"
                style={{
                  background: exportLoading[item.key] ? 'rgba(0,212,255,0.06)' : 'rgba(0,212,255,0.10)',
                  color: exportLoading[item.key] ? 'var(--text-faint)' : '#00d4ff',
                  border: '1px solid rgba(0,212,255,0.20)',
                  cursor: exportLoading[item.key] ? 'not-allowed' : 'pointer',
                  minWidth: 140,
                  justifyContent: 'center',
                }}
              >
                <IconExportar size={13} />
                {exportLoading[item.key] ? 'Descargando…' : 'Descargar CSV'}
              </button>
              {exportError[item.key] && (
                <span className="text-xs" style={{ color: 'var(--sla-critical-text)' }}>
                  {exportError[item.key]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── IMPORT ─────────────────────────────────────────────────────────── */}
      {/* Divider */}
      <div
        className="mb-8"
        style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 32 }}
      >
        {sectionTitle(
          'Importar datos',
          'Subí un archivo .csv exportado previamente. Respetá el orden numérico para mantener las dependencias entre entidades.',
        )}
      </div>

      {/* Import note */}
      <div
        className="rounded-md px-4 py-3 mb-5 text-sm"
        style={{
          background: 'rgba(240,160,32,0.07)',
          border: '1px solid rgba(240,160,32,0.20)',
          color: '#f0a020',
        }}
      >
        <strong>Importante:</strong> las filas que ya existen (mismo DNI/CUIL, número de póliza, etc.)
        se omiten sin error. Las filas con referencias no encontradas se reportan como errores y
        no se insertan. Nunca se eliminan datos existentes.
      </div>

      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--border-subtle)' }}
      >
        {/* Header */}
        <div
          className="grid text-xs font-semibold uppercase tracking-widest px-5 py-3"
          style={{
            gridTemplateColumns: '32px 1fr 2fr 1fr',
            background: 'var(--surface-record)',
            borderBottom: '1px solid var(--border-subtle)',
            color: 'var(--text-faint)',
          }}
        >
          <span>#</span>
          <span>Entidad</span>
          <span>Descripción</span>
          <span>Archivo + Acción</span>
        </div>

        {IMPORTS.map((item, idx) => {
          const state = importStates[item.key];
          return (
            <div
              key={item.key}
              className="grid items-start px-5 py-4 gap-4"
              style={{
                gridTemplateColumns: '32px 1fr 2fr 1fr',
                borderBottom: idx < IMPORTS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                background: 'var(--surface-card)',
              }}
            >
              {/* Order badge */}
              <span
                className="text-xs font-bold w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: 'rgba(0,212,255,0.10)',
                  color: '#00d4ff',
                  border: '1px solid rgba(0,212,255,0.20)',
                }}
              >
                {item.order}
              </span>

              {/* Label */}
              <span className="font-medium text-sm pt-0.5" style={{ color: 'var(--text-primary)' }}>
                {item.label}
              </span>

              {/* Description */}
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {item.description}
              </p>

              {/* File picker + upload + result */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <label
                    className="flex-1 min-w-0 flex items-center gap-2 px-2.5 py-1.5 rounded text-xs cursor-pointer truncate"
                    style={{
                      background: 'var(--surface-record)',
                      border: '1px solid var(--border-subtle)',
                      color: state.file ? 'var(--text-primary)' : 'var(--text-faint)',
                    }}
                  >
                    <input
                      ref={(el) => { fileInputRefs.current[item.key] = el; }}
                      type="file"
                      accept=".csv"
                      className="sr-only"
                      onChange={(e) => handleFileChange(item.key, e)}
                    />
                    <span className="truncate">
                      {state.file ? state.file.name : 'Elegir archivo .csv'}
                    </span>
                  </label>

                  <button
                    onClick={() => handleUpload(item)}
                    disabled={!state.file || state.loading}
                    className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded transition-colors"
                    style={{
                      background: state.file && !state.loading
                        ? 'rgba(16,201,122,0.12)'
                        : 'rgba(16,201,122,0.04)',
                      color: state.file && !state.loading ? '#10c97a' : 'var(--text-faint)',
                      border: '1px solid rgba(16,201,122,0.20)',
                      cursor: state.file && !state.loading ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {state.loading ? 'Subiendo…' : 'Subir'}
                  </button>
                </div>

                {/* Result */}
                {state.result && <ImportResultBadges result={state.result} />}

                {/* API-level error */}
                {state.error && (
                  <p className="text-xs" style={{ color: '#ff5050' }}>
                    {state.error}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="mt-4 text-xs" style={{ color: 'var(--text-faint)' }}>
        Los archivos exportados incluyen el ID propio y las claves naturales de cada relación para
        garantizar una reimportación completa y sin pérdida de datos.
      </p>
    </div>
  );
}
