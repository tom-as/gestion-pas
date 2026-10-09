/**
 * icons.tsx — Capa de iconos semánticos para Gestión PAS
 *
 * Todos los SVGs están inline (sin dependencia externa).
 * Las variantes de tamaño se controlan con `size` (por defecto 16).
 * Usar ESTOS nombres semánticos en lugar de formas genéricas (ej: users, alertTri).
 */

interface IconProps {
  size?: number;
  className?: string;
  'aria-hidden'?: boolean;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24' as const,
  fill: 'none' as const,
  stroke: 'currentColor' as const,
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

/* ── Entidades principales ─────────────────────────────── */

export function IconAsegurado({ size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function IconProductor({ size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  );
}

export function IconPoliza({ size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export function IconEndoso({ size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="12" y1="8" x2="12" y2="16" />
    </svg>
  );
}

export function IconSiniestro({ size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function IconReclamo({ size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function IconDocumento({ size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

export function IconVencimiento({ size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="12" y1="14" x2="12" y2="18" />
      <line x1="10" y1="16" x2="14" y2="16" />
    </svg>
  );
}

export function IconCompania({ size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}

/* ── Ramos ─────────────────────────────────────────────── */

export function IconAutomotor({ size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <rect x="1" y="8" width="22" height="9" rx="2" />
      <path d="M5 8V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

export function IconHogar({ size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function IconVida({ size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function IconComercio({ size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

/* ── Navegación y UI ────────────────────────────────────── */

export function IconDashboard({ size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function IconReportes({ size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

export function IconBienes({ size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

export function IconSearch({ size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function IconBell({ size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function IconSun({ size = 14, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export function IconMoon({ size = 14, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function IconLogOut({ size = 14, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function IconChevronRight({ size = 14, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function IconClose({ size = 14, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden} strokeWidth={2.5}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function IconPlus({ size = 14, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden} strokeWidth={2.5}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function IconFilter({ size = 14, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export function IconArrowRight({ size = 14, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function IconTrendUp({ size = 14, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

export function IconClock({ size = 14, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function IconCheck({ size = 14, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden} strokeWidth={2.5}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function IconAttachment({ size = 14, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

export function IconExportar({ size = 16, className, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden={ariaHidden}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

/* ── Mapa de iconos por sección de nav ─────────────────── */
export const NavIcon = {
  dashboard:  IconDashboard,
  asegurados: IconAsegurado,
  bienes:     IconBienes,
  polizas:    IconPoliza,
  siniestros: IconSiniestro,
  reclamos:   IconReclamo,
  documentos: IconDocumento,
  productores:IconProductor,
  companias:  IconCompania,
  reportes:   IconReportes,
  exportar:   IconExportar,
} as const;
