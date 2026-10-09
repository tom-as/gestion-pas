import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { formatDate } from '../../lib/format';
import { colors, font, spacing, radius } from '../../theme/tokens';

// ─── reusable row ────────────────────────────────────────────────────────────

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

// ─── section title ────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return <Text style={secStyle.label}>{text.toUpperCase()}</Text>;
}
const secStyle = StyleSheet.create({
  label: {
    color: colors.textMuted,
    fontSize: font.xs,
    fontWeight: font.bold,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
});

// ─── main screen ──────────────────────────────────────────────────────────────

export default function AseguradoDetailScreen({ route, navigation }: any) {
  const { aseguradoId } = route.params;

  const { data: asegurado, isLoading, isError } = useQuery({
    queryKey: ['asegurado', aseguradoId],
    queryFn: () => api.get(`/asegurados/${aseguradoId}`).then((r) => r.data),
  });

  if (isLoading) return <LoadingState />;
  if (isError || !asegurado) return <ErrorState message="No se pudo cargar el asegurado." />;

  const fullName = [asegurado.apellido, asegurado.nombre].filter(Boolean).join(', ') || asegurado.nombre;

  const infoRows = [
    { label: 'DNI / CUIL', value: asegurado.dniCuil ?? '—', mono: true },
    { label: 'Email',       value: asegurado.email ?? '—' },
    { label: 'Teléfono',    value: asegurado.telefono ?? '—' },
    { label: 'Dirección',   value: asegurado.direccion ?? '—' },
    { label: 'Cód. Postal', value: asegurado.codigoPostal ?? '—' },
    { label: 'Nacimiento',  value: formatDate(asegurado.fechaNacimiento) },
    { label: 'Productor',   value: asegurado.productor?.nombre ?? '—' },
  ];

  const relatedLinks = [
    { label: 'Pólizas',    screen: 'PolizasList',    icon: 'document-outline'     as const },
    { label: 'Siniestros', screen: 'SiniestrosList',  icon: 'alert-circle-outline' as const },
    { label: 'Reclamos',   screen: 'ReclamosList',    icon: 'chatbox-outline'      as const },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Identity header */}
        <View style={styles.headerCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>
              {(asegurado.apellido?.[0] ?? asegurado.nombre?.[0] ?? '?').toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.dniLabel}>{asegurado.dniCuil}</Text>
          </View>
        </View>

        {/* Info section */}
        <SectionLabel text="Datos personales" />
        <View style={styles.card}>
          {infoRows.map((r) => (
            <InfoRow key={r.label} label={r.label} value={r.value} mono={r.mono} />
          ))}
        </View>

        {/* Related section */}
        <SectionLabel text="Ver relacionados" />
        {relatedLinks.map((link) => (
          <Pressable
            key={link.screen}
            style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}
            onPress={() => navigation.navigate(link.screen, { aseguradoId })}
            accessibilityLabel={link.label}
          >
            <View style={styles.linkIconWrap}>
              <Ionicons name={link.icon} size={18} color={colors.accent} />
            </View>
            <Text style={styles.linkText}>{link.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.base, paddingBottom: spacing.xxxl },

  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accent + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: colors.accent,
    fontSize: font.xl,
    fontWeight: font.bold,
  },
  headerText: { flex: 1 },
  name: { color: colors.textPrimary, fontSize: font.xl, fontWeight: font.bold },
  dniLabel: { color: colors.textMuted, fontSize: font.sm, fontFamily: 'monospace', marginTop: 2 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    overflow: 'hidden',
  },

  linkRow: {
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
    minHeight: 52,
  },
  linkPressed: { opacity: 0.7 },
  linkIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: { flex: 1, color: colors.textPrimary, fontSize: font.md },
});
