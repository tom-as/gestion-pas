/**
 * Helpers de formato — mismos que apps/web/src/lib/format.ts
 */

/** Formatea una fecha ISO 'YYYY-MM-DD' o Date al estilo dd/mm/aaaa */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value + 'T00:00:00') : value;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Formatea número como moneda argentina */
export function formatMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}
