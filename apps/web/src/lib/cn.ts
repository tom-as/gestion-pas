/**
 * cn.ts — Design system dark-navy para Gestión PAS
 *
 * Regla fundamental: NINGUNA clase usa colores "light" (`bg-white`, `bg-slate-50`,
 * `text-slate-900`, `dark:` prefijos). Toda la app es dark-navy permanente.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/* ── Design system ──────────────────────────────────────── */

export const cls = {
  /* ── Buttons ─────────────────────────────────────────── */
  btn:        'inline-flex items-center gap-1.5 font-semibold rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] select-none',
  btnSm:      'px-3 py-1.5 text-xs',
  btnMd:      'px-4 py-2.5 text-sm',
  btnLg:      'px-6 py-3 text-sm',

  /* Primary — accent blue con glow */
  btnPrimary: 'bg-accent-500 hover:bg-accent-400 text-white shadow-[0_0_0_1px_rgba(61,107,255,0.5),0_4px_16px_rgba(61,107,255,0.3)] hover:shadow-[0_0_0_1px_rgba(61,107,255,0.65),0_6px_24px_rgba(61,107,255,0.42)]',

  /* Secondary — glass surface */
  btnSecond:  'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 hover:border-white/20',

  /* Danger */
  btnDanger:  'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40',

  /* Ghost */
  btnGhost:   'text-slate-400 hover:text-slate-200 hover:bg-white/5',

  /* ── Inputs ──────────────────────────────────────────── */
  input:      'w-full px-4 py-2.5 text-sm bg-navy-700 border border-white/10 rounded-xl outline-none transition-all duration-200 text-slate-100 placeholder:text-slate-600 hover:border-white/20 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20',
  inputError: 'border-red-500/50 bg-red-500/5 focus:border-red-500 focus:ring-red-500/20',
  select:     'w-full px-4 py-2.5 text-sm bg-navy-700 border border-white/10 rounded-xl outline-none transition-all duration-200 text-slate-100 hover:border-white/20 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 cursor-pointer',
  textarea:   'w-full px-4 py-2.5 text-sm bg-navy-700 border border-white/10 rounded-xl outline-none transition-all duration-200 text-slate-100 placeholder:text-slate-600 hover:border-white/20 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 resize-none',
  label:      'block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5',

  /* ── Cards / surfaces ────────────────────────────────── */
  /* card: para paneles pequeños embebidos */
  card:       'rounded-xl border border-white/6 bg-navy-700/50',
  cardPad:    'rounded-xl border border-white/6 bg-navy-700/50 p-6',

  /* surface: reemplaza bg-white dark:bg-slate-900 — panel principal */
  surface:    'surface rounded-xl overflow-hidden',

  /* ── Tables ──────────────────────────────────────────── */
  table:      'w-full text-sm',
  th:         'px-5 py-3.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-widest bg-navy-800/70 border-b border-white/5 whitespace-nowrap',
  td:         'px-5 py-4 text-slate-300 border-b border-white/[0.04]',
  trHover:    'tr-hover cursor-pointer',

  /* ── Badges ──────────────────────────────────────────── */
  badge:      'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold tracking-wide',
  badgeGreen: 'bg-emerald-500/12 text-emerald-400 ring-1 ring-emerald-500/20',
  badgeAmber: 'bg-amber-500/12 text-amber-400 ring-1 ring-amber-500/20',
  badgeRed:   'bg-red-500/12 text-red-400 ring-1 ring-red-500/20',
  badgeBlue:  'bg-accent-500/12 text-accent-400 ring-1 ring-accent-500/20',
  badgeGray:  'bg-white/6 text-slate-400 ring-1 ring-white/8',
  badgeViolet:'bg-violet-500/12 text-violet-400 ring-1 ring-violet-500/20',

  /* ── Page typography ─────────────────────────────────── */
  pageTitle:    'text-2xl font-bold text-slate-100 tracking-tight',
  sectionTitle: 'text-sm font-semibold text-slate-300 tracking-tight',

  /* ── Modal ───────────────────────────────────────────── */
  overlay:  'fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md',
  modal:    'bg-navy-800 rounded-xl border border-white/8 w-full overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.55)]',
  modalSm:  'max-w-md',
  modalMd:  'max-w-lg',
  modalLg:  'max-w-2xl',

  /* Modal divider (reemplaza border-slate-100 dark:border-slate-800) */
  modalDivider: 'border-b border-white/6',
};

/* ── Helpers de badge por enum ──────────────────────────── */
import { EstadoPoliza, EstadoSiniestro, EstadoReclamo, EstadoCuota, TipoBien } from '@gestion-pas/types';

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
