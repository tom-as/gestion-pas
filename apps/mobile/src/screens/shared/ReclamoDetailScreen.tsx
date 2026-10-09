import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../lib/format';
import { colors, font, spacing, radius } from '../../theme/tokens';

// ─── helpers ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { color: colors.textMuted, fontSize: font.sm, flex: 1 },
  value: { color: colors.textPrimary, fontSize: font.sm, maxWidth: '58%', textAlign: 'right' },
});

// ─── main screen ──────────────────────────────────────────────────────────────

export default function ReclamoDetailScreen({ route }: any) {
  const { reclamoId } = route.params;

  const { data: r, isLoading, isError } = useQuery({
    queryKey: ['reclamo', reclamoId],
    queryFn: () => api.get(`/reclamos/${reclamoId}`).then((res) => res.data),
  });

  if (isLoading) return <LoadingState />;
  if (isError || !r) return <ErrorState message="No se pudo cargar el reclamo." />;

  const aseguradoName = [r.asegurado?.apellido, r.asegurado?.nombre].filter(Boolean).join(', ') || r.asegurado?.nombre || '—';

  const rows = [
    { label: 'Tipo',          value: r.tipo ?? '—' },
    { label: 'Fecha apertura', value: formatDate(r.fechaApertura) },
    { label: 'Asegurado',     value: aseguradoName },
    { label: 'Productor',     value: r.productor?.nombre ?? '—' },
    { label: 'Compañía',      value: r.compania?.nombre ?? '—' },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroLeft}>
            <Text style={styles.tipo}>{r.tipo ?? '—'}</Text>
            <Text style={styles.date}>{formatDate(r.fechaApertura)}</Text>
          </View>
          <StatusBadge value={r.estado} />
        </View>

        {/* Detail rows */}
        <View style={styles.card}>
          {rows.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} />
          ))}
        </View>

        {/* Descripción */}
        {r.descripcion ? (
          <View style={styles.blockCard}>
            <Text style={styles.blockTitle}>DESCRIPCIÓN</Text>
            <Text style={styles.blockBody}>{r.descripcion}</Text>
          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.base, paddingBottom: spacing.xxxl },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  heroLeft: { flex: 1 },
  tipo: { color: colors.textPrimary, fontSize: font.xl, fontWeight: font.bold },
  date: { color: colors.textMuted, fontSize: font.sm, marginTop: 2 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },

  blockCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    marginBottom: spacing.sm,
  },
  blockTitle: {
    color: colors.textMuted,
    fontSize: font.xs,
    fontWeight: font.bold,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  blockBody: {
    color: colors.textSecondary,
    fontSize: font.base,
    lineHeight: font.base * 1.6,
  },
});
