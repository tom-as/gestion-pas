/**
 * SlaIndicator.tsx — Indicador visual de SLA con días y porcentaje
 */
import type { SlaStatus } from './domain-types';
import { SLA_STATUS_LABEL } from './domain-types';
import { IconClock } from './icons';

const SLA_STYLE: Record<SlaStatus, { bg: string; text: string; border: string; bar: string }> = {
  safe: {
    bg:     'var(--sla-safe-bg)',
    text:   'var(--sla-safe-text)',
    border: 'var(--sla-safe-border)',
    bar:    'var(--sla-safe-text)',
  },
  warning: {
    bg:     'var(--sla-warning-bg)',
    text:   'var(--sla-warning-text)',
    border: 'var(--sla-warning-border)',
    bar:    'var(--sla-warning-text)',
  },
  breached: {
    bg:     'var(--sla-breached-bg)',
    text:   'var(--sla-breached-text)',
    border: 'var(--sla-breached-border)',
    bar:    'var(--sla-breached-text)',
  },
};

interface SlaIndicatorProps {
  status: SlaStatus;
  /** Porcentaje de SLA consumido (0–100+) */
  pct?: number;
  /** Texto libre: "8 días" */
  diasLabel?: string;
}

export default function SlaIndicator({ status, pct, diasLabel }: SlaIndicatorProps) {
  const s = SLA_STYLE[status];
  const label = SLA_STATUS_LABEL[status];
  const barPct = pct !== undefined ? Math.min(pct, 100) : undefined;

  return (
    <span
      role="status"
      aria-label={`SLA: ${label}${diasLabel ? ` — ${diasLabel}` : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 8px',
        borderRadius: '3px',
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        fontSize: '11px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <IconClock size={11} aria-hidden />
      {diasLabel && <span>{diasLabel}</span>}
      <span style={{ opacity: 0.7 }}>{label}</span>
      {barPct !== undefined && (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: 32,
            height: 4,
            borderRadius: 2,
            background: 'rgba(128,128,128,0.2)',
            overflow: 'hidden',
            verticalAlign: 'middle',
          }}
        >
          <span
            style={{
              display: 'block',
              height: '100%',
              width: `${barPct}%`,
              background: s.bar,
              borderRadius: 2,
            }}
          />
        </span>
      )}
    </span>
  );
}
