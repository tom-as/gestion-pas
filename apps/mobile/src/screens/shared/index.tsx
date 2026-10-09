import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function placeholder(name: string) {
  return function PlaceholderScreen() {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{name}</Text>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#040a18', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontSize: 16 },
});

export const DashboardScreen = placeholder('Dashboard');
export const AseguradosScreen = placeholder('Asegurados');
export const AseguradoDetailScreen = placeholder('Detalle Asegurado');
export const NuevoAseguradoScreen = placeholder('Nuevo Asegurado');
export const PolizasScreen = placeholder('Pólizas');
export const PolizaDetailScreen = placeholder('Detalle Póliza');
export const NuevaPolizaScreen = placeholder('Nueva Póliza');
export const SiniestrosScreen = placeholder('Siniestros');
export const SiniestroDetailScreen = placeholder('Detalle Siniestro');
export const NuevoSiniestroScreen = placeholder('Nuevo Siniestro');
export const ReclamosScreen = placeholder('Reclamos');
export const ReclamoDetailScreen = placeholder('Detalle Reclamo');
export const NuevoReclamoScreen = placeholder('Nuevo Reclamo');
