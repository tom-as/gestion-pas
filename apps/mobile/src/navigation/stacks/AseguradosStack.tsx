import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AseguradosScreen from '../../screens/shared/AseguradosScreen';
import AseguradoDetailScreen from '../../screens/shared/AseguradoDetailScreen';
import NuevoAseguradoScreen from '../../screens/shared/NuevoAseguradoScreen';

const Stack = createNativeStackNavigator();

export function AseguradosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#040a18' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="AseguradosList" component={AseguradosScreen} options={{ title: 'Asegurados' }} />
      <Stack.Screen name="AseguradoDetail" component={AseguradoDetailScreen} options={{ title: 'Detalle' }} />
      <Stack.Screen name="NuevoAsegurado" component={NuevoAseguradoScreen} options={{ title: 'Nuevo Asegurado' }} />
    </Stack.Navigator>
  );
}
