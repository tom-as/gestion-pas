import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { EstadoSiniestro } from '@gestion-pas/types';
import StatusBadge from '../../components/StatusBadge';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { formatDate } from '../../lib/format';
import { colors, font, spacing, radius } from '../../theme/tokens';

type Filter = 'todos' | EstadoSiniestro;

const FILTER_OPTIONS: { key: Filter; label: string }[] = [
  { key: 'todos',                        label: 'Todos'       },
  { key: EstadoSiniestro.ABIERTO,        label: 'Abierto'     },
  { key: EstadoSiniestro.EN_GESTION,     label: 'En gestión'  },
  { key: EstadoSiniestro.RESUELTO,       label: 'Resuelto'    },
  { key: EstadoSiniestro.RECHAZADO,      label: 'Rechazado'   },
];

export default function SiniestrosScreen({ navigation }: any) {
  const [filter, setFilter] = useState<Filter>('todos');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['siniestros'],
    queryFn: () => api.get('/siniestros').then((r) => r.data),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="No se pudieron cargar los siniestros." />;

  const list: any[] = Array.isArray(data) ? data : [];
  const filtered = list.filter((s: any) => filter === 'todos' || s.estado === filter);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {FILTER_OPTIONS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('SiniestroDetail', { siniestroId: item.id })}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.tipo} numberOfLines={1}>
                  {item.tipo?.replace(/_/g, ' ') ?? '—'}
                </Text>
                <StatusBadge value={item.estado} />
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.meta}>{formatDate(item.fechaOcurrencia)}</Text>
                {item.lugarOcurrencia ? (
                  <Text style={styles.meta} numberOfLines={1}>{item.lugarOcurrencia}</Text>
                ) : null}
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="alert-circle-outline" size={36} color={colors.textFaint} />
            <Text style={styles.empty}>
              {filter !== 'todos' ? 'Sin siniestros con ese estado.' : 'No hay siniestros registrados.'}
            </Text>
          </View>
        }
      />

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => navigation.navigate('NuevoSiniestro')}
        accessibilityLabel="Nuevo siniestro"
      >
        <Ionicons name="add" size={28} color={colors.bg} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  filtersRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  chipText: { color: colors.textMuted, fontSize: font.sm },
  chipTextActive: { color: colors.accent, fontWeight: font.semibold },

  list: { paddingHorizontal: spacing.base, paddingBottom: 100 },
  pressed: { opacity: 0.7 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  tipo: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: font.base,
    fontWeight: font.semibold,
    textTransform: 'capitalize',
  },
  cardBottom: { flexDirection: 'row', gap: spacing.md },
  meta: { color: colors.textMuted, fontSize: font.xs },

  emptyWrap: { alignItems: 'center', marginTop: spacing.xxxl, gap: spacing.sm },
  empty: { color: colors.textFaint, fontSize: font.base, textAlign: 'center' },

  fab: {
    position: 'absolute',
    right: spacing.base,
    bottom: spacing.xl,
    backgroundColor: colors.warning,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabPressed: { opacity: 0.8 },
});
