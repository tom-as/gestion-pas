/**
 * OperationalAlert.tsx — Alerta operativa con acción concreta
 *
 * Usada en el dashboard para tareas que requieren atención.
 * Siempre incluye: icono semántico + mensaje + acción.
 */
import type { ClaimStatus, PolicyStatus, SlaStatus } from './domain-types';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface OperationalAlertProps {
  severity: AlertSeverity;
  title: string;
  description?: string;
  actionLabel: string;
  onAction: () => void;
  /** Accesibilidad: descripción del ícono */
  iconAriaLabel?: string;
  count?: number;
}

const SEVERITY_STYLE: Record<AlertSeverity, {
  bg: string; text: string; border: string; leftBar: string; actionColor: string;
}> = {
  critical: {
    bg:          'var(--sla-breached-bg)',
    text:        'var(--sla-breached-text)',
    border:      'var(--sla-breached-border)',
    leftBar:     'var(--sla-breached-text)',
    actionColor: 'var(--sla-breached-text)',
  },
  warning: {
    bg:          'var(--sla-warning-bg)',
    text:        'var(--sla-warning-text)',
    border:      'var(--sla-warning-border)',
    leftBar:     'var(--sla-warning-text)',
    actionColor: 'var(--sla-warning-text)',
  },
  info: {
    bg:          'var(--claim-reported-bg)',
    text:        'var(--claim-reported-text)',
    border:      'var(--claim-reported-border)',
    leftBar:     'var(--claim-reported-text)',
    actionColor: 'var(--accent-primary)',
  },
};

export default function OperationalAlert({
  severity,
  title,
  description,
  actionLabel,
  onAction,
  count,
}: OperationalAlertProps) {
  const s = SEVERITY_STYLE[severity];

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        borderRadius: '4px',
        background: 'var(--surface-record)',
        border: '1px solid var(--border-subtle)',
        borderLeft: `3px solid ${s.leftBar}`,
      }}
    >
      {count !== undefined && (
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            minWidth: 24,
            height: 24,
            borderRadius: 3,
            background: s.bg,
            color: s.text,
            border: `1px solid ${s.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.4,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {title}
        </p>
        {description && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, lineHeight: 1.4 }}>
            {description}
          </p>
        )}
      </div>
      <button
        onClick={onAction}
        style={{
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 600,
          color: s.actionColor,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 0',
          whiteSpace: 'nowrap',
        }}
        aria-label={`${actionLabel}: ${title}`}
      >
        {actionLabel} →
      </button>
    </div>
  );
}
