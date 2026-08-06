/**
 * ProducerBadge.tsx — Badge de productor asignado
 */

interface ProducerBadgeProps {
  nombre: string;
  /** Mostrar iniciales en lugar del nombre completo */
  compact?: boolean;
}

export default function ProducerBadge({ nombre, compact = false }: ProducerBadgeProps) {
  const initials = nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <span
      title={nombre}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 8px',
        borderRadius: '3px',
        background: 'var(--badge-gray-bg)',
        color: 'var(--badge-gray-text)',
        border: '1px solid var(--badge-gray-ring)',
        fontSize: '11px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        maxWidth: compact ? 140 : undefined,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 16,
          height: 16,
          borderRadius: 2,
          background: 'var(--claim-docs-bg)',
          color: 'var(--claim-docs-text)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {initials}
      </span>
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {compact ? initials : nombre}
      </span>
    </span>
  );
}
