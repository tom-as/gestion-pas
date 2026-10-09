/**
 * DashboardScreen — Iteration 2 redesign.
 *
 * Layout priority:  Urgency → Context → Action
 *
 *  1. AttentionSummary  — glanceable "what needs action now"
 *  2. MetricStrip       — compact 4-number horizontal strip
 *  3. Upcoming section  — next 5 cuotas with time-remaining emphasis
 *  4. (future) ActivityTimeline
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { EstadoPoliza, EstadoSiniestro, EstadoReclamo } from '@gestion-pas/types';
import api from '../../lib/api';
import { formatMoney } from '../../lib/format';
import Screen from '../../components/Screen';
import { colors, font, spacing, radius } from '../../theme/tokens';

// ─── helpers ────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function urgencyColor(days: number): string {
  if (days <= 3)  return colors.danger;
  if (days <= 10) return colors.urgent;
  if (days <= 20) return colors.warning;
  return colors.success;
}

function urgencyLabel(days: number): string {
  if (days < 0)  return 'Vencida';
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  return `${days}d`;
}

// ─── sub-components ─────────────────────────────────────────────────────────

/** Glanceable summary: "X items need attention" */
function AttentionSummary({
  siniestros,
  reclamos,
  vencimientosUrgentes,
}: {
  siniestros: number;
  reclamos: number;
  vencimientosUrgentes: number;
}) {
  const total = siniestros + reclamos + vencimientosUrgentes;
  if (total === 0) {
    return (
      <View style={attnStyles.card}>
        <View style={[attnStyles.dot, { backgroundColor: colors.success }]} />
        <Text style={attnStyles.allGood}>Todo al día — sin urgencias</Text>
      </View>
    );
  }

  return (
    <View style={attnStyles.card}>
      <Text style={attnStyles.headline}>
        <Text style={attnStyles.count}>{total}</Text>
        {' '}elementos requieren atención
      </Text>
      <View style={attnStyles.pills}>
        {vencimientosUrgentes > 0 && (
          <View style={[attnStyles.pill, { backgroundColor: colors.dangerDim }]}>
            <Text style={[attnStyles.pillText, { color: colors.danger }]}>
              {vencimientosUrgentes} venc. urgentes
            </Text>
          </View>
        )}
        {siniestros > 0 && (
          <View style={[attnStyles.pill, { backgroundColor: colors.warningDim }]}>
            <Text style={[attnStyles.pillText, { color: colors.warning }]}>
              {siniestros} siniestros
            </Text>
          </View>
        )}
        {reclamos > 0 && (
          <View style={[attnStyles.pill, { backgroundColor: colors.accentDim }]}>
            <Text style={[attnStyles.pillText, { color: colors.accent }]}>
              {reclamos} reclamos
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const attnStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    marginBottom: spacing.xs,
  },
  allGood: {
    color: colors.success,
    fontSize: font.base,
    fontWeight: font.semibold,
  },
  headline: {
    color: colors.textSecondary,
    fontSize: font.base,
    marginBottom: spacing.sm,
  },
  count: {
    color: colors.textPrimary,
    fontWeight: font.bold,
    fontSize: font.lg,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  pillText: { fontSize: font.xs, fontWeight: font.semibold },
});

// ─────────────────────────────────────────────────────────────────────────────

/** Horizontal strip of 4 compact KPI numbers */
function MetricStrip({
  asegurados,
  polizas,
  siniestros,
  reclamos,
}: {
  asegurados: number;
  polizas: number;
  siniestros: number;
  reclamos: number;
}) {
  const metrics = [
    { label: 'Asegurados', value: asegurados, color: colors.accent },
    { label: 'Pólizas',    value: polizas,    color: colors.success },
    { label: 'Siniestros', value: siniestros, color: colors.warning },
    { label: 'Reclamos',   value: reclamos,   color: colors.danger  },
  ];

  return (
    <View style={stripStyles.row}>
      {metrics.map((m, i) => (
        <React.Fragment key={m.label}>
          <View style={stripStyles.cell}>
            <Text style={[stripStyles.value, { color: m.color }]}>
              {m.value > 0 ? m.value : '—'}
            </Text>
            <Text style={stripStyles.label}>{m.label}</Text>
          </View>
          {i < metrics.length - 1 && <View style={stripStyles.divider} />}
        </React.Fragment>
      ))}
    </View>
  );
}

const stripStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  value: {
    fontSize: font.xxl,
    fontWeight: font.bold,
    lineHeight: font.xxl * 1.2,
  },
  label: {
    color: colors.textMuted,
    fontSize: font.xs,
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
});

// ─────────────────────────────────────────────────────────────────────────────

/** Single upcoming cuota row */
function ExpirationItem({ cuota }: { cuota: any }) {
  const days = daysUntil(cuota.fechaVencimiento);
  const urgColor = urgencyColor(days);
  const urgLabel = urgencyLabel(days);

  return (
    <View style={expStyles.row}>
      {/* urgency badge */}
      <View style={[expStyles.urgBadge, { backgroundColor: urgColor + '22' }]}>
        <Text style={[expStyles.urgText, { color: urgColor }]}>{urgLabel}</Text>
      </View>

      {/* policy info */}
      <View style={expStyles.info}>
        <Text style={expStyles.poliza} numberOfLines={1}>
          {cuota.poliza?.numeroPoliza ?? '—'}
        </Text>
        <Text style={expStyles.asegurado} numberOfLines={1}>
          {cuota.poliza?.asegurado?.apellido ?? ''} {cuota.poliza?.asegurado?.nombre ?? ''}
        </Text>
      </View>

      {/* amount */}
      <Text style={expStyles.monto}>{formatMoney(cuota.importe)}</Text>
    </View>
  );
}

const expStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  urgBadge: {
    width: 50,
    height: 50,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgText: {
    fontSize: font.sm,
    fontWeight: font.bold,
    textAlign: 'center',
  },
  info: { flex: 1, gap: 2 },
  poliza: {
    color: colors.textPrimary,
    fontSize: font.base,
    fontWeight: font.semibold,
    fontFamily: font.mono,
  },
  asegurado: {
    color: colors.textMuted,
    fontSize: font.sm,
  },
  monto: {
    color: colors.success,
    fontSize: font.base,
    fontWeight: font.semibold,
  },
});

// ─── section label ────────────────────────────────────────────────────────────

function SectionLabel({ text, count }: { text: string; count?: number }) {
  return (
    <View style={secStyles.row}>
      <Text style={secStyles.text}>{text.toUpperCase()}</Text>
      {count !== undefined && (
        <View style={secStyles.badge}>
          <Text style={secStyles.badgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

const secStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  text: {
    color: colors.textMuted,
    fontSize: font.xs,
    fontWeight: font.bold,
    letterSpacing: 0.8,
  },
  badge: {
    backgroundColor: colors.overlay,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: {
    color: colors.textFaint,
    fontSize: font.xs,
    fontWeight: font.semibold,
  },
});

// ─── main screen ─────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { data: cartera } = useQuery({
    queryKey: ['r-cartera'],
    queryFn: () => api.get('/reportes/cartera-asegurados').then((r) => r.data),
  });
  const { data: polizasData } = useQuery({
    queryKey: ['r-polizas-activas'],
    queryFn: () => api.get(`/reportes/polizas?estado=${EstadoPoliza.ACTIVA}`).then((r) => r.data),
  });
  const { data: siniestrosData } = useQuery({
    queryKey: ['r-siniestros-abiertos'],
    queryFn: () =>
      api.get(`/reportes/siniestros?estado=${EstadoSiniestro.ABIERTO}`).then((r) => r.data),
  });
  const { data: reclamosData } = useQuery({
    queryKey: ['r-reclamos-abiertos'],
    queryFn: () =>
      api.get(`/reportes/reclamos?estado=${EstadoReclamo.ABIERTO}`).then((r) => r.data),
  });
  const { data: vencimientosRaw } = useQuery({
    queryKey: ['r-vencimientos'],
    queryFn: () => api.get('/reportes/vencimientos-proximos?dias=30').then((r) => r.data),
  });

  // Normalise API shapes
  const asegurados: any[] = cartera?.asegurados ?? (Array.isArray(cartera) ? cartera : []);
  const polizas:    any[] = polizasData?.polizas ?? (Array.isArray(polizasData) ? polizasData : []);
  const siniestros: any[] = siniestrosData?.siniestros ?? (Array.isArray(siniestrosData) ? siniestrosData : []);
  const reclamos:   any[] = reclamosData?.reclamos ?? (Array.isArray(reclamosData) ? reclamosData : []);
  const cuotas:     any[] = vencimientosRaw?.cuotas ?? (Array.isArray(vencimientosRaw) ? vencimientosRaw : []);

  // Compute urgency counts for AttentionSummary
  const vencimientosUrgentes = useMemo(
    () => cuotas.filter((c) => daysUntil(c.fechaVencimiento) <= 7).length,
    [cuotas],
  );

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  return (
    <Screen>
      {/* Greeting */}
      <View style={styles.greetingRow}>
        <Text style={styles.greeting}>{greeting}</Text>
      </View>

      {/* 1. Attention summary */}
      <AttentionSummary
        siniestros={siniestros.length}
        reclamos={reclamos.length}
        vencimientosUrgentes={vencimientosUrgentes}
      />

      {/* 2. Metric strip */}
      <MetricStrip
        asegurados={asegurados.length}
        polizas={polizas.length}
        siniestros={siniestros.length}
        reclamos={reclamos.length}
      />

      {/* 3. Upcoming expirations */}
      <SectionLabel
        text="Próximos vencimientos"
        count={cuotas.length > 0 ? cuotas.length : undefined}
      />
      {cuotas.length === 0 ? (
        <Text style={styles.empty}>Sin vencimientos en los próximos 30 días.</Text>
      ) : (
        cuotas.slice(0, 7).map((c: any) => (
          <ExpirationItem key={c.id} cuota={c} />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  greetingRow: {
    marginBottom: spacing.base,
  },
  greeting: {
    color: colors.textPrimary,
    fontSize: font.xl,
    fontWeight: font.bold,
  },
  empty: {
    color: colors.textFaint,
    fontSize: font.base,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
