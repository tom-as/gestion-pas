/**
 * RecordCode.tsx — Identificador operativo en fuente monoespaciada
 *
 * Usado para: número de póliza, expediente de siniestro, DNI/CUIL/CUIT,
 * importes, códigos de reclamo, fechas operativas.
 */

interface RecordCodeProps {
  value: string | number;
  /** Prefijo decorativo antes del valor (ej: "EXP-") */
  prefix?: string;
  className?: string;
}

export default function RecordCode({ value, prefix, className }: RecordCodeProps) {
  const display = prefix ? `${prefix}${value}` : String(value);
  return (
    <span
      className={className}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8125rem',
        fontWeight: 500,
        letterSpacing: '0.025em',
        color: 'var(--text-secondary)',
      }}
      aria-label={display}
    >
      {display}
    </span>
  );
}
