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
import { EstadoReclamo } from '@gestion-pas/types';
import StatusBadge from '../../components/StatusBadge';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { formatDate } from '../../lib/format';
import { colors, font, spacing, radius } from '../../theme/tokens';

type Filter = 'todos' | EstadoReclamo;

const FILTER_OPTIONS: { key: Filter; label: string }[] = [
  { key: 'todos',                    label: 'Todos'      },
  { key: EstadoReclamo.ABIERTO,      label: 'Abierto'    },
  { key: EstadoReclamo.EN_GESTION,   label: 'En gestión' },
  { key: EstadoReclamo.RESUELTO,     label: 'Resuelto'   },
];

export default function ReclamosScreen({ navigation }: any) {
  const [filter, setFilter] = useState<Filter>('todos');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reclamos'],
    queryFn: () => api.get('/reclamos').then((r) => r.data),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="No se pudieron cargar los reclamos." />;

  const list: any[] = Array.isArray(data) ? data : [];
  const filtered = list.filter((r: any) => filter === 'todos' || r.estado === filter);

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
            onPress={() => navigation.navigate('ReclamoDetail', { reclamoId: item.id })}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.tipo} numberOfLines={1}>{item.tipo ?? '—'}</Text>
                <StatusBadge value={item.estado} />
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.meta}>{formatDate(item.fechaApertura)}</Text>
                {item.descripcion ? (
                  <Text style={styles.desc} numberOfLines={1}>{item.descripcion}</Text>
                ) : null}
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="chatbox-outline" size={36} color={colors.textFaint} />
            <Text style={styles.empty}>
              {filter !== 'todos' ? 'Sin reclamos con ese estado.' : 'No hay reclamos registrados.'}
            </Text>
          </View>
        }
      />

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => navigation.navigate('NuevoReclamo')}
        accessibilityLabel="Nuevo reclamo"
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
  },
  cardBottom: { gap: spacing.xs },
  meta: { color: colors.textMuted, fontSize: font.xs },
  desc: { color: colors.textFaint, fontSize: font.xs },

  emptyWrap: { alignItems: 'center', marginTop: spacing.xxxl, gap: spacing.sm },
  empty: { color: colors.textFaint, fontSize: font.base, textAlign: 'center' },

  fab: {
    position: 'absolute',
    right: spacing.base,
    bottom: spacing.xl,
    backgroundColor: colors.accent,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabPressed: { opacity: 0.8 },
});
