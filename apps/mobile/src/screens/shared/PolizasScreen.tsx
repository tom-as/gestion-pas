import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '@gestion-pas/types';
import StatusBadge from '../../components/StatusBadge';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { formatDate, formatMoney } from '../../lib/format';
import { colors, font, spacing, radius } from '../../theme/tokens';

export default function PolizasScreen({ navigation }: any) {
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['polizas'],
    queryFn: () => api.get('/polizas').then((r) => r.data),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="No se pudieron cargar las pólizas." />;

  const list: any[] = Array.isArray(data) ? data : [];
  const canCreate = user?.perfil !== UserRole.ASEGURADO;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('PolizaDetail', { polizaId: item.id })}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <View style={styles.card}>
              {/* Top row: number + status */}
              <View style={styles.cardTop}>
                <Text style={styles.numero}>{item.numeroPoliza}</Text>
                <StatusBadge value={item.estado} />
              </View>
              {/* Bottom row: dates + amount */}
              <View style={styles.cardBottom}>
                <Text style={styles.dates}>
                  {formatDate(item.vigenciaInicio)} → {formatDate(item.vigenciaFin)}
                </Text>
                <Text style={styles.monto}>{formatMoney(item.importeCuotaVigente)}</Text>
              </View>
              {/* Asegurado name if available */}
              {item.asegurado?.nombre && (
                <Text style={styles.asegurado} numberOfLines={1}>
                  {[item.asegurado.apellido, item.asegurado.nombre].filter(Boolean).join(', ')}
                </Text>
              )}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="document-outline" size={36} color={colors.textFaint} />
            <Text style={styles.empty}>No hay pólizas registradas.</Text>
          </View>
        }
      />

      {canCreate && (
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => navigation.navigate('NuevaPoliza')}
          accessibilityLabel="Nueva póliza"
        >
          <Ionicons name="add" size={28} color={colors.bg} />
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.base, paddingBottom: 100 },
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
  },
  numero: {
    color: colors.textPrimary,
    fontSize: font.base,
    fontWeight: font.semibold,
    fontFamily: 'monospace',
    flex: 1,
    marginRight: spacing.sm,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dates: { color: colors.textMuted, fontSize: font.xs },
  monto: { color: colors.success, fontSize: font.sm, fontWeight: font.semibold },
  asegurado: { color: colors.textFaint, fontSize: font.xs },

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
