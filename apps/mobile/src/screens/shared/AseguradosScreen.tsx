import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '@gestion-pas/types';
import ListCard from '../../components/ListCard';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { colors, font, spacing, radius } from '../../theme/tokens';

export default function AseguradosScreen({ navigation }: any) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['asegurados'],
    queryFn: () => api.get('/asegurados').then((r) => r.data),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="No se pudieron cargar los asegurados." />;

  const list: any[] = Array.isArray(data) ? data : [];
  const filtered = list.filter(
    (a: any) =>
      a.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      a.dniCuil?.toLowerCase().includes(search.toLowerCase()),
  );

  const canCreate = user?.perfil !== UserRole.ASEGURADO;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={colors.textFaint} style={styles.searchIcon} />
        <TextInput
          style={styles.search}
          placeholder="Buscar por nombre o DNI/CUIL…"
          placeholderTextColor={colors.textFaint}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.textFaint} />
          </Pressable>
        )}
      </View>

      {/* Count label */}
      {search.length > 0 && (
        <Text style={styles.resultCount}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </Text>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('AseguradoDetail', { aseguradoId: item.id })}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <ListCard
              title={`${item.apellido ?? ''} ${item.nombre ?? ''}`.trim() || item.nombre}
              subtitle={item.dniCuil}
              meta={item.email ?? undefined}
              right={<Ionicons name="chevron-forward" size={14} color={colors.textFaint} />}
            />
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={36} color={colors.textFaint} />
            <Text style={styles.empty}>
              {search ? 'Sin resultados para esa búsqueda.' : 'No hay asegurados registrados.'}
            </Text>
          </View>
        }
      />

      {canCreate && (
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => navigation.navigate('NuevoAsegurado')}
          accessibilityLabel="Nuevo asegurado"
        >
          <Ionicons name="add" size={28} color={colors.bg} />
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchIcon: {},
  search: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: font.base,
    padding: 0,
  },
  resultCount: {
    color: colors.textMuted,
    fontSize: font.xs,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },

  list: { paddingHorizontal: spacing.base, paddingBottom: 100 },
  pressed: { opacity: 0.7 },

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
