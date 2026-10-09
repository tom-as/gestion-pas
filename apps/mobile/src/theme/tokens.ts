/**
 * Design tokens — single source of truth for the mobile app.
 * All colours, spacing, radii and typography values live here.
 */

// ─── Palette ────────────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  bg:          '#040a18',
  surface:     '#0a1628',
  surfaceHigh: '#0f1e36',
  overlay:     '#0d1a2e',

  // Borders
  border:      '#0d1a2e',
  borderStrong:'#1a2744',

  // Text
  textPrimary:  '#ffffff',
  textSecondary:'#a0aec0',
  textMuted:    '#718096',
  textFaint:    '#4a5568',

  // Accent / brand
  accent:       '#00d4ff',
  accentDim:    '#00d4ff22',

  // Semantic
  success:      '#10c97a',
  successDim:   '#0d2b1a',
  warning:      '#f0a020',
  warningDim:   '#2b2200',
  danger:       '#fc8181',
  dangerDim:    '#2b0000',
  urgent:       '#f97316',
  urgentDim:    '#2b0d00',

  // Misc
  transparent:  'transparent',
} as const;

// ─── Spacing ────────────────────────────────────────────────────────────────

export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  base:16,
  lg:  20,
  xl:  24,
  xxl: 32,
  xxxl:40,
} as const;

// ─── Border radius ──────────────────────────────────────────────────────────

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

// ─── Typography ─────────────────────────────────────────────────────────────

export const font = {
  // sizes
  xs:   11,
  sm:   12,
  base: 14,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  24,
  xxxl: 32,

  // weights (as valid RN fontWeight strings)
  regular: '400' as const,
  medium:  '500' as const,
  semibold:'600' as const,
  bold:    '700' as const,

  // families
  mono: 'monospace',  // for policy numbers, DNI, IDs
} as const;

// ─── Touch targets ───────────────────────────────────────────────────────────

export const touch = {
  min: 44, // minimum tap target (px)
} as const;
