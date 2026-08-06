/**
 * domain-types.ts — Tipos discriminados del dominio de seguros
 *
 * Centraliza las uniones de estado, etiquetas y mapas de tokens.
 * Importar desde aquí en lugar de usar strings dispersos.
 */

/* ── Estados de póliza ─────────────────────────────────── */
export type PolicyStatus =
  | 'active'
  | 'grace_period'
  | 'suspended'
  | 'cancelled';

export const POLICY_STATUS_LABEL: Record<PolicyStatus, string> = {
  active:       'Vigente',
  grace_period: 'Período de gracia',
  suspended:    'Suspendida',
  cancelled:    'Anulada',
};

/** Mapeo desde EstadoPoliza (enum del backend) */
export const POLIZA_ESTADO_TO_POLICY_STATUS: Record<string, PolicyStatus> = {
  activa:     'active',
  suspendida: 'suspended',
  anulada:    'cancelled',
};

/* ── Estados de siniestro ──────────────────────────────── */
export type ClaimStatus =
  | 'reported'
  | 'documentation_pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'closed';

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  reported:               'Reportado',
  documentation_pending:  'Documentación pendiente',
  under_review:           'En revisión',
  approved:               'Aprobado',
  rejected:               'Rechazado',
  closed:                 'Cerrado',
};

/** Mapeo desde EstadoSiniestro / EstadoReclamo */
export const SINIESTRO_ESTADO_TO_CLAIM_STATUS: Record<string, ClaimStatus> = {
  abierto:    'reported',
  en_gestion: 'under_review',
  resuelto:   'approved',
  rechazado:  'rejected',
};

export const RECLAMO_ESTADO_TO_CLAIM_STATUS: Record<string, ClaimStatus> = {
  abierto:    'reported',
  en_gestion: 'under_review',
  resuelto:   'approved',
};

/* ── SLA ───────────────────────────────────────────────── */
export type SlaStatus = 'safe' | 'warning' | 'breached';

export const SLA_STATUS_LABEL: Record<SlaStatus, string> = {
  safe:     'Dentro de plazo',
  warning:  'Próximo a vencer',
  breached: 'Fuera de SLA',
};

/** Calcula el estado de SLA según días transcurridos */
export function calcSlaStatus(diasTranscurridos: number, diasLimite: number): SlaStatus {
  const ratio = diasTranscurridos / diasLimite;
  if (ratio >= 1) return 'breached';
  if (ratio >= 0.75) return 'warning';
  return 'safe';
}

/* ── Estado de documento ───────────────────────────────── */
export type DocumentStatus = 'complete' | 'missing' | 'expired';

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  complete: 'Completo',
  missing:  'Pendiente',
  expired:  'Vencido',
};

/* ── Vencimiento ───────────────────────────────────────── */
export type ExpirationUrgency = 'critical' | 'warning' | 'normal';

/** días ≤ 7 → critical | ≤ 30 → warning | > 30 → normal */
export function calcExpirationUrgency(diasRestantes: number): ExpirationUrgency {
  if (diasRestantes <= 7)  return 'critical';
  if (diasRestantes <= 30) return 'warning';
  return 'normal';
}

export const EXPIRATION_URGENCY_LABEL: Record<ExpirationUrgency, string> = {
  critical: 'Crítico',
  warning:  'Próximo',
  normal:   'Normal',
};
