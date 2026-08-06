/**
 * PolicyStatusBadge.tsx — Badge semántico para estado de póliza
 *
 * Usa icono + etiqueta + color token. No depende solo del color.
 */
import type { PolicyStatus } from './domain-types';
import { POLICY_STATUS_LABEL } from './domain-types';

/* ── Tokens de color por estado ────────────────────────── */
const POLICY_STATUS_STYLE: Record<PolicyStatus, {
  bg: string; text: string; border: string; dot: string;
}> = {
  active: {
    bg:     'var(--policy-active-bg)',
    text:   'var(--policy-active-text)',
    border: 'var(--policy-active-border)',
    dot:    'var(--policy-active-text)',
  },
  grace_period: {
    bg:     'var(--policy-grace-bg)',
    text:   'var(--policy-grace-text)',
    border: 'var(--policy-grace-border)',
    dot:    'var(--policy-grace-text)',
  },
  suspended: {
    bg:     'var(--policy-suspended-bg)',
    text:   'var(--policy-suspended-text)',
    border: 'var(--policy-suspended-border)',
    dot:    'var(--policy-suspended-text)',
  },
  cancelled: {
    bg:     'var(--policy-cancelled-bg)',
    text:   'var(--policy-cancelled-text)',
    border: 'var(--policy-cancelled-border)',
    dot:    'var(--policy-cancelled-text)',
  },
};

/* ── Patrón textual complementario (no depende solo del color) */
const POLICY_STATUS_PATTERN: Record<PolicyStatus, string> = {
  active:       '●',
  grace_period: '◐',
  suspended:    '○',
  cancelled:    '✕',
};

interface PolicyStatusBadgeProps {
  status: PolicyStatus;
  /** Variante compacta sin etiqueta */
  iconOnly?: boolean;
}

export default function PolicyStatusBadge({ status, iconOnly = false }: PolicyStatusBadgeProps) {
  const s = POLICY_STATUS_STYLE[status];
  const label = POLICY_STATUS_LABEL[status];
  const pattern = POLICY_STATUS_PATTERN[status];

  return (
    <span
      role="status"
      aria-label={`Estado: ${label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: iconOnly ? '2px 6px' : '2px 8px',
        borderRadius: '3px',
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '9px', lineHeight: 1 }}>{pattern}</span>
      {!iconOnly && <span>{label}</span>}
    </span>
  );
}
