/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';

/* ── Zonas de daño definidas sobre el SVG (viewBox 0 0 500 220) ──── */
export interface ZonaDano {
  id: string;
  label: string;
  path: string;           // SVG path data
}

export const ZONAS: ZonaDano[] = [
  {
    id: 'frente',
    label: 'Frente',
    path: 'M30,80 L30,140 L80,155 L80,65 Z',
  },
  {
    id: 'paragolpes_delantero',
    label: 'Paragolpes delantero',
    path: 'M10,90 L30,80 L30,140 L10,130 Z',
  },
  {
    id: 'capo',
    label: 'Capo',
    path: 'M80,65 L80,155 L160,160 L160,60 Z',
  },
  {
    id: 'techo',
    label: 'Techo',
    path: 'M160,55 L160,165 L340,165 L340,55 Z',
  },
  {
    id: 'baul',
    label: 'Baul / Maletero',
    path: 'M340,60 L340,160 L420,155 L420,65 Z',
  },
  {
    id: 'paragolpes_trasero',
    label: 'Paragolpes trasero',
    path: 'M420,70 L490,80 L490,140 L420,150 Z',
  },
  {
    id: 'puerta_delantera_izq',
    label: 'Puerta delantera izquierda',
    path: 'M155,165 L155,200 L260,200 L260,165 Z',
  },
  {
    id: 'puerta_trasera_izq',
    label: 'Puerta trasera izquierda',
    path: 'M265,165 L265,200 L345,200 L345,165 Z',
  },
  {
    id: 'puerta_delantera_der',
    label: 'Puerta delantera derecha',
    path: 'M155,20 L155,55 L260,55 L260,20 Z',
  },
  {
    id: 'puerta_trasera_der',
    label: 'Puerta trasera derecha',
    path: 'M265,20 L265,55 L345,55 L345,20 Z',
  },
  {
    id: 'guardabarro_del_izq',
    label: 'Guardabarro delantero izquierdo',
    path: 'M80,155 L155,160 L155,200 L80,195 Z',
  },
  {
    id: 'guardabarro_del_der',
    label: 'Guardabarro delantero derecho',
    path: 'M80,20 L80,65 L155,60 L155,25 Z',
  },
  {
    id: 'guardabarro_tra_izq',
    label: 'Guardabarro trasero izquierdo',
    path: 'M345,165 L420,160 L420,195 L345,200 Z',
  },
  {
    id: 'guardabarro_tra_der',
    label: 'Guardabarro trasero derecho',
    path: 'M345,20 L345,55 L420,60 L420,25 Z',
  },
];

/* ── Ruedas (decorativas, no clickeables) ─────────────────── */
const RUEDAS = [
  { cx: 130, cy: 205, r: 22 },
  { cx: 130, cy: 15,  r: 22 },
  { cx: 370, cy: 205, r: 22 },
  { cx: 370, cy: 15,  r: 22 },
];

/* ── Props ──────────────────────────────────────────────── */
interface Props {
  /** IDs de zonas marcadas (controlado desde el padre) */
  zonasSeleccionadas: string[];
  onChange: (zonas: string[]) => void;
  /** Solo lectura (detalle siniestro) */
  readOnly?: boolean;
}

export default function VehiculoSilueta({ zonasSeleccionadas, onChange, readOnly = false }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const toggle = (id: string) => {
    if (readOnly) return;
    onChange(
      zonasSeleccionadas.includes(id)
        ? zonasSeleccionadas.filter((z) => z !== id)
        : [...zonasSeleccionadas, id],
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <svg
        viewBox="0 0 500 220"
        className="w-full max-w-[520px] h-auto block rounded-lg border border-slate-200 bg-slate-50"
        role="img"
        aria-label="Silueta de vehiculo — marcar zonas de dano"
      >
        {/* Contorno del auto (decorativo) */}
        <rect x="10" y="10" width="480" height="200" rx="28" ry="28"
          fill="#f0f2f5" stroke="#c8cdd4" strokeWidth="1.5" />

        {/* Ruedas */}
        {RUEDAS.map((r) => (
          <circle key={`${r.cx}-${r.cy}`} cx={r.cx} cy={r.cy} r={r.r}
            fill="#4b5563" stroke="#374151" strokeWidth="1.5" />
        ))}

        {/* Zonas de dano — inline styles para fill/stroke dinámicos en SVG */}
        {ZONAS.map((zona) => {
          const selected = zonasSeleccionadas.includes(zona.id);
          const isHovered = hovered === zona.id && !readOnly;
          return (
            <path
              key={zona.id}
              d={zona.path}
              style={{
                fill: selected
                  ? (readOnly ? 'rgba(239,68,68,0.22)' : 'rgba(239,68,68,0.30)')
                  : isHovered
                    ? 'rgba(59,130,212,0.18)'
                    : 'rgba(100,116,139,0.12)',
                stroke: selected ? '#dc2626' : isHovered ? '#3b82d4' : '#94a3b8',
                strokeWidth: selected ? 2 : isHovered ? 1.5 : 1,
                cursor: readOnly ? 'default' : 'pointer',
                transition: 'fill 0.12s, stroke 0.12s',
              }}
              onClick={() => toggle(zona.id)}
              onMouseEnter={() => !readOnly && setHovered(zona.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <title>{zona.label}{selected ? ' — DANO MARCADO' : ''}</title>
            </path>
          );
        })}
      </svg>

      {/* Tooltip del hover */}
      {hovered && !readOnly && (
        <p className="text-xs txt-tertiary min-h-[1.2em]">
          {ZONAS.find((z) => z.id === hovered)?.label}
          {zonasSeleccionadas.includes(hovered) ? ' — click para desmarcar' : ' — click para marcar dano'}
        </p>
      )}

      {/* Leyenda de zonas seleccionadas */}
      {zonasSeleccionadas.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium txt-tertiary uppercase tracking-wide">Zonas marcadas:</span>
          <div className="flex flex-wrap gap-1.5">
            {zonasSeleccionadas.map((id) => (
              <span key={id} className="inline-flex items-center gap-1 bg-red-50 text-red-800 border border-red-200 rounded px-2 py-0.5 text-xs font-medium">
                {ZONAS.find((z) => z.id === id)?.label ?? id}
                {!readOnly && (
                  <button
                    className="text-red-600 opacity-60 hover:opacity-100 leading-none flex-shrink-0"
                    onClick={() => toggle(id)}
                    aria-label="Quitar zona"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
