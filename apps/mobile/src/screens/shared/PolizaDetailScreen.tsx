import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatMoney } from '../../lib/format';
import { colors, font, spacing, radius } from '../../theme/tokens';

type Section = 'general' | 'endosos' | 'cuotas';

// ─── reusable row ─────────────────────────────────────────────────────────────

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, mono && rowStyles.mono]} numberOfLines={2}>
        {value}
      </Text>
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
  mono: { fontFamily: 'monospace' },
});

// ─── main screen ──────────────────────────────────────────────────────────────

export default function PolizaDetailScreen({ route }: any) {
  const { polizaId } = route.params;
  const [section, setSection] = useState<Section>('general');

  const { data: poliza, isLoading, isError } = useQuery({
    queryKey: ['poliza', polizaId],
    queryFn: () => api.get(`/polizas/${polizaId}`).then((r) => r.data),
  });

  const { data: endosos } = useQuery({
    queryKey: ['endosos', polizaId],
    queryFn: () => api.get(`/polizas/${polizaId}/endosos`).then((r) => r.data),
    enabled: section === 'endosos',
  });

  const { data: cuotas } = useQuery({
    queryKey: ['cuotas', polizaId],
    queryFn: () => api.get(`/cuotas?polizaId=${polizaId}`).then((r) => r.data),
    enabled: section === 'cuotas',
  });

  if (isLoading) return <LoadingState />;
  if (isError || !poliza) return <ErrorState message="No se pudo cargar la póliza." />;

  const tabs: { key: Section; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'endosos', label: 'Endosos' },
    { key: 'cuotas',  label: 'Cuotas'  },
  ];

  const generalRows = [
    { label: 'Vigencia inicio',  value: formatDate(poliza.vigenciaInicio) },
    { label: 'Vigencia fin',     value: formatDate(poliza.vigenciaFin) },
    { label: 'Cuota vigente',    value: formatMoney(poliza.importeCuotaVigente) },
    { label: 'Modalidad pago',   value: poliza.modalidadPago ?? '—' },
    { label: 'Periodicidad',     value: poliza.periodicidadRefacturacion ?? '—' },
    { label: 'Asegurado',        value: [poliza.asegurado?.apellido, poliza.asegurado?.nombre].filter(Boolean).join(', ') || poliza.asegurado?.nombre || '—' },
    { label: 'Productor',        value: poliza.productor?.nombre ?? '—' },
    { label: 'Compañía',         value: poliza.compania?.nombre ?? '—' },
    { label: 'Bien',             value: poliza.bien?.descripcion ?? poliza.bien?.marca ?? '—' },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>

      {/* Policy hero header */}
      <View style={styles.hero}>
        <View style={styles.heroLeft}>
          <Text style={styles.numero}>{poliza.numeroPoliza}</Text>
          <Text style={styles.compania}>{poliza.compania?.nombre ?? '—'}</Text>
        </View>
        <StatusBadge value={poliza.estado} />
      </View>

      {/* Section tabs */}
      <View style={styles.tabBar}>
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, section === t.key && styles.tabActive]}
            onPress={() => setSection(t.key)}
          >
            <Text style={[styles.tabText, section === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── General ── */}
        {section === 'general' && (
          <View style={styles.card}>
            {generalRows.map((r) => (
              <InfoRow key={r.label} label={r.label} value={r.value} />
            ))}
          </View>
        )}

        {/* ── Endosos ── */}
        {section === 'endosos' && (
          <>
            {(endosos ?? []).length === 0 && (
              <Text style={styles.empty}>Sin endosos registrados.</Text>
            )}
            {(endosos ?? []).map((e: any) => (
              <View key={e.id} style={styles.card}>
                <Text style={styles.cardTitle}>Endoso #{e.numeroEndoso}</Text>
                <InfoRow label="Tipo"               value={e.tipoModificacion ?? '—'} />
                <InfoRow label="Fecha emisión"      value={formatDate(e.fechaEmision)} />
                <InfoRow label="Importe actualizado" value={formatMoney(e.importeActualizado)} />
              </View>
            ))}
          </>
        )}

        {/* ── Cuotas ── */}
        {section === 'cuotas' && (
          <>
            {(cuotas ?? []).length === 0 && (
              <Text style={styles.empty}>Sin cuotas registradas.</Text>
            )}
            {(cuotas ?? []).map((c: any) => (
              <View key={c.id} style={styles.cuotaRow}>
                <View style={styles.cuotaLeft}>
                  <Text style={styles.cuotaNum}>Cuota #{c.numeroCuota ?? '—'}</Text>
                  <Text style={styles.cuotaDate}>{formatDate(c.fechaVencimiento)}</Text>
                </View>
                <View style={styles.cuotaRight}>
                  <StatusBadge value={c.estado} />
                  <Text style={styles.cuotaMonto}>{formatMoney(c.monto)}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroLeft: { flex: 1, marginRight: spacing.sm },
  numero: {
    color: colors.textPrimary,
    fontSize: font.lg,
    fontWeight: font.bold,
    fontFamily: 'monospace',
  },
  compania: { color: colors.textMuted, fontSize: font.sm, marginTop: 2 },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  tabText: { color: colors.textMuted, fontSize: font.base },
  tabTextActive: { color: colors.accent, fontWeight: font.semibold },

  scroll: { padding: spacing.base, paddingBottom: spacing.xxxl },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: font.base,
    fontWeight: font.semibold,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  empty: { color: colors.textFaint, textAlign: 'center', marginTop: spacing.xxxl, fontSize: font.base },

  cuotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cuotaLeft: { gap: spacing.xs },
  cuotaNum: { color: colors.textPrimary, fontSize: font.base, fontWeight: font.semibold },
  cuotaDate: { color: colors.textMuted, fontSize: font.sm },
  cuotaRight: { alignItems: 'flex-end', gap: spacing.xs },
  cuotaMonto: { color: colors.success, fontSize: font.sm, fontWeight: font.semibold },
});
