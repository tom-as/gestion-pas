import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SiniestrosScreen from '../../screens/shared/SiniestrosScreen';
import SiniestroDetailScreen from '../../screens/shared/SiniestroDetailScreen';
import NuevoSiniestroScreen from '../../screens/shared/NuevoSiniestroScreen';

const Stack = createNativeStackNavigator();

export function SiniestrosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#040a18' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="SiniestrosList" component={SiniestrosScreen} options={{ title: 'Siniestros' }} />
      <Stack.Screen name="SiniestroDetail" component={SiniestroDetailScreen} options={{ title: 'Detalle Siniestro' }} />
      <Stack.Screen name="NuevoSiniestro" component={NuevoSiniestroScreen} options={{ title: 'Nuevo Siniestro' }} />
    </Stack.Navigator>
  );
}
