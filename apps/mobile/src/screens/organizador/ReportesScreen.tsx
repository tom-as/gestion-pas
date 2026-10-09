/**
 * ReportesScreen — Iteration 4 redesign.
 *
 * Layout:
 *  1. StatStrip       — 4 key numbers (same component pattern as Dashboard)
 *  2. Vencimientos    — next 8 cuotas with urgency indicator
 *  3. Pólizas por vencer — policies expiring in 30 days
 *  4. Datos incompletos — count + list
 *  5. Comisiones (ORGANIZADOR only) — per-producer breakdown
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import LoadingState from '../../components/LoadingState';
import { useAuth } from '../../hooks/useAuth';
import { UserRole, EstadoSiniestro, EstadoReclamo, EstadoPoliza } from '@gestion-pas/types';
import { formatDate, formatMoney } from '../../lib/format';
import { colors, font, spacing, radius } from '../../theme/tokens';

// ─── helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
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

// ─── sub-components ───────────────────────────────────────────────────────────

/** Section label with optional count badge */
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  text: { color: colors.textMuted, fontSize: font.xs, fontWeight: font.bold, letterSpacing: 0.8 },
  badge: { backgroundColor: colors.overlay, borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  badgeText: { color: colors.textFaint, fontSize: font.xs, fontWeight: font.semibold },
});

/** 4-number horizontal stat strip */
function StatStrip({
  asegurados, polizas, siniestros, reclamos,
}: {
  asegurados: number; polizas: number; siniestros: number; reclamos: number;
}) {
  const metrics = [
    { label: 'Asegurados', value: asegurados, color: colors.accent   },
    { label: 'Pólizas',    value: polizas,    color: colors.success  },
    { label: 'Siniestros', value: siniestros, color: colors.warning  },
    { label: 'Reclamos',   value: reclamos,   color: colors.danger   },
  ];
  return (
    <View style={statStyles.strip}>
      {metrics.map((m, i) => (
        <React.Fragment key={m.label}>
          <View style={statStyles.cell}>
            <Text style={[statStyles.value, { color: m.color }]}>{m.value > 0 ? m.value : '—'}</Text>
            <Text style={statStyles.label}>{m.label}</Text>
          </View>
          {i < metrics.length - 1 && <View style={statStyles.divider} />}
        </React.Fragment>
      ))}
    </View>
  );
}

const statStyles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  cell: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  value: { fontSize: font.xxl, fontWeight: font.bold },
  label: { color: colors.textMuted, fontSize: font.xs, marginTop: 2 },
  divider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
});

/** Single cuota row with urgency badge */
function CuotaRow({ cuota }: { cuota: any }) {
  const days = daysUntil(cuota.fechaVencimiento);
  const urgColor = urgencyColor(days);
  return (
    <View style={cuotaStyles.row}>
      <View style={[cuotaStyles.urgBadge, { backgroundColor: urgColor + '22' }]}>
        <Text style={[cuotaStyles.urgText, { color: urgColor }]}>{urgencyLabel(days)}</Text>
      </View>
      <View style={cuotaStyles.info}>
        <Text style={cuotaStyles.poliza} numberOfLines={1}>
          {cuota.poliza?.numeroPoliza ?? '—'}
        </Text>
        <Text style={cuotaStyles.asegurado} numberOfLines={1}>
          {cuota.poliza?.asegurado?.apellido ?? ''} {cuota.poliza?.asegurado?.nombre ?? ''}
        </Text>
      </View>
      <Text style={cuotaStyles.monto}>{formatMoney(cuota.importe)}</Text>
    </View>
  );
}

const cuotaStyles = StyleSheet.create({
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
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgText: { fontSize: font.sm, fontWeight: font.bold, textAlign: 'center' },
  info: { flex: 1, gap: 2 },
  poliza: { color: colors.textPrimary, fontSize: font.base, fontWeight: font.semibold, fontFamily: 'monospace' },
  asegurado: { color: colors.textMuted, fontSize: font.sm },
  monto: { color: colors.success, fontSize: font.base, fontWeight: font.semibold },
});

/** Generic label/value list row */
function ListRow({ primary, secondary }: { primary: string; secondary?: string }) {
  return (
    <View style={listRowStyles.row}>
      <Text style={listRowStyles.primary} numberOfLines={1}>{primary}</Text>
      {secondary ? <Text style={listRowStyles.secondary} numberOfLines={1}>{secondary}</Text> : null}
    </View>
  );
}

const listRowStyles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  primary: { color: colors.textPrimary, fontSize: font.base, fontWeight: font.semibold, fontFamily: 'monospace' },
  secondary: { color: colors.textMuted, fontSize: font.sm, marginTop: 2 },
});

/** Comisiones row per productor */
function ComisionRow({ productor }: { productor: any }) {
  return (
    <View style={comStyles.row}>
      <View style={comStyles.left}>
        <Text style={comStyles.nombre} numberOfLines={1}>{productor.nombre ?? '—'}</Text>
        <Text style={comStyles.polizas}>{productor.polizasActivas ?? 0} pólizas activas</Text>
      </View>
      <Text style={comStyles.monto}>{formatMoney(productor.totalImporteCuotasMes)}</Text>
    </View>
  );
}

const comStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  left: { flex: 1 },
  nombre: { color: colors.textPrimary, fontSize: font.base, fontWeight: font.semibold },
  polizas: { color: colors.textMuted, fontSize: font.sm, marginTop: 2 },
  monto: { color: colors.success, fontSize: font.md, fontWeight: font.bold },
});

// ─── empty placeholder ────────────────────────────────────────────────────────

function EmptyRow({ text }: { text: string }) {
  return <Text style={emptyStyle.text}>{text}</Text>;
}
const emptyStyle = StyleSheet.create({
  text: { color: colors.textFaint, fontSize: font.base, marginBottom: spacing.md },
});

// ─── main screen ──────────────────────────────────────────────────────────────

export function ReportesScreen() {
  const { user } = useAuth();
  const isOrganizador = user?.perfil === UserRole.ORGANIZADOR;

  const { data: cartera, isLoading: loadingCartera } = useQuery({
    queryKey: ['r-cartera'],
    queryFn: () => api.get('/reportes/cartera-asegurados').then((r) => r.data),
  });
  const { data: polizasData } = useQuery({
    queryKey: ['r-polizas-activas'],
    queryFn: () => api.get(`/reportes/polizas?estado=${EstadoPoliza.ACTIVA}`).then((r) => r.data),
  });
  const { data: siniestrosData } = useQuery({
    queryKey: ['r-siniestros-abiertos'],
    queryFn: () => api.get(`/reportes/siniestros?estado=${EstadoSiniestro.ABIERTO}`).then((r) => r.data),
  });
  const { data: reclamosData } = useQuery({
    queryKey: ['r-reclamos-abiertos'],
    queryFn: () => api.get(`/reportes/reclamos?estado=${EstadoReclamo.ABIERTO}`).then((r) => r.data),
  });
  const { data: vencimientosRaw } = useQuery({
    queryKey: ['r-vencimientos'],
    queryFn: () => api.get('/reportes/vencimientos-proximos?dias=30').then((r) => r.data),
  });
  const { data: polizasPorVencer } = useQuery({
    queryKey: ['r-polizas-vencer'],
    queryFn: () => api.get('/reportes/polizas?vencenEnDias=30').then((r) => r.data),
  });
  const { data: comisiones } = useQuery({
    queryKey: ['r-comisiones'],
    queryFn: () => api.get('/reportes/comisiones').then((r) => r.data),
    enabled: isOrganizador,
  });
  const { data: incompletos } = useQuery({
    queryKey: ['r-incompletos'],
    queryFn: () => api.get('/reportes/datos-incompletos').then((r) => r.data),
  });

  // Normalise API shapes
  const carteraList       = Array.isArray(cartera?.asegurados)          ? cartera.asegurados          : (Array.isArray(cartera)            ? cartera            : []);
  const polizasList       = Array.isArray(polizasData?.polizas)         ? polizasData.polizas         : (Array.isArray(polizasData)         ? polizasData         : []);
  const siniestrosList    = Array.isArray(siniestrosData?.siniestros)   ? siniestrosData.siniestros   : (Array.isArray(siniestrosData)      ? siniestrosData      : []);
  const reclamosList      = Array.isArray(reclamosData?.reclamos)       ? reclamosData.reclamos       : (Array.isArray(reclamosData)        ? reclamosData        : []);
  const cuotas            = Array.isArray(vencimientosRaw?.cuotas)      ? vencimientosRaw.cuotas      : (Array.isArray(vencimientosRaw)     ? vencimientosRaw     : []);
  const polizasVencerList = Array.isArray(polizasPorVencer?.polizas)    ? polizasPorVencer.polizas    : (Array.isArray(polizasPorVencer)    ? polizasPorVencer    : []);
  const incompletosList   = Array.isArray(incompletos?.bienes)          ? incompletos.bienes          : (Array.isArray(incompletos)         ? incompletos         : []);
  const comisionesList    = Array.isArray(comisiones?.productores)      ? comisiones.productores      : (Array.isArray(comisiones)          ? comisiones          : []);

  // Sort cuotas by proximity
  const cuotasSorted = useMemo(
    () => [...cuotas].sort((a, b) => daysUntil(a.fechaVencimiento) - daysUntil(b.fechaVencimiento)),
    [cuotas],
  );

  if (loadingCartera) return <LoadingState />;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── 1. Summary strip ── */}
        <SectionLabel text="Resumen general" />
        <StatStrip
          asegurados={carteraList.length}
          polizas={polizasList.length}
          siniestros={siniestrosList.length}
          reclamos={reclamosList.length}
        />

        {/* ── 2. Upcoming cuotas ── */}
        <SectionLabel
          text="Vencimientos próximos (30 días)"
          count={cuotas.length > 0 ? cuotas.length : undefined}
        />
        {cuotasSorted.length === 0
          ? <EmptyRow text="Sin vencimientos próximos." />
          : cuotasSorted.slice(0, 8).map((c: any) => <CuotaRow key={c.id} cuota={c} />)
        }

        {/* ── 3. Policies expiring ── */}
        <SectionLabel
          text="Pólizas por vencer (30 días)"
          count={polizasVencerList.length > 0 ? polizasVencerList.length : undefined}
        />
        {polizasVencerList.length === 0
          ? <EmptyRow text="Sin pólizas próximas a vencer." />
          : polizasVencerList.slice(0, 5).map((p: any) => (
              <ListRow
                key={p.id}
                primary={p.numeroPoliza}
                secondary={`Vence: ${formatDate(p.vigenciaFin)}`}
              />
            ))
        }

        {/* ── 4. Incomplete data ── */}
        <SectionLabel
          text="Datos incompletos"
          count={incompletosList.length > 0 ? incompletosList.length : undefined}
        />
        {incompletosList.length === 0 ? (
          <View style={styles.allGoodRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.allGoodText}>Sin bienes con datos faltantes.</Text>
          </View>
        ) : (
          <>
            <View style={styles.incompletoSummary}>
              <Text style={styles.incompletoCount}>{incompletosList.length}</Text>
              <Text style={styles.incompletoLabel}>bienes con datos incompletos</Text>
            </View>
            {incompletosList.slice(0, 5).map((b: any) => (
              <ListRow
                key={b.id}
                primary={b.descripcion ?? b.marca ?? b.id ?? '—'}
                secondary={b.tipo ?? undefined}
              />
            ))}
          </>
        )}

        {/* ── 5. Commissions (ORGANIZADOR only) ── */}
        {isOrganizador && (
          <>
            <SectionLabel
              text="Comisiones por productor"
              count={comisionesList.length > 0 ? comisionesList.length : undefined}
            />
            {comisionesList.length === 0
              ? <EmptyRow text="Sin datos de comisiones." />
              : comisionesList.map((c: any) => (
                  <ComisionRow key={c.id ?? c.nombre} productor={c} />
                ))
            }
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.base, paddingBottom: spacing.xxxl },

  allGoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  allGoodText: {
    color: colors.success,
    fontSize: font.base,
  },

  incompletoSummary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  incompletoCount: {
    color: colors.warning,
    fontSize: font.xxxl,
    fontWeight: font.bold,
  },
  incompletoLabel: {
    color: colors.textMuted,
    fontSize: font.base,
  },
});
