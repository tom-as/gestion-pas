import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import ListCard from '../../components/ListCard';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '@gestion-pas/types';

export function ProductoresScreen() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['productores'],
    queryFn: () => api.get('/productores').then((r) => r.data),
    enabled: user?.perfil === UserRole.ORGANIZADOR,
  });

  if (user?.perfil !== UserRole.ORGANIZADOR) return <ErrorState message="Acceso no autorizado." />;
  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="No se pudieron cargar los productores." />;

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ListCard
            title={item.nombre}
            subtitle={`DNI/CUIL: ${item.dniCuil ?? '—'}  |  ${item.estado ?? '—'}`}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>Sin productores.</Text>}
      />
    </SafeAreaView>
  );
}

export function CompaniasScreen() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['companias'],
    queryFn: () => api.get('/companias').then((r) => r.data),
    enabled: user?.perfil === UserRole.ORGANIZADOR,
  });

  if (user?.perfil !== UserRole.ORGANIZADOR) return <ErrorState message="Acceso no autorizado." />;
  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="No se pudieron cargar las compañías." />;

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ListCard
            title={item.nombre}
            subtitle={`Gracia: ${item.periodoDGraciaDias ?? '—'} días  |  ${item.mecanismoNotificacion ?? '—'}`}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>Sin compañías.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#040a18' },
  list: { padding: 16, paddingBottom: 40 },
  empty: { color: '#4a5568', textAlign: 'center', marginTop: 40, fontSize: 14 },
});
