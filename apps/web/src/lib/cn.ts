/**
 * cn.ts — Design system para Gestión PAS
 * Soporta modo claro y oscuro via CSS custom properties definidas en index.css.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/* ── Design system ──────────────────────────────────────── */

export const cls = {
  /* ── Buttons ─────────────────────────────────────────── */
  btn:        'inline-flex items-center gap-1.5 font-semibold rounded transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] select-none focus-visible:outline-2 focus-visible:outline-offset-2',
  btnSm:      'px-3 py-1.5 text-xs',
  btnMd:      'px-4 py-2 text-sm',
  btnLg:      'px-5 py-2.5 text-sm',

  /* Primary */
  btnPrimary: 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white shadow-sm',

  /* Secondary */
  btnSecond:  'bg-[var(--btn-second-bg)] hover:opacity-80 text-[var(--btn-second-text)] border border-[var(--btn-second-border)]',

  /* Danger */
  btnDanger:  'bg-red-500/8 hover:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20 hover:border-red-500/35',

  /* Ghost */
  btnGhost:   'text-[var(--btn-ghost-text)] hover:text-[var(--text-secondary)] hover:bg-black/4 dark:hover:bg-white/5',

  /* ── Inputs ──────────────────────────────────────────── */
  input:      'input-base w-full px-3 py-2 text-sm rounded outline-none transition-colors border focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)]',
  inputError: 'border-red-500/50 bg-red-500/4 focus:border-red-500',
  select:     'input-base w-full px-3 py-2 text-sm rounded outline-none transition-colors border focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] cursor-pointer',
  textarea:   'input-base w-full px-3 py-2 text-sm rounded outline-none transition-colors border focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)] resize-none',
  label:      'block text-[11px] font-semibold txt-muted uppercase tracking-wider mb-1.5',

  /* ── Cards / surfaces ────────────────────────────────── */
  card:       'card-base rounded-md',
  cardPad:    'card-base rounded-md p-5',

  /* surface: panel principal */
  surface:    'surface rounded-sm overflow-hidden',

  /* ── Tables ──────────────────────────────────────────── */
  table:      'w-full text-sm',
  th:         'th-cell px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap',
  td:         'td-cell px-5 py-3.5',
  trHover:    'tr-hover cursor-pointer',

  /* ── Badges genéricos ────────────────────────────────── */
  badge:      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold',
  badgeGreen: 'bg-[var(--policy-active-bg)] text-[var(--policy-active-text)] ring-1 ring-[var(--policy-active-border)]',
  badgeAmber: 'bg-[var(--policy-grace-bg)] text-[var(--policy-grace-text)] ring-1 ring-[var(--policy-grace-border)]',
  badgeRed:   'bg-[var(--policy-cancelled-bg)] text-[var(--policy-cancelled-text)] ring-1 ring-[var(--policy-cancelled-border)]',
  badgeBlue:  'bg-[var(--claim-reported-bg)] text-[var(--claim-reported-text)] ring-1 ring-[var(--claim-reported-border)]',
  badgeGray:  'bg-[var(--badge-gray-bg)] text-[var(--badge-gray-text)] ring-1 ring-[var(--badge-gray-ring)]',
  badgeViolet:'bg-[var(--claim-docs-bg)] text-[var(--claim-docs-text)] ring-1 ring-[var(--claim-docs-border)]',

  /* ── Page typography ─────────────────────────────────── */
  pageTitle:    'text-xl font-bold txt-primary tracking-tight',
  sectionTitle: 'text-xs font-semibold txt-tertiary uppercase tracking-wider',

  /* ── Modal ───────────────────────────────────────────── */
  overlay:  'fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--modal-overlay)] backdrop-blur-sm',
  modal:    'modal-base rounded-lg w-full overflow-hidden shadow-xl',
  modalSm:  'max-w-md',
  modalMd:  'max-w-lg',
  modalLg:  'max-w-2xl',

  /* Modal divider */
  modalDivider: 'modal-divider-base border-b',
};

/* ── Helpers de badge por enum ──────────────────────────── */
import { EstadoPoliza, EstadoSiniestro, EstadoReclamo, TipoBien } from '@gestion-pas/types';

export const estadoPolicaBadge: Record<EstadoPoliza, string> = {
  [EstadoPoliza.ACTIVA]:     cls.badgeGreen,
  [EstadoPoliza.SUSPENDIDA]: cls.badgeAmber,
  [EstadoPoliza.ANULADA]:    cls.badgeRed,
};

export const estadoSiniestroBadge: Record<EstadoSiniestro, string> = {
  [EstadoSiniestro.ABIERTO]:     cls.badgeBlue,
  [EstadoSiniestro.EN_GESTION]:  cls.badgeAmber,
  [EstadoSiniestro.RESUELTO]:    cls.badgeGreen,
  [EstadoSiniestro.RECHAZADO]:   cls.badgeRed,
};

export const estadoReclamoBadge: Record<EstadoReclamo, string> = {
  [EstadoReclamo.ABIERTO]:    cls.badgeBlue,
  [EstadoReclamo.EN_GESTION]: cls.badgeAmber,
  [EstadoReclamo.RESUELTO]:   cls.badgeGreen,
};

export const estadoCuotaBadge: Record<string, string> = {
  pendiente: cls.badgeAmber,
  pagada:    cls.badgeGreen,
  rechazada: cls.badgeRed,
  vencida:   cls.badgeRed,
};

export const tipoBienBadge: Record<TipoBien, string> = {
  [TipoBien.AUTOMOTOR]: cls.badgeBlue,
  [TipoBien.HOGAR]:     cls.badgeGreen,
  [TipoBien.VIDA]:      cls.badgeViolet,
  [TipoBien.OTRO]:      cls.badgeGray,
};
