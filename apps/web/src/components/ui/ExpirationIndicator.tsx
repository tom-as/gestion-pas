/**
 * ExpirationIndicator.tsx — Muestra días restantes con urgencia visual
 *
 * Usa borde izquierdo + texto auxiliar (no solo color).
 */
import type { ExpirationUrgency } from './domain-types';
import { calcExpirationUrgency } from './domain-types';
import { IconVencimiento } from './icons';

const URGENCY_STYLE: Record<ExpirationUrgency, {
  bg: string; text: string; border: string; label: string;
}> = {
  critical: {
    bg:     'var(--sla-breached-bg)',
    text:   'var(--sla-breached-text)',
    border: 'var(--sla-breached-border)',
    label:  'CRÍTICO',
  },
  warning: {
    bg:     'var(--sla-warning-bg)',
    text:   'var(--sla-warning-text)',
    border: 'var(--sla-warning-border)',
    label:  'PRÓXIMO',
  },
  normal: {
    bg:     'transparent',
    text:   'var(--text-muted)',
    border: 'transparent',
    label:  '',
  },
};

interface ExpirationIndicatorProps {
  diasRestantes: number;
  /** Fecha de vencimiento formateada (solo para mostrar) */
  fechaLabel?: string;
}

export default function ExpirationIndicator({ diasRestantes, fechaLabel }: ExpirationIndicatorProps) {
  const urgency = calcExpirationUrgency(diasRestantes);
  const s = URGENCY_STYLE[urgency];

  const diasText =
    diasRestantes < 0
      ? `Venció hace ${Math.abs(diasRestantes)} días`
      : diasRestantes === 0
      ? 'Vence hoy'
      : diasRestantes === 1
      ? 'Vence mañana'
      : `${diasRestantes} días`;

  return (
    <span
      role="status"
      aria-label={`Vencimiento: ${diasText}${fechaLabel ? ` (${fechaLabel})` : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: urgency !== 'normal' ? '2px 8px' : '0',
        borderRadius: '3px',
        background: s.bg,
        color: s.text,
        border: urgency !== 'normal' ? `1px solid ${s.border}` : 'none',
        fontSize: '12px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {urgency !== 'normal' && (
        <IconVencimiento size={12} aria-hidden />
      )}
      <span>{diasText}</span>
      {urgency !== 'normal' && s.label && (
        <span
          aria-hidden="true"
          style={{
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            opacity: 0.75,
          }}
        >
          · {s.label}
        </span>
      )}
      {fechaLabel && urgency === 'normal' && (
        <span style={{ fontWeight: 400, color: 'var(--text-faint)', fontSize: '11px' }}>
          {fechaLabel}
        </span>
      )}
    </span>
  );
}
