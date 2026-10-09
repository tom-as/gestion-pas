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

function BlockCard({ title, body }: { title: string; body: string }) {
  return (
    <View style={blockStyles.card}>
      <Text style={blockStyles.title}>{title.toUpperCase()}</Text>
      <Text style={blockStyles.body}>{body}</Text>
    </View>
  );
}

const blockStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textMuted,
    fontSize: font.xs,
    fontWeight: font.bold,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  body: { color: colors.textSecondary, fontSize: font.base, lineHeight: font.base * 1.6 },
});

// ─── main screen ──────────────────────────────────────────────────────────────

export default function SiniestroDetailScreen({ route }: any) {
  const { siniestroId } = route.params;

  const { data: s, isLoading, isError } = useQuery({
    queryKey: ['siniestro', siniestroId],
    queryFn: () => api.get(`/siniestros/${siniestroId}`).then((r) => r.data),
  });

  if (isLoading) return <LoadingState />;
  if (isError || !s) return <ErrorState message="No se pudo cargar el siniestro." />;

  const tipoLabel = s.tipo?.replace(/_/g, ' ') ?? '—';
  const aseguradoName = [s.asegurado?.apellido, s.asegurado?.nombre].filter(Boolean).join(', ') || s.asegurado?.nombre || '—';

  const rows = [
    { label: 'Tipo',                 value: tipoLabel },
    { label: 'Fecha',                value: formatDate(s.fechaOcurrencia) },
    { label: 'Hora',                 value: s.horaOcurrencia ?? '—' },
    { label: 'Lugar',                value: s.lugarOcurrencia ?? '—' },
    { label: 'N° denuncia compañía', value: s.numeroDenunciaCompania ?? '—' },
    { label: 'Asegurado',            value: aseguradoName },
    { label: 'Bien',                 value: s.bien?.descripcion ?? s.bien?.marca ?? '—' },
    { label: 'Productor',            value: s.productor?.nombre ?? '—' },
    { label: 'Compañía',             value: s.compania?.nombre ?? '—' },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroLeft}>
            <Text style={styles.tipo}>{tipoLabel}</Text>
            <Text style={styles.date}>{formatDate(s.fechaOcurrencia)}</Text>
          </View>
          <StatusBadge value={s.estado} />
        </View>

        {/* Details card */}
        <View style={styles.card}>
          {rows.map((r) => (
            <InfoRow key={r.label} label={r.label} value={r.value} />
          ))}
        </View>

        {/* Relato */}
        {s.relato ? <BlockCard title="Relato" body={s.relato} /> : null}

        {/* Datos terceros */}
        {s.datosTerceros ? <BlockCard title="Datos de terceros" body={s.datosTerceros} /> : null}

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
  tipo: {
    color: colors.textPrimary,
    fontSize: font.xl,
    fontWeight: font.bold,
    textTransform: 'capitalize',
  },
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
});
