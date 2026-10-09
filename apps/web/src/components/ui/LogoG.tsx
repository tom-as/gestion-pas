/**
 * LogoG — Logo de Gestión PAS: letra G en gris sobre fondo blanco.
 * Usable en sidebar (size="sm") y en login (size="lg" o sin prop).
 */
interface Props {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function LogoG({ size = 28, className, style }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Gestión PAS"
    >
      {/* Fondo blanco con esquinas redondeadas */}
      <rect width="40" height="40" rx="8" fill="white" />

      {/* Letra G en gris medio */}
      <text
        x="20"
        y="29"
        textAnchor="middle"
        fontFamily="-apple-system, 'Segoe UI', system-ui, sans-serif"
        fontWeight="700"
        fontSize="26"
        fill="#5a5a5a"
        letterSpacing="-1"
      >
        G
      </text>
    </svg>
  );
}
