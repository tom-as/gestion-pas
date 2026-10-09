import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ReclamosScreen from '../../screens/shared/ReclamosScreen';
import ReclamoDetailScreen from '../../screens/shared/ReclamoDetailScreen';
import NuevoReclamoScreen from '../../screens/shared/NuevoReclamoScreen';

const Stack = createNativeStackNavigator();

export function ReclamosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#040a18' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="ReclamosList" component={ReclamosScreen} options={{ title: 'Reclamos' }} />
      <Stack.Screen name="ReclamoDetail" component={ReclamoDetailScreen} options={{ title: 'Detalle Reclamo' }} />
      <Stack.Screen name="NuevoReclamo" component={NuevoReclamoScreen} options={{ title: 'Nuevo Reclamo' }} />
    </Stack.Navigator>
  );
}
