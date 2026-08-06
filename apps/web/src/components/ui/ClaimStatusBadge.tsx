/**
 * ClaimStatusBadge.tsx — Badge semántico para estado de siniestro/reclamo
 */
import type { ClaimStatus } from './domain-types';
import { CLAIM_STATUS_LABEL } from './domain-types';

const CLAIM_STATUS_STYLE: Record<ClaimStatus, {
  bg: string; text: string; border: string;
}> = {
  reported: {
    bg:     'var(--claim-reported-bg)',
    text:   'var(--claim-reported-text)',
    border: 'var(--claim-reported-border)',
  },
  documentation_pending: {
    bg:     'var(--claim-docs-bg)',
    text:   'var(--claim-docs-text)',
    border: 'var(--claim-docs-border)',
  },
  under_review: {
    bg:     'var(--claim-review-bg)',
    text:   'var(--claim-review-text)',
    border: 'var(--claim-review-border)',
  },
  approved: {
    bg:     'var(--claim-approved-bg)',
    text:   'var(--claim-approved-text)',
    border: 'var(--claim-approved-border)',
  },
  rejected: {
    bg:     'var(--claim-rejected-bg)',
    text:   'var(--claim-rejected-text)',
    border: 'var(--claim-rejected-border)',
  },
  closed: {
    bg:     'var(--claim-closed-bg)',
    text:   'var(--claim-closed-text)',
    border: 'var(--claim-closed-border)',
  },
};

/* Patrón textual + abreviatura para no depender solo del color */
const CLAIM_STATUS_ABBR: Record<ClaimStatus, string> = {
  reported:               'REP',
  documentation_pending:  'DOC',
  under_review:           'REV',
  approved:               'APR',
  rejected:               'REC',
  closed:                 'CER',
};

interface ClaimStatusBadgeProps {
  status: ClaimStatus;
  showAbbr?: boolean;
}

export default function ClaimStatusBadge({ status, showAbbr = false }: ClaimStatusBadgeProps) {
  const s = CLAIM_STATUS_STYLE[status];
  const label = CLAIM_STATUS_LABEL[status];
  const abbr = CLAIM_STATUS_ABBR[status];

  return (
    <span
      role="status"
      aria-label={`Estado: ${label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '2px 8px',
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
      {showAbbr && (
        <span
          aria-hidden="true"
          style={{
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            opacity: 0.7,
          }}
        >
          {abbr}
        </span>
      )}
      <span>{label}</span>
    </span>
  );
}
