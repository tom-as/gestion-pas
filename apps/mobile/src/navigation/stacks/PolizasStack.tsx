import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PolizasScreen from '../../screens/shared/PolizasScreen';
import PolizaDetailScreen from '../../screens/shared/PolizaDetailScreen';
import NuevaPolizaScreen from '../../screens/shared/NuevaPolizaScreen';

const Stack = createNativeStackNavigator();

export function PolizasStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#040a18' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="PolizasList" component={PolizasScreen} options={{ title: 'Pólizas' }} />
      <Stack.Screen name="PolizaDetail" component={PolizaDetailScreen} options={{ title: 'Detalle Póliza' }} />
      <Stack.Screen name="NuevaPoliza" component={NuevaPolizaScreen} options={{ title: 'Nueva Póliza' }} />
    </Stack.Navigator>
  );
}
